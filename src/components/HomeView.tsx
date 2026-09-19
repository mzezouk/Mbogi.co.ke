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
  Sparkles,
  ChevronRight,
  TrendingUp,
  Receipt,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';
import { DepositModal } from './DepositModal';
import { WithdrawModal } from './WithdrawModal';
import { SendMoneyModal } from './SendMoneyModal';
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
    articles,
    setSelectedReceipt,
    setIsAiCopilotOpen,
  } = useMboka();

  const [hideBalance, setHideBalance] = useState<boolean>(false);
  const [showDeposit, setShowDeposit] = useState<boolean>(false);
  const [showWithdraw, setShowWithdraw] = useState<boolean>(false);
  const [showSendMoney, setShowSendMoney] = useState<boolean>(false);

  const recentTxs = transactions.slice(0, 5);

  const openReceiptFromTx = (tx: WalletTransaction) => {
    if (tx.category === 'pos' || tx.metadata?.token) {
      setSelectedReceipt({
        receiptNumber: tx.reference,
        serviceType: tx.title.includes('Airtime') ? 'airtime' : tx.title.includes('KPLC') ? 'kplc' : 'tv',
        serviceName: tx.title,
        accountOrPhone: tx.recipientOrSender || user.phone,
        amount: tx.amount,
        fee: tx.fee,
        date: tx.date,
        token: tx.metadata?.token,
        units: tx.metadata?.units ? parseFloat(tx.metadata.units) : undefined,
        provider: tx.title.includes('KPLC') ? 'Kenya Power' : tx.title.includes('Safaricom') ? 'Safaricom' : 'Digital Services',
        operator: 'Mboka Express',
        cashbackEarned: tx.metadata?.cashback,
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
              Sasa, {user.name.split(' ')[0]}!
            </h1>
            {user.isKycVerified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Your centralized financial ledger, affiliate network & utility hub.
          </p>
        </div>

        {/* Quick AI Advisor pill */}
        <button
          onClick={() => setIsAiCopilotOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 hover:border-emerald-300 text-emerald-900 text-xs font-bold transition-all self-start sm:self-auto cursor-pointer shadow-2xs"
        >
          <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Need help? Ask Mboka Copilot</span>
        </button>
      </div>

      {/* 1. Main Wallet Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold tracking-wider uppercase">
              <span>Mboka Central Wallet</span>
              <button
                onClick={() => setHideBalance(!hideBalance)}
                className="text-emerald-400/80 hover:text-emerald-300 p-0.5"
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

      {/* 2. Quick Digital Utility Services (POS Quick Access) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading">Digital Utilities & POS</h2>
            <p className="text-xs text-slate-500">Instant tokens, airtime, and subscriptions with cashback</p>
          </div>
          <button
            onClick={() => setActiveTab('pos')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
          >
            <span>POS Merchant Portal</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Airtime */}
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-start gap-3.5 p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900">Buy Airtime</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-sm">
                  2% Back
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Safaricom, Airtel, Telkom top-up</p>
            </div>
          </button>

          {/* KPLC Tokens */}
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-start gap-3.5 p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-amber-50/50 hover:border-amber-200 transition-all text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900">KPLC Tokens</span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-sm">
                  Instant
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">20-digit prepaid stima tokens</p>
            </div>
          </button>

          {/* TV Subscriptions */}
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-start gap-3.5 p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/50 hover:border-blue-200 transition-all text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900">TV Packages</span>
                <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded-sm">
                  DStv / GOtv
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Direct decoder renewal</p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Earn on Mboka (Affiliate & Blogging) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Affiliate Card */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/40 to-white p-5 sm:p-6 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg">
                <Users className="w-4 h-4" />
                <span>Mboka Affiliate Program</span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-800">
                Code: {user.referralCode}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-heading mt-3">
              Earn KSh 150 + 5% Per Friend
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Invite contacts to transact on Mboka. Earn instant rewards when they register and recurring commissions on utility sales.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-amber-200/60">
            <div>
              <span className="text-[11px] text-slate-500 block">Available Rewards</span>
              <strong className="text-amber-900 font-extrabold text-base font-mono">
                {formatKsh(affiliateBalance)}
              </strong>
            </div>
            <button
              onClick={() => setActiveTab('affiliate')}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-xs"
            >
              Referral Dashboard
            </button>
          </div>
        </div>

        {/* Blogging Monetization Card */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-teal-50/40 to-white p-5 sm:p-6 rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-900 bg-teal-100 px-2.5 py-1 rounded-lg">
                <PenTool className="w-4 h-4" />
                <span>Mboka Creator Blogging</span>
              </div>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-200/60 px-2 py-0.5 rounded-md">
                70% Ad Split
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-heading mt-3">
              Write Articles & Monetize Traffic
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Share knowledge on business, hustle, tech, or farming. Earn ad revenue from eligible reads and impressions.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-teal-200/60">
            <div>
              <span className="text-[11px] text-slate-500 block">Creator Earnings</span>
              <strong className="text-teal-900 font-extrabold text-base font-mono">
                {formatKsh(blogBalance)}
              </strong>
            </div>
            <button
              onClick={() => setActiveTab('blog')}
              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition-colors shadow-xs"
            >
              Creator Studio
            </button>
          </div>
        </div>
      </div>

      {/* 4. Community Pulse & Recent Ledger Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Ledger Transactions */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">Recent Transactions</h2>
              <p className="text-xs text-slate-500">Live ledger records across all Mboka modules</p>
            </div>
            <button
              onClick={() => setActiveTab('wallet')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              <span>Full Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentTxs.map((tx) => (
              <div
                key={tx.id}
                onClick={() => openReceiptFromTx(tx)}
                className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'deposit' || tx.type === 'affiliate_payout' || tx.type === 'blog_payout'
                        ? 'bg-emerald-100 text-emerald-700'
                        : tx.type === 'pos_purchase'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tx.type === 'deposit' || tx.type === 'affiliate_payout' || tx.type === 'blog_payout' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : tx.type === 'pos_purchase' ? (
                      <Receipt className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 line-clamp-1">{tx.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{tx.date}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-500">{tx.reference}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-extrabold font-mono ${
                      tx.type === 'deposit' || tx.type === 'affiliate_payout' || tx.type === 'blog_payout'
                        ? 'text-emerald-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {tx.type === 'deposit' || tx.type === 'affiliate_payout' || tx.type === 'blog_payout'
                      ? `+${formatKsh(tx.amount)}`
                      : `-${formatKsh(tx.amount)}`}
                  </span>
                  {tx.metadata?.token && (
                    <span className="block text-[10px] text-amber-700 font-medium">View Token</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Community & Chat Highlight */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">Mboka Chat & Guilds</h3>
                <p className="text-xs text-slate-500">Connect with fellow hustlers & agents</p>
              </div>
              <button
                onClick={() => setActiveTab('chat')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                Join Chat
              </button>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => setActiveTab('chat')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/40 border border-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <strong className="text-xs text-slate-900">Nairobi Hustlers & Tech Guild</strong>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">
                  Evans: Stima tokens just bought via Mboka arrived in 2 secs!
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">842 active members</span>
              </div>

              <div
                onClick={() => setActiveTab('chat')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/40 border border-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <strong className="text-xs text-slate-900">Mboka Official Support 24/7</strong>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">
                  Agent Brenda: Your KYC verification has been approved.
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">Instant reply</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => setActiveTab('chat')}
              className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Open Mboka Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
      {showWithdraw && <WithdrawModal onClose={() => setShowWithdraw(false)} />}
      {showSendMoney && <SendMoneyModal onClose={() => setShowSendMoney(false)} />}
    </div>
  );
};
