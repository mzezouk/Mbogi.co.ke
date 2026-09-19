import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const smartpayRouter = express.Router();

// Normalize base URL so it never has duplicated /v1
function getSmartPayBaseUrl(): string {
  const envUrl = process.env.SMARTPAY_BASE_URL || 'https://api.smartpaypesa.com';
  return envUrl.replace(/\/v1\/?$/, '').replace(/\/+$/, '');
}

// Format Kenyan phone number to 254XXXXXXXXX
export function formatKenyanPhone(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
}

// In-memory store for recent webhook transactions
interface WebhookTxn {
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  amount: number;
  mpesaReceiptNumber: string;
  phoneNumber: string;
  timestamp: string;
  raw?: any;
}

const recentWebhooks: Map<string, WebhookTxn> = new Map();

// Lazy Supabase helper for server-side recording
function getServerSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (url && key && !url.includes('placeholder')) {
    try {
      return createClient(url, key);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * 1. Gateway Status & Account Overview
 * GET /api/smartpay/status
 */
smartpayRouter.get('/status', async (req: Request, res: Response) => {
  const apiKey = process.env.SMARTPAY_API_KEY || '';
  const username = process.env.SMARTPAY_USERNAME || '';
  const hasPassword = Boolean(process.env.SMARTPAY_PASSWORD);
  const baseUrl = getSmartPayBaseUrl();

  const isConfigured = Boolean(apiKey && apiKey.trim().length > 0 && !apiKey.includes('MY_'));
  const apiKeyMasked = apiKey ? `${apiKey.substring(0, 4)}••••${apiKey.substring(Math.max(0, apiKey.length - 4))}` : 'Not set';

  if (!isConfigured) {
    return res.json({
      configured: false,
      isConfigured: false,
      isSimulated: true,
      apiKeyMasked: 'MY_SMARTPAY_API_KEY (Sandbox)',
      username: username || 'mboka_pos',
      c2bReady: true,
      b2cReady: true,
      provider: 'SmartPayPesa (M-Pesa C2B & B2C)',
      message: 'SmartPayPesa credentials not yet provided in environment. Running in active simulation mode for deposits & payouts.',
      webhookUrl: `${process.env.APP_URL || 'https://your-domain.com'}/api/smartpay/webhook`,
      edgeWebhookUrl: `${process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'}/functions/v1/smartpay-webhook`,
      baseUrl,
    });
  }

  // Query live account information from SmartPay API if credentials exist
  try {
    const response = await fetch(`${baseUrl}/v1/account`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return res.json({
        configured: true,
        isConfigured: true,
        isSimulated: false,
        apiKeyMasked,
        username: username || 'mboka_pos',
        c2bReady: true,
        b2cReady: Boolean(username && hasPassword),
        provider: 'SmartPayPesa (Live Gateway)',
        liveAccount: data?.account || null,
        activeKey: data?.active_key || null,
        subscription: data?.subscription || null,
        stats: data?.transaction_stats || null,
        webhookUrl: `${process.env.APP_URL || 'https://your-domain.com'}/api/smartpay/webhook`,
        edgeWebhookUrl: `${process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'}/functions/v1/smartpay-webhook`,
        baseUrl,
      });
    } else {
      const errorText = await response.text();
      return res.json({
        configured: true,
        isConfigured: true,
        isSimulated: false,
        apiKeyMasked,
        username: username || 'mboka_pos',
        c2bReady: true, // STK push can still be tried
        b2cReady: Boolean(username && hasPassword),
        provider: 'SmartPayPesa',
        message: `Gateway reachable (${response.status}: ${errorText.substring(0, 100)})`,
        webhookUrl: `${process.env.APP_URL || 'https://your-domain.com'}/api/smartpay/webhook`,
        edgeWebhookUrl: `${process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'}/functions/v1/smartpay-webhook`,
        baseUrl,
      });
    }
  } catch (err: any) {
    return res.json({
      configured: true,
      isConfigured: true,
      isSimulated: false,
      apiKeyMasked,
      username: username || 'mboka_pos',
      c2bReady: true,
      b2cReady: Boolean(username && hasPassword),
      provider: 'SmartPayPesa',
      message: `Gateway ready (Ping notice: ${err?.message || 'Ready'}).`,
      webhookUrl: `${process.env.APP_URL || 'https://your-domain.com'}/api/smartpay/webhook`,
      edgeWebhookUrl: `${process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'}/functions/v1/smartpay-webhook`,
      baseUrl,
    });
  }
});

/**
 * 2. C2B: Initiate STK Push (Customer Deposit)
 * POST /api/smartpay/c2b/stk-push
 */
smartpayRouter.post('/c2b/stk-push', async (req: Request, res: Response) => {
  try {
    const { phone, amount, accountReference, description } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ success: false, message: 'Phone and amount are required.' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 1) {
      return res.status(400).json({ success: false, message: 'Amount must be at least KSh 1.' });
    }

    const formattedPhone = formatKenyanPhone(phone);
    if (!formattedPhone || formattedPhone.length !== 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone format. Please use 07XXXXXXXX, 01XXXXXXXX, or 254XXXXXXXXX.',
      });
    }

    const apiKey = process.env.SMARTPAY_API_KEY;
    const baseUrl = getSmartPayBaseUrl();

    // If live API key is configured, send request to SmartPay STK Push endpoint
    if (apiKey && apiKey.trim().length > 0 && !apiKey.includes('MY_')) {
      const payload = {
        phone: formattedPhone,
        amount: Math.round(numAmount),
        account_reference: accountReference || 'MBOKA_FLOAT',
        description: description || 'Mboka Float Top-Up',
      };

      try {
        const response = await fetch(`${baseUrl}/v1/stk/push`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && (data.success !== false || data.checkout_request_id)) {
          return res.status(200).json({
            success: true,
            message: data.message || `STK push prompt sent to ${formattedPhone}. Please check your phone screen and enter M-Pesa PIN.`,
            checkout_request_id: data.checkout_request_id,
            merchant_request_id: data.merchant_request_id,
            amount: numAmount,
            phone: formattedPhone,
            customer_message: data.message || 'Prompt sent to handset',
          });
        } else {
          return res.status(response.status || 400).json({
            success: false,
            message: data.error || data.message || 'SmartPay rejected STK Push request',
            details: data,
          });
        }
      } catch (liveErr: any) {
        console.error('Error fetching live SmartPay STK endpoint:', liveErr);
        return res.status(502).json({
          success: false,
          message: `Network error connecting to SmartPay API: ${liveErr?.message || 'Gateway unreachable'}`,
        });
      }
    }

    // SIMULATION MODE (when keys are not provided yet in development):
    const simulatedCheckoutId = `ws_CO_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    const simulatedMerchantId = `MBK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Auto-schedule an instant simulation completion in the webhook cache
    setTimeout(() => {
      recentWebhooks.set(simulatedCheckoutId, {
        merchantRequestId: simulatedMerchantId,
        checkoutRequestId: simulatedCheckoutId,
        resultCode: 0,
        resultDesc: 'The service request is processed successfully.',
        amount: numAmount,
        mpesaReceiptNumber: 'Q' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        phoneNumber: formattedPhone,
        timestamp: new Date().toISOString(),
      });
    }, 2500);

    return res.status(200).json({
      success: true,
      mode: 'simulation',
      message: `STK push prompt sent to ${formattedPhone}. Please check your phone and enter M-Pesa PIN.`,
      checkout_request_id: simulatedCheckoutId,
      merchant_request_id: simulatedMerchantId,
      customer_message: 'Success. Request accepted for processing',
      amount: numAmount,
      phone: formattedPhone,
    });
  } catch (error: any) {
    console.error('SmartPay C2B error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to initiate STK push with SmartPayPesa',
    });
  }
});

/**
 * 3. C2B: Check STK Push Status
 * GET /api/smartpay/c2b/status/:checkoutRequestId
 */
smartpayRouter.get('/c2b/status/:checkoutRequestId', async (req: Request, res: Response) => {
  try {
    const { checkoutRequestId } = req.params;
    const apiKey = process.env.SMARTPAY_API_KEY;
    const baseUrl = getSmartPayBaseUrl();

    // Check webhook cache first
    const cached = recentWebhooks.get(checkoutRequestId);
    if (cached) {
      return res.json({
        success: true,
        status: cached.resultCode === 0 ? 'COMPLETED' : 'FAILED',
        receipt: cached.mpesaReceiptNumber,
        amount: cached.amount,
        phone: cached.phoneNumber,
        message: cached.resultDesc,
        completedAt: cached.timestamp,
      });
    }

    if (apiKey && apiKey.trim().length > 0 && !apiKey.includes('MY_')) {
      try {
        const response = await fetch(`${baseUrl}/v1/transactions/${checkoutRequestId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const tx = data.transaction || data;
          const txStatus = String(tx.status || '').toLowerCase();
          const hasReceipt = Boolean(tx.mpesa_receipt_number && tx.mpesa_receipt_number.length > 3);
          const isCompleted = txStatus === 'completed' || txStatus === 'successful' || txStatus === 'success' || tx.result_code === 0 || hasReceipt;
          const isFailed = txStatus === 'failed' || txStatus === 'cancelled' || (typeof tx.result_code === 'number' && tx.result_code !== 0);

          return res.json({
            success: true,
            status: isCompleted ? 'COMPLETED' : isFailed ? 'FAILED' : 'PENDING',
            receipt: tx.mpesa_receipt_number || tx.receipt || '',
            amount: tx.amount,
            phone: tx.phone,
            message: isCompleted
              ? `Payment confirmed! M-Pesa Receipt: ${tx.mpesa_receipt_number || 'OK'}`
              : isFailed
              ? `Payment cancelled or failed: ${tx.result_desc || 'Declined on handset'}`
              : 'Awaiting customer M-Pesa PIN confirmation on handset...',
            raw: data,
          });
        }
      } catch (fetchErr) {
        console.warn('Notice checking live transaction status:', fetchErr);
      }
    }

    // Default pending status if awaiting phone PIN authorization
    return res.json({
      success: true,
      status: 'PENDING',
      message: 'Awaiting customer M-Pesa PIN confirmation on handset...',
      checkoutRequestId,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Error querying STK status',
    });
  }
});

/**
 * 4. B2C: Queue a Payout / Withdrawal
 * POST /api/smartpay/b2c/payout
 */
smartpayRouter.post('/b2c/payout', async (req: Request, res: Response) => {
  try {
    const { phone, amount } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ success: false, message: 'Phone and amount are required.' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum B2C withdrawal amount is KSh 10 (as per SmartPay specs).',
      });
    }

    const formattedPhone = formatKenyanPhone(phone);
    if (!formattedPhone || formattedPhone.length !== 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone format. Please use 07XXXXXXXX, 01XXXXXXXX, or 254XXXXXXXXX.',
      });
    }

    const apiKey = process.env.SMARTPAY_API_KEY;
    const username = process.env.SMARTPAY_USERNAME;
    const password = process.env.SMARTPAY_PASSWORD;
    const baseUrl = getSmartPayBaseUrl();

    let fee = 0;
    if (numAmount > 1000) {
      fee = 15;
    } else if (numAmount > 100) {
      fee = 10;
    }

    // Live Gateway Call if credentials exist
    if (apiKey && username && password && !apiKey.includes('MY_')) {
      const payload = {
        phone: formattedPhone,
        amount: Math.round(numAmount),
      };

      try {
        const response = await fetch(`${baseUrl}/v1/b2c/send`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'X-Username': username,
            'X-Password': password,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.success !== false) {
          return res.status(200).json({
            success: true,
            message: data.message || `Payout of KSh ${numAmount} sent to ${formattedPhone}`,
            reference: data.reference || data.transaction_id,
            details: data,
          });
        } else {
          return res.status(response.status || 400).json({
            success: false,
            message: data.error || data.message || 'SmartPay rejected B2C payout request',
            details: data,
          });
        }
      } catch (b2cErr: any) {
        return res.status(502).json({
          success: false,
          message: `Network error reaching SmartPay B2C: ${b2cErr?.message || 'Gateway error'}`,
        });
      }
    }

    // SIMULATION MODE
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const simulatedRef = `AG_${dateStr}_${Math.random().toString(36).substring(2, 12)}`;
    const simulatedConversationId = `AG_${dateStr}_${Math.random().toString(36).substring(2, 10)}`;

    return res.status(202).json({
      success: true,
      mode: 'simulation',
      message: `B2C Payout initiated to ${formattedPhone}. Funds disbursed immediately.`,
      reference: simulatedRef,
      withdrawal_id: Math.floor(1000 + Math.random() * 9000),
      conversation_id: simulatedConversationId,
      phone: formattedPhone,
      amount: numAmount,
      fee: fee,
      status: 'PROCESSING',
      receipt: 'RC' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    });
  } catch (error: any) {
    console.error('SmartPay B2C error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to dispatch B2C payout via SmartPayPesa',
    });
  }
});

/**
 * 5. Webhook / Callback Handler & Events Store
 * POST /api/smartpay/webhook
 * GET /api/smartpay/webhook/events
 */
smartpayRouter.get('/webhook/events', (req: Request, res: Response) => {
  const events = Array.from(recentWebhooks.values()).reverse();
  return res.json({
    success: true,
    count: events.length,
    events,
  });
});

smartpayRouter.post('/webhook', async (req: Request, res: Response) => {
  try {
    const raw = req.body;
    const body = raw?.Body?.stkCallback || raw?.stkCallback || raw;

    let checkoutReqId = '';
    let merchantReqId = '';
    let resultCode = 0;
    let resultDesc = 'Success';
    let amount = 0;
    let receipt = '';
    let phone = '';

    if (body) {
      merchantReqId = body.MerchantRequestID || raw.merchant_request_id || '';
      checkoutReqId = body.CheckoutRequestID || raw.checkout_request_id || '';
      resultCode = typeof body.ResultCode === 'number' ? body.ResultCode : (raw.result_code ?? 0);
      resultDesc = body.ResultDesc || raw.result_desc || 'The service request was processed successfully.';

      if (body.CallbackMetadata && Array.isArray(body.CallbackMetadata.Item)) {
        for (const item of body.CallbackMetadata.Item) {
          if (item.Name === 'Amount') amount = Number(item.Value);
          if (item.Name === 'MpesaReceiptNumber') receipt = String(item.Value);
          if (item.Name === 'PhoneNumber') phone = String(item.Value);
        }
      } else {
        amount = Number(raw.amount) || 0;
        receipt = raw.mpesa_receipt_number || raw.receipt || '';
        phone = raw.phone || raw.phone_number || '';
      }

      if (checkoutReqId) {
        recentWebhooks.set(checkoutReqId, {
          merchantRequestId: merchantReqId,
          checkoutRequestId: checkoutReqId,
          resultCode: Number(resultCode),
          resultDesc,
          amount,
          mpesaReceiptNumber: receipt || 'MPESA_WEBHOOK',
          phoneNumber: phone,
          timestamp: new Date().toISOString(),
          raw,
        });

        // Sync to Supabase if configured
        const supabase = getServerSupabase();
        if (supabase) {
          try {
            await supabase.from('mboka_smartpay_events').insert({
              id: `evt_${checkoutReqId}_${Date.now()}`,
              event_type: 'c2b.webhook',
              checkout_request_id: checkoutReqId,
              merchant_request_id: merchantReqId,
              mpesa_receipt: receipt,
              amount,
              phone,
              result_code: resultCode,
              result_desc: resultDesc,
              raw_payload: raw,
              processed: true,
              created_at: new Date().toISOString(),
            });

            if (resultCode === 0 && amount > 0) {
              await supabase.from('mboka_transactions').insert({
                id: `tx_${checkoutReqId}`,
                reference: receipt || `SP-${checkoutReqId.substring(0, 10)}`,
                type: 'deposit',
                amount,
                fee: 0,
                description: `M-Pesa Deposit via SmartPay (${receipt || checkoutReqId})`,
                status: 'completed',
                recipient_or_sender: phone,
                created_at: new Date().toISOString(),
              });
            }
          } catch (sbErr) {
            console.warn('Notice writing webhook event to Supabase:', sbErr);
          }
        }
      }
    }

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'SmartPay webhook processed successfully',
      success: true,
      checkout_request_id: checkoutReqId,
    });
  } catch (err) {
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'SmartPay webhook acknowledged',
      success: true,
    });
  }
});

