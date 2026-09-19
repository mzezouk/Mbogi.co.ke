import React, { useState } from 'react';
import { PosReceipt } from '../types';
import { CheckCircle2, Copy, Check, Share2, Printer, X, Zap, Phone, Tv } from 'lucide-react';
import { useMboka } from '../context/MbokaContext';

interface ReceiptModalProps {
  receipt: PosReceipt;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  const { formatKsh } = useMboka();
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const handleCopyToken = () => {
    if (receipt.token) {
      navigator.clipboard.writeText(receipt.token.replace(/-/g, ''));
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(receipt.receiptNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = receipt.token
      ? `Mboka Digital Receipt\nService: ${receipt.serviceName}\nRef: ${receipt.receiptNumber}\nAmount: ${formatKsh(receipt.amount)}\nToken: ${receipt.token}\nUnits: ${receipt.units || 'N/A'} kWh\nDate: ${receipt.date}`
      : `Mboka Digital Receipt\nService: ${receipt.serviceName}\nRef: ${receipt.receiptNumber}\nAmount: ${formatKsh(receipt.amount)}\nAccount/Phone: ${receipt.accountOrPhone}\nDate: ${receipt.date}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getServiceIcon = () => {
    switch (receipt.serviceType) {
      case 'kplc':
        return <Zap className="w-6 h-6 text-amber-500" />;
      case 'airtime':
        return <Phone className="w-6 h-6 text-emerald-500" />;
      case 'tv':
        return <Tv className="w-6 h-6 text-blue-500" />;
      default:
        return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
            aria-label="Close receipt"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-emerald-600 mb-3 shadow-md">
            {getServiceIcon()}
          </div>
          <h2 className="text-xl font-bold tracking-tight font-heading">Transaction Successful</h2>
          <p className="text-emerald-100 text-sm mt-0.5">{receipt.serviceName}</p>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-5">
          {/* Token Highlight for KPLC */}
          {receipt.token && (
            <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl text-center space-y-2">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                KPLC Prepaid Stima Token
              </span>
              <div className="text-2xl font-mono font-extrabold text-amber-950 tracking-wider select-all">
                {receipt.token}
              </div>
              <div className="flex items-center justify-center gap-4 pt-1">
                <button
                  onClick={handleCopyToken}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedToken ? 'Copied Token!' : 'Copy Token'}
                </button>
                {receipt.units && (
                  <span className="text-xs font-semibold text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-md">
                    Units: {receipt.units} kWh
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Key Details Grid */}
          <div className="divide-y divide-slate-100 text-sm bg-slate-50/60 rounded-xl p-4 border border-slate-100">
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Amount Paid</span>
              <span className="font-bold text-slate-900 text-base">{formatKsh(receipt.amount)}</span>
            </div>

            {receipt.cashbackEarned !== undefined && receipt.cashbackEarned > 0 && (
              <div className="flex justify-between py-2.5 text-emerald-700">
                <span className="font-medium">Cashback Earned</span>
                <span className="font-bold">+{formatKsh(receipt.cashbackEarned)}</span>
              </div>
            )}

            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Target / Account</span>
              <span className="font-mono font-medium text-slate-800">{receipt.accountOrPhone}</span>
            </div>

            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Provider</span>
              <span className="font-medium text-slate-800">{receipt.provider}</span>
            </div>

            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Reference No.</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-semibold text-slate-800">{receipt.receiptNumber}</span>
                <button
                  onClick={handleCopyRef}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                  title="Copy reference"
                >
                  {copiedRef ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Timestamp</span>
              <span className="text-slate-600">{receipt.date}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp Slip
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print / Save
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Processed via <strong className="font-semibold text-slate-700">Mboka Digital Ledger</strong> • Powered by Safaricom & KPLC APIS
          </p>
        </div>
      </div>
    </div>
  );
};
