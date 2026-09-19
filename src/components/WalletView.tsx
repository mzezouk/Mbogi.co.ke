import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Receipt,
  FileSpreadsheet,
  Coins,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';
import { DepositModal } from './DepositModal';
import { WithdrawModal } from './WithdrawModal';
import { SendMoneyModal } from './SendMoneyModal';
import { WalletTransaction } from '../types';

export const WalletView: React.FC = () => {
  const {
    user,
    walletBalance,
    affiliateBalance,
    blogBalance,
    posFloatBalance,
    transactions,
    formatKsh,
    transferEarningsToWallet,
    setSelectedReceipt,
  } = useMboka();

  const [hideBalance, setHideBalance] = useState<boolean>(false);
  const [showDeposit, setShowDeposit] = useState<boolean>(false);
  const [showWithdraw, setShowWithdraw] = useState<boolean>(false);
  const [showSendMoney, setShowSendMoney] = useState<boolean>(false);

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const [sweepNotice, setSweepNotice] = useState<string | null>(null);

  // Reconcile / sweep affiliate or blog earnings into main wallet
  const handleSweepAll = async () => {
    setIsSweeping(true);
    let totalClaimed = 0;
    if (affiliateBalance > 0) {
      await transferEarningsToWallet('affiliate');
      totalClaimed += affiliateBalance;
    }
    if (blogBalance > 0) {
      await transferEarningsToWallet('blog');
      totalClaimed += blogBalance;
    }
    setIsSweeping(false);
    if (totalClaimed > 0) {
      setSweepNotice(`Reconciled and swept ${formatKsh(totalClaimed)} into your primary wallet!`);
      setTimeout(() => setSweepNotice(null), 3000);
    } else {
      setSweepNotice('No pending affiliate or blog earnings to sweep.');
      setTimeout(() => setSweepNotice(null), 2500);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesCat =
      filterCategory === 'all'
        ? true
        : filterCategory === 'deposits'
        ? tx.type === 'deposit'
        : filterCategory === 'withdrawals'
        ? tx.type === 'withdrawal'
        : filterCategory === 'p2p'
        ? tx.type === 'transfer_in' || tx.type === 'transfer_out'
        : filterCategory === 'pos'
        ? tx.category === 'pos'
        : filterCategory === 'earnings'
        ? tx.category === 'affiliate' || tx.category === 'blog'
        : true;

    const matchesSearch =
      tx.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.recipientOrSender && tx.recipientOrSender.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCat && matchesSearch;
  });

  const openReceipt = (tx: WalletTransaction) => {
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
      provider: tx.title.includes('KPLC') ? 'Kenya Power' : tx.title.includes('Safaricom') ? 'Safaricom' : 'Mboka Express',
      operator: 'Mboka Wallet Ledger',
      cashbackEarned: tx.metadata?.cashback,
    });
  };

  const handleExportStatement = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Date,Reference,Description,Type,Amount (KSh),Fee (KSh),Status']
        .concat(
          transactions.map(
            (t) => `"${t.date}","${t.reference}","${t.title}","${t.type}",${t.amount},${t.fee},"${t.status}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Mboka_Statement_${user.username}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Wallet Ledger Overview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Primary Cash Balance
              </span>
              <button
                onClick={() => setHideBalance(!hideBalance)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                {hideBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-heading mt-1">
              {hideBalance ? '••••••••' : formatKsh(walletBalance)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Central Ledger ID: <span className="font-mono font-semibold text-slate-700">{user.id}</span> • M-Pesa linked
            </p>
          </div>

          {/* Action buttons */}
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
              <span>Withdraw to M-Pesa</span>
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

        {/* Central Ledger Reconciliation Card */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70">
            <span className="text-[11px] font-semibold text-amber-900 uppercase">Affiliate Earnings</span>
            <div className="text-lg font-bold text-amber-950 font-mono mt-0.5">
              {formatKsh(affiliateBalance)}
            </div>
            <span className="text-[10px] text-amber-700">From referral signups & commissions</span>
          </div>

          <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/70">
            <span className="text-[11px] font-semibold text-teal-900 uppercase">Blog Monetization</span>
            <div className="text-lg font-bold text-teal-950 font-mono mt-0.5">
              {formatKsh(blogBalance)}
            </div>
            <span className="text-[10px] text-teal-700">70% ad revenue from article reads</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-600 uppercase">Reconciliation</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Consolidate all earnings into primary cash</p>
            </div>
            <button
              onClick={handleSweepAll}
              disabled={isSweeping || (affiliateBalance === 0 && blogBalance === 0)}
              className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 disabled:opacity-50 py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSweeping ? 'animate-spin' : ''}`} />
              <span>Sweep to Wallet</span>
            </button>
          </div>
        </div>

        {sweepNotice && (
          <div className="mt-4 p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{sweepNotice}</span>
          </div>
        )}
      </div>

      {/* Transactions & Ledger Records */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading">Ledger Transactions</h2>
            <p className="text-xs text-slate-500">Every debit and credit across your Mboka accounts</p>
          </div>

          {/* Statement Export Button */}
          <button
            onClick={handleExportStatement}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Statement (CSV)</span>
          </button>
        </div>

        {/* Filter bar & Search */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reference, title, or recipient..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'deposits', label: 'Deposits' },
              { id: 'withdrawals', label: 'Withdrawals' },
              { id: 'pos', label: 'POS & Utilities' },
              { id: 'earnings', label: 'Rewards & Ad Rev' },
              { id: 'p2p', label: 'P2P' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterCategory(f.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  filterCategory === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table/List */}
        <div className="divide-y divide-slate-100">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No transactions match your search or filter.
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => openReceipt(tx)}
                className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'deposit' || tx.type === 'affiliate_payout' || tx.type === 'blog_payout'
                        ? 'bg-emerald-100 text-emerald-700'
                        : tx.type === 'pos_purchase'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tx.type === 'deposit' || tx.type === 'affiliate_payout' || tx.type === 'blog_payout' ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : tx.type === 'pos_purchase' ? (
                      <Receipt className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {tx.title}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-sm">
                        {tx.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{tx.date}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-500">{tx.reference}</span>
                      {tx.recipientOrSender && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600">{tx.recipientOrSender}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-extrabold font-mono block ${
                      tx.type === 'deposit' || tx.type === 'affiliate_payout' || tx.type === 'blog_payout'
                        ? 'text-emerald-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {tx.type === 'deposit' || tx.type === 'affiliate_payout' || tx.type === 'blog_payout'
                      ? `+${formatKsh(tx.amount)}`
                      : `-${formatKsh(tx.amount)}`}
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-emerald-600 font-medium transition-colors">
                    View Receipt →
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
      {showWithdraw && <WithdrawModal onClose={() => setShowWithdraw(false)} />}
      {showSendMoney && <SendMoneyModal onClose={() => setShowSendMoney(false)} />}
    </div>
  );
};
