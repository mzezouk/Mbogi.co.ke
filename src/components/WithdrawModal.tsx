import React, { useState } from 'react';
import {
  X,
  ArrowDownRight,
  Lock,
  Loader2,
  CheckCircle2,
  KeyRound,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';

interface WithdrawModalProps {
  onClose: () => void;
  onSwitchToDeposit?: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  onClose,
  onSwitchToDeposit,
}) => {
  const {
    initiateSmartPayWithdrawal,
    walletBalance,
    user,
    formatKsh,
    updateUserPin,
  } = useMboka();

  const [amount, setAmount] = useState<string>('50');
  const [phone, setPhone] = useState<string>(user.phone || '+254796282073');
  const [pin, setPin] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // In-modal PIN change state
  const [showPinEditor, setShowPinEditor] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const numAmount = Number(amount) || 0;

  // Official requested B2C fee rule:
  // 10-100 is FREE
  // 101~15000 to be discussed in future (currently KSh 0 promotional tier)
  const fee = 0;
  const totalDeduction = numAmount + fee;

  const activePin = user.walletPin || user.pin || '1234';
  const hasMinimumBalance = walletBalance >= 10;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasMinimumBalance) {
      setStatusMessage({
        type: 'error',
        text: `B2C withdrawals require a minimum balance of KSh 10. Your balance is ${formatKsh(
          walletBalance
        )}. Please deposit funds first.`,
      });
      return;
    }

    if (numAmount < 10) {
      setStatusMessage({
        type: 'error',
        text: 'Minimum withdrawal amount is KSh 10.',
      });
      return;
    }

    if (numAmount > 15000) {
      setStatusMessage({
        type: 'error',
        text: 'Maximum single B2C withdrawal limit is KSh 15,000.',
      });
      return;
    }

    if (totalDeduction > walletBalance) {
      setStatusMessage({
        type: 'error',
        text: `Insufficient balance for KSh ${numAmount}. Your balance is ${formatKsh(
          walletBalance
        )}.`,
      });
      return;
    }

    if (pin.length !== 4) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter your 4-digit transaction PIN.',
      });
      return;
    }

    if (pin !== activePin) {
      setStatusMessage({
        type: 'error',
        text: 'Incorrect PIN. If you forgot your PIN, use the "Set / Change PIN" option below.',
      });
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
      }, 2000);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinChangeMsg({
        type: 'error',
        text: 'PIN must be exactly 4 numeric digits (0-9).',
      });
      return;
    }
    if (newPin !== confirmPin) {
      setPinChangeMsg({
        type: 'error',
        text: 'PIN confirmation does not match.',
      });
      return;
    }

    const ok = updateUserPin(newPin);
    if (ok) {
      setPinChangeMsg({
        type: 'success',
        text: 'PIN updated successfully! You can now use it to withdraw.',
      });
      setPin(newPin); // Auto-fill current withdraw PIN
      setTimeout(() => {
        setShowPinEditor(false);
        setPinChangeMsg(null);
        setNewPin('');
        setConfirmPin('');
      }, 1500);
    } else {
      setPinChangeMsg({
        type: 'error',
        text: 'Could not update PIN. Please try again.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 font-heading">
                Withdraw to M-Pesa
              </h2>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                SmartPay B2C
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Available Balance:{' '}
              <strong className="text-emerald-700 font-bold font-mono">
                {formatKsh(walletBalance)}
              </strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Balance check warning if balance < 10 */}
          {!hasMinimumBalance && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="font-bold">Minimum Balance Notice</p>
                <p className="text-amber-800 leading-relaxed">
                  B2C withdrawals require a minimum wallet balance of{' '}
                  <strong>KSh 10.00</strong>. Your current balance is{' '}
                  <strong>{formatKsh(walletBalance)}</strong>.
                </p>
                {onSwitchToDeposit && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSwitchToDeposit();
                    }}
                    className="mt-1 text-xs font-bold text-emerald-700 underline hover:text-emerald-800 cursor-pointer"
                  >
                    Deposit Funds via M-Pesa STK →
                  </button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleWithdraw} className="space-y-4">
            {/* Amount field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700">
                  Withdrawal Amount (KSh)
                </label>
                <span className="text-[11px] text-slate-500">Min: KSh 10 • Max: KSh 15,000</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                  KSh
                </span>
                <input
                  type="number"
                  min="10"
                  max="15000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50"
                  className="w-full pl-13 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  required
                />
              </div>

              {/* Fee breakdown notice as requested by user */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>B2C Transfer Fee:</span>
                  <span className="font-bold text-emerald-700">
                    {numAmount >= 10 && numAmount <= 100
                      ? 'Free (KSh 0)'
                      : numAmount > 100 && numAmount <= 15000
                      ? 'Free (Future Tier / Promo KSh 0)'
                      : 'KSh 0'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700 font-semibold border-t border-slate-200/60 pt-1">
                  <span>Total Wallet Deduction:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatKsh(totalDeduction)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 pt-0.5">
                  Fee policy: <strong>10–100 is Free</strong>. 101–15,000 tier terms under review (Free during promotion).
                </p>
              </div>
            </div>

            {/* Destination Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Destination M-Pesa Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                required
              />
            </div>

            {/* Security PIN Section with User-Settable PIN Option */}
            <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>4-Digit Withdrawal PIN</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPinEditor(!showPinEditor)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>{showPinEditor ? 'Cancel' : 'Set / Change PIN'}</span>
                  {showPinEditor ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Inline PIN Editor */}
              {showPinEditor && (
                <div className="p-3 bg-white rounded-lg border border-emerald-200 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Set Your Personal Withdrawal PIN</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                        New 4-Digit PIN
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={newPin}
                        onChange={(e) =>
                          setNewPin(e.target.value.replace(/\D/g, ''))
                        }
                        placeholder="••••"
                        className="w-full text-center tracking-widest text-base font-mono py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                        Confirm PIN
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={confirmPin}
                        onChange={(e) =>
                          setConfirmPin(e.target.value.replace(/\D/g, ''))
                        }
                        placeholder="••••"
                        className="w-full text-center tracking-widest text-base font-mono py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {pinChangeMsg && (
                    <div
                      className={`p-2 rounded text-[11px] flex items-center gap-1.5 ${
                        pinChangeMsg.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-rose-50 text-rose-800'
                      }`}
                    >
                      {pinChangeMsg.type === 'success' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      <span>{pinChangeMsg.text}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSavePin}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md shadow-2xs transition-colors cursor-pointer"
                  >
                    Save New PIN
                  </button>
                </div>
              )}

              {/* Main PIN input field */}
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full text-center tracking-widest text-xl font-mono py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <p className="text-[10px] text-slate-400 text-center">
                Current PIN: •••• (Default: 1234 or your custom set PIN)
              </p>
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
                {statusMessage.type === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={
                isProcessing ||
                !hasMinimumBalance ||
                totalDeduction > walletBalance
              }
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
                  <span>
                    Withdraw {amount ? formatKsh(Number(amount)) : ''}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
