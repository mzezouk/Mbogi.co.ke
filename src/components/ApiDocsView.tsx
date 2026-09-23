import React, { useState } from 'react';
import {
  BookOpen,
  Copy,
  Check,
  Code2,
  Server,
  Key,
  Globe,
  Zap,
  ShieldCheck,
  ArrowRight,
  Download,
  Terminal,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';

interface ApiDocsViewProps {
  onBackToSandbox?: () => void;
  secretKey?: string;
  publicKey?: string;
}

export const ApiDocsView: React.FC<ApiDocsViewProps> = ({
  onBackToSandbox,
  secretKey,
  publicKey,
}) => {
  const { user, formatKsh } = useMboka();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string>('initialize');

  const myWalletId = user.walletId || 'MBK-904281';
  const effectiveSecret = secretKey || 'mbk_live_sk_sample_secret_key';
  const effectivePublic = publicKey || 'mbk_live_pk_sample_public_key';

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDownloadDocs = () => {
    const element = document.createElement('a');
    element.setAttribute('href', '/API_DOCUMENTATION.md');
    element.setAttribute('download', 'Mboka_Wallet_API_Documentation.md');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/30">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Developer Reference v1.2</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
            Mboka Merchant API Documentation
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Complete technical specification for collecting M-Pesa customer payments with instant settlement into your <strong className="text-emerald-400">Wallet ID ({myWalletId})</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          {onBackToSandbox && (
            <button
              onClick={onBackToSandbox}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer border border-slate-700 flex items-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sandbox &amp; Keys</span>
            </button>
          )}

          <button
            onClick={handleDownloadDocs}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .MD Docs</span>
          </button>
        </div>
      </div>

      {/* Quick Architecture Callout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <span className="font-bold text-slate-900 block">Linked to Wallet ID</span>
            <p className="text-slate-500">
              Every charge resolves your Wallet ID (<strong>{myWalletId}</strong>) so funds settle directly into your balance with zero reconciliation delay.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <span className="font-bold text-slate-900 block">Base URL</span>
            <code className="text-slate-800 font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
              https://mboka.app/api/v1
            </code>
            <p className="text-slate-500">
              Standard JSON REST endpoints over TLS 1.3 encryption.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <span className="font-bold text-slate-900 block">Automated B2C Sweep</span>
            <p className="text-slate-500">
              Pairs seamlessly with your Auto-B2C rule: accumulated wallet balances above your threshold auto-disburse to your phone.
            </p>
          </div>
        </div>
      </div>

      {/* Authentication Section */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Key className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900 font-heading">
            Authentication &amp; Request Headers
          </h2>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Mboka API authenticates requests using Bearer token authentication in the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">Authorization</code> header. Your Secret API Key must be kept strictly confidential on your backend.
        </p>

        <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto relative">
          <pre className="space-y-1">
            <span className="text-slate-400">Authorization:</span> Bearer {effectiveSecret}
            <br />
            <span className="text-slate-400">Content-Type:</span> application/json
            <br />
            <span className="text-slate-400">x-wallet-id:</span> {myWalletId} <span className="text-slate-500"># Optional explicit destination binding</span>
          </pre>
          <button
            onClick={() => handleCopy(`Authorization: Bearer ${effectiveSecret}\nContent-Type: application/json\nx-wallet-id: ${myWalletId}`, 'auth_headers')}
            className="absolute top-3 right-3 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            {copiedSection === 'auth_headers' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedSection === 'auth_headers' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Endpoints Reference Interactive Accordion */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
            REST API Endpoints Specification
          </h2>
          <p className="text-xs text-slate-500">
            Click any endpoint below to inspect request parameters, headers, sample cURL requests, and response payloads.
          </p>
        </div>

        <div className="space-y-4">
          {/* 1. Initialize Charge */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpandedEndpoint(expandedEndpoint === 'initialize' ? '' : 'initialize')}
              className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs">
                  POST
                </span>
                <span className="font-mono font-bold text-xs text-slate-900">
                  /api/v1/charges/initialize
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  — Collect customer payment (STK Push)
                </span>
              </div>
              {expandedEndpoint === 'initialize' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {expandedEndpoint === 'initialize' && (
              <div className="p-5 space-y-5 text-xs text-slate-700 bg-white border-t border-slate-200">
                <p>
                  Dispatches an M-Pesa payment prompt to the customer's phone. Once approved, the funds settle directly into Wallet ID <strong className="font-mono text-slate-900">{myWalletId}</strong>.
                </p>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px]">Request Body Parameters</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden">
                      <thead className="bg-slate-50 font-semibold text-slate-600">
                        <tr>
                          <th className="p-2.5 border-b border-slate-200">Parameter</th>
                          <th className="p-2.5 border-b border-slate-200">Type</th>
                          <th className="p-2.5 border-b border-slate-200">Required</th>
                          <th className="p-2.5 border-b border-slate-200">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-600 font-mono text-[11px]">
                        <tr>
                          <td className="p-2.5 font-bold text-slate-900">walletId</td>
                          <td className="p-2.5 text-indigo-600">string</td>
                          <td className="p-2.5 text-slate-500">Optional*</td>
                          <td className="p-2.5 font-sans">Settlement Wallet ID (defaults to ID tied to your secret key).</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-900">amount</td>
                          <td className="p-2.5 text-indigo-600">number</td>
                          <td className="p-2.5 text-emerald-600 font-bold">Required</td>
                          <td className="p-2.5 font-sans">Amount in KSh (min: 1.00).</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-900">phone</td>
                          <td className="p-2.5 text-indigo-600">string</td>
                          <td className="p-2.5 text-emerald-600 font-bold">Required</td>
                          <td className="p-2.5 font-sans">Customer M-Pesa number (e.g. "0712345678" or "254712345678").</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-900">reference</td>
                          <td className="p-2.5 text-indigo-600">string</td>
                          <td className="p-2.5 text-slate-500">Optional</td>
                          <td className="p-2.5 font-sans">Internal order or invoice identifier (e.g. "ORD-901").</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-900">description</td>
                          <td className="p-2.5 text-indigo-600">string</td>
                          <td className="p-2.5 text-slate-500">Optional</td>
                          <td className="p-2.5 font-sans">Payment purpose memo displayed to the customer.</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-900">customerEmail</td>
                          <td className="p-2.5 text-indigo-600">string</td>
                          <td className="p-2.5 text-slate-500">Optional</td>
                          <td className="p-2.5 font-sans">Recipient email for digital receipt dispatch.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px]">Example cURL Request</h4>
                  <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto relative">
                    <pre>{`curl -X POST https://mboka.app/api/v1/charges/initialize \\
  -H "Authorization: Bearer ${effectiveSecret}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "walletId": "${myWalletId}",
    "amount": 500,
    "phone": "254712345678",
    "reference": "ORD-99201",
    "description": "E-Commerce Checkout"
  }'`}</pre>
                    <button
                      onClick={() => handleCopy(`curl -X POST https://mboka.app/api/v1/charges/initialize \\\n  -H "Authorization: Bearer ${effectiveSecret}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "walletId": "${myWalletId}",\n    "amount": 500,\n    "phone": "254712345678",\n    "reference": "ORD-99201",\n    "description": "E-Commerce Checkout"\n  }'`, 'curl_init')}
                      className="absolute top-2.5 right-2.5 px-2 py-1 bg-slate-800 text-slate-300 text-[10px] rounded hover:bg-slate-700 cursor-pointer"
                    >
                      {copiedSection === 'curl_init' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px]">Response (201 Created)</h4>
                  <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto">
                    <pre>{`{
  "success": true,
  "status": "pending",
  "chargeId": "chg_94ad81b5c421",
  "reference": "ORD-99201",
  "amount": 500,
  "currency": "KES",
  "settleToWalletId": "${myWalletId}",
  "message": "Payment request initialized for KSh 500.00. Funds will automatically settle into Mboka Wallet (${myWalletId}) upon customer authorization.",
  "checkoutUrl": "https://mboka.app/pay/chg_94ad81b5c421"
}`}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Get Charge Status */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpandedEndpoint(expandedEndpoint === 'status' ? '' : 'status')}
              className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs">
                  GET
                </span>
                <span className="font-mono font-bold text-xs text-slate-900">
                  /api/v1/charges/:chargeId
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  — Check payment charge state
                </span>
              </div>
              {expandedEndpoint === 'status' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {expandedEndpoint === 'status' && (
              <div className="p-5 space-y-4 text-xs text-slate-700 bg-white border-t border-slate-200">
                <p>
                  Returns the real-time settlement status of a transaction (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">pending</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">completed</code>, or <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">failed</code>).
                </p>
                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px]">
                  <pre>{`// Response (200 OK)
{
  "success": true,
  "data": {
    "id": "chg_94ad81b5c421",
    "walletId": "${myWalletId}",
    "amount": 500,
    "phone": "254712345678",
    "reference": "ORD-99201",
    "status": "completed",
    "settledAt": "2026-09-23T02:14:18.000Z",
    "mpesaReceiptNumber": "MBK9812401"
  }
}`}</pre>
                </div>
              </div>
            )}
          </div>

          {/* 3. History */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpandedEndpoint(expandedEndpoint === 'history' ? '' : 'history')}
              className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs">
                  GET
                </span>
                <span className="font-mono font-bold text-xs text-slate-900">
                  /api/v1/charges/history/:walletId
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  — List all collections settled into wallet
                </span>
              </div>
              {expandedEndpoint === 'history' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {expandedEndpoint === 'history' && (
              <div className="p-5 space-y-4 text-xs text-slate-700 bg-white border-t border-slate-200">
                <p>
                  Retrieves all chronological collections and settled charges processed for Wallet ID <strong className="font-mono">{myWalletId}</strong>.
                </p>
                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px]">
                  <pre>{`// GET /api/v1/charges/history/${myWalletId}
{
  "success": true,
  "total": 3,
  "data": [
    {
      "id": "chg_94ad81b5c421",
      "walletId": "${myWalletId}",
      "amount": 500,
      "reference": "ORD-99201",
      "status": "completed",
      "mpesaReceiptNumber": "MBK9812401"
    }
  ]
}`}</pre>
                </div>
              </div>
            )}
          </div>

          {/* 4. Complete / Settle Sandbox */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpandedEndpoint(expandedEndpoint === 'complete' ? '' : 'complete')}
              className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-mono font-bold text-xs">
                  POST
                </span>
                <span className="font-mono font-bold text-xs text-slate-900">
                  /api/v1/charges/:chargeId/complete
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  — Simulate customer PIN entry (Sandbox settlement)
                </span>
              </div>
              {expandedEndpoint === 'complete' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {expandedEndpoint === 'complete' && (
              <div className="p-5 space-y-4 text-xs text-slate-700 bg-white border-t border-slate-200">
                <p>
                  Sandbox helper endpoint: completes a pending charge instantly, credits the linked wallet balance, generates an M-Pesa receipt code, and triggers your registered webhook.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Webhook Notifications Section */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-heading">
            Webhook Event Specification
          </h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Mboka pushes an HTTP <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">POST</code> request to your webhook URL whenever a customer authorizes an M-Pesa payment.
        </p>

        <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto">
          <pre>{`// Webhook Event: payment.settled
{
  "event": "payment.settled",
  "data": {
    "id": "chg_94ad81b5c421",
    "walletId": "${myWalletId}",
    "amount": 750.00,
    "currency": "KES",
    "phone": "254712345678",
    "reference": "ORD-2026-9912",
    "status": "completed",
    "mpesaReceiptNumber": "MBK8492018",
    "settledAt": "2026-09-23T02:14:18.000Z"
  }
}`}</pre>
        </div>

        <p className="text-xs text-slate-500">
          Your server must return an HTTP status code <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">200 OK</code> within 5 seconds of receiving the callback.
        </p>
      </div>

      {/* Error Codes Table */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 font-heading border-b border-slate-100 pb-3">
          Error Codes &amp; Handling
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="p-3 border-b border-slate-200">HTTP Status</th>
                <th className="p-3 border-b border-slate-200">Error Description</th>
                <th className="p-3 border-b border-slate-200">Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
              <tr>
                <td className="p-3 font-mono font-bold text-amber-700">400 Bad Request</td>
                <td className="p-3 font-mono text-slate-800">Amount must be at least KSh 1.00</td>
                <td className="p-3">Ensure amount is numeric and &ge; 1.00</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-amber-700">400 Bad Request</td>
                <td className="p-3 font-mono text-slate-800">Customer phone number is required</td>
                <td className="p-3">Provide valid Kenyan phone number format (07..., 01..., or 254...)</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-rose-700">401 Unauthorized</td>
                <td className="p-3 font-mono text-slate-800">Missing Wallet ID / Invalid Secret Key</td>
                <td className="p-3">Pass valid Bearer secret key or explicit x-wallet-id header</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-slate-700">404 Not Found</td>
                <td className="p-3 font-mono text-slate-800">Charge not found</td>
                <td className="p-3">Verify chargeId parameter passed in the URL route</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
