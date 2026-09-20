import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Zap,
  Phone,
  Tv,
  Users,
  PenTool,
  MessageSquare,
  ChevronRight,
  Receipt,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  HelpCircle,
  Headphones,
  UserPlus,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';
import { DepositModal } from './DepositModal';
import { WithdrawModal } from './WithdrawModal';
import { SendMoneyModal } from './SendMoneyModal';
import { AuthModal } from './AuthModal';
import { WalletTransaction } from '../types';

export const HomeView: React.FC = () => {
  const {
    user,
    walletBalance,
    affiliateBalance,
    blogBalance,
    transactions,
    setActiveTab,
    formatKsh,
    setSelectedReceipt,
    setIsAiCopilotOpen,
  } = useMboka();

  const [hideBalance, setHideBalance] = useState<boolean>(false);
  const [showDeposit, setShowDeposit] = useState<boolean>(false);
  const [showWithdraw, setShowWithdraw] = useState<boolean>(false);
  const [showSendMoney, setShowSendMoney] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const recentTxs = transactions.slice(0, 5);

  const openReceiptFromTx = (tx: WalletTransaction) => {
    setSelectedReceipt({
      receiptNumber: tx.reference,
      serviceType: tx.title.includes('Airtime')
        ? 'airtime'
        : tx.title.includes('KPLC')
        ? 'kplc'
        : 'tv',
      serviceName: tx.title,
      accountOrPhone: tx.recipientOrSender || user.phone,
      amount: tx.amount,
      fee: tx.fee,
      date: tx.date,
      token: tx.metadata?.token,
      units: tx.metadata?.units ? parseFloat(tx.metadata.units) : undefined,
      provider: tx.title.includes('KPLC')
        ? 'Kenya Power'
        : tx.title.includes('Safaricom')
        ? 'Safaricom'
        : 'Mboka Network',
      operator: 'Mboka Express',
      cashbackEarned: tx.metadata?.cashback,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header Bar with Greeting & Quick Account Options */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
              Sasa, {user.name.split(' ')[0]}!
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Account
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Your centralized financial ledger, M-Pesa B2C disbursements &amp; contact hub.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sign Up / Switch User button */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Register a new real user account with starting balance > 0"
          >
            <UserPlus className="w-3.5 h-3.5 text-slate-600" />
            <span>Sign Up / Switch</span>
          </button>

          {/* Quick Support Desk */}
          <button
            onClick={() => setIsAiCopilotOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Headphones className="w-3.5 h-3.5 text-slate-600" />
            <span>Support Desk</span>
          </button>
        </div>
      </div>

      {/* 2. Main Wallet Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold tracking-wider uppercase">
              <span>Mboka Central Wallet</span>
              <button
                onClick={() => setHideBalance(!hideBalance)}
                className="text-emerald-400/80 hover:text-emerald-300 p-0.5 cursor-pointer"
                title={hideBalance ? 'Show balance' : 'Hide balance'}
              >
                {hideBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-heading mt-2">
              {hideBalance ? '••••••••' : formatKsh(walletBalance)}
            </div>

            {/* Sub balances badges */}
            <div className="flex flex-wrap items-center gap-2.5 mt-4 pt-2 border-t border-white/10 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Affiliate:</span>
                <strong className="text-white font-mono">{formatKsh(affiliateBalance)}</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                <PenTool className="w-3.5 h-3.5 text-blue-400" />
                <span>Blog Ad Rev:</span>
                <strong className="text-white font-mono">{formatKsh(blogBalance)}</strong>
              </span>
              <span className="text-[11px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                B2C: 10–100 Free • 10+ Bal Required
              </span>
            </div>
          </div>

          {/* Primary Quick Actions */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowDeposit(true)}
              className="flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <ArrowDownLeft className="w-5 h-5 text-slate-950" />
              <span>Deposit</span>
            </button>

            <button
              onClick={() => setShowWithdraw(true)}
              className="flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 transition-all active:scale-95 cursor-pointer"
            >
              <ArrowUpRight className="w-5 h-5 text-emerald-300" />
              <span>Withdraw</span>
            </button>

            <button
              onClick={() => setShowSendMoney(true)}
              className="flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 transition-all active:scale-95 cursor-pointer"
            >
              <Send className="w-5 h-5 text-teal-300" />
              <span>Send P2P</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Clean Digital Utilities Grid */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading">
              Quick Utilities &amp; Airtime
            </h2>
            <p className="text-xs text-slate-500">
              Instant dispatch directly from your central wallet balance
            </p>
          </div>
          <button
            onClick={() => setActiveTab('pos')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Open POS Terminal</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveTab('pos')}
            className="p-4 rounded-xl border border-slate-200/70 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Buy Airtime</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Safaricom &amp; Airtel</p>
            <span className="inline-block text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm mt-2">
              2% Cashback
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pos')}
            className="p-4 rounded-xl border border-slate-200/70 hover:border-amber-300 hover:bg-amber-50/30 transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">KPLC Tokens</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Prepaid &amp; Postpaid</p>
            <span className="inline-block text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded-sm mt-2">
              Instant 20-digit
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pos')}
            className="p-4 rounded-xl border border-slate-200/70 hover:border-blue-300 hover:bg-blue-50/30 transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Tv className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Pay TV Bills</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">DStv, GOtv &amp; StarTimes</p>
            <span className="inline-block text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded-sm mt-2">
              Zero surcharge
            </span>
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className="p-4 rounded-xl border border-slate-200/70 hover:border-teal-300 hover:bg-teal-50/30 transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Send className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">P2P Transfers</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Member-to-Member</p>
            <span className="inline-block text-[10px] text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded-sm mt-2">
              Free internal
            </span>
          </button>
        </div>
      </div>

      {/* 4. Dedicated Customer Contact & Support Center */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
              <Headphones className="w-4 h-4 text-emerald-600" />
              <span>Mboka Help Desk &amp; Official Contact</span>
            </h2>
            <p className="text-xs text-slate-500">
              Need assistance with deposits, B2C payouts, or account setup? Contact our Nairobi operations team 24/7.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Support Online</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* WhatsApp Direct */}
          <a
            href="https://wa.me/254796282073?text=Hello%20Mboka%20Support,%20I%20need%20assistance"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 hover:bg-emerald-100/60 transition-colors flex items-start gap-3 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Phone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-900">WhatsApp Support</span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-700" />
              </div>
              <p className="text-xs font-mono font-bold text-emerald-800 mt-0.5">+254 796 282 073</p>
              <span className="text-[11px] text-emerald-700 block mt-1">Instant reply within 2 mins</span>
            </div>
          </a>

          {/* Direct Phone Call */}
          <a
            href="tel:+254796282073"
            className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 transition-colors flex items-start gap-3 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Phone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-900">Call Operations Desk</span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-slate-800" />
              </div>
              <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">+254 796 282 073</p>
              <span className="text-[11px] text-slate-500 block mt-1">Available 24/7 toll line</span>
            </div>
          </a>

          {/* Email Support */}
          <a
            href="mailto:support@mboka.co.ke?subject=Mboka%20Support%20Inquiry"
            className="p-4 rounded-xl bg-teal-50/60 border border-teal-200/80 hover:bg-teal-100/60 transition-colors flex items-start gap-3 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-900">Email Inquiries</span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-teal-700" />
              </div>
              <p className="text-xs font-mono font-bold text-teal-900 mt-0.5">support@mboka.co.ke</p>
              <span className="text-[11px] text-teal-700 block mt-1">Official ticket resolution</span>
            </div>
          </a>
        </div>

        {/* Office & Live Chat Footer */}
        <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              <strong>HQ Address:</strong> Westlands Commercial Center, 4th Flr, Nairobi, Kenya
            </span>
          </div>

          <button
            onClick={() => setActiveTab('chat')}
            className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer self-start sm:self-auto"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Open In-App Live Support Chat →</span>
          </button>
        </div>
      </div>

      {/* 5. Recent Transactions Preview & Community Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">
                Recent Activity
              </h2>
              <p className="text-xs text-slate-500">Latest wallet debits and credits</p>
            </div>
            <button
              onClick={() => setActiveTab('wallet')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentTxs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No transactions yet. Deposit or top up to get started.
              </div>
            ) : (
              recentTxs.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => openReceiptFromTx(tx)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === 'deposit'
                          ? 'bg-emerald-100 text-emerald-700'
                          : tx.type === 'withdrawal'
                          ? 'bg-rose-100 text-rose-700'
                          : tx.type === 'pos_purchase'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-teal-100 text-teal-700'
                      }`}
                    >
                      {tx.type === 'deposit' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : tx.type === 'withdrawal' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : tx.type === 'pos_purchase' ? (
                        <Receipt className="w-4 h-4" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">
                        {tx.title}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-600">{tx.reference}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-extrabold font-mono ${
                        tx.type === 'deposit' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {tx.type === 'deposit'
                        ? `+${formatKsh(tx.amount)}`
                        : `-${formatKsh(tx.amount)}`}
                    </span>
                    <span className="block text-[10px] text-slate-400 group-hover:text-emerald-600 font-medium">
                      Receipt →
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Guilds & Support Chat Room (1 col) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Community Guilds
                </h3>
                <p className="text-xs text-slate-500">Network with active merchants</p>
              </div>
              <button
                onClick={() => setActiveTab('chat')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                Join Chat
              </button>
            </div>

            <div className="space-y-2.5">
              <div
                onClick={() => setActiveTab('chat')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <strong className="text-xs text-slate-900">Nairobi Hustlers &amp; Tech</strong>
                </div>
                <p className="text-xs text-slate-600 line-clamp-1">
                  Evans: Stima tokens just bought via Mboka arrived in 2 secs!
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">842 active members</span>
              </div>

              <div
                onClick={() => setActiveTab('chat')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <strong className="text-xs text-slate-900">Mboka Official Support Desk</strong>
                </div>
                <p className="text-xs text-slate-600 line-clamp-1">
                  Agent Brenda: All B2C disbursements are instant 24/7.
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">Always active</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => setActiveTab('chat')}
              className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Launch Live Support Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
      {showWithdraw && (
        <WithdrawModal
          onClose={() => setShowWithdraw(false)}
          onSwitchToDeposit={() => setShowDeposit(true)}
        />
      )}
      {showSendMoney && <SendMoneyModal onClose={() => setShowSendMoney(false)} />}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};
