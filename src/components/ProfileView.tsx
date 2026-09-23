import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Phone,
  Mail,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  Lock,
  Calendar,
  UserPlus,
  Gift,
  Wallet,
  Copy,
  Check,
  Share2,
  LogOut,
  Fingerprint,
  ScanFace,
  Smartphone,
  RefreshCw,
  AlertCircle,
  Sparkles,
  CheckCheck,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';
import { AuthModal } from './AuthModal';
import { detectHardwareCapabilities, HardwareBiometricStatus } from '../services/biometricAuth';

export const ProfileView: React.FC = () => {
  const {
    user,
    updateUserProfile,
    resetAllData,
    updateUserPin,
    walletBalance,
    formatKsh,
    isLoggedIn,
    logoutUser,
    triggerBiometricAuth,
    updateBiometricSettings,
    registerBiometricPasskey,
  } = useMboka();

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email);
  const [pin, setPin] = useState(user.walletPin || user.pin || '1234');
  const [savedMsg, setSavedMsg] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [copiedWalletId, setCopiedWalletId] = useState(false);

  // Biometric Hardware State
  const [hardware, setHardware] = useState<HardwareBiometricStatus | null>(null);
  const [isEnrollingBio, setIsEnrollingBio] = useState(false);
  const [bioActionMsg, setBioActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    detectHardwareCapabilities().then((hw) => {
      setHardware(hw);
    });
  }, []);

  const bioSettings = user.biometricSettings || {
    enabled: true,
    credentialId: 'mbk_bio_platform_credential',
    deviceName: 'Native Platform Authenticator',
    biometricType: 'fingerprint',
    registeredAt: 'Jan 2026',
    requireForWithdrawals: true,
    requireForP2P: true,
    requireForProfileEdit: true,
  };

  const walletId = user.walletId || user.referralCode || 'MBK-904281';

  const handleCopyWalletId = () => {
    navigator.clipboard.writeText(walletId);
    setCopiedWalletId(true);
    setTimeout(() => setCopiedWalletId(false), 2000);
  };

  const executeSaveProfile = () => {
    updateUserProfile({
      name,
      phone,
      email,
      walletPin: pin,
      pin: pin,
    });
    updateUserPin(pin);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      alert('PIN must be exactly 4 numeric digits.');
      return;
    }

    const bioRequired = bioSettings.enabled && bioSettings.requireForProfileEdit;

    if (bioRequired) {
      triggerBiometricAuth({
        actionTitle: 'Authorize Profile & PIN Update',
        actionDescription: 'Biometric authorization required to modify account profile or PIN.',
        recipientText: `Account @${user.username}`,
        onSuccess: () => {
          executeSaveProfile();
        },
      });
      return;
    }

    executeSaveProfile();
  };

  const handleEnrollBiometric = async () => {
    setIsEnrollingBio(true);
    setBioActionMsg(null);
    try {
      const res = await registerBiometricPasskey();
      if (res.success) {
        setBioActionMsg({ type: 'success', text: res.message });
      } else {
        setBioActionMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setBioActionMsg({ type: 'error', text: err?.message || 'Biometric enrollment failed.' });
    } finally {
      setIsEnrollingBio(false);
      setTimeout(() => setBioActionMsg(null), 4000);
    }
  };

  const handleTestBiometric = () => {
    triggerBiometricAuth({
      actionTitle: 'Test Biometric Hardware Sensor',
      actionDescription: 'Verifying native device fingerprint / Face ID biometric passkey.',
      recipientText: hardware?.deviceLabel || 'Platform Authenticator',
      onSuccess: () => {
        setBioActionMsg({
          type: 'success',
          text: 'Biometric test successful! Your hardware sensor is fully verified and active.',
        });
        setTimeout(() => setBioActionMsg(null), 4000);
      },
    });
  };

  const handleReset = () => {
    if (window.confirm('Reset all Mboka wallet balances and simulated transactions to fresh defaults?')) {
      resetAllData();
      alert('Data reset to default setup.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Prominent Unique Wallet ID Card */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white shadow-xl border border-slate-700/70 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Unique Account Wallet ID</span>
            </div>

            <div>
              <span className="text-xs text-slate-300 font-medium uppercase tracking-wider block">
                Your Assigned ID for P2P &amp; Referrals
              </span>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-white select-all">
                  {walletId}
                </span>

                <button
                  type="button"
                  onClick={handleCopyWalletId}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                    copiedWalletId
                      ? 'bg-emerald-400 text-slate-950 shadow-emerald-400/30'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                  title="Copy Wallet ID to clipboard"
                >
                  {copiedWalletId ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-emerald-300" />
                      <span>Copy Wallet ID</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300/90 leading-relaxed max-w-xl">
              Other Mboka users transfer money instantly to your account using this unique ID. It also functions as your referral code (earning <strong className="text-white font-mono">KSh 20.00</strong> per activated friend) and directs your automated M-Pesa B2C payouts.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl shrink-0 text-center md:text-right space-y-1">
            <span className="text-[11px] text-slate-300 font-semibold block uppercase tracking-wider">
              Account Status
            </span>
            <div className="flex items-center justify-center md:justify-end gap-1.5">
              <ShieldCheck className={`w-4 h-4 ${user.isActivated ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="text-sm font-bold text-white font-heading">
                {user.isActivated ? 'Activated' : 'Activation Pending'}
              </span>
            </div>
            <span className="text-[11px] text-emerald-300 block">
              {user.isActivated ? 'P2P & Auto-B2C Enabled' : 'Requires KSh 50 Activation'}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-3xl object-cover ring-4 ring-emerald-500/20 shadow-md"
              />
              {user.isKycVerified && (
                <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 font-heading">{user.name}</h1>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block self-center sm:self-auto">
                  KYC Verified
                </span>
              </div>
              <p className="text-xs text-slate-500">
                @{user.username} • Balance: <strong className="text-emerald-700 font-mono">{formatKsh(walletBalance)}</strong>
              </p>
              
              {/* Quick Wallet ID badge in header */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                  <Wallet className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-500 font-medium">Wallet ID:</span>
                  <span className="font-mono font-bold text-slate-900">{walletId}</span>
                  <button
                    type="button"
                    onClick={handleCopyWalletId}
                    className="p-0.5 text-slate-400 hover:text-emerald-700 transition-colors cursor-pointer"
                    title="Copy Wallet ID"
                  >
                    {copiedWalletId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 font-mono text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {user.joinedDate || 'Recently'}
                </span>
              </div>
            </div>
          </div>

          {/* If user has an account, show Logout instead of Create Account */}
          {isLoggedIn ? (
            <button
              onClick={logoutUser}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold transition-colors cursor-pointer shadow-xs"
              title="Sign out of this account"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Logout</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          )}
        </div>

        {/* Edit Details Form */}
        <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">M-Pesa Linked Mobile</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Unique Wallet ID (Permanent)</span>
                <span className="text-[10px] text-slate-400 font-medium">Auto-generated</span>
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  value={walletId}
                  readOnly
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 cursor-not-allowed select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyWalletId}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-700 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
                  title="Copy Wallet ID"
                >
                  {copiedWalletId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700">Withdrawal Security PIN (4-Digits)</label>
                <span className="text-[10px] text-emerald-700 font-bold">User-Settable</span>
              </div>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Used to authorize M-Pesa B2C disbursements and P2P wallet transfers.
              </p>
            </div>
          </div>

          {savedMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Profile information &amp; 4-digit Security PIN saved successfully!</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Save Profile &amp; PIN
            </button>
          </div>
        </form>
      </div>

      {/* Native Biometric Hardware Authentication Center */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base font-heading">
                  Native Biometric Security Layer
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold">
                  Hardware FIDO2
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Uses your device native fingerprint sensor, Touch ID, Face ID, or Windows Hello.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestBiometric}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Test hardware fingerprint or facial recognition"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Test Sensor</span>
            </button>

            <button
              type="button"
              onClick={handleEnrollBiometric}
              disabled={isEnrollingBio}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isEnrollingBio ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>{isEnrollingBio ? 'Enrolling Hardware...' : 'Register Passkey'}</span>
            </button>
          </div>
        </div>

        {/* Hardware Status Information Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
              Detected Hardware
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>{hardware?.deviceLabel || 'Platform Biometrics'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
              Credential Passkey
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{bioSettings.credentialId ? `${bioSettings.credentialId.slice(0, 16)}...` : 'Enrolled'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">
              Hardware Protection Status
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{bioSettings.enabled ? 'Active & Guarding' : 'Disabled by User'}</span>
            </div>
          </div>
        </div>

        {bioActionMsg && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2 border animate-in fade-in ${
              bioActionMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {bioActionMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{bioActionMsg.text}</span>
          </div>
        )}

        {/* Granular Protection Toggles */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
            <div>
              <span className="text-xs font-bold text-emerald-950 block">
                Master Biometric Protection
              </span>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Require device native biometric verification before authorizing any critical action.
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateBiometricSettings({ enabled: !bioSettings.enabled })}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                bioSettings.enabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  bioSettings.enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Withdrawal toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Protect Withdrawals
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Requires fingerprint / Face ID for M-Pesa B2C cashouts.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateBiometricSettings({
                    requireForWithdrawals: !bioSettings.requireForWithdrawals,
                  })
                }
                className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors self-start ${
                  bioSettings.requireForWithdrawals && bioSettings.enabled
                    ? 'bg-emerald-600'
                    : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    bioSettings.requireForWithdrawals && bioSettings.enabled
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* P2P toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Protect P2P Transfers
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Requires biometric scan when sending funds to other wallet IDs.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateBiometricSettings({
                    requireForP2P: !bioSettings.requireForP2P,
                  })
                }
                className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors self-start ${
                  bioSettings.requireForP2P && bioSettings.enabled
                    ? 'bg-emerald-600'
                    : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    bioSettings.requireForP2P && bioSettings.enabled
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Profile edit toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Protect Profile &amp; PIN
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Biometric check before saving new phone, email, or PIN.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateBiometricSettings({
                    requireForProfileEdit: !bioSettings.requireForProfileEdit,
                  })
                }
                className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors self-start ${
                  bioSettings.requireForProfileEdit && bioSettings.enabled
                    ? 'bg-emerald-600'
                    : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    bioSettings.requireForProfileEdit && bioSettings.enabled
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Safety & Demo Reset Option */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base font-heading">Security &amp; Data Options</h3>
        <p className="text-xs text-slate-500">
          User accounts are assigned a unique Wallet ID upon sign up, and custom withdrawal PINs are persisted locally.
        </p>

        {isLoggedIn && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-xs text-slate-800 block">Session Management</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Currently signed in as <strong className="text-slate-800 font-mono">@{user.username}</strong> ({user.phone}).
              </p>
            </div>
            <button
              onClick={logoutUser}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold text-xs text-rose-900 block">Reset Sandbox Data</span>
            <p className="text-[11px] text-rose-700 mt-0.5">
              Restore default balances (KSh 5,250), clear custom transactions, and refresh initial mock state.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

