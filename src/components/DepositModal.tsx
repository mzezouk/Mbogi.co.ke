import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Smartphone,
  Building2,
  CreditCard,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  Clock,
  Sliders,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';
import { smartpayService, StkStatusResponse } from '../lib/smartpay';

interface DepositModalProps {
  onClose: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ onClose }) => {
  const { depositFunds, confirmSmartPayDeposit, recordCancelledDeposit, user, formatKsh } = useMboka();
  const [method, setMethod] = useState<'mpesa' | 'bank' | 'card'>('mpesa');
  const [amount, setAmount] = useState<string>('1000');
  const [phone, setPhone] = useState<string>(user.phone);

  // STK Flow State Machine: 'input' | 'stk_prompt' | 'success' | 'cancelled'
  const [step, setStep] = useState<'input' | 'stk_prompt' | 'success' | 'cancelled'>('input');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // STK Push Details
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>('');
  const [stkStatus, setStkStatus] = useState<'PENDING' | 'COMPLETED' | 'CANCELLED' | 'FAILED'>('PENDING');
  const [stkMessage, setStkMessage] = useState<string>('');
  const [confirmedReceipt, setConfirmedReceipt] = useState<string>('');
  const [cancelReason, setCancelReason] = useState<string>('');
  const [pollCountdown, setPollCountdown] = useState<number>(30);

  const hasHandledFinalEvent = useRef<boolean>(false);

  const presetAmounts = [200, 500, 1000, 2500, 5000];

  // Automated Webhook Listener & Polling (Zero manual confirmation required)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let pollInterval: NodeJS.Timeout;
    let unsubscribeSSE: (() => void) | undefined;

    if (step === 'stk_prompt' && checkoutRequestId && stkStatus === 'PENDING') {
      hasHandledFinalEvent.current = false;

      const handleWebhookUpdate = async (res: StkStatusResponse) => {
        if (hasHandledFinalEvent.current) return;

        if (res.status === 'COMPLETED') {
          hasHandledFinalEvent.current = true;
          const receipt = res.receipt || `SP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          setStkStatus('COMPLETED');
          setConfirmedReceipt(receipt);
          setStep('success');
          await confirmSmartPayDeposit(checkoutRequestId, phone, Number(amount), receipt);
          clearInterval(pollInterval);
          clearInterval(timer);
          if (unsubscribeSSE) unsubscribeSSE();
        } else if (res.status === 'CANCELLED' || res.status === 'FAILED') {
          hasHandledFinalEvent.current = true;
          const reason =
            res.message ||
            (res.status === 'CANCELLED'
              ? 'M-Pesa STK push was cancelled by customer on handset'
              : 'Payment was declined or failed on the M-Pesa network');
          setStkStatus('CANCELLED');
          setCancelReason(reason);
          setStep('cancelled');
          await recordCancelledDeposit(checkoutRequestId, phone, Number(amount), reason);
          clearInterval(pollInterval);
          clearInterval(timer);
          if (unsubscribeSSE) unsubscribeSSE();
        } else if (res.message) {
          setStkMessage(res.message);
        }
      };

      // 1. Subscribe to instant Server-Sent Events (SSE) from the webhook receiver
      unsubscribeSSE = smartpayService.subscribeStkEvents(checkoutRequestId, (event) => {
        handleWebhookUpdate(event);
      });

      // 2. Countdown timer
      timer = setInterval(() => {
        setPollCountdown((prev) => {
          if (prev <= 1) {
            handleWebhookUpdate({
              success: false,
              status: 'CANCELLED',
              message: 'STK prompt timed out awaiting M-Pesa PIN on handset.',
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // 3. Fallback polling check every 1.8s
      pollInterval = setInterval(async () => {
        try {
          const res = await smartpayService.checkStkStatus(checkoutRequestId);
          handleWebhookUpdate(res);
        } catch {
          // Continue listening
        }
      }, 1800);
    }

    return () => {
      clearInterval(timer);
      clearInterval(pollInterval);
      if (unsubscribeSSE) unsubscribeSSE();
    };
  }, [step, checkoutRequestId, stkStatus, phone, amount, confirmSmartPayDeposit, recordCancelledDeposit]);

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

  // User explicitly cancels the active prompt
  const handleCancelPrompt = async () => {
    setIsProcessing(true);
    hasHandledFinalEvent.current = true;
    const reason = 'Deposit cancelled by user in Mboka app';
    setStkStatus('CANCELLED');
    setCancelReason(reason);
    setStep('cancelled');
    setIsProcessing(false);

    await smartpayService.cancelStkPush({
      checkoutRequestId,
      phone,
      amount: Number(amount),
      reason,
    });
    await recordCancelledDeposit(checkoutRequestId, phone, Number(amount), reason);
  };

  // Simulation test triggers for instant webhook verification
  const handleSimulateWebhook = async (eventType: 'complete' | 'cancel') => {
    setIsProcessing(true);
    await smartpayService.simulateWebhookEvent({
      checkoutRequestId,
      eventType,
      amount: Number(amount),
      phone,
      reason: eventType === 'cancel' ? 'User cancelled prompt on phone (ResultCode 1032)' : undefined,
    });
    setIsProcessing(false);
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
                : step === 'success'
                ? 'Deposit Confirmed!'
                : 'Deposit Cancelled'}
            </h2>
            <p className="text-xs text-slate-500">
              {step === 'input'
                ? 'Instant funding with zero platform deposit fees'
                : step === 'stk_prompt'
                ? 'Awaiting authorization on your phone'
                : step === 'success'
                ? 'Funds credited to your central wallet balance'
                : 'No funds were deducted from your phone or wallet'}
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

        {/* STEP 2: STK Push Dispatched Screen - Live Webhook Driven */}
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

              {/* Live Webhook Status Indicator */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200/70">
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-ping" />
                <span>Listening for SmartPay Webhook Event... ({pollCountdown}s)</span>
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

            {/* Zero Manual Confirmation Notice */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
              <p className="text-xs font-semibold text-slate-800">
                Automatic Webhook Confirmation
              </p>
              <p className="text-[11px] text-slate-500">
                Enter your PIN or cancel on your phone. The webhook updates this screen and your ledger in real-time with no manual confirmation needed.
              </p>
            </div>

            {/* Webhook Simulation Shortcuts (For instant sandbox verification) */}
            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2">
              <p className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                Simulate Real-time Webhook Event:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateWebhook('complete')}
                  disabled={isProcessing}
                  className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Simulate PIN Approved
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateWebhook('cancel')}
                  disabled={isProcessing}
                  className="py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-3 h-3" />
                  Simulate Cancelled
                </button>
              </div>
            </div>

            {/* Cancel Action */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleCancelPrompt}
                disabled={isProcessing}
                className="w-full py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Cancel Deposit Request
              </button>

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
                Webhook event received and reconciled with zero manual intervention.
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
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Reconciliation:</span>
                <span className="text-emerald-700 font-semibold">Auto-Reconciled via Webhook</span>
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

        {/* STEP 4: Cancelled Screen - Webhook Driven */}
        {step === 'cancelled' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-50 animate-in zoom-in-50 duration-300">
              <XCircle className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 font-heading">Deposit Cancelled</h3>
              <p className="text-xs text-slate-500 mt-1">
                The transaction was cancelled and no funds were deducted from your M-Pesa account.
              </p>
            </div>

            <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-100 space-y-2 text-left">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Amount Attempted:</span>
                <span className="font-bold text-slate-800">{formatKsh(Number(amount))}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Phone:</span>
                <span className="font-mono text-slate-700">{phone}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-rose-700">Cancelled / Declined</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Reason:</span>
                <span className="font-medium text-slate-700 max-w-[200px] text-right truncate" title={cancelReason}>
                  {cancelReason || 'Customer cancelled on phone'}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('input');
                  setStkStatus('PENDING');
                  setCancelReason('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Return to Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
