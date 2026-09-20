import React, { useState } from 'react';
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
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';
import { AuthModal } from './AuthModal';

export const ProfileView: React.FC = () => {
  const { user, updateUserProfile, resetAllData, updateUserPin, walletBalance, formatKsh } = useMboka();

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email);
  const [pin, setPin] = useState(user.walletPin || user.pin || '1234');
  const [savedMsg, setSavedMsg] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      alert('PIN must be exactly 4 numeric digits.');
      return;
    }

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

  const handleReset = () => {
    if (window.confirm('Reset all Mboka wallet balances and simulated transactions to fresh defaults?')) {
      resetAllData();
      alert('Data reset to default setup.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
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
              <p className="text-xs text-slate-500">@{user.username} • Balance: <strong className="text-emerald-700 font-mono">{formatKsh(walletBalance)}</strong></p>
              <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {user.joinedDate || 'Recently'}
                </span>
                <span>•</span>
                <span className="font-mono text-emerald-700 font-bold">Referral: {user.referralCode}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAuthModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Create New Account</span>
          </button>
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

      {/* Account Safety & Demo Reset Option */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base font-heading">Security &amp; Data Options</h3>
        <p className="text-xs text-slate-500">
          User accounts start with a real positive balance (&gt; 0) upon sign up, and custom withdrawal PINs are persisted locally.
        </p>

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
