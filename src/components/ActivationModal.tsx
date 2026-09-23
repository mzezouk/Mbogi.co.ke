import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Phone,
  Wallet,
  ArrowRight,
  AlertCircle,
  Loader2,
  Zap,
  Check,
  Sparkles,
  X,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';

interface ActivationModalProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export const ActivationModal: React.FC<ActivationModalProps> = ({ onSuccess, onClose }) => {
  const {
    user,
    walletBalance,
    formatKsh,
    activateAccount,
    initiateSmartPayDeposit,
    confirmSmartPayDeposit,
  } = useMboka();

  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'wallet'>('mpesa');
  const [phone, setPhone] = useState<string>(user.phone);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [waitingStk, setWaitingStk] = useState<boolean>(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isDone, setIsDone] = useState<boolean>(false);

  const activationFee = 50;

  // Handle M-Pesa STK Push flow
  const handleStkPushActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsProcessing(true);

    try {
      const cleanPhone = phone.trim();
      const res = await initiateSmartPayDeposit(cleanPhone, activationFee);

      if (res.success && res.checkoutRequestId) {
        setCheckoutId(res.checkoutRequestId);
        setWaitingStk(true);
        setStatusMsg({
          type: 'info',
          text: `STK Prompt sent to ${cleanPhone}. Please enter your M-Pesa PIN on your phone to complete activation.`,
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res.message || 'Failed to dispatch M-Pesa STK Push. Please retry.',
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Error communicating with M-Pesa gateway.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Simulate or confirm handset pin entry
  const handleConfirmHandsetEntry = async () => {
    setIsProcessing(true);
    try {
      if (checkoutId) {
        await confirmSmartPayDeposit(checkoutId, phone, activationFee);
      }
      const actRes = await activateAccount('mpesa');
      if (actRes.success) {
        setIsDone(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        setStatusMsg({ type: 'error', text: actRes.message });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || 'Could not verify activation.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Direct wallet payment if balance permits
  const handleWalletActivation = async () => {
    setStatusMsg(null);
    setIsProcessing(true);
    try {
      const actRes = await activateAccount('wallet');
      if (actRes.success) {
        setIsDone(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        setStatusMsg({ type: 'error', text: actRes.message });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || 'Wallet activation failed.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Fast sandbox demo activation button for testing & review
  const handleSandboxInstantActivation = async () => {
    setIsProcessing(true);
    try {
      const actRes = await activateAccount('instant');
      if (actRes.success) {
        setIsDone(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1200);
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg my-auto bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Visual Header */}
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 p-6 sm:p-7 text-white shrink-0 relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Account Platform Activation</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight">
            Activate Your Mboka Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
            A one-time platform activation fee of <strong className="text-emerald-400 font-mono">KSh 50.00</strong> is required to initialize your unique Wallet ID and unlock platform transactions.
          </p>

          <div className="mt-4 p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Your Assigned Wallet ID</span>
              <div className="text-lg font-black font-mono tracking-wider text-white">
                {user.walletId || 'MBK-ASSIGNED'}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Activation Fee</span>
              <div className="text-lg font-black font-mono text-emerald-400">
                {formatKsh(activationFee)}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isDone ? (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900 font-heading">
                Platform Activated!
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Your account is verified and ready. Wallet ID <strong>{user.walletId}</strong> is now operational for automated payouts, P2P transfers, and affiliate earnings.
              </p>
              {user.referredBy && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium">
                  Referral acknowledged: KSh 20.00 commission automatically credited to your inviter ({user.referredBy})!
                </div>
              )}
            </div>
          ) : (
            <>
              {statusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
                    statusMsg.type === 'error'
                      ? 'bg-rose-50 border border-rose-200 text-rose-800'
                      : statusMsg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-teal-50 border border-teal-200 text-teal-800'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{statusMsg.text}</span>
                </div>
              )}

              {/* Payment Method Selector */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('mpesa');
                    setWaitingStk(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    paymentMethod === 'mpesa'
                      ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>M-Pesa STK Push</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Prompt to your phone</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('wallet');
                    setWaitingStk(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    paymentMethod === 'wallet'
                      ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Wallet className="w-3.5 h-3.5 text-teal-600" />
                    <span>Wallet Balance</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Bal: {formatKsh(walletBalance)}
                  </p>
                </button>
              </div>

              {paymentMethod === 'mpesa' ? (
                <div className="space-y-3 pt-1">
                  {!waitingStk ? (
                    <form onSubmit={handleStkPushActivation} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">
                          M-Pesa Mobile Number
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="07XX XXX XXX or +254 7XX..."
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Sending STK Prompt...</span>
                          </>
                        ) : (
                          <>
                            <span>Send KSh 50 STK Prompt to Phone</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 animate-in fade-in">
                      <div className="flex items-start gap-2 text-xs text-amber-900">
                        <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0 mt-0.5" />
                        <div>
                          <strong>Waiting for Handset PIN...</strong>
                          <p className="text-[11px] text-amber-700 mt-0.5">
                            Enter your M-Pesa PIN on your phone. Once entered, click below to verify and complete activation.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleConfirmHandsetEntry}
                        disabled={isProcessing}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span>I have entered PIN / Verify Now</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Available Balance:</span>
                      <strong className="text-slate-900 font-mono">{formatKsh(walletBalance)}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Activation Fee:</span>
                      <strong className="text-emerald-700 font-mono">KSh 50.00</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleWalletActivation}
                    disabled={isProcessing || walletBalance < activationFee}
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>Pay KSh 50 from Wallet Balance</span>
                  </button>
                </div>
              )}

              {/* Developer Sandbox Instant Demo Button */}
              <div className="pt-2 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={handleSandboxInstantActivation}
                  disabled={isProcessing}
                  className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 underline underline-offset-2 cursor-pointer transition-colors"
                >
                  ⚡ Sandbox Instant Test: Activate Account Now (Free Demo)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
