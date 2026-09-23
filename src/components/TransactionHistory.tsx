import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Copy,
  Check,
  Filter,
  TrendingDown,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';
import { WalletTransaction } from '../types';

interface TransactionHistoryProps {
  onOpenReceipt?: (tx: WalletTransaction) => void;
  maxItems?: number;
  showFilters?: boolean;
  compact?: boolean;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  onOpenReceipt,
  maxItems,
  showFilters = true,
  compact = false,
}) => {
  const { transactions, formatKsh, user, setSelectedReceipt } = useMboka();

  const [activeType, setActiveType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount-desc' | 'amount-asc'>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenTx = (tx: WalletTransaction) => {
    if (onOpenReceipt) {
      onOpenReceipt(tx);
    } else {
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
          : tx.title.includes('KPLC')
          ? 'Kenya Power'
          : 'Mboka Network',
        operator: 'Mboka Central Ledger',
        cashbackEarned: tx.metadata?.cashback,
      });
    }
  };

  // Filter calculations
  const filtered = transactions.filter((tx) => {
    const matchesType =
      activeType === 'all'
        ? true
        : activeType === 'deposits'
        ? tx.type === 'deposit'
        : activeType === 'payouts'
        ? tx.type === 'withdrawal'
        : activeType === 'transfers'
        ? tx.type === 'transfer_in' || tx.type === 'transfer_out'
        : activeType === 'affiliate'
        ? tx.category === 'affiliate' || tx.type === 'affiliate_payout'
        : true;

    const matchesStatus =
      statusFilter === 'all' ? true : tx.status === statusFilter;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      tx.title.toLowerCase().includes(query) ||
      tx.reference.toLowerCase().includes(query) ||
      (tx.recipientOrSender && tx.recipientOrSender.toLowerCase().includes(query)) ||
      (tx.notes && tx.notes.toLowerCase().includes(query));

    return matchesType && matchesStatus && matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    if (sortBy === 'oldest') {
      return new Date(a.date.replace(/ at .*$/, '')).getTime() - new Date(b.date.replace(/ at .*$/, '')).getTime();
    }
    // Default newest
    return new Date(b.date.replace(/ at .*$/, '')).getTime() - new Date(a.date.replace(/ at .*$/, '')).getTime();
  });

  const displayedList = maxItems ? sorted.slice(0, maxItems) : sorted;

  // KPI calculations
  const totalDeposits = transactions
    .filter((t) => t.type === 'deposit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPayouts = transactions
    .filter((t) => t.type === 'withdrawal' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalTransfers = transactions
    .filter(
      (t) =>
        (t.type === 'transfer_in' || t.type === 'transfer_out') &&
        t.status === 'completed'
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Date,Reference,Title,Type,Category,Amount (KSh),Fee (KSh),Status,Recipient/Sender']
        .concat(
          transactions.map(
            (t) =>
              `"${t.date}","${t.reference}","${t.title}","${t.type}","${t.category}",${t.amount},${t.fee},"${t.status}","${t.recipientOrSender || ''}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Mboka_Statement_${user.username}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header with Title & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
            <span>Transaction Ledger History</span>
            <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Real-time tracking of deposits, B2C payouts, and wallet transfers
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
          title="Export records to CSV statement"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Quick Summary Metrics Cards */}
      {!compact && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                Total Deposits
              </span>
              <div className="text-base font-extrabold text-emerald-950 font-mono mt-0.5">
                +{formatKsh(totalDeposits)}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                B2C Withdrawals
              </span>
              <div className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
                -{formatKsh(totalPayouts)}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-200/70 text-slate-700 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/70 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-teal-800 uppercase tracking-wide">
                Transfers & P2P
              </span>
              <div className="text-base font-extrabold text-teal-950 font-mono mt-0.5">
                {formatKsh(totalTransfers)}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      {showFilters && (
        <div className="space-y-2.5 pt-1">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by M-Pesa receipt, phone, description..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount-desc">Amount: High to Low</option>
                  <option value="amount-asc">Amount: Low to High</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'All Transactions' },
              { id: 'deposits', label: 'Deposits (C2B)' },
              { id: 'payouts', label: 'Withdrawals (B2C)' },
              { id: 'transfers', label: 'P2P Transfers' },
              { id: 'affiliate', label: 'Affiliate Commissions' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveType(tab.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeType === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white">
        {displayedList.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No transactions found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || activeType !== 'all' || statusFilter !== 'all'
                ? 'No transactions match your current search or filters. Try adjusting your query.'
                : 'Deposit funds or perform a transaction to start building your verified ledger history.'}
            </p>
          </div>
        ) : (
          displayedList.map((tx) => {
            const isCredit =
              tx.type === 'deposit' ||
              tx.type === 'affiliate_payout' ||
              tx.type === 'blog_payout' ||
              tx.type === 'transfer_in' ||
              tx.type === 'pos_commission';

            return (
              <div
                key={tx.id}
                onClick={() => handleOpenTx(tx)}
                className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Category / Direction Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                      tx.type === 'deposit'
                        ? 'bg-emerald-100 text-emerald-700'
                        : tx.type === 'withdrawal'
                        ? 'bg-rose-100 text-rose-700'
                        : tx.type === 'pos_purchase'
                        ? 'bg-amber-100 text-amber-700'
                        : tx.type === 'transfer_out'
                        ? 'bg-teal-100 text-teal-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {tx.type === 'deposit' ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : tx.type === 'withdrawal' ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : tx.type === 'pos_purchase' ? (
                      <Receipt className="w-5 h-5" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        {tx.title}
                      </span>
                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tx.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tx.status === 'completed' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : tx.status === 'pending' ? (
                          <Clock className="w-3 h-3 text-amber-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                        )}
                        <span className="capitalize">{tx.status}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                      <span>{tx.date}</span>
                      <span>•</span>
                      {/* Reference with copy button */}
                      <button
                        onClick={(e) => handleCopy(tx.reference, tx.id, e)}
                        className="font-mono text-slate-700 hover:text-emerald-700 flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-md text-[11px]"
                        title="Click to copy receipt code"
                      >
                        <span>{tx.reference}</span>
                        {copiedId === tx.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </button>

                      {tx.recipientOrSender && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600 font-medium truncate max-w-[140px] sm:max-w-none">
                            {tx.recipientOrSender}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <span
                    className={`text-sm sm:text-base font-extrabold font-mono block ${
                      tx.status === 'failed'
                        ? 'text-rose-500/80 line-through'
                        : isCredit
                        ? 'text-emerald-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {tx.status === 'failed'
                      ? formatKsh(tx.amount)
                      : isCredit
                      ? `+${formatKsh(tx.amount)}`
                      : `-${formatKsh(tx.amount)}`}
                  </span>

                  <div className="flex items-center justify-end gap-1 mt-0.5 text-[10px] text-slate-400 group-hover:text-emerald-600 font-medium transition-colors">
                    {tx.status === 'failed' ? (
                      <span className="text-rose-600 font-semibold">Cancelled / No Charge</span>
                    ) : tx.fee > 0 ? (
                      <span>Fee: {formatKsh(tx.fee)} • Receipt →</span>
                    ) : (
                      <span>Free • Receipt →</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
