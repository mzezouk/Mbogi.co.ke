import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Building2,
  CreditCard,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  Clock,
  Sparkles,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';
import { smartpayService } from '../lib/smartpay';

interface DepositModalProps {
  onClose: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ onClose }) => {
  const { depositFunds, confirmSmartPayDeposit, user, formatKsh } = useMboka();
  const [method, setMethod] = useState<'mpesa' | 'bank' | 'card'>('mpesa');
  const [amount, setAmount] = useState<string>('1000');
  const [phone, setPhone] = useState<string>(user.phone);

  // STK Flow State Machine: 'input' | 'stk_prompt' | 'success'
  const [step, setStep] = useState<'input' | 'stk_prompt' | 'success'>('input');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // STK Push Details
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>('');
  const [stkStatus, setStkStatus] = useState<'PENDING' | 'COMPLETED' | 'FAILED'>('PENDING');
  const [stkMessage, setStkMessage] = useState<string>('');
  const [confirmedReceipt, setConfirmedReceipt] = useState<string>('');
  const [pollCountdown, setPollCountdown] = useState<number>(30);
  const [showManualReceiptInput, setShowManualReceiptInput] = useState<boolean>(false);
  const [manualReceipt, setManualReceipt] = useState<string>('');

  const presetAmounts = [200, 500, 1000, 2500, 5000];

  // Live polling effect when in 'stk_prompt' step
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let pollInterval: NodeJS.Timeout;

    if (step === 'stk_prompt' && checkoutRequestId && stkStatus === 'PENDING') {
      // Countdown timer
      timer = setInterval(() => {
        setPollCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      // Status check interval every 2.5s
      pollInterval = setInterval(async () => {
        try {
          const res = await smartpayService.checkStkStatus(checkoutRequestId);
          if (res.status === 'COMPLETED') {
            const receipt = res.receipt || `SP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            setStkStatus('COMPLETED');
            setConfirmedReceipt(receipt);
            setStep('success');
            await confirmSmartPayDeposit(checkoutRequestId, phone, Number(amount), receipt);
            clearInterval(pollInterval);
            clearInterval(timer);
          } else if (res.status === 'FAILED') {
            setStkStatus('FAILED');
            setStkMessage(res.message || 'M-Pesa payment was declined or cancelled.');
          }
        } catch {
          // Continue polling
        }
      }, 2500);
    }

    return () => {
      clearInterval(timer);
      clearInterval(pollInterval);
    };
  }, [step, checkoutRequestId, stkStatus, phone, amount, confirmSmartPayDeposit]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 1) {
      setStatusMessage({ type: 'error', text: 'Please enter a minimum deposit of KSh 1' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    if (method === 'mpesa') {
      try {
        const res = await smartpayService.sendStkPush({
          phone,
          amount: numAmount,
          accountReference: 'MBOKA_FLOAT',
          description: 'Mboka Float Top-Up',
        });

        setIsProcessing(false);

        if (res.success || res.checkout_request_id) {
          const cId = res.checkout_request_id || `ws_CO_${Date.now()}`;
          setCheckoutRequestId(cId);
          setStkStatus('PENDING');
          setPollCountdown(30);
          setStkMessage(res.message || 'M-Pesa prompt sent. Check your phone screen now.');
          setStep('stk_prompt');
        } else {
          setStatusMessage({
            type: 'error',
            text: res.message || 'Failed to dispatch M-Pesa STK push. Please check your phone number.',
          });
        }
      } catch (err: any) {
        setIsProcessing(false);
        setStatusMessage({
          type: 'error',
          text: err?.message || 'Error connecting to payment gateway.',
        });
      }
    } else {
      // Bank / Card Instant Deposit
      setTimeout(async () => {
        const methodName = method === 'bank' ? 'Bank Transfer' : 'Debit Card';
        const res = await depositFunds(numAmount, methodName, phone);
        setIsProcessing(false);
        if (res.success) {
          setStatusMessage({ type: 'success', text: res.message });
          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          setStatusMessage({ type: 'error', text: res.message });
        }
      }, 900);
    }
  };

  // Manual fast-confirm when user has entered PIN or testing
  const handleFastConfirm = async () => {
    setIsProcessing(true);
    const numAmount = Number(amount);
    const receipt =
      manualReceipt.trim().toUpperCase() ||
      confirmedReceipt ||
      `SP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const res = await confirmSmartPayDeposit(checkoutRequestId, phone, numAmount, receipt);
    setIsProcessing(false);
    if (res.success) {
      setConfirmedReceipt(receipt);
      setStkStatus('COMPLETED');
      setStep('success');
      setTimeout(() => {
        onClose();
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              {step === 'input'
                ? 'Deposit into Mboka Wallet'
                : step === 'stk_prompt'
                ? 'M-Pesa STK Prompt Active'
                : 'Deposit Confirmed!'}
            </h2>
            <p className="text-xs text-slate-500">
              {step === 'input'
                ? 'Instant funding with zero platform deposit fees'
                : step === 'stk_prompt'
                ? 'Awaiting authorization on your phone'
                : 'Funds credited to your central wallet balance'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Method & Amount Selection */}
        {step === 'input' && (
          <form onSubmit={handleDeposit} className="p-6 space-y-5">
            {/* Method Selector */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setMethod('mpesa')}
                className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  method === 'mpesa'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 shadow-xs ring-1 ring-emerald-600/30'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <Smartphone className={`w-5 h-5 ${method === 'mpesa' ? 'text-emerald-600' : 'text-slate-500'}`} />
                <span className="text-xs font-semibold">M-Pesa STK</span>
                <span className="text-[9px] text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded font-mono font-medium">SmartPay</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('bank')}
                className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  method === 'bank'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 shadow-xs ring-1 ring-emerald-600/30'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <Building2 className={`w-5 h-5 ${method === 'bank' ? 'text-emerald-600' : 'text-slate-500'}`} />
                <span className="text-xs font-semibold">Paybill / Bank</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  method === 'card'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 shadow-xs ring-1 ring-emerald-600/30'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <CreditCard className={`w-5 h-5 ${method === 'card' ? 'text-emerald-600' : 'text-slate-500'}`} />
                <span className="text-xs font-semibold">Card</span>
              </button>
            </div>

            {/* Amount field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Deposit Amount (KSh)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                  KSh
                </span>
                <input
                  type="number"
                  min="1"
                  max="300000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1,000"
                  className="w-full pl-13 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  required
                />
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {presetAmounts.map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setAmount(p.toString())}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                      amount === p.toString()
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                        : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    +{formatKsh(p)}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone or Account */}
            {method === 'mpesa' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">M-Pesa Registered Phone Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0796 282 073 or 2547XXXXXXXX"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    required
                  />
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Safaricom will send an instant pop-up asking for your M-Pesa PIN.
                </p>
              </div>
            )}

            {method === 'bank' && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Mboka Paybill:</span>
                  <strong className="font-mono text-slate-900">882940</strong>
                </div>
                <div className="flex justify-between">
                  <span>Account Number:</span>
                  <strong className="font-mono text-slate-900">{user.phone.replace(/\s+/g, '')}</strong>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Enter your phone number as account number for instant automated reconciliation.
                </p>
              </div>
            )}

            {method === 'card' && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Card Number (4XXX XXXX XXXX XXXX)"
                  defaultValue="4242 •••• •••• 4242"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    defaultValue="12/28"
                    className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm"
                  />
                  <input
                    type="password"
                    placeholder="CVV"
                    defaultValue="•••"
                    className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Status Alert */}
            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to SmartPay M-Pesa...</span>
                </>
              ) : (
                <>
                  <span>Deposit {amount ? formatKsh(Number(amount)) : ''}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: STK Push Dispatched Screen */}
        {step === 'stk_prompt' && (
          <div className="p-6 space-y-5">
            {/* Visual Phone Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-200 text-center relative overflow-hidden">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-600 text-white shadow-lg mb-3 ring-4 ring-emerald-100 animate-pulse">
                <Smartphone className="w-8 h-8" />
              </div>

              <h3 className="font-bold text-slate-900 text-base">Check Your Phone Screen Now</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                An M-Pesa STK PIN prompt has been dispatched to{' '}
                <strong className="text-emerald-700 font-mono">{phone}</strong>.
              </p>

              {/* Amount Tag */}
              <div className="mt-3.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-emerald-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium">Paying:</span>
                <span className="text-sm font-extrabold text-emerald-800">{formatKsh(Number(amount))}</span>
              </div>

              {/* Live Polling Status Indicator */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-emerald-700">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Listening for M-Pesa network confirmation... ({pollCountdown}s)</span>
              </div>
            </div>

            {/* STK Message feedback */}
            {stkMessage && (
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                <span className="truncate">{stkMessage}</span>
                <span className="font-mono text-[10px] text-slate-400 shrink-0 ml-2">
                  ID: {checkoutRequestId.substring(0, 12)}...
                </span>
              </div>
            )}

            {/* Fast-Action Confirmation Options */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleFastConfirm}
                disabled={isProcessing}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying & Crediting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>I Have Authorized / Confirm Payment</span>
                  </>
                )}
              </button>

              {/* Manual Receipt code toggle */}
              {!showManualReceiptInput ? (
                <button
                  type="button"
                  onClick={() => setShowManualReceiptInput(true)}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 text-center font-medium transition-colors"
                >
                  Have an M-Pesa SMS Code? Enter receipt manually
                </button>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    M-Pesa SMS Confirmation Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualReceipt}
                      onChange={(e) => setManualReceipt(e.target.value)}
                      placeholder="e.g. QJH89XK294"
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleFastConfirm}
                      className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      Reconcile
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep('input')}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 text-center transition-colors"
              >
                Back to change amount or phone number
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Success Confirmation Screen */}
        {step === 'success' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50 animate-in zoom-in-50 duration-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 font-heading">Deposit Successfully Credited!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your Mboka Central Ledger has been credited with zero fees.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-left">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Amount Credited:</span>
                <span className="font-extrabold text-emerald-700">{formatKsh(Number(amount))}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">M-Pesa Receipt:</span>
                <span className="font-mono font-bold text-slate-900">{confirmedReceipt || 'SP-CONFIRMED'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Phone:</span>
                <span className="font-mono text-slate-700">{phone}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Done & View Balance
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
