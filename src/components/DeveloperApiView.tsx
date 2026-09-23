import React, { useState, useEffect } from 'react';
import {
  Code2,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Globe,
  Terminal,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Server,
  FileCode2,
  BookOpen,
  Fingerprint,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';
import { MerchantApiKey, ApiCharge } from '../types';
import { ApiDocsView } from './ApiDocsView';

export const DeveloperApiView: React.FC = () => {
  const { user, walletBalance, formatKsh, recordApiPaymentSettlement, triggerBiometricAuth } = useMboka();

  const [activeSubTab, setActiveSubTab] = useState<'sandbox' | 'docs'>('sandbox');
  const [keys, setKeys] = useState<MerchantApiKey | null>(null);
  const [loadingKeys, setLoadingKeys] = useState<boolean>(true);
  const [showSecretKey, setShowSecretKey] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Webhook state
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [savingWebhook, setSavingWebhook] = useState<boolean>(false);
  const [webhookNotice, setWebhookNotice] = useState<string | null>(null);

  // Test Charge sandbox state
  const [testPhone, setTestPhone] = useState<string>(user.phone || '0712345678');
  const [testAmount, setTestAmount] = useState<string>('250');
  const [testReference, setTestReference] = useState<string>(`INV-${Date.now().toString().slice(-5)}`);
  const [testDescription, setTestDescription] = useState<string>('Online Store Checkout');
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [activeCharge, setActiveCharge] = useState<ApiCharge | null>(null);
  const [chargeNotice, setChargeNotice] = useState<string | null>(null);
  const [isSettling, setIsSettling] = useState<boolean>(false);

  // Charges History state
  const [chargesHistory, setChargesHistory] = useState<ApiCharge[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Code snippet tab state
  const [codeTab, setCodeTab] = useState<'curl' | 'node' | 'python' | 'php'>('curl');

  // Fetch or initialize API keys linked to user's walletId
  const fetchKeys = async () => {
    if (!user.walletId) return;
    setLoadingKeys(true);
    try {
      const res = await fetch(`/api/v1/keys/${encodeURIComponent(user.walletId)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setKeys(data.data);
        if (data.data.webhookUrl) {
          setWebhookUrl(data.data.webhookUrl);
        }
      }
    } catch (err) {
      console.warn('Failed to load merchant keys:', err);
    } finally {
      setLoadingKeys(false);
    }
  };

  // Fetch payment charges for user's walletId
  const fetchCharges = async () => {
    if (!user.walletId) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/v1/charges/history/${encodeURIComponent(user.walletId)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setChargesHistory(data.data);
      }
    } catch (err) {
      console.warn('Failed to load charge history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchCharges();
  }, [user.walletId]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const executeKeyRotation = async () => {
    setLoadingKeys(true);
    try {
      const res = await fetch('/api/v1/keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: user.walletId,
          merchantName: user.name,
          webhookUrl,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setKeys(data.data);
      }
    } catch (err) {
      console.warn('Failed to regenerate keys:', err);
    } finally {
      setLoadingKeys(false);
    }
  };

  const handleRegenerateKeys = async () => {
    if (user.biometricSettings?.enabled !== false) {
      triggerBiometricAuth({
        actionTitle: 'Authorize API Secret Key Rotation',
        actionDescription: 'Biometric authorization required to rotate merchant API keys.',
        recipientText: `Merchant ${user.walletId}`,
        onSuccess: () => {
          executeKeyRotation();
        },
      });
      return;
    }

    if (!window.confirm('Are you sure you want to rotate your API secret keys? Any existing client integrations will need to update their secret key.')) {
      return;
    }
    executeKeyRotation();
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWebhook(true);
    setWebhookNotice(null);
    try {
      const res = await fetch('/api/v1/keys/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: user.walletId,
          webhookUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWebhookNotice('Webhook endpoint saved successfully!');
        setTimeout(() => setWebhookNotice(null), 3000);
      }
    } catch (err) {
      setWebhookNotice('Failed to update webhook URL.');
    } finally {
      setSavingWebhook(false);
    }
  };

  // Dispatch payment collection request
  const handleInitiateCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testAmount || parseFloat(testAmount) <= 0) return;
    setIsCharging(true);
    setChargeNotice(null);
    setActiveCharge(null);

    try {
      const res = await fetch('/api/v1/charges/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keys?.secretKey || ''}`,
          'x-wallet-id': user.walletId,
        },
        body: JSON.stringify({
          walletId: user.walletId,
          amount: parseFloat(testAmount),
          phone: testPhone,
          reference: testReference,
          description: testDescription,
          metadata: { merchantWalletId: user.walletId, source: 'merchant_sandbox' },
        }),
      });

      const data = await res.json();
      if (data.success && data.charge) {
        setActiveCharge(data.charge);
        setChargeNotice(`Payment request initiated! M-Pesa prompt dispatched to ${testPhone}.`);
        fetchCharges();
      } else {
        setChargeNotice(data.error || 'Charge initiation failed.');
      }
    } catch (err: any) {
      setChargeNotice(err?.message || 'Network error initiating charge.');
    } finally {
      setIsCharging(false);
    }
  };

  // Settle payment (Simulate customer entering PIN)
  const handleCompleteCharge = async () => {
    if (!activeCharge) return;
    setIsSettling(true);
    try {
      const res = await fetch(`/api/v1/charges/${activeCharge.id}/complete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.data) {
        const completedCharge: ApiCharge = data.data;
        setActiveCharge(completedCharge);
        // Settle immediately into user's wallet
        recordApiPaymentSettlement(completedCharge);
        setChargeNotice(`Payment approved! KSh ${formatKsh(completedCharge.amount)} settled directly into Wallet ${user.walletId}.`);
        fetchCharges();
        // Generate new test reference for convenience
        setTestReference(`INV-${Date.now().toString().slice(-5)}`);
      }
    } catch (err) {
      console.warn('Failed to complete charge:', err);
    } finally {
      setIsSettling(false);
    }
  };

  const secretKeyDisplay = keys?.secretKey
    ? showSecretKey
      ? keys.secretKey
      : `${keys.secretKey.substring(0, 14)}${'•'.repeat(24)}`
    : 'Generating keys...';

  // Dynamic code snippets pre-filled with the user's actual Wallet ID and API keys
  const snippetCurl = `curl -X POST https://mboka.app/api/v1/charges/initialize \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${keys?.secretKey || 'mbk_live_sk_your_secret_key'}" \\
  -d '{
    "walletId": "${user.walletId}",
    "amount": 500,
    "phone": "254712345678",
    "reference": "ORDER-9042",
    "description": "Store Purchase",
    "customerEmail": "customer@example.com"
  }'`;

  const snippetNode = `// Node.js (fetch / axios)
import axios from 'axios';

async function collectPayment() {
  const response = await axios.post('https://mboka.app/api/v1/charges/initialize', {
    walletId: '${user.walletId}', // Funds settle into your Wallet ID
    amount: 500,
    phone: '254712345678',
    reference: 'ORDER-9042',
    description: 'E-commerce Purchase'
  }, {
    headers: {
      'Authorization': 'Bearer ${keys?.secretKey || 'mbk_live_sk_your_secret_key'}',
      'Content-Type': 'application/json'
    }
  });

  console.log('Payment initialized:', response.data);
  // Response includes chargeId and confirmation status
}

collectPayment();`;

  const snippetPython = `# Python 3 (requests)
import requests

url = "https://mboka.app/api/v1/charges/initialize"
headers = {
    "Authorization": "Bearer ${keys?.secretKey || 'mbk_live_sk_your_secret_key'}",
    "Content-Type": "application/json"
}

payload = {
    "walletId": "${user.walletId}", # Settle destination
    "amount": 500,
    "phone": "254712345678",
    "reference": "ORDER-9042",
    "description": "E-Commerce Store Payment"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;

  const snippetPhp = `<?php
// PHP cURL Integration
$ch = curl_init('https://mboka.app/api/v1/charges/initialize');
$payload = json_encode([
    'walletId' => '${user.walletId}',
    'amount' => 500,
    'phone' => '254712345678',
    'reference' => 'ORDER-9042',
    'description' => 'Online Order Checkout'
]);

curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ${keys?.secretKey || 'mbk_live_sk_your_secret_key'}'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>`;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30 backdrop-blur-xs">
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Merchant &amp; Developer API</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
              Collect Payments with Mboka Wallet API
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Accept customer M-Pesa payments on your website, app, or point of sale. Every transaction processed through this API is strictly linked to your unique <strong className="text-white">Wallet ID</strong> and settles directly into your balance in real time.
            </p>
          </div>

          {/* Settle Destination Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-5 rounded-2xl shrink-0 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
              Settlement Destination
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-black text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-500/30">
                {user.walletId}
              </span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="pt-1 flex items-center justify-between text-xs text-slate-300">
              <span>Current Balance:</span>
              <strong className="text-white font-mono">{formatKsh(walletBalance)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation tabs: Sandbox & Keys vs Full API Docs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('sandbox')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'sandbox'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>Dashboard &amp; Sandbox</span>
        </button>

        <button
          onClick={() => setActiveSubTab('docs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'docs'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>Full API Documentation</span>
        </button>
      </div>

      {activeSubTab === 'docs' ? (
        <ApiDocsView
          onBackToSandbox={() => setActiveSubTab('sandbox')}
          secretKey={keys?.secretKey}
          publicKey={keys?.publicKey}
        />
      ) : (
        <>
          {/* Grid: Credentials & Webhooks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* API Credentials */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 font-heading">
                  Merchant API Credentials
                </h2>
                <p className="text-xs text-slate-500">
                  Authentication keys linked to Wallet ID <strong className="font-mono text-slate-700">{user.walletId}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={handleRegenerateKeys}
              disabled={loadingKeys}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              title="Rotate Secret Key"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingKeys ? 'animate-spin' : ''}`} />
              <span>Rotate Keys</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Public Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Public Key (Client-side / Checkout)</span>
                <span className="text-[10px] text-slate-400 font-normal">Identifies your merchant wallet</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={keys?.publicKey || 'Loading...'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none"
                />
                <button
                  onClick={() => handleCopy(keys?.publicKey || '', 'public')}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                >
                  {copiedKey === 'public' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'public' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Secret Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Secret API Key (Server-to-Server)</span>
                <span className="text-[10px] text-rose-500 font-semibold">Keep private • Authorizes charges</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={secretKeyDisplay}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shrink-0"
                  title={showSecretKey ? 'Hide Secret Key' : 'Reveal Secret Key'}
                >
                  {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleCopy(keys?.secretKey || '', 'secret')}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                >
                  {copiedKey === 'secret' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'secret' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Linked Wallet Callout */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-950 flex items-start gap-3">
              <Zap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-emerald-900 block">Automatic Direct Settlement</span>
                <p className="text-emerald-800">
                  Payments collected with this key settle directly into <strong className="font-mono">{user.walletId}</strong>. You can then withdraw to M-Pesa manually or enable Automated B2C Settlement.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Webhook Configuration */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">Webhook Notifications</h3>
                <p className="text-xs text-slate-500">Real-time HTTP callbacks</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Mboka sends a <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">POST</code> request with <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">payment.settled</code> event whenever customer funds land in your wallet.
            </p>

            <form onSubmit={handleSaveWebhook} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Webhook URL</label>
                <input
                  type="url"
                  placeholder="https://yourdomain.com/webhooks/mboka"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {webhookNotice && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{webhookNotice}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={savingWebhook}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {savingWebhook ? 'Saving...' : 'Save Webhook Endpoint'}
              </button>
            </form>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Payload format: <span className="font-mono text-slate-600">&#123; event, data: ApiCharge &#125;</span>
          </div>
        </div>
      </div>

      {/* Interactive Sandbox Test Runner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Terminal className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                Interactive Payment Collection Sandbox
              </h2>
              <p className="text-xs text-slate-500">
                Trigger a payment request right now and see the funds settle into your Wallet ID ({user.walletId}).
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono self-start sm:self-auto">
            POST /api/v1/charges/initialize
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Form */}
          <form onSubmit={handleInitiateCharge} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Customer Phone Number</label>
                <input
                  type="tel"
                  required
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="07XX XXX XXX or 254..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Collection Amount (KSh)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    KSh
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={testAmount}
                    onChange={(e) => setTestAmount(e.target.value)}
                    placeholder="250"
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Order Reference</label>
                <input
                  type="text"
                  required
                  value={testReference}
                  onChange={(e) => setTestReference(e.target.value)}
                  placeholder="INV-9042"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Payment Description</label>
                <input
                  type="text"
                  required
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                  placeholder="Sneakers Purchase"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
              <span>Settlement Account:</span>
              <strong className="font-mono text-slate-900">{user.walletId}</strong>
            </div>

            <button
              type="submit"
              disabled={isCharging}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className={`w-3.5 h-3.5 ${isCharging ? 'animate-pulse' : ''}`} />
              <span>{isCharging ? 'Initiating Payment Request...' : 'Trigger API Payment Request'}</span>
            </button>
          </form>

          {/* Real-time Result Sandbox Card */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">API Response &amp; Settlement State</span>
                </div>
                {activeCharge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      activeCharge.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {activeCharge.status === 'completed' ? 'Settled to Wallet' : 'Pending Customer PIN'}
                  </span>
                )}
              </div>

              {chargeNotice && (
                <div className="mt-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200">
                  {chargeNotice}
                </div>
              )}

              {activeCharge ? (
                <div className="mt-4 space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                    <span>Charge ID:</span>
                    <strong className="text-white">{activeCharge.id}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                    <span>Settles To:</span>
                    <strong className="text-emerald-400 font-bold">{activeCharge.walletId}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                    <span>Amount:</span>
                    <strong className="text-white font-bold">{formatKsh(activeCharge.amount)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                    <span>Customer Phone:</span>
                    <strong className="text-white">{activeCharge.phone}</strong>
                  </div>
                  {activeCharge.mpesaReceiptNumber && (
                    <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                      <span>Receipt:</span>
                      <strong className="text-emerald-300">{activeCharge.mpesaReceiptNumber}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                  <p>No charge initiated yet.</p>
                  <p className="text-[11px] text-slate-500">Fill the sandbox form and click "Trigger API Payment Request".</p>
                </div>
              )}
            </div>

            {activeCharge && activeCharge.status === 'pending' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCompleteCharge}
                  disabled={isSettling}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSettling ? 'Settling Payment...' : 'Simulate Customer PIN Approved (Settle to Wallet)'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Code Snippets & Documentation */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <FileCode2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Integration Code Examples
              </h3>
              <p className="text-xs text-slate-500">
                Pre-configured with your Wallet ID (<strong className="font-mono">{user.walletId}</strong>) and live secret key
              </p>
            </div>
          </div>

          {/* Language selector tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['curl', 'node', 'python', 'php'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setCodeTab(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  codeTab === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'curl' ? 'cURL' : tab === 'node' ? 'Node.js' : tab === 'python' ? 'Python' : 'PHP'}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <pre className="bg-slate-900 text-slate-200 p-4 sm:p-5 rounded-2xl text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed">
            {codeTab === 'curl' && snippetCurl}
            {codeTab === 'node' && snippetNode}
            {codeTab === 'python' && snippetPython}
            {codeTab === 'php' && snippetPhp}
          </pre>
          <button
            onClick={() => {
              const code =
                codeTab === 'curl'
                  ? snippetCurl
                  : codeTab === 'node'
                  ? snippetNode
                  : codeTab === 'python'
                  ? snippetPython
                  : snippetPhp;
              handleCopy(code, 'snippet');
            }}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            {copiedKey === 'snippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'snippet' ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Charges & Settlement Log Table */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              API Collection &amp; Settlement Log
            </h3>
            <p className="text-xs text-slate-500">
              All payment charges processed through your API keys settling into Wallet {user.walletId}
            </p>
          </div>

          <button
            onClick={fetchCharges}
            disabled={loadingHistory}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
            <span>Refresh Log</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          {chargesHistory.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No API charges collected yet. Use the sandbox runner above or your API keys to collect customer payments.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-100">
                <tr>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Customer Phone</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Settlement Wallet</th>
                  <th className="py-3 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chargesHistory.map((chg) => (
                  <tr key={chg.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-slate-900">{chg.reference}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">{chg.id}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">{chg.phone}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {formatKsh(chg.amount)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          chg.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : chg.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {chg.status === 'completed' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Settled</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        {chg.walletId}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {new Date(chg.createdAt).toLocaleDateString()} {new Date(chg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
};
