/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MbokaProvider, useMboka } from './context/MbokaContext';
import { Navbar } from './components/Navbar';
import { WalletView } from './components/WalletView';
import { AffiliateView } from './components/AffiliateView';
import { DeveloperApiView } from './components/DeveloperApiView';
import { ProfileView } from './components/ProfileView';
import { AdminView } from './components/AdminView';
import { ReceiptModal } from './components/ReceiptModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import {
  Wallet,
  Users,
  Headphones,
  User,
  Code2,
} from 'lucide-react';
import { ActiveTab } from './types';

const MainContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isAdminMode,
    setIsAdminMode,
    selectedReceipt,
    setSelectedReceipt,
    isAiCopilotOpen,
    setIsAiCopilotOpen,
  } = useMboka();

  const mobileNavItems: {
    id: ActiveTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
  }[] = [
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'api', label: 'API', icon: Code2 },
    { id: 'affiliate', label: 'Affiliate', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 flex flex-col font-sans text-slate-900 pb-20 lg:pb-8">
      {/* Top Sticky Navigation */}
      <Navbar />

      {/* Main App Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isAdminMode ? (
          <AdminView />
        ) : (
          <>
            {activeTab === 'wallet' && <WalletView />}
            {activeTab === 'api' && <DeveloperApiView />}
            {activeTab === 'affiliate' && <AffiliateView />}
            {activeTab === 'profile' && <ProfileView />}
            {activeTab === 'admin' && <AdminView />}
          </>
        )}
      </main>

      {/* Floating Support Desk Button (desktop & mobile) */}
      {!isAiCopilotOpen && (
        <button
          onClick={() => setIsAiCopilotOpen(true)}
          className="fixed bottom-20 sm:bottom-8 right-5 z-40 flex items-center gap-2.5 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold text-xs group border border-slate-700/80"
          aria-label="Open Mboka Support Desk"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Headphones className="w-3.5 h-3.5" />
          </div>
          <span className="tracking-wide">Help &amp; Support</span>
        </button>
      )}

      {/* Global Modals */}
      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {isAiCopilotOpen && (
        <AiAssistantModal onClose={() => setIsAiCopilotOpen(false)} />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-2 px-3 flex items-center justify-around shadow-lg">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !isAdminMode;
          return (
            <button
              key={item.id}
              onClick={() => {
                setIsAdminMode(false);
                setActiveTab(item.id);
              }}
              className={`relative flex flex-col items-center gap-0.5 py-1 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isActive ? 'text-emerald-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Clean Minimal Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6 text-center text-xs text-slate-400 border-t border-slate-200/60 mt-12">
        <div className="flex flex-wrap items-center justify-center gap-3 text-slate-500 font-medium">
          <span>Mboka Wallet Kenya</span>
          <span aria-hidden="true">·</span>
          <span>M-Pesa STK Push</span>
          <span aria-hidden="true">·</span>
          <span>P2P Zero-Fee Transfers</span>
          <span aria-hidden="true">·</span>
          <span>Automated B2C Settlement</span>
          <span aria-hidden="true">·</span>
          <span>Mbogi Affiliate</span>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Secure digital ledger &amp; instant payments.
        </p>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <MbokaProvider>
      <MainContent />
    </MbokaProvider>
  );
}
