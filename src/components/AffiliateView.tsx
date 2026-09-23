import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  Share2,
  ArrowRight,
  UserPlus,
  ShieldCheck,
  Award,
  Wallet,
  Zap,
  CheckCircle2,
  DollarSign,
  Lock,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';

export const AffiliateView: React.FC = () => {
  const {
    user,
    walletBalance,
    invitedUsers,
    formatKsh,
    setActiveTab,
  } = useMboka();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Wallet ID is the referral code applied on the link
  const myReferralCode = user.walletId || user.referralCode;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mboka.app';
  const referralUrl = `${baseUrl}/?ref=${myReferralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(myReferralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const totalCommissionsPaid = invitedUsers.reduce((sum, u) => sum + (u.earnedCommission || 20), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-black/20 text-amber-200 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-xs">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Mboka Hustler Affiliate Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
              Refer Friends & Earn KSh 20.00 Per Activation
            </h1>
            <p className="text-amber-100 text-xs sm:text-sm max-w-xl leading-relaxed">
              Share your personal <strong className="text-white">Wallet ID</strong> link. When your referral activates their account with <strong className="text-white">KSh 50.00</strong>, your <strong className="text-white font-mono">KSh 20.00 commission</strong> lands directly in your wallet automatically!
            </p>
          </div>

          {/* Quick Stats Box */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-center md:text-right shrink-0">
            <span className="text-xs text-amber-200 font-semibold block">Commission Per Active Referral</span>
            <div className="text-3xl font-black font-mono mt-1 text-white">
              KSh 20.00
            </div>
            <span className="text-[11px] text-amber-200/90 block mt-1">
              Lands automatically in your wallet
            </span>
            <button
              onClick={() => setActiveTab('wallet')}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white text-amber-900 font-bold text-xs hover:bg-amber-50 transition-colors shadow-sm cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-700" />
              <span>View Main Wallet ({formatKsh(walletBalance)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Referral Link & Wallet ID Code Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 font-heading">Your Referral Wallet ID &amp; Link</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Your unique Wallet ID is your referral code applied on the signup link.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Referral Wallet ID */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">
                Your Referral Code (Wallet ID)
              </span>
              <strong className="text-xl font-mono font-extrabold text-slate-900 tracking-wider">
                {myReferralCode}
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
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">
                Your Signup Link
              </span>
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
                      `Join Mboka App to send money, automate M-Pesa payouts, and earn daily! Register using my Wallet ID ${myReferralCode}: ${referralUrl}`
                    )}`,
                    '_blank'
                  )
                }
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
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
          <span className="text-xs text-slate-500 font-medium">Successful Referrals</span>
          <div className="text-2xl font-black text-slate-900 font-heading mt-1">
            {invitedUsers.length}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">Activated accounts</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Activation Fee Required</span>
          <div className="text-2xl font-black text-slate-900 font-heading mt-1">
            KSh 50
          </div>
          <span className="text-[11px] text-amber-700 font-semibold mt-0.5 block">Paid by new member</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Earned (to Wallet)</span>
          <div className="text-2xl font-black text-slate-900 font-heading mt-1 font-mono">
            {formatKsh(totalCommissionsPaid)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">All landed automatically</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Commission Rate</span>
          <div className="text-2xl font-black text-emerald-700 font-heading mt-1 font-mono">
            KSh 20.00
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Per activated friend</span>
        </div>
      </div>

      {/* Commission Rules & Activation Requirements */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 font-heading">Affiliate Program Guidelines</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center font-mono">
              1
            </span>
            <h3 className="font-bold text-sm text-slate-900">Invite via Wallet ID Link</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Share your link containing your Wallet ID as the referral code on WhatsApp, SMS, or Twitter/X.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center font-mono">
              2
            </span>
            <h3 className="font-bold text-sm text-slate-900">Member Activates (KSh 50)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              For a referral to be qualified and access the platform, they must complete the one-time <strong>KSh 50</strong> activation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center font-mono">
              3
            </span>
            <h3 className="font-bold text-sm text-slate-900">KSh 20 Lands Automatically</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              The moment they activate, <strong>KSh 20.00</strong> lands directly into your primary wallet with immediate auto-B2C payout eligibility!
            </p>
          </div>
        </div>
      </div>

      {/* Invited Members List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading">Referral Squad &amp; Commission Log</h2>
            <p className="text-xs text-slate-500">Real-time record of members who joined with your Wallet ID</p>
          </div>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
            title="Copy referral link to invite friends"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Referral Link'}</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {invitedUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No referral activations yet. Share your Wallet ID link ({myReferralCode}) to earn KSh 20.00 per activated friend.
            </div>
          ) : (
            invitedUsers.map((inv) => (
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
                    +KSh 20.00
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 bg-emerald-100 text-emerald-800">
                    Landed in Wallet
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
