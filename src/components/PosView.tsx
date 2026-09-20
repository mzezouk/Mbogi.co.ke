import React, { useState } from 'react';
import {
  Store,
  Phone,
  Zap,
  Tv,
  Receipt,
  ArrowRight,
  CheckCircle2,
  Share2,
  Printer,
  Copy,
  Check,
  Coins,
  History,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';
import { PosReceipt } from '../types';

export const PosView: React.FC = () => {
  const {
    user,
    walletBalance,
    processPosSale,
    formatKsh,
    setSelectedReceipt,
  } = useMboka();

  const [activeService, setActiveService] = useState<'airtime' | 'kplc' | 'tv'>('airtime');

  // Airtime form state
  const [network, setNetwork] = useState<'Safaricom' | 'Airtel' | 'Telkom'>('Safaricom');
  const [airtimePhone, setAirtimePhone] = useState<string>(user.phone);
  const [airtimeAmount, setAirtimeAmount] = useState<string>('200');

  // KPLC form state
  const [meterNumber, setMeterNumber] = useState<string>('3719048102');
  const [kplcAmount, setKplcAmount] = useState<string>('1000');

  // TV form state
  const [tvProvider, setTvProvider] = useState<'DStv' | 'GOtv' | 'StarTimes'>('GOtv');
  const [tvSmartCard, setTvSmartCard] = useState<string>('8291048291');
  const [tvBouquet, setTvBouquet] = useState<string>('GOtv Plus');
  const [tvAmount, setTvAmount] = useState<string>('1150');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick amounts
  const airtimePresets = [50, 100, 200, 500, 1000];
  const kplcPresets = [300, 500, 1000, 2000, 3500];

  const handleAirtimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(airtimeAmount);
    if (!amt || amt < 10) {
      setStatusMsg({ type: 'error', text: 'Minimum airtime amount is KSh 10' });
      return;
    }
    if (amt > walletBalance) {
      setStatusMsg({ type: 'error', text: 'Insufficient wallet balance to purchase airtime' });
      return;
    }

    setIsProcessing(true);
    setStatusMsg(null);

    setTimeout(async () => {
      const res = await processPosSale({
        serviceType: 'airtime',
        serviceName: `${network} Airtime Topup`,
        accountOrPhone: airtimePhone,
        amount: amt,
        fee: 0,
        provider: network,
        operator: user.name,
      });

      setIsProcessing(false);
      if (res.success) {
        setStatusMsg({ type: 'success', text: `Airtime loaded! Ref: ${res.receipt.receiptNumber}` });
      } else {
        setStatusMsg({ type: 'error', text: res.message });
      }
    }, 1200);
  };

  const handleKplcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(kplcAmount);
    if (!meterNumber.trim() || meterNumber.length < 8) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid 11-digit KPLC Meter number' });
      return;
    }
    if (!amt || amt < 50) {
      setStatusMsg({ type: 'error', text: 'Minimum KPLC token amount is KSh 50' });
      return;
    }
    if (amt > walletBalance) {
      setStatusMsg({ type: 'error', text: 'Insufficient wallet balance for electricity purchase' });
      return;
    }

    setIsProcessing(true);
    setStatusMsg(null);

    setTimeout(async () => {
      const res = await processPosSale({
        serviceType: 'kplc',
        serviceName: `KPLC Prepaid Tokens (Meter ${meterNumber})`,
        accountOrPhone: meterNumber,
        amount: amt,
        fee: 0,
        provider: 'Kenya Power (KPLC)',
        operator: user.name,
      });

      setIsProcessing(false);
      if (res.success) {
        setStatusMsg({
          type: 'success',
          text: `Token generated: ${res.receipt.token} (${res.receipt.units} kWh)!`,
        });
      } else {
        setStatusMsg({ type: 'error', text: res.message });
      }
    }, 1400);
  };

  const handleTvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(tvAmount);
    if (!tvSmartCard.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter Smartcard / IUC number' });
      return;
    }
    if (amt > walletBalance) {
      setStatusMsg({ type: 'error', text: 'Insufficient wallet balance for TV renewal' });
      return;
    }

    setIsProcessing(true);
    setStatusMsg(null);

    setTimeout(async () => {
      const res = await processPosSale({
        serviceType: 'tv',
        serviceName: `${tvProvider} - ${tvBouquet}`,
        accountOrPhone: tvSmartCard,
        amount: amt,
        fee: 0,
        provider: tvProvider,
        operator: user.name,
      });

      setIsProcessing(false);
      if (res.success) {
        setStatusMsg({ type: 'success', text: `${tvBouquet} renewed successfully! Ref: ${res.receipt.receiptNumber}` });
      } else {
        setStatusMsg({ type: 'error', text: res.message });
      }
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* POS Terminal Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-400/30">
              <Store className="w-3.5 h-3.5" />
              <span>Mboka Merchant Point of Sale (POS)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
              Digital Utilities & Instant Tokens
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Sell airtime, generate 20-digit KPLC stima tokens, and renew Pay-TV packages with instant commissions credited right back to your float.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl text-center md:text-right shrink-0">
            <span className="text-xs text-slate-400 font-semibold block">Active Trading Float</span>
            <div className="text-3xl font-black font-mono mt-1 text-emerald-400">
              {formatKsh(walletBalance)}
            </div>
            <span className="text-[11px] text-slate-300 mt-0.5 block">Zero settlement delays</span>
          </div>
        </div>
      </div>

      {/* Service Tab Switcher */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => {
            setActiveService('airtime');
            setStatusMsg(null);
          }}
          className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
            activeService === 'airtime'
              ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/30 shadow-xs'
              : 'border-slate-200 hover:bg-slate-50 text-slate-700 bg-white'
          }`}
        >
          <Phone className={`w-6 h-6 ${activeService === 'airtime' ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span className="font-bold text-xs sm:text-sm">Mobile Airtime</span>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.2 rounded-full">
            2.0% Cashback
          </span>
        </button>

        <button
          onClick={() => {
            setActiveService('kplc');
            setStatusMsg(null);
          }}
          className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
            activeService === 'kplc'
              ? 'border-amber-600 bg-amber-50/80 text-amber-950 ring-2 ring-amber-500/30 shadow-xs'
              : 'border-slate-200 hover:bg-slate-50 text-slate-700 bg-white'
          }`}
        >
          <Zap className={`w-6 h-6 ${activeService === 'kplc' ? 'text-amber-600' : 'text-slate-400'}`} />
          <span className="font-bold text-xs sm:text-sm">KPLC Prepaid Tokens</span>
          <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.2 rounded-full">
            Instant 20-Digit
          </span>
        </button>

        <button
          onClick={() => {
            setActiveService('tv');
            setStatusMsg(null);
          }}
          className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
            activeService === 'tv'
              ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-2 ring-blue-500/30 shadow-xs'
              : 'border-slate-200 hover:bg-slate-50 text-slate-700 bg-white'
          }`}
        >
          <Tv className={`w-6 h-6 ${activeService === 'tv' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span className="font-bold text-xs sm:text-sm">Pay-TV Packages</span>
          <span className="text-[10px] text-blue-800 font-bold bg-blue-100 px-2 py-0.2 rounded-full">
            DStv / GOtv
          </span>
        </button>
      </div>

      {/* Active Service Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs max-w-2xl mx-auto">
        {/* Airtime Form */}
        {activeService === 'airtime' && (
          <form onSubmit={handleAirtimeSubmit} className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-heading">Buy / Sell Mobile Airtime</h2>
              <p className="text-xs text-slate-500">Supports Safaricom, Airtel Kenya & Telkom</p>
            </div>

            {/* Network Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Mobile Network</label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['Safaricom', 'Airtel', 'Telkom'] as const).map((net) => (
                  <button
                    key={net}
                    type="button"
                    onClick={() => setNetwork(net)}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      network === net
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {net}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Recipient Phone Number</label>
              <input
                type="text"
                value={airtimePhone}
                onChange={(e) => setAirtimePhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                required
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700">Airtime Amount (KSh)</label>
                <span className="text-xs text-emerald-700 font-semibold">
                  You earn: {formatKsh(Number(airtimeAmount || 0) * 0.02)} cashback
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                  KSh
                </span>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  value={airtimeAmount}
                  onChange={(e) => setAirtimeAmount(e.target.value)}
                  className="w-full pl-14 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  required
                />
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-2 pt-1">
                {airtimePresets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAirtimeAmount(p.toString())}
                    className={`text-xs px-3 py-1 rounded-lg border font-medium transition-colors ${
                      airtimeAmount === p.toString()
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                        : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    KSh {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Alert */}
            {statusMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {statusMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting Network Gateway...</span>
                </>
              ) : (
                <>
                  <span>Load Airtime ({formatKsh(Number(airtimeAmount || 0))})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* KPLC Tokens Form */}
        {activeService === 'kplc' && (
          <form onSubmit={handleKplcSubmit} className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-heading">Generate KPLC Prepaid Stima Tokens</h2>
              <p className="text-xs text-slate-500">Instant 20-digit token generation directly linked to Kenya Power</p>
            </div>

            {/* Meter Number */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700">Prepaid Meter Number</label>
                <span className="text-[11px] text-amber-700 font-semibold">11-Digit Standard</span>
              </div>
              <input
                type="text"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="3719048102"
                maxLength={11}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                required
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700">Token Amount (KSh)</label>
                <span className="text-xs text-amber-800 font-semibold">
                  Est. Units: ~{(Number(kplcAmount || 0) / 24.5).toFixed(1)} kWh
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                  KSh
                </span>
                <input
                  type="number"
                  min="50"
                  max="50000"
                  value={kplcAmount}
                  onChange={(e) => setKplcAmount(e.target.value)}
                  className="w-full pl-14 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  required
                />
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-2 pt-1">
                {kplcPresets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setKplcAmount(p.toString())}
                    className={`text-xs px-3 py-1 rounded-lg border font-medium transition-colors ${
                      kplcAmount === p.toString()
                        ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    KSh {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Alert */}
            {statusMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {statusMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating 20-Digit Token...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Generate Token ({formatKsh(Number(kplcAmount || 0))})</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Pay-TV Form */}
        {activeService === 'tv' && (
          <form onSubmit={handleTvSubmit} className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-heading">Renew TV Subscription</h2>
              <p className="text-xs text-slate-500">Immediate decoder activation for GOtv, DStv & StarTimes</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Provider</label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['GOtv', 'DStv', 'StarTimes'] as const).map((prov) => (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => {
                      setTvProvider(prov);
                      if (prov === 'GOtv') setTvAmount('1150');
                      if (prov === 'DStv') setTvAmount('2300');
                      if (prov === 'StarTimes') setTvAmount('900');
                    }}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      tvProvider === prov
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {prov}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Decoder Smartcard / IUC Number</label>
              <input
                type="text"
                value={tvSmartCard}
                onChange={(e) => setTvSmartCard(e.target.value)}
                placeholder="10-digit number"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Package Bouquet</label>
              <select
                value={tvBouquet}
                onChange={(e) => {
                  setTvBouquet(e.target.value);
                  if (e.target.value.includes('Plus')) setTvAmount('1150');
                  if (e.target.value.includes('Supa')) setTvAmount('1999');
                  if (e.target.value.includes('Family')) setTvAmount('2300');
                  if (e.target.value.includes('Basic')) setTvAmount('900');
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="GOtv Plus">GOtv Plus - KSh 1,150/mo</option>
                <option value="GOtv Supa+">GOtv Supa+ - KSh 1,999/mo</option>
                <option value="DStv Family">DStv Family - KSh 2,300/mo</option>
                <option value="StarTimes Basic">StarTimes Basic - KSh 900/mo</option>
              </select>
            </div>

            {/* Status Alert */}
            {statusMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {statusMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Renewing Subscription...</span>
                </>
              ) : (
                <>
                  <Tv className="w-4 h-4" />
                  <span>Activate Package ({formatKsh(Number(tvAmount || 0))})</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
