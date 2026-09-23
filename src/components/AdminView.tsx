import React, { useState } from 'react';
import {
  Shield,
  Users,
  Wallet,
  Store,
  PenTool,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Radio,
  Sliders,
  Wrench,
  Server,
  Send,
  Lock,
  Database,
  Copy,
  Check,
  RefreshCw,
  Smartphone,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';
import { DatabaseInstallReport } from '../lib/supabase';
import { smartpayService } from '../lib/smartpay';

export const AdminView: React.FC = () => {
  const {
    adminStats,
    formatKsh,
    articles,
    transactions,
    addNotification,
    setIsAdminMode,
    setActiveTab,
    isSupabaseConfigured,
    isSupabaseConnected,
    checkSupabaseHealth,
    syncAllToSupabase,
    installDatabase,
    smartpayStatus,
    refreshSmartPayStatus,
    initiateSmartPayDeposit,
    initiateSmartPayWithdrawal,
  } = useMboka();

  const [activeAdminTab, setActiveAdminTab] = useState<
    'overview' | 'users' | 'finance' | 'moderation' | 'broadcast' | 'database' | 'smartpay'
  >('overview');

  // Supabase test, install and sync state
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<string | null>(null);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [dbSyncResult, setDbSyncResult] = useState<string | null>(null);
  const [isInstallingDb, setIsInstallingDb] = useState(false);
  const [dbInstallReport, setDbInstallReport] = useState<DatabaseInstallReport | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // SmartPayPesa sandbox state
  const [stkPhone, setStkPhone] = useState('254712345678');
  const [stkAmount, setStkAmount] = useState('100');
  const [isTriggeringStk, setIsTriggeringStk] = useState(false);
  const [stkResult, setStkResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const [b2cPhone, setB2cPhone] = useState('254712345678');
  const [b2cAmount, setB2cAmount] = useState('50');
  const [isTriggeringB2c, setIsTriggeringB2c] = useState(false);
  const [b2cResult, setB2cResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const [copiedEdgeWebhookUrl, setCopiedEdgeWebhookUrl] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  // Affiliate commission setting state
  const [signupCommission, setSignupCommission] = useState('150');
  const [utilityRate, setUtilityRate] = useState('5.0');
  const [rateSaved, setRateSaved] = useState(false);

  const mockUsersList = [
    { id: 'usr-1', name: 'Brian Mwangi', phone: '+254 712 345 678', kyc: 'Verified', role: 'Trader / Agent', balance: 'KSh 5,250' },
    { id: 'usr-2', name: 'Faith Kemunto', phone: '+254 722 890 123', kyc: 'Verified', role: 'Creator / Writer', balance: 'KSh 12,400' },
    { id: 'usr-3', name: 'Dennis Ochieng', phone: '+254 701 445 928', kyc: 'Pending Review', role: 'Standard User', balance: 'KSh 1,200' },
    { id: 'usr-4', name: 'Amina Hassan', phone: '+254 733 918 273', kyc: 'Verified', role: 'Merchant', balance: 'KSh 45,900' },
  ];

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    addNotification({
      title: `[BROADCAST] ${broadcastTitle}`,
      message: broadcastMessage,
      type: 'system',
      linkTab: 'wallet',
    });

    setBroadcastSent(true);
    setBroadcastTitle('');
    setBroadcastMessage('');
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    setRateSaved(true);
    setTimeout(() => setRateSaved(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Admin Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30">
            <Shield className="w-3.5 h-3.5" />
            <span>Mboka Super Administrator Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
            Platform Operations & Liquidity Hub
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            Manage system users, escrow ledger floats, commission campaigns & service gateways.
          </p>
        </div>

        <button
          onClick={() => {
            setIsAdminMode(false);
            setActiveTab('wallet');
          }}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-colors self-start md:self-auto cursor-pointer"
        >
          Exit to User View →
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
        {[
          { id: 'overview', label: 'System Overview' },
          { id: 'users', label: 'User & KYC Management' },
          { id: 'finance', label: 'Ledger & Float Escrow' },
          { id: 'moderation', label: 'Blog & Articles' },
          { id: 'broadcast', label: 'Broadcast & Campaign' },
          { id: 'database', label: 'Supabase Database' },
          { id: 'smartpay', label: 'SmartPayPesa (C2B / B2C)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveAdminTab(tab.id as any)}
            className={`text-xs px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAdminTab === tab.id
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. Overview Tab */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Registered Users</span>
              <div className="text-2xl font-black text-slate-900 font-heading mt-1">
                {adminStats.totalUsers.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">98.4% KYC pass rate</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Platform Processed Volume</span>
              <div className="text-2xl font-black text-slate-900 font-heading mt-1 font-mono">
                {formatKsh(adminStats.totalVolumeProcessed)}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">Safe ledger balance</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Platform Net Revenue</span>
              <div className="text-2xl font-black text-amber-700 font-heading mt-1 font-mono">
                {formatKsh(adminStats.platformNetRevenue)}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">From POS & ad margins</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Active POS Utilities Today</span>
              <div className="text-2xl font-black text-slate-900 font-heading mt-1 font-mono">
                {adminStats.activeUtilitiesToday}
              </div>
              <span className="text-[11px] text-teal-700 font-semibold mt-0.5 block">Instant token requests</span>
            </div>
          </div>

          {/* Gateway Status Cards */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base font-heading">
              Third-Party Integrations & Gateway Health
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block">Safaricom Daraja API</span>
                  <span className="text-[11px] text-slate-500">STK Push & C2B Webhook</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Healthy
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block">KPLC Stima Token Hub</span>
                  <span className="text-[11px] text-slate-500">STS Token Generation</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Healthy
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block">MultiChoice & StarTimes</span>
                  <span className="text-[11px] text-slate-500">Decoder Activation API</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Healthy
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Users Tab */}
      {activeAdminTab === 'users' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base font-heading">User Directory & KYC Verification</h3>
              <p className="text-xs text-slate-500">Review National IDs, suspend suspicious accounts, and elevate agents</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">KYC Status</th>
                  <th className="py-3 px-4">Wallet Float</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockUsersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{u.phone}</td>
                    <td className="py-3 px-4 text-slate-700">{u.role}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.kyc === 'Verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {u.kyc}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{u.balance}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => alert(`Reviewing KYC documents for ${u.name}`)}
                        className="text-emerald-700 font-bold hover:underline"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Finance & Float Escrow Tab */}
      {activeAdminTab === 'finance' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base font-heading">Ledger Oversight & Float Escrow</h3>
          <p className="text-xs text-slate-500">
            Real-time balance of Kenya commercial bank escrow accounts securing customer wallet funds.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs text-emerald-900 font-semibold block">Total User Deposits Held</span>
              <div className="text-2xl font-black text-emerald-950 font-mono mt-1">
                {formatKsh(adminStats.totalVolumeProcessed * 0.42)}
              </div>
              <span className="text-[10px] text-emerald-700 mt-0.5 block">Backed 100% in CBK Escrow</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-600 font-semibold block">POS Utility Float Buffer</span>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                KSh 2,500,000
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Pre-allocated KPLC & Telco float</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-xs text-amber-900 font-semibold block">Platform Reserve Net</span>
              <div className="text-2xl font-black text-amber-950 font-mono mt-1">
                {formatKsh(adminStats.platformNetRevenue)}
              </div>
              <span className="text-[10px] text-amber-700 mt-0.5 block">Retained corporate revenue</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Moderation Tab */}
      {activeAdminTab === 'moderation' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base font-heading">Articles & Content Moderation</h3>
          <p className="text-xs text-slate-500">Review articles for hate speech, misinformation, or predatory financial advice</p>

          <div className="divide-y divide-slate-100">
            {articles.map((art) => (
              <div key={art.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">{art.title}</h4>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-md">
                      {art.category}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 mt-0.5 block">
                    By {art.authorName} • {art.views} reads • {art.likes} likes
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    Approved (Monetized)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Broadcast Tab */}
      {activeAdminTab === 'broadcast' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Push Broadcast Notification */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base font-heading">Broadcast System Announcement</h3>
              <p className="text-xs text-slate-500">Send an urgent alert to all active Mboka user notification bells</p>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Notice Title</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Scheduled KPLC Maintenance Notice"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Message Content</label>
                <textarea
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Details for all Mboka users..."
                  className="w-full mt-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {broadcastSent && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Broadcast transmitted to all active user device notifications!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send Broadcast Notice</span>
              </button>
            </form>
          </div>

          {/* Affiliate Campaign Tuning */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base font-heading">Affiliate Commission Campaign Rules</h3>
              <p className="text-xs text-slate-500">Fine-tune the viral referral payout incentives</p>
            </div>

            <form onSubmit={handleSaveRates} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">New User Signup Payout (KSh)</label>
                <input
                  type="number"
                  value={signupCommission}
                  onChange={(e) => setSignupCommission(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Utility Fee Kickback (%)</label>
                <input
                  type="text"
                  value={utilityRate}
                  onChange={(e) => setUtilityRate(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {rateSaved && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>New referral reward parameters deployed!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Sliders className="w-4 h-4" />
                <span>Update Commission Rules</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. Supabase Database Tab */}
      {activeAdminTab === 'database' && (
        <div className="space-y-6">
          {/* Provider Overview Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-lg font-heading">
                      Supabase Cloud Database
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isSupabaseConnected
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : isSupabaseConfigured
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isSupabaseConnected
                        ? '● Live & Connected'
                        : isSupabaseConfigured
                        ? '● Configured (Testing)'
                        : '○ Awaiting Environment Keys'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    PostgreSQL persistence provider for Mboka ledger accounts, wallet transactions, articles & referrals.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={async () => {
                    setIsInstallingDb(true);
                    setDbTestResult(null);
                    setDbSyncResult(null);
                    const report = await installDatabase();
                    setDbInstallReport(report);
                    setIsInstallingDb(false);
                  }}
                  disabled={isInstallingDb}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                >
                  <Wrench className={`w-3.5 h-3.5 text-emerald-400 ${isInstallingDb ? 'animate-spin' : ''}`} />
                  <span>{isInstallingDb ? 'Installing & Verifying...' : 'Install & Verify DB'}</span>
                </button>

                <button
                  onClick={async () => {
                    setIsTestingDb(true);
                    setDbTestResult(null);
                    const res = await checkSupabaseHealth();
                    setDbTestResult(res.message);
                    setIsTestingDb(false);
                  }}
                  disabled={isTestingDb}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin' : ''}`} />
                  <span>{isTestingDb ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  onClick={async () => {
                    setIsSyncingDb(true);
                    setDbSyncResult(null);
                    const res = await syncAllToSupabase();
                    setDbSyncResult(res.message);
                    setIsSyncingDb(false);
                  }}
                  disabled={isSyncingDb}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
                  <span>{isSyncingDb ? 'Syncing...' : 'Sync Local Ledger to Cloud'}</span>
                </button>
              </div>
            </div>

            {/* Install Report Alert */}
            {dbInstallReport && (
              <div
                className={`mt-4 p-4 rounded-xl border text-xs flex items-start gap-3 ${
                  dbInstallReport.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {dbInstallReport.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h5 className="font-bold text-sm">
                    {dbInstallReport.success
                      ? 'Database Tables Operational!'
                      : 'Database Tables Verification Status'}
                  </h5>
                  <p className="mt-0.5">{dbInstallReport.message}</p>
                </div>
              </div>
            )}

            {/* Test / Sync alerts */}
            {dbTestResult && (
              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{dbTestResult}</span>
              </div>
            )}

            {dbSyncResult && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{dbSyncResult}</span>
              </div>
            )}

            {/* Configured Environment Variables Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  1. Supabase Project URL
                </span>
                <div className="mt-1 font-mono text-xs font-bold text-slate-800 truncate">
                  {import.meta.env.VITE_SUPABASE_URL || 'Not provided in environment (VITE_SUPABASE_URL)'}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Find this under Supabase Project Settings → API → Project URL
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  2. Supabase Anon Public Key
                </span>
                <div className="mt-1 font-mono text-xs font-bold text-slate-800 truncate">
                  {import.meta.env.VITE_SUPABASE_ANON_KEY
                    ? `${String(import.meta.env.VITE_SUPABASE_ANON_KEY).substring(0, 16)}••••••••••••••••`
                    : 'Not provided in environment (VITE_SUPABASE_ANON_KEY)'}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Find this under Supabase Project Settings → API → Project API Keys (anon public)
                </span>
              </div>
            </div>
          </div>

          {/* Database Tables Schema */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                table: 'mboka_profiles',
                title: 'User & Agent Profiles',
                desc: 'User identity, phone, KYC verification, and transaction PIN.',
              },
              {
                table: 'mboka_transactions',
                title: 'Central Cash Ledger',
                desc: 'Double-entry log for Deposits, P2P transfers & POS sales.',
              },
              {
                table: 'mboka_smartpay_events',
                title: 'SmartPay Webhooks & Events',
                desc: 'Audit trail of all incoming SmartPay IPN callbacks and M-Pesa STK results.',
              },
              {
                table: 'mboka_articles',
                title: 'Monetized Blog Hub',
                desc: 'Creator hustle stories, reading stats, claps & ad revenue.',
              },
              {
                table: 'mboka_invited_users',
                title: 'Affiliate Referrals',
                desc: 'Direct downlines, qualified status checkpoints & rewards.',
              },
            ].map((col) => {
              const tableStatus = dbInstallReport?.tables?.find((t) => t.table === col.table);
              return (
                <div
                  key={col.table}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                        {col.table}
                      </span>
                      {tableStatus && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            tableStatus.status === 'ready'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {tableStatus.status === 'ready' ? `${tableStatus.rowsCount} rows` : 'Needs DDL'}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{col.title}</h4>
                    <p className="text-[11px] text-slate-500">{col.desc}</p>
                  </div>
                  {tableStatus && (
                    <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 truncate">
                      {tableStatus.message}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* One-Click SQL Schema Setup */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-white text-base font-heading">
                  Supabase PostgreSQL Setup Script (DDL)
                </h4>
                <p className="text-xs text-slate-400">
                  Execute this SQL in your Supabase project SQL Editor to automatically create all Mboka tables and Row-Level Security (RLS) policies.
                </p>
              </div>

              <button
                onClick={() => {
                  const sqlText = `-- MBOKA POSTGRESQL TABLES FOR SUPABASE
CREATE TABLE IF NOT EXISTS mboka_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'Standard User',
  referral_code TEXT,
  is_kyc_verified BOOLEAN DEFAULT FALSE,
  wallet_pin TEXT DEFAULT '1234',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mboka_transactions (
  id TEXT PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  fee NUMERIC DEFAULT 0,
  description TEXT,
  status TEXT DEFAULT 'completed',
  recipient_or_sender TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mboka_smartpay_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  checkout_request_id TEXT,
  merchant_request_id TEXT,
  mpesa_receipt TEXT,
  amount NUMERIC,
  phone TEXT,
  result_code INTEGER,
  result_desc TEXT,
  raw_payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mboka_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  author TEXT,
  category TEXT,
  read_time TEXT,
  cover_image TEXT,
  claps INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  earnings_ksh NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mboka_invited_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  joined_date TEXT,
  status TEXT DEFAULT 'qualified',
  bonus_earned NUMERIC DEFAULT 150,
  pos_volume_generated NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mboka_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mboka_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mboka_smartpay_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mboka_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mboka_invited_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON mboka_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public write" ON mboka_profiles FOR ALL USING (true);
CREATE POLICY "Allow tx" ON mboka_transactions FOR ALL USING (true);
CREATE POLICY "Allow events" ON mboka_smartpay_events FOR ALL USING (true);
CREATE POLICY "Allow art" ON mboka_articles FOR ALL USING (true);
CREATE POLICY "Allow ref" ON mboka_invited_users FOR ALL USING (true);`;
                  navigator.clipboard.writeText(sqlText);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2500);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer self-start sm:self-auto"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800 max-h-56 leading-relaxed">
{`-- 1. Create Mboka Profiles
CREATE TABLE IF NOT EXISTS mboka_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'Standard User',
  referral_code TEXT,
  is_kyc_verified BOOLEAN DEFAULT FALSE,
  wallet_pin TEXT DEFAULT '1234',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Ledger Transactions
CREATE TABLE IF NOT EXISTS mboka_transactions (
  id TEXT PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  fee NUMERIC DEFAULT 0,
  recipient_or_sender TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Creator Articles & Referrals
CREATE TABLE IF NOT EXISTS mboka_articles ( ... );
CREATE TABLE IF NOT EXISTS mboka_invited_users ( ... );`}
            </pre>
          </div>
        </div>
      )}

      {/* Tab: SmartPayPesa (C2B / B2C) */}
      {activeAdminTab === 'smartpay' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Smartphone className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  SmartPayPesa Payment Gateway (C2B & B2C)
                </h3>
                {smartpayStatus?.isConfigured && !smartpayStatus?.isSimulated ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Production Gateway
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Sandbox / Simulation Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Direct integration with SmartPayPesa for M-Pesa STK push deposits (C2B) and automated mobile money payouts (B2C).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  setIsRefreshingStatus(true);
                  await refreshSmartPayStatus();
                  setIsRefreshingStatus(false);
                }}
                disabled={isRefreshingStatus}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStatus ? 'animate-spin' : ''}`} />
                <span>Refresh Status</span>
              </button>

              <a
                href="https://smartpaypesa.com/mpesa-api.php"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>SmartPay Docs</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Configuration & Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Gateway Credentials */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gateway Configuration</span>
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Mode:</span>
                  <span className="font-bold text-slate-800">
                    {smartpayStatus?.isConfigured && !smartpayStatus?.isSimulated ? 'Live Production' : 'Sandbox (Simulated)'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">API Key:</span>
                  <span className="font-mono text-slate-700">{smartpayStatus?.apiKeyMasked || 'Not set'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Username:</span>
                  <span className="font-mono text-slate-700">{smartpayStatus?.username || 'mboka_pos'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Base URL:</span>
                  <span className="font-mono text-slate-700 truncate max-w-[150px]">
                    {smartpayStatus?.baseUrl || 'https://smartpaypesa.com'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Webhook Endpoint (Supabase Edge & App Server) */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">M-Pesa Webhook (IPN)</span>
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Add either webhook URL into your SmartPayPesa IPN settings to auto-reconcile deposits:
              </p>

              {/* Supabase Edge Function Webhook */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <Server className="w-3 h-3" />
                    Supabase Edge Function:
                  </span>
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono">
                    Serverless Edge
                  </span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-700 truncate">
                    {import.meta.env.VITE_SUPABASE_URL
                      ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smartpay-webhook`
                      : 'https://<project-ref>.supabase.co/functions/v1/smartpay-webhook'}
                  </span>
                  <button
                    onClick={() => {
                      const edgeUrl = import.meta.env.VITE_SUPABASE_URL
                        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smartpay-webhook`
                        : `${window.location.origin}/api/smartpay/webhook`;
                      navigator.clipboard.writeText(edgeUrl);
                      setCopiedEdgeWebhookUrl(true);
                      setTimeout(() => setCopiedEdgeWebhookUrl(false), 2500);
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedEdgeWebhookUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedEdgeWebhookUrl ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* App Server Webhook */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                  <span>App Gateway Webhook:</span>
                  <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                    Express Route
                  </span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-700 truncate">
                    /api/smartpay/webhook
                  </span>
                  <button
                    onClick={() => {
                      const fullUrl = `${window.location.origin}/api/smartpay/webhook`;
                      navigator.clipboard.writeText(fullUrl);
                      setCopiedWebhookUrl(true);
                      setTimeout(() => setCopiedWebhookUrl(false), 2500);
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedWebhookUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedWebhookUrl ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: B2C Payout Fee Schedule */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">B2C Fee Schedule</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">KSh 10 – 100</span>
                  <span className="font-bold text-emerald-600">Free (KSh 0)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">KSh 101 – 1,000</span>
                  <span className="font-bold text-slate-900">KSh 10</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Above KSh 1,000</span>
                  <span className="font-bold text-slate-900">KSh 15</span>
                </div>
                <div className="flex justify-between py-1 text-[11px] text-slate-400">
                  <span>C2B STK Deposits</span>
                  <span className="text-emerald-600 font-bold">0% Fee (Free)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Test Sandboxes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. C2B STK Push Test Box */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-heading">
                    Test C2B STK Push (Customer Deposit)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Sends an M-Pesa prompt to the specified phone and awaits confirmation.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">M-Pesa Phone Number</label>
                  <input
                    type="text"
                    value={stkPhone}
                    onChange={(e) => setStkPhone(e.target.value)}
                    placeholder="254712345678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Amount (KSh)</label>
                  <input
                    type="number"
                    min="1"
                    value={stkAmount}
                    onChange={(e) => setStkAmount(e.target.value)}
                    placeholder="100"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <button
                  onClick={async () => {
                    const num = Number(stkAmount);
                    if (!num || num <= 0) return;
                    setIsTriggeringStk(true);
                    setStkResult(null);

                    try {
                      const res = await initiateSmartPayDeposit(stkPhone, num);
                      setStkResult({
                        success: res.success,
                        message: res.message,
                        details: res,
                      });
                    } catch (err: any) {
                      setStkResult({
                        success: false,
                        message: err?.message || 'STK Push failed to execute',
                      });
                    } finally {
                      setIsTriggeringStk(false);
                    }
                  }}
                  disabled={isTriggeringStk}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isTriggeringStk ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending STK Prompt & Polling...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Trigger C2B STK Push ({formatKsh(Number(stkAmount) || 0)})</span>
                    </>
                  )}
                </button>

                {stkResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      stkResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      {stkResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                      <span>{stkResult.message}</span>
                    </div>
                    {stkResult.details && (
                      <pre className="p-2 bg-white/70 rounded-lg text-[10px] font-mono overflow-x-auto">
                        {JSON.stringify(stkResult.details, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 2. B2C Payout Test Box */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-heading">
                    Test B2C Payout (Disbursement)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Dispatches mobile money from business float to recipient phone.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Recipient Phone Number</label>
                  <input
                    type="text"
                    value={b2cPhone}
                    onChange={(e) => setB2cPhone(e.target.value)}
                    placeholder="254712345678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-700">Payout Amount (KSh)</label>
                    <span className="text-[10px] text-slate-500">
                      Fee: {Number(b2cAmount) > 1000 ? 'KSh 15' : Number(b2cAmount) > 100 ? 'KSh 10' : 'KSh 0 (Free)'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="10"
                    value={b2cAmount}
                    onChange={(e) => setB2cAmount(e.target.value)}
                    placeholder="50"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <button
                  onClick={async () => {
                    const num = Number(b2cAmount);
                    if (!num || num < 10) return;
                    setIsTriggeringB2c(true);
                    setB2cResult(null);

                    try {
                      // Uses default admin pin '1234' for sandbox trigger
                      const res = await initiateSmartPayWithdrawal(b2cPhone, num, '1234');
                      setB2cResult({
                        success: res.success,
                        message: res.message,
                        details: res,
                      });
                    } catch (err: any) {
                      setB2cResult({
                        success: false,
                        message: err?.message || 'B2C Payout failed to execute',
                      });
                    } finally {
                      setIsTriggeringB2c(false);
                    }
                  }}
                  disabled={isTriggeringB2c}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isTriggeringB2c ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching Payout via SmartPay B2C...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch B2C Payout ({formatKsh(Number(b2cAmount) || 0)})</span>
                    </>
                  )}
                </button>

                {b2cResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      b2cResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      {b2cResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                      <span>{b2cResult.message}</span>
                    </div>
                    {b2cResult.details && (
                      <pre className="p-2 bg-white/70 rounded-lg text-[10px] font-mono overflow-x-auto">
                        {JSON.stringify(b2cResult.details, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent SmartPay Processed Transactions */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 font-heading">
                  SmartPay Transaction Ledger
                </h4>
                <p className="text-xs text-slate-500">
                  Real-time ledger of M-Pesa C2B and B2C transactions processed through SmartPayPesa
                </p>
              </div>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                {transactions.filter((t) => t.title.toLowerCase().includes('smartpay') || t.title.toLowerCase().includes('m-pesa')).length} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="pb-3">Reference</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Recipient / Sender</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions
                    .filter(
                      (t) =>
                        t.title.toLowerCase().includes('smartpay') ||
                        t.title.toLowerCase().includes('m-pesa') ||
                        t.reference.startsWith('SP-') ||
                        t.reference.startsWith('AG_') ||
                        t.reference.startsWith('MP-')
                    )
                    .slice(0, 8)
                    .map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 font-mono font-bold text-slate-800">{tx.reference}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.type === 'deposit'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {tx.type === 'deposit' ? 'C2B Deposit' : 'B2C Payout'}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600">{tx.recipientOrSender || 'Mobile Customer'}</td>
                        <td className="py-3 font-bold text-slate-900">
                          {tx.type === 'deposit' ? '+' : '-'}{formatKsh(tx.amount)}
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{tx.status}</span>
                          </span>
                        </td>
                        <td className="py-3 text-slate-400 text-[11px]">{tx.date}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
