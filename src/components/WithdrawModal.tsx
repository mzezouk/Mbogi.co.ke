import React, { useState } from 'react';
import { X, ArrowDownRight, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { useMboka } from '../context/MbokaContext';

interface WithdrawModalProps {
  onClose: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ onClose }) => {
  const { initiateSmartPayWithdrawal, walletBalance, user, formatKsh } = useMboka();
  const [amount, setAmount] = useState<string>('500');
  const [phone, setPhone] = useState<string>(user.phone);
  const [pin, setPin] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const numAmount = Number(amount) || 0;
  // SmartPay official fee schedule: KSh 10-100 free, 101-1000 KSh 10, >1000 KSh 15
  const estimatedFee = numAmount > 1000 ? 15 : numAmount > 100 ? 10 : 0;
  const totalDeduction = numAmount + estimatedFee;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount < 10) {
      setStatusMessage({ type: 'error', text: 'Minimum withdrawal amount is KSh 10' });
      return;
    }
    if (totalDeduction > walletBalance) {
      setStatusMessage({ type: 'error', text: `Insufficient balance for KSh ${numAmount} + KSh ${estimatedFee} fee.` });
      return;
    }
    if (pin.length !== 4) {
      setStatusMessage({ type: 'error', text: 'Please enter your 4-digit transaction PIN' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    const res = await initiateSmartPayWithdrawal(phone, numAmount, pin);
    setIsProcessing(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setTimeout(() => {
        onClose();
      }, 1800);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 font-heading">Withdraw to M-Pesa</h2>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    SmartPay B2C
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Available Wallet Balance: <strong className="text-emerald-700 font-semibold">{formatKsh(walletBalance)}</strong>
                </p>
              </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleWithdraw} className="p-6 space-y-4">
          {/* Amount field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Withdrawal Amount (KSh)</label>
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
            <div className="flex justify-between text-[11px] text-slate-500 px-1 pt-0.5">
              <span>M-Pesa processing fee: {formatKsh(estimatedFee)}</span>
              <span>Total deduction: <strong className="text-slate-800">{formatKsh(totalDeduction)}</strong></span>
            </div>
          </div>

          {/* Destination Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">M-Pesa Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254 7XX XXX XXX"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              required
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
            disabled={isProcessing || totalDeduction > walletBalance}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing M-Pesa Payout...</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                <span>Withdraw {amount ? formatKsh(Number(amount)) : ''}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
