import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  Share2,
  ArrowRight,
  TrendingUp,
  UserPlus,
  ShieldCheck,
  Award,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';

export const AffiliateView: React.FC = () => {
  const {
    user,
    affiliateBalance,
    invitedUsers,
    addInvitedUser,
    transferEarningsToWallet,
    formatKsh,
  } = useMboka();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friendName, setFriendName] = useState('');
  const [friendPhone, setFriendPhone] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferMsg, setTransferMsg] = useState<string | null>(null);

  const referralUrl = `https://mboka.app/join?ref=${user.referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleTransferToWallet = async () => {
    if (affiliateBalance <= 0) return;
    setIsTransferring(true);
    const res = await transferEarningsToWallet('affiliate');
    setIsTransferring(false);
    setTransferMsg(res.message);
    setTimeout(() => setTransferMsg(null), 3000);
  };

  const handleSimulateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendName.trim()) return;
    addInvitedUser(friendName, friendPhone || '+254 7XX XXX XXX');
    setFriendName('');
    setFriendPhone('');
    setShowInviteModal(false);
  };

  const totalCommissionsPaid = invitedUsers.reduce((sum, u) => sum + u.earnedCommission, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-black/20 text-amber-200 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-xs">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Mboka Hustler Affiliate Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
              Refer Friends & Earn Every Single Day
            </h1>
            <p className="text-amber-100 text-xs sm:text-sm max-w-xl leading-relaxed">
              Earn <strong className="text-white">KSh 150</strong> instantly when each invited user registers, plus an ongoing <strong className="text-white">5% commission</strong> on all their digital utility and POS purchases.
            </p>
          </div>

          {/* Claimable Balance Box */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-center md:text-right shrink-0">
            <span className="text-xs text-amber-200 font-semibold block">Available Affiliate Balance</span>
            <div className="text-3xl font-black font-mono mt-1 text-white">
              {formatKsh(affiliateBalance)}
            </div>
            <button
              onClick={handleTransferToWallet}
              disabled={isTransferring || affiliateBalance <= 0}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white text-amber-900 font-bold text-xs hover:bg-amber-50 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-700" />
              <span>{isTransferring ? 'Transferring...' : 'Transfer to Wallet'}</span>
            </button>
          </div>
        </div>

        {transferMsg && (
          <div className="mt-4 p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-xs text-white font-medium">
            {transferMsg}
          </div>
        )}
      </div>

      {/* Referral Link & Code Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 font-heading">Your Unique Referral Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Referral Code */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Your Referral Code</span>
              <strong className="text-xl font-mono font-extrabold text-slate-900 tracking-wider">
                {user.referralCode}
              </strong>
            </div>
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Referral Link */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-xs text-slate-500 font-medium block">Your Invite Link</span>
              <p className="text-xs font-mono font-semibold text-slate-700 truncate">{referralUrl}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <button
                onClick={() =>
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(
                      `Join Mboka App to buy KPLC tokens, airtime with cashback, and earn money! Use my code ${user.referralCode}: ${referralUrl}`
                    )}`,
                    '_blank'
                  )
                }
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                title="Share on WhatsApp"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Invited</span>
          <div className="text-2xl font-black text-slate-900 font-heading mt-1">
            {invitedUsers.length}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">Registered accounts</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Active Transactors</span>
          <div className="text-2xl font-black text-slate-900 font-heading mt-1">
            {invitedUsers.filter((u) => u.status === 'qualified' || u.status === 'active').length}
          </div>
          <span className="text-[11px] text-amber-700 font-semibold mt-0.5 block">Generating 5% rev</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Affiliate Payouts</span>
          <div className="text-2xl font-black text-slate-900 font-heading mt-1 font-mono">
            {formatKsh(totalCommissionsPaid + affiliateBalance)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Cumulative earned</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Reward Per Invite</span>
          <div className="text-2xl font-black text-emerald-700 font-heading mt-1">
            KSh 150
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Paid instantly</span>
        </div>
      </div>

      {/* How it works 3-step workflow */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 font-heading">Affiliate Commission Structure</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center font-mono">
              1
            </span>
            <h3 className="font-bold text-sm text-slate-900">Share Your Link</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Send your referral link or code via WhatsApp, SMS, or social media to colleagues, family, and local traders.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center font-mono">
              2
            </span>
            <h3 className="font-bold text-sm text-slate-900">Friend Registers & Transacts</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              They open an account and make their first airtime top-up, KPLC stima token purchase, or M-Pesa deposit.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center font-mono">
              3
            </span>
            <h3 className="font-bold text-sm text-slate-900">Automatic Payouts</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You receive KSh 150 credited directly to your affiliate balance, plus 5% of our fee on every utility purchase they make!
            </p>
          </div>
        </div>
      </div>

      {/* Invited Friends List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading">Invited Members & Commissions</h2>
            <p className="text-xs text-slate-500">Real-time status of your referral squad</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Simulate New Referral</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {invitedUsers.map((inv) => (
            <div key={inv.id} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                  {inv.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{inv.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{inv.phone}</span>
                    <span>•</span>
                    <span>Joined {inv.registeredDate}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-emerald-700 font-mono block">
                  +{formatKsh(inv.earnedCommission)}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                    inv.status === 'qualified'
                      ? 'bg-emerald-100 text-emerald-800'
                      : inv.status === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {inv.status === 'qualified' ? 'Qualified Payout' : inv.status === 'active' ? 'Active Trader' : 'Signed Up'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simulate Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-heading">Invite a New User (Simulation)</h3>
            <p className="text-xs text-slate-500">
              Test the affiliate engine by simulating a friend who registered with your code {user.referralCode}.
            </p>
            <form onSubmit={handleSimulateInvite} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Friend Name</label>
                <input
                  type="text"
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  placeholder="e.g. Cynthia Moraa"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Phone Number</label>
                <input
                  type="text"
                  value={friendPhone}
                  onChange={(e) => setFriendPhone(e.target.value)}
                  placeholder="+254 7XX XXX XXX"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Add Referral (+KSh 150)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
