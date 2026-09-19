import React, { useState } from 'react';
import { X, Send, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { useMboka } from '../context/MbokaContext';

interface SendMoneyModalProps {
  onClose: () => void;
}

export const SendMoneyModal: React.FC<SendMoneyModalProps> = ({ onClose }) => {
  const { sendMoneyP2P, walletBalance, formatKsh } = useMboka();
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('500');
  const [notes, setNotes] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const numAmount = Number(amount) || 0;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter recipient username or phone' });
      return;
    }
    if (numAmount < 10) {
      setStatusMessage({ type: 'error', text: 'Minimum transfer is KSh 10' });
      return;
    }
    if (numAmount > walletBalance) {
      setStatusMessage({ type: 'error', text: 'Insufficient wallet balance.' });
      return;
    }
    if (pin.length !== 4) {
      setStatusMessage({ type: 'error', text: 'Please enter your 4-digit transaction PIN' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    setTimeout(async () => {
      const res = await sendMoneyP2P(recipient, numAmount, notes, pin);
      setIsProcessing(false);
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    }, 1000);
  };

  const quickRecipients = ['@faith_wanjiku', '@brian_mutua', '@mercy_achieng'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-heading">Send Money (P2P)</h2>
            <p className="text-xs text-slate-500">
              Free instant transfers between Mboka members
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="p-6 space-y-4">
          {/* Recipient */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Recipient Username or Phone</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="@username or +254..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              required
            />
            {/* Quick chips */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400">Recent:</span>
              {quickRecipients.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => setRecipient(q)}
                  className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Amount field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700">Amount (KSh)</label>
              <span className="text-[11px] text-slate-500">
                Max: <strong className="text-slate-800">{formatKsh(walletBalance)}</strong>
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                KSh
              </span>
              <input
                type="number"
                min="10"
                max={walletBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
                className="w-full pl-13 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                required
              />
            </div>
          </div>

          {/* Optional Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Add a Note (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Lunch contribution, POS float share"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Security PIN */}
          <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Enter 4-Digit Security PIN</span>
              </label>
              <span className="text-[11px] text-slate-400">Default: 1234</span>
            </div>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-center tracking-widest text-xl font-mono py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={isProcessing || numAmount > walletBalance}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Transferring Funds...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send {amount ? formatKsh(Number(amount)) : ''}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
