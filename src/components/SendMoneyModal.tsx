import React, { useState } from 'react';
import { X, Send, Lock, Loader2, CheckCircle2, Fingerprint } from 'lucide-react';
import { useMboka } from '../context/MbokaContext';

interface SendMoneyModalProps {
  onClose: () => void;
}

export const SendMoneyModal: React.FC<SendMoneyModalProps> = ({ onClose }) => {
  const { sendMoneyP2P, walletBalance, formatKsh, user, triggerBiometricAuth } = useMboka();
  const [recipientWalletId, setRecipientWalletId] = useState<string>('');
  const [amount, setAmount] = useState<string>('500');
  const [notes, setNotes] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const numAmount = Number(amount) || 0;
  const activePin = user.walletPin || user.pin || '1234';
  const isBiometricEnabled = user.biometricSettings?.enabled !== false && user.biometricSettings?.requireForP2P !== false;

  const executeSend = (pinToUse: string) => {
    const cleanId = recipientWalletId.trim().toUpperCase();
    setIsProcessing(true);
    setStatusMessage(null);

    setTimeout(async () => {
      const res = await sendMoneyP2P(cleanId, numAmount, notes, pinToUse);
      setIsProcessing(false);
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    }, 800);
  };

  const handleBiometricSend = () => {
    const cleanId = recipientWalletId.trim().toUpperCase();
    if (!cleanId) {
      setStatusMessage({ type: 'error', text: 'Please enter recipient Wallet ID (e.g. MBK-729104)' });
      return;
    }
    if (cleanId === (user.walletId || '').toUpperCase()) {
      setStatusMessage({ type: 'error', text: 'Cannot send money to your own Wallet ID.' });
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

    triggerBiometricAuth({
      actionTitle: 'Authorize P2P Transfer',
      actionDescription: 'Biometric authorization required to send funds.',
      amountText: formatKsh(numAmount),
      recipientText: cleanId,
      onSuccess: () => {
        executeSend(activePin);
      },
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = recipientWalletId.trim().toUpperCase();
    if (!cleanId) {
      setStatusMessage({ type: 'error', text: 'Please enter recipient Wallet ID (e.g. MBK-729104)' });
      return;
    }
    if (cleanId === (user.walletId || '').toUpperCase()) {
      setStatusMessage({ type: 'error', text: 'Cannot send money to your own Wallet ID.' });
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

    if (isBiometricEnabled && pin.length !== 4) {
      handleBiometricSend();
      return;
    }

    if (pin.length !== 4) {
      setStatusMessage({ type: 'error', text: 'Please enter your 4-digit transaction PIN' });
      return;
    }

    executeSend(pin);
  };

  const quickRecipients = [
    { id: 'MBK-729104', label: 'MBK-729104 (Faith)' },
    { id: 'MBK-518290', label: 'MBK-518290 (Brian)' },
    { id: 'MBK-630192', label: 'MBK-630192 (Mercy)' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md my-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">Send Money (P2P by Wallet ID)</h2>
            <p className="text-xs text-slate-500">
              Direct, 0-fee transfers between Mboka Wallet IDs
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3.5">
          {/* Recipient Wallet ID */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700">Recipient Wallet ID</label>
              <span className="text-[10px] text-slate-400">Format: MBK-XXXXXX</span>
            </div>
            <input
              type="text"
              value={recipientWalletId}
              onChange={(e) => setRecipientWalletId(e.target.value.toUpperCase())}
              placeholder="e.g. MBK-729104"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white uppercase"
              required
            />
            {/* Quick chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400">Frequent:</span>
              {quickRecipients.map((q) => (
                <button
                  type="button"
                  key={q.id}
                  onClick={() => setRecipientWalletId(q.id)}
                  className="text-[10px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                >
                  {q.label}
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

          {/* Action Buttons */}
          <div className="space-y-2">
            {isBiometricEnabled && (
              <button
                type="button"
                onClick={handleBiometricSend}
                disabled={isProcessing || numAmount > walletBalance}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/15 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Fingerprint className="w-4 h-4 text-emerald-200" />
                <span>Authorize with Biometrics</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isProcessing || numAmount > walletBalance}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transferring Funds...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isBiometricEnabled ? 'Or Send with PIN' : `Send ${amount ? formatKsh(Number(amount)) : ''}`}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
