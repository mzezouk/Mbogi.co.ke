import express, { Request, Response } from 'express';
import crypto from 'crypto';

export const merchantApiRouter = express.Router();

export interface MerchantApiKey {
  walletId: string;
  publicKey: string;
  secretKey: string;
  webhookUrl?: string;
  merchantName?: string;
  createdAt: string;
}

export interface ApiCharge {
  id: string;
  walletId: string;
  amount: number;
  phone: string;
  reference: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  currency: string;
  createdAt: string;
  settledAt?: string;
  mpesaReceiptNumber?: string;
  customerEmail?: string;
  metadata?: Record<string, any>;
}

// In-memory key store & charge store
const apiKeysStore: Map<string, MerchantApiKey> = new Map(); // key is walletId
const secretKeyIndex: Map<string, string> = new Map(); // secretKey -> walletId
const chargesStore: Map<string, ApiCharge> = new Map(); // chargeId -> ApiCharge

function generateKeys(walletId: string, merchantName?: string): MerchantApiKey {
  const cleanId = walletId.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  const secretRandom = crypto.randomBytes(16).toString('hex');

  const publicKey = `mbk_live_pk_${cleanId}_${randomSuffix}`;
  const secretKey = `mbk_live_sk_${secretRandom}`;

  const record: MerchantApiKey = {
    walletId,
    publicKey,
    secretKey,
    merchantName: merchantName || `Merchant ${walletId}`,
    createdAt: new Date().toISOString(),
  };

  apiKeysStore.set(walletId, record);
  secretKeyIndex.set(secretKey, walletId);
  return record;
}

// Pre-seed default test key for MBK-904281
generateKeys('MBK-904281', 'Mboka Premium Merchant');

// 1. Get or create keys for a Wallet ID
merchantApiRouter.get('/keys/:walletId', (req: Request, res: Response) => {
  const { walletId } = req.params;
  if (!walletId) {
    return res.status(400).json({ error: 'walletId is required' });
  }

  let keys = apiKeysStore.get(walletId);
  if (!keys) {
    keys = generateKeys(walletId);
  }

  res.json({
    success: true,
    data: keys,
  });
});

// 2. Generate / Rotate keys for a Wallet ID
merchantApiRouter.post('/keys/generate', (req: Request, res: Response) => {
  const { walletId, merchantName, webhookUrl } = req.body;
  if (!walletId) {
    return res.status(400).json({ error: 'walletId is required' });
  }

  // Remove old secret index if exists
  const oldKey = apiKeysStore.get(walletId);
  if (oldKey) {
    secretKeyIndex.delete(oldKey.secretKey);
  }

  const keys = generateKeys(walletId, merchantName);
  if (webhookUrl) {
    keys.webhookUrl = webhookUrl;
  }

  res.json({
    success: true,
    message: `API keys successfully generated and linked to Wallet ID ${walletId}`,
    data: keys,
  });
});

// 3. Update Webhook URL
merchantApiRouter.post('/keys/webhook', (req: Request, res: Response) => {
  const { walletId, webhookUrl } = req.body;
  if (!walletId) {
    return res.status(400).json({ error: 'walletId is required' });
  }

  let keys = apiKeysStore.get(walletId);
  if (!keys) {
    keys = generateKeys(walletId);
  }
  keys.webhookUrl = webhookUrl || '';
  apiKeysStore.set(walletId, keys);

  res.json({
    success: true,
    message: 'Webhook URL updated successfully',
    data: keys,
  });
});

// Helper to resolve Wallet ID from Auth Header or Body
function resolveWalletId(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const foundWalletId = secretKeyIndex.get(token);
    if (foundWalletId) return foundWalletId;
  }

  const headerWalletId = req.headers['x-wallet-id'];
  if (headerWalletId && typeof headerWalletId === 'string') {
    return headerWalletId.trim();
  }

  if (req.body?.walletId && typeof req.body.walletId === 'string') {
    return req.body.walletId.trim();
  }

  return null;
}

// 4. Initialize Payment Charge
// POST /api/v1/charges/initialize
merchantApiRouter.post('/charges/initialize', async (req: Request, res: Response) => {
  try {
    const walletId = resolveWalletId(req);
    const { amount, phone, reference, description, customerEmail, metadata } = req.body;

    if (!walletId) {
      return res.status(401).json({
        success: false,
        error: 'Missing Wallet ID. Provide Authorization: Bearer <secret_key>, x-wallet-id header, or body.walletId so the system knows where payments will settle.',
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 1) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number of at least KSh 1.00',
      });
    }

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Customer phone number is required (e.g. 0712345678 or 254712345678)',
      });
    }

    const chargeId = `chg_${crypto.randomBytes(6).toString('hex')}`;
    const cleanRef = reference || `ORD-${Date.now().toString().slice(-6)}`;
    const cleanDesc = description || `Payment to ${walletId}`;

    const newCharge: ApiCharge = {
      id: chargeId,
      walletId,
      amount: numAmount,
      phone,
      reference: cleanRef,
      description: cleanDesc,
      status: 'pending',
      currency: 'KES',
      createdAt: new Date().toISOString(),
      customerEmail,
      metadata: metadata || {},
    };

    chargesStore.set(chargeId, newCharge);

    res.status(201).json({
      success: true,
      status: 'pending',
      chargeId: newCharge.id,
      reference: newCharge.reference,
      amount: newCharge.amount,
      currency: 'KES',
      settleToWalletId: walletId,
      message: `Payment request initialized for KSh ${numAmount.toFixed(2)}. Funds will automatically settle into Mboka Wallet (${walletId}) upon customer authorization.`,
      checkoutUrl: `https://mboka.app/pay/${chargeId}`,
      charge: newCharge,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to initialize payment charge',
    });
  }
});

// 5. Get Charge Status
merchantApiRouter.get('/charges/:chargeId', (req: Request, res: Response) => {
  const { chargeId } = req.params;
  const charge = chargesStore.get(chargeId);
  if (!charge) {
    return res.status(404).json({ success: false, error: 'Charge not found' });
  }

  res.json({
    success: true,
    data: charge,
  });
});

// 6. Complete / Settle Charge (Customer PIN Approved or Instant Simulation)
merchantApiRouter.post('/charges/:chargeId/complete', async (req: Request, res: Response) => {
  const { chargeId } = req.params;
  const charge = chargesStore.get(chargeId);
  if (!charge) {
    return res.status(404).json({ success: false, error: 'Charge not found' });
  }

  const receipt = `MBK${Date.now().toString().slice(-7).toUpperCase()}`;
  charge.status = 'completed';
  charge.settledAt = new Date().toISOString();
  charge.mpesaReceiptNumber = receipt;

  chargesStore.set(chargeId, charge);

  // If merchant has a webhook configured, attempt async notification
  const keys = apiKeysStore.get(charge.walletId);
  if (keys?.webhookUrl) {
    try {
      fetch(keys.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'payment.settled',
          data: charge,
        }),
      }).catch((e) => console.warn('Webhook notification delivery notice:', e));
    } catch (e) {
      console.warn('Webhook error:', e);
    }
  }

  res.json({
    success: true,
    message: `Payment of KSh ${charge.amount.toFixed(2)} successfully settled into Mboka Wallet (${charge.walletId}). Receipt: ${receipt}`,
    data: charge,
  });
});

// 7. List Charges History for a specific Wallet ID
merchantApiRouter.get('/charges/history/:walletId', (req: Request, res: Response) => {
  const { walletId } = req.params;
  if (!walletId) {
    return res.status(400).json({ error: 'walletId is required' });
  }

  const userCharges: ApiCharge[] = [];
  for (const c of chargesStore.values()) {
    if (c.walletId.toLowerCase() === walletId.toLowerCase()) {
      userCharges.push(c);
    }
  }

  userCharges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    total: userCharges.length,
    data: userCharges,
  });
});
