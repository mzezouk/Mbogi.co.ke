import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Lock,
  Phone,
  User,
  Mail,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Tag,
  AlertCircle,
  LogIn,
  KeyRound,
  Sparkles,
  Fingerprint,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';
import { verifyNativeBiometric } from '../services/biometricAuth';

interface AuthModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const { registerUser, setActiveTab, setUser, user: currentUser, updateUserPin, loginUser } = useMboka();

  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [step, setStep] = useState<1 | 2>(1);

  // Signup fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Login fields
  const [loginPhoneOrWallet, setLoginPhoneOrWallet] = useState('');
  const [loginPin, setLoginPin] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [createdWalletId, setCreatedWalletId] = useState<string>('');

  // Auto-detect referral code from URL query (?ref=MBK-...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get('ref');
      if (refParam) {
        setReferralCode(refParam.toUpperCase());
      }
    } catch {
      // safe fallback
    }
  }, []);

  const handleBiometricLogin = async () => {
    setError(null);
    try {
      const res = await verifyNativeBiometric(
        currentUser.biometricSettings?.credentialId,
        'Sign in to Mboka Wallet'
      );
      if (res.success) {
        setSuccess(true);
        loginUser(currentUser.walletId, currentUser.walletPin || currentUser.pin || '1234');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
          setActiveTab('wallet');
        }, 1000);
      } else {
        setError(res.error || 'Biometric authentication cancelled.');
      }
    } catch (err: any) {
      setError(err?.message || 'Biometric hardware authentication failed.');
    }
  };

  const handleNextStep = () => {
    setError(null);
    if (!name.trim()) {
      setError('Please enter your full legal name');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      setError('Please enter a valid Kenyan phone number (e.g. 0712 345 678 or 254...)');
      return;
    }
    setStep(2);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{4}$/.test(pin)) {
      setError('Transaction PIN must be exactly 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PIN confirmation does not match');
      return;
    }

    try {
      const newUser = registerUser({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        pin: pin.trim(),
        referralCode: referralCode.trim() ? referralCode.trim().toUpperCase() : undefined,
      });

      setCreatedWalletId(newUser.walletId);
      setSuccess(true);

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        setActiveTab('wallet');
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginPhoneOrWallet.trim()) {
      setError('Please enter your phone number or unique Wallet ID');
      return;
    }
    if (!/^\d{4}$/.test(loginPin)) {
      setError('Security PIN must be 4 digits');
      return;
    }

    const res = loginUser(loginPhoneOrWallet, loginPin);
    if (!res.success) {
      setError(res.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      if (onSuccess) onSuccess();
      onClose();
      setActiveTab('wallet');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md my-auto bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-5 text-white shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure Platform Authentication</span>
          </div>

          <h2 className="text-xl font-black font-heading tracking-tight">
            {mode === 'signup' ? 'Create Mboka Account' : 'Sign In to Mboka'}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            {mode === 'signup'
              ? 'Get your permanent Wallet ID for zero-fee transfers and M-Pesa automated payouts.'
              : 'Enter your credentials or 4-digit security PIN to access your wallet.'}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-white/10 backdrop-blur-md rounded-xl mt-3 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                mode === 'signup'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                mode === 'login'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {success ? (
            <div className="py-6 text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900 font-heading">
                {mode === 'signup' ? 'Account Created Successfully!' : 'Welcome Back!'}
              </h3>
              {createdWalletId && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl max-w-xs mx-auto text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Your Assigned Wallet ID
                  </span>
                  <div className="text-xl font-black font-mono text-emerald-700 tracking-wider">
                    {createdWalletId}
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Opening your unified ledger dashboard...
              </p>
            </div>
          ) : mode === 'signup' ? (
            <div className="space-y-4">
              {/* Step indicator */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-1 border-b border-slate-100">
                <span className={step === 1 ? 'text-emerald-700 font-extrabold' : ''}>
                  1. Profile &amp; Mobile
                </span>
                <span>→</span>
                <span className={step === 2 ? 'text-emerald-700 font-extrabold' : ''}>
                  2. PIN &amp; Wallet ID
                </span>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {step === 1 ? (
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Full Legal Name</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Kelvin Otieno"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>M-Pesa Mobile Number</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07XX XXX XXX or +254 7XX..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                    <span className="text-[10px] text-slate-400 block">
                      Used for instant M-Pesa Express deposits &amp; automated B2C cashouts.
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Email Address (Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>Continue to Security &amp; PIN</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Set 4-Digit PIN
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-full text-center tracking-widest text-sm font-mono py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Confirm PIN
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-full text-center tracking-widest text-sm font-mono py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Referral Wallet ID (Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="e.g. MBK-904281"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white uppercase"
                    />
                    <span className="text-[10px] text-slate-400 block">
                      Enter your friend's Wallet ID to link referral benefits (KSh 20 bonus).
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      A unique permanent Wallet ID (<strong className="font-mono">MBK-XXXXXX</strong>) will be generated for your account.
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="py-2.5 px-3.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>

                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>Complete &amp; Generate ID</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Phone or Wallet ID</label>
                <input
                  type="text"
                  required
                  value={loginPhoneOrWallet}
                  onChange={(e) => setLoginPhoneOrWallet(e.target.value)}
                  placeholder="07XX XXX XXX or MBK-904281"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">4-Digit Security PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full tracking-widest text-center text-sm font-mono py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
                Tip: Default demo PIN is <strong className="font-mono text-slate-800">1234</strong> or the custom PIN saved in your Profile.
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Fingerprint className="w-4 h-4 text-emerald-200" />
                  <span>Sign In with Device Biometrics</span>
                </button>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <LogIn className="w-4 h-4 text-emerald-400" />
                  <span>Sign In with PIN</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
