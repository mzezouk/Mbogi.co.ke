import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Copy,
  Check,
  Zap,
  Phone,
  Lock,
  ChevronRight,
  Users,
  Code2,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';
import { DepositModal } from './DepositModal';
import { WithdrawModal } from './WithdrawModal';
import { SendMoneyModal } from './SendMoneyModal';
import { TransactionHistory } from './TransactionHistory';
import { ActivationModal } from './ActivationModal';
import { AuthModal } from './AuthModal';
import { WalletTransaction, AutoB2cSettings } from '../types';

export const WalletView: React.FC = () => {
  const {
    user,
    walletBalance,
    affiliateBalance,
    formatKsh,
    transferEarningsToWallet,
    setSelectedReceipt,
    updateAutoB2cSettings,
    triggerAutoB2cCheck,
    setActiveTab,
    isLoggedIn,
  } = useMboka();

  const [hideBalance, setHideBalance] = useState<boolean>(false);
  const [showDeposit, setShowDeposit] = useState<boolean>(false);
  const [showWithdraw, setShowWithdraw] = useState<boolean>(false);
  const [showSendMoney, setShowSendMoney] = useState<boolean>(false);
  const [showActivation, setShowActivation] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [copiedWalletId, setCopiedWalletId] = useState<boolean>(false);

  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const [sweepNotice, setSweepNotice] = useState<string | null>(null);

  // Auto-B2C Form State
  const initialAutoSettings: AutoB2cSettings = user.autoB2cSettings || {
    enabled: false,
    phone: user.phone || '',
    amount: 100,
  };
  const [autoEnabled, setAutoEnabled] = useState<boolean>(initialAutoSettings.enabled);
  const [autoPhone, setAutoPhone] = useState<string>(initialAutoSettings.phone || user.phone);
  const [autoAmount, setAutoAmount] = useState<string>(
    initialAutoSettings.amount?.toString() || '100'
  );
  const [autoSavedNotice, setAutoSavedNotice] = useState<string | null>(null);
  const [isTestingAuto, setIsTestingAuto] = useState<boolean>(false);

  const handleCopyWalletId = () => {
    if (user.walletId) {
      navigator.clipboard.writeText(user.walletId);
      setCopiedWalletId(true);
      setTimeout(() => setCopiedWalletId(false), 2000);
    }
  };

  const handleSaveAutoB2c = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = Math.max(10, Number(autoAmount) || 10);
    const newSettings: AutoB2cSettings = {
      enabled: autoEnabled,
      phone: autoPhone.trim(),
      amount: numAmt,
    };
    updateAutoB2cSettings(newSettings);
    setAutoSavedNotice('Automated B2C payout settings saved!');
    setTimeout(() => setAutoSavedNotice(null), 3000);
  };

  const handleManualTriggerAutoB2c = async () => {
    setIsTestingAuto(true);
    const triggered = await triggerAutoB2cCheck();
    setIsTestingAuto(false);
    if (triggered) {
      setAutoSavedNotice('Auto-B2C rule verified and triggered!');
    } else {
      setAutoSavedNotice(
        `Conditions not met: Balance (${formatKsh(walletBalance)}) must be ≥ ${formatKsh(
          Number(autoAmount) || 100
        )} and automation enabled.`
      );
    }
    setTimeout(() => setAutoSavedNotice(null), 4000);
  };

  const handleSweepAffiliate = async () => {
    if (affiliateBalance <= 0) return;
    setIsSweeping(true);
    const res = await transferEarningsToWallet('affiliate');
    setIsSweeping(false);
    setSweepNotice(res.message);
    setTimeout(() => setSweepNotice(null), 3500);
  };

  const openReceipt = (tx: WalletTransaction) => {
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
      provider: tx.title.includes('SmartPay')
        ? 'SmartPayPesa M-Pesa'
        : 'Mboka Wallet Ledger',
      operator: 'Mboka Digital Ledger',
      cashbackEarned: tx.metadata?.cashback,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Logged Out Guest Banner */}
      {!isLoggedIn && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                You are currently signed out
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Sign in or create an account to start depositing, withdrawing, or sending funds.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAuthModal(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer text-center"
          >
            Create Account / Log In
          </button>
        </div>
      )}

      {/* Account Inactive Banner (If user not yet activated with 50 KSh) */}
      {isLoggedIn && !user.isActivated && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-200/70 text-amber-900 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Account Activation Required
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Pay a one-time fee of <strong className="font-mono">KSh 50.00</strong> to unlock your Wallet ID (<strong>{user.walletId}</strong>) and enable outbound transfers.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowActivation(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Activate Account (KSh 50)</span>
          </button>
        </div>
      )}

      {/* Clean Wallet Balance Hero Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Available Balance
              </span>
              <button
                onClick={() => setHideBalance(!hideBalance)}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer transition-colors"
                title={hideBalance ? 'Show balance' : 'Hide balance'}
              >
                {hideBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading tracking-tight">
              {hideBalance ? '••••••••' : formatKsh(walletBalance)}
            </div>

            {/* Unboxed Metadata: Wallet ID & Status */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <div className="flex items-center gap-1.5 font-mono text-slate-700">
                <span className="text-slate-400 font-sans">Wallet ID:</span>
                <span className="font-bold text-slate-900">{user.walletId || 'MBK-NOT-SET'}</span>
                <button
                  onClick={handleCopyWalletId}
                  className="text-slate-400 hover:text-emerald-700 p-0.5 transition-colors cursor-pointer"
                  title="Copy Wallet ID"
                >
                  {copiedWalletId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <span className="text-slate-300" aria-hidden="true">·</span>

              <div className="flex items-center gap-1.5 text-slate-600">
                <span
                  className={`w-2 h-2 rounded-full ${
                    user.isActivated ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <span>{user.isActivated ? 'Activated' : 'Pending Activation'}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowDeposit(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Deposit Funds</span>
            </button>

            <button
              onClick={() => setShowWithdraw(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span>Withdraw</span>
            </button>

            <button
              onClick={() => setShowSendMoney(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4 text-teal-600" />
              <span>Send Money</span>
            </button>
          </div>
        </div>
      </div>

      {/* Merchant & Developer API Gateway Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Code2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 font-heading">
                Collect Payments via Mboka API
              </span>
              <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200/60">
                Settles to {user.walletId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Integrate customer M-Pesa checkout on your website or app. Every collection settles directly into your wallet.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('api')}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer self-stretch sm:self-auto shrink-0 shadow-xs"
        >
          <span>View API Keys &amp; Docs</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Affiliate Earnings Summary & Sweep */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 font-heading">
                Mbogi Affiliate Earnings
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-700">
                {formatKsh(affiliateBalance)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Earn KSh 20.00 immediately whenever an invited user activates their account.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {affiliateBalance > 0 && (
            <button
              onClick={handleSweepAffiliate}
              disabled={isSweeping}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSweeping ? 'animate-spin' : ''}`} />
              <span>Sweep to Wallet</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('affiliate')}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <span>View Mbogi</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {sweepNotice && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{sweepNotice}</span>
        </div>
      )}

      {/* Automated M-Pesa B2C Settlement Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 font-heading">
                  Automated M-Pesa B2C Settlement
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    autoEnabled
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {autoEnabled ? 'Active' : 'Paused'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically dispatches your balance to M-Pesa whenever funds reach the set threshold or above (full accumulated amount).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setAutoEnabled(!autoEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoEnabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
              aria-label="Toggle Automated Settlement"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  autoEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-xs font-bold text-slate-700">
              {autoEnabled ? 'Enabled' : 'Paused'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveAutoB2c} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Destination M-Pesa Phone</span>
              </label>
              <input
                type="tel"
                required
                value={autoPhone}
                onChange={(e) => setAutoPhone(e.target.value)}
                placeholder="07XX XXX XXX or 254..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-slate-400" />
                  <span>Trigger Threshold (Amount Set &amp; Above)</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">Min: KSh 10</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  KSh
                </span>
                <input
                  type="number"
                  min="10"
                  required
                  value={autoAmount}
                  onChange={(e) => setAutoAmount(e.target.value)}
                  placeholder="100"
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
              <span className="text-[11px] text-slate-400 block pt-0.5">
                Sweeps entire wallet balance whenever balance is &ge; this amount.
              </span>
            </div>
          </div>

          {autoSavedNotice && (
            <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{autoSavedNotice}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Save Automation Settings
            </button>

            <button
              type="button"
              onClick={handleManualTriggerAutoB2c}
              disabled={isTestingAuto || !autoEnabled}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isTestingAuto ? 'animate-spin' : ''}`} />
              <span>Test Rule Evaluation</span>
            </button>
          </div>
        </form>
      </div>

      {/* Detailed Transaction History Component */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs">
        <TransactionHistory onOpenReceipt={openReceipt} />
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
      {showActivation && (
        <ActivationModal
          onSuccess={() => setShowActivation(false)}
          onClose={() => setShowActivation(false)}
        />
      )}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};
