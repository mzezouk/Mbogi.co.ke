import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  ShieldCheck,
  X,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Lock,
  Smartphone,
  ScanFace,
  RefreshCw,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';
import { verifyNativeBiometric, detectHardwareCapabilities, HardwareBiometricStatus } from '../services/biometricAuth';

interface BiometricPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle: string;
  actionDescription?: string;
  amountText?: string;
  recipientText?: string;
}

export const BiometricPromptModal: React.FC<BiometricPromptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle,
  actionDescription,
  amountText,
  recipientText,
}) => {
  const { user } = useMboka();

  const [mode, setMode] = useState<'biometric' | 'pin'>('biometric');
  const [pin, setPin] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hardware, setHardware] = useState<HardwareBiometricStatus | null>(null);

  const activePin = user.walletPin || user.pin || '1234';
  const credentialId = user.biometricSettings?.credentialId;
  const isBiometricEnabled = user.biometricSettings?.enabled !== false;

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setErrorMessage(null);
      setPin('');
      setMode(isBiometricEnabled ? 'biometric' : 'pin');

      detectHardwareCapabilities().then((hw) => {
        setHardware(hw);
        // Automatically launch biometric prompt if biometric is enabled
        if (isBiometricEnabled) {
          triggerBiometricVerification();
        }
      });
    }
  }, [isOpen]);

  const triggerBiometricVerification = async () => {
    setStatus('scanning');
    setErrorMessage(null);

    try {
      const res = await verifyNativeBiometric(credentialId, actionTitle);

      if (res.success) {
        setStatus('success');
        if (navigator.vibrate) {
          navigator.vibrate([40, 60, 40]);
        }
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      } else {
        setStatus('error');
        setErrorMessage(res.error || 'Biometric authorization failed. Enter your Wallet PIN.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'Biometric hardware sensor error. Use PIN instead.');
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setErrorMessage('Please enter your 4-digit PIN.');
      return;
    }

    if (pin === activePin) {
      setStatus('success');
      setErrorMessage(null);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 600);
    } else {
      setStatus('error');
      setErrorMessage('Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  if (!isOpen) return null;

  const isFaceType = hardware?.biometricType === 'face';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm my-auto bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 tracking-wider uppercase block">
                Hardware Security Layer
              </span>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Biometric Authorization
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Details Card */}
        <div className="px-5 pt-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">{actionTitle}</span>
              {amountText && (
                <span className="text-xs font-mono font-black text-emerald-600">
                  {amountText}
                </span>
              )}
            </div>
            {recipientText && (
              <p className="text-[11px] text-slate-500 font-mono">
                To: <strong className="text-slate-800">{recipientText}</strong>
              </p>
            )}
            {actionDescription && (
              <p className="text-[11px] text-slate-500">{actionDescription}</p>
            )}
          </div>
        </div>

        {/* Auth Body */}
        <div className="p-5 flex flex-col items-center text-center space-y-4">
          {mode === 'biometric' ? (
            <>
              {/* Biometric Icon Scanner Animation */}
              <div className="relative my-3">
                {/* Glowing ripple circles */}
                {status === 'scanning' && (
                  <>
                    <div className="absolute inset-0 -m-3 rounded-full border-2 border-emerald-400/40 animate-ping pointer-events-none" />
                    <div className="absolute inset-0 -m-6 rounded-full border border-emerald-400/20 animate-pulse pointer-events-none" />
                  </>
                )}

                <button
                  type="button"
                  onClick={triggerBiometricVerification}
                  className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-300 relative cursor-pointer ${
                    status === 'success'
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-105'
                      : status === 'error'
                      ? 'bg-rose-50 text-rose-600 border-2 border-rose-300'
                      : status === 'scanning'
                      ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200'
                  }`}
                  title="Click to scan biometrics"
                >
                  {status === 'success' ? (
                    <CheckCircle2 className="w-12 h-12 animate-in zoom-in-50 duration-300" />
                  ) : status === 'scanning' ? (
                    isFaceType ? (
                      <ScanFace className="w-12 h-12 animate-pulse" />
                    ) : (
                      <Fingerprint className="w-12 h-12 animate-pulse" />
                    )
                  ) : (
                    isFaceType ? (
                      <ScanFace className="w-12 h-12" />
                    ) : (
                      <Fingerprint className="w-12 h-12" />
                    )
                  )}

                  {/* Scanning beam overlay */}
                  {status === 'scanning' && (
                    <div className="absolute inset-x-2 h-1 bg-emerald-400 rounded-full blur-[1px] animate-bounce" />
                  )}
                </button>
              </div>

              {/* Status Text */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 block font-heading">
                  {status === 'success'
                    ? 'Biometrics Verified!'
                    : status === 'scanning'
                    ? `Touch sensor or look at screen...`
                    : status === 'error'
                    ? 'Verification Failed'
                    : `Authenticate with ${hardware?.deviceLabel || 'Biometrics'}`}
                </span>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  {status === 'success'
                    ? 'Cryptographic passkey signature confirmed.'
                    : status === 'scanning'
                    ? 'Waiting for device platform authenticator...'
                    : status === 'error'
                    ? errorMessage
                    : 'Use your registered fingerprint or facial recognition to authorize this sensitive action.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-2 pt-2">
                {status !== 'scanning' && status !== 'success' && (
                  <button
                    type="button"
                    onClick={triggerBiometricVerification}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Scan Biometrics Again</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMode('pin');
                    setErrorMessage(null);
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  <span>Use 4-Digit Wallet PIN Instead</span>
                </button>
              </div>
            </>
          ) : (
            /* PIN Fallback Form */
            <form onSubmit={handlePinSubmit} className="w-full space-y-4 pt-1">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 font-heading">Enter Transaction PIN</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Fallback authorization for your sensitive action
                </p>
              </div>

              <div className="space-y-1">
                <input
                  type="password"
                  maxLength={4}
                  autoFocus
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-mono font-bold tracking-[0.5em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={pin.length !== 4}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Authorize with PIN
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('biometric');
                    setErrorMessage(null);
                  }}
                  className="w-full py-2 px-3 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  &larr; Switch back to Biometrics
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Security Badge */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <Smartphone className="w-3 h-3" />
          <span>FIDO2 / WebAuthn Hardware Protected</span>
        </div>
      </div>
    </div>
  );
};
