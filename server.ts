import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { smartpayRouter } from './server/smartpay.js';
import { merchantApiRouter } from './server/merchantApi.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('GoogleGenAI initialization notice:', e);
    }
  }
  return aiClient;
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Mboka Ecosystem API',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// 2. SmartPayPesa C2B & B2C Payment Gateway
app.use('/api/smartpay', smartpayRouter);

// 3. Mboka Merchant & Developer API (Linked to Wallet ID for instant settlement)
app.use('/api/v1', merchantApiRouter);

// Helper to detect 503 / 429 / high demand transient status
function isTransientCapacityError(err: any): boolean {
  if (!err) return false;
  const status = err?.status || err?.code || err?.error?.code || (err?.error && err.error.status);
  const str = (err?.message || (typeof err === 'object' ? JSON.stringify(err) : '')).toLowerCase();
  return (
    status === 503 ||
    status === 429 ||
    status === 'UNAVAILABLE' ||
    str.includes('503') ||
    str.includes('high demand') ||
    str.includes('unavailable') ||
    str.includes('rate limit') ||
    str.includes('spikes in demand')
  );
}

// 2. Mboka AI Copilot & Knowledge Assistant
app.post('/api/ai-assistant', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getGenAI();

    // Context for Mboka App
    const systemInstruction = `You are the Mboka AI Smart Assistant (Mboka Copilot) for the Mboka Digital Super App.
Mboka is an all-in-one Kenyan digital ecosystem combining:
1. 💰 Mboka Wallet: Central digital ledger for deposits (M-Pesa, bank, cards), withdrawals, user-to-user P2P transfers, PIN verification, transaction receipts and statements.
2. 🤝 Mbogi/Mboka Affiliate Program: Unique referral codes, earning KSh 150 per verified signup + 5% transaction commission, referral dashboard, withdrawal of affiliate commissions to wallet.
3. ✍️ Mboka Blogging: Article publication platform with rich text, topics (tech, hustle, business, agriculture), and ad revenue monetization where creators earn up to 70% of impression/read ad revenue.
4. 💬 Mboka Chat: Community groups (Nairobi Hustlers, Tech Mboka, KPLC Alerts, county groups) and direct 1-on-1 messaging with verified agents.
5. 🏪 Mboka POS: Merchant point of sale for instant digital utilities: Airtime (Safaricom, Airtel, Telkom with cashback), KPLC Prepaid Tokens (instant 20-digit token generation), and TV Subscriptions (DStv, GOtv, StarTimes) with merchant commission tracking.
6. 🛠️ Central Identity & Admin Dashboard: Unified balance reconciliation, KYC status, and admin oversight.

Your persona: Warm, smart, encouraging, conversational East African / Kenyan fintech advisor. You can seamlessly understand and respond in English, Swahili, and popular Sheng ("Niaje", "Mboka fiti", "Kazi safi") when appropriate. Be concise, actionable, and formatted with clean bullet points when helpful.`;

    if (ai) {
      try {
        // Format history if provided
        const contents: any[] = [];
        if (Array.isArray(history)) {
          for (const item of history.slice(-6)) {
            contents.push({
              role: item.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: item.content }],
            });
          }
        }
        contents.push({
          role: 'user',
          parts: [{ text: message }],
        });

        // Try primary model
        let replyText = '';
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
              maxOutputTokens: 600,
            },
          });
          replyText = response.text || '';
        } catch (primaryErr: any) {
          if (isTransientCapacityError(primaryErr)) {
            console.warn('Gemini 3.8-flash capacity spike (503/high-demand); attempting fallback to gemini-3.1-flash-lite...');
            try {
              const fallbackResponse = await ai.models.generateContent({
                model: 'gemini-3.1-flash-lite',
                contents,
                config: {
                  systemInstruction,
                  temperature: 0.7,
                  maxOutputTokens: 600,
                },
              });
              replyText = fallbackResponse.text || '';
            } catch (liteErr: any) {
              console.warn('Gemini 3.1-flash-lite also experiencing demand; engaging internal fintech knowledge engine.');
            }
          } else {
            console.warn('Gemini request notice:', primaryErr?.message || 'Model call skipped');
          }
        }

        if (replyText) {
          return res.json({ reply: replyText });
        }
      } catch (geminiError: any) {
        console.warn('Gemini service handling notice:', geminiError?.message || 'Utilizing smart fallback');
      }
    }

    // High quality intelligent domain knowledge fallback
    const lower = message.toLowerCase();
    let fallbackReply = '';

    if (lower.includes('kplc') || lower.includes('token') || lower.includes('stima') || lower.includes('meter')) {
      fallbackReply = `💡 **KPLC Prepaid Tokens on Mboka POS:**\n- Navigate to the **POS tab** and select **KPLC Tokens**.\n- Enter your 11-digit Meter Number and desired amount in KSh.\n- Your 20-digit token is generated instantly along with estimated kWh units, and a printable WhatsApp receipt!`;
    } else if (lower.includes('deposit') || lower.includes('mpesa') || lower.includes('m-pesa') || lower.includes('add money') || lower.includes('top up')) {
      fallbackReply = `💰 **Depositing to Mboka Wallet:**\n- Go to **Wallet** > Click **Deposit**.\n- Choose **M-Pesa Express** (STK push) or Paybill.\n- Enter your Safaricom phone number and amount (Min KSh 50).\n- The money is instantly credited to your Mboka Central Ledger with zero transaction fees!`;
    } else if (lower.includes('withdraw') || lower.includes('cash out') || lower.includes('send to mpesa') || lower.includes('payout')) {
      fallbackReply = `🏧 **Withdrawing from Mboka Wallet:**\n- Go to the **Wallet tab** and tap **Withdraw**.\n- Enter the recipient M-Pesa phone number and amount.\n- Confirm your 4-digit Transaction PIN (default: **1234**).\n- Funds are disbursed to M-Pesa immediately with transparent tiered excise fees.`;
    } else if (lower.includes('transfer') || lower.includes('p2p') || lower.includes('send money') || lower.includes('send to friend')) {
      fallbackReply = `🔄 **Free P2P Transfers:**\n- In the **Wallet tab**, select **Send Money / P2P**.\n- Enter the recipient's phone number or Mboka username.\n- User-to-user transfers on Mboka are **100% free** with instant ledger credit!`;
    } else if (lower.includes('affiliate') || lower.includes('refer') || lower.includes('earn') || lower.includes('mbogi') || lower.includes('commission')) {
      fallbackReply = `🤝 **Mboka Affiliate Program:**\n- Share your unique referral code (**MBOKA-9042**) from the **Affiliate** tab.\n- You earn **KSh 150** immediately when an invited friend registers, plus a **5% recurring commission** on all their POS and utility purchases!\n- You can withdraw your referral earnings straight into your main Mboka Wallet anytime using the **Withdraw to Wallet** button.`;
    } else if (lower.includes('blog') || lower.includes('write') || lower.includes('monetiz') || lower.includes('article') || lower.includes('creator')) {
      fallbackReply = `✍️ **Earn by Writing on Mboka Blog:**\n- Click on the **Blog** tab and hit **Write Article**.\n- Share insights on Kenyan business, tech, farming, or community stories.\n- Once published, ads will display on your article. You receive a **70% revenue split** on all eligible reads and ad impressions!\n- You can claim and sweep your ad earnings directly to your main wallet balance anytime.`;
    } else if (lower.includes('airtime') || lower.includes('safaricom') || lower.includes('airtel') || lower.includes('telkom')) {
      fallbackReply = `📱 **Buying Airtime on Mboka:**\n- Open **POS** or the quick action on the Home dashboard.\n- Pick your network (Safaricom, Airtel, Telkom) and enter phone number.\n- Enjoy **2% instant cashback** credited right back to your Mboka float!`;
    } else if (lower.includes('tv') || lower.includes('dstv') || lower.includes('gotv') || lower.includes('startimes')) {
      fallbackReply = `📺 **Pay-TV Renewals:**\n- Go to **POS Utilities** > **Pay-TV**.\n- Select provider (**GOtv, DStv, StarTimes**), enter your smartcard/IUC number, and choose your bouquet package.\n- Your decoder activates immediately with an instant printable receipt for the customer.`;
    } else if (lower.includes('pin') || lower.includes('security') || lower.includes('kyc') || lower.includes('profile')) {
      fallbackReply = `🔒 **Security & KYC Verification:**\n- Check your verification status and update your 4-digit PIN in your **Profile** tab.\n- Verified KYC users enjoy higher transaction limits and instant float replenishments.\n- Never share your 4-digit Mboka PIN with anyone!`;
    } else if (lower.includes('admin') || lower.includes('float') || lower.includes('merchant')) {
      fallbackReply = `🛠️ **POS & Merchant Operations:**\n- Toggle the **Admin** switch in the top bar to inspect system float balances, view all registered users, audit transactions, or broadcast community notices.\n- Merchants can replenish their float via M-Pesa or by sweeping affiliate & blog commissions into working capital.`;
    } else if (lower.includes('niaje') || lower.includes('sasa') || lower.includes('mambo') || lower.includes('hello') || lower.includes('hi')) {
      fallbackReply = `👋 **Niaje! Welcome to Mboka Digital Super App.**\nMboka fiti kabisa! I'm your Copilot for all things hustle, finance, and utilities.\n\nYou can ask me:\n• "How do I buy KPLC stima tokens?"\n• "How does the affiliate 5% commission work?"\n• "How do creators earn 70% ad split on Mboka Blog?"\n• "How do I deposit money via M-Pesa?"\n\nWhat can I help you settle today?`;
    } else {
      fallbackReply = `👋 **Sasa! Welcome to Mboka App.**\nI am your Mboka Copilot. I can guide you through:\n• **Wallet**: Instant M-Pesa deposits, P2P transfers & withdrawals\n• **POS Utilities**: Airtime, KPLC electricity tokens & TV renewals\n• **Affiliate**: Earn rewards for inviting friends (KSh 150 + 5% commission)\n• **Blogging**: Publish content & earn through 70% ad monetization\n• **Community Chat**: Connect with local entrepreneurs & groups.\n\nWhat would you like to explore or do today?`;
    }

    return res.json({ reply: fallbackReply });
  } catch (error: any) {
    console.warn('AI assistant endpoint handled fallback:', error?.message || 'Error occurred');
    res.status(200).json({
      reply: '👋 Sasa! The Mboka assistant is operating in high-availability mode. Please ask about your Wallet, KPLC tokens, Airtime cashback, or Affiliate earnings!',
    });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mboka server listening on port ${PORT}`);
  });
}

startServer();
