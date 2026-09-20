import React, { useState } from 'react';
import {
  Home,
  Wallet,
  Users,
  PenTool,
  MessageSquare,
  Store,
  User,
  Shield,
  Bell,
  Headphones,
  Eye,
  EyeOff,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
  Database,
  UserPlus,
} from 'lucide-react';
import { useMboka } from '../context/MbokaContext';
import { AuthModal } from './AuthModal';
import { ActiveTab } from '../types';

export const Navbar: React.FC = () => {
  const {
    user,
    activeTab,
    setActiveTab,
    isAdminMode,
    setIsAdminMode,
    walletBalance,
    formatKsh,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setIsAiCopilotOpen,
    isSupabaseConfigured,
    isSupabaseConnected,
  } = useMboka();

  const [hideBalance, setHideBalance] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'affiliate', label: 'Affiliate', icon: Users },
    { id: 'blog', label: 'Blog', icon: PenTool },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'pos', label: 'POS Store', icon: Store },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-heading font-black text-xl shadow-md group-hover:scale-105 transition-transform">
                M
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900 font-heading">
                    Mboka
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm">
                    Hub
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 hidden sm:block">
                  Hustle • Earn • Transact
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id && !isAdminMode;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setIsAdminMode(false);
                      setActiveTab(item.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Wallet Pill */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-100/80 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/70 transition-colors">
              <span className="text-xs text-slate-500 font-medium">Balance:</span>
              <span className="font-bold text-slate-900 text-sm font-mono">
                {hideBalance ? '••••••' : formatKsh(walletBalance)}
              </span>
              <button
                onClick={() => setHideBalance(!hideBalance)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                title={hideBalance ? 'Show balance' : 'Hide balance'}
              >
                {hideBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Support Desk Button */}
            <button
              onClick={() => setIsAiCopilotOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Headphones className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Support Desk</span>
            </button>

            {/* Supabase Database Status Pill */}
            <button
              onClick={() => {
                setIsAdminMode(true);
                setActiveTab('admin');
              }}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                isSupabaseConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : isSupabaseConfigured
                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Supabase PostgreSQL Provider - Click to view Database Admin"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden xl:inline">
                {isSupabaseConnected
                  ? 'Supabase: Connected'
                  : isSupabaseConfigured
                  ? 'Supabase: Syncing'
                  : 'Supabase DB'}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSupabaseConnected
                    ? 'bg-emerald-500'
                    : isSupabaseConfigured
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
            </button>

            {/* Admin Switcher Toggle */}
            <button
              onClick={() => {
                const nextAdmin = !isAdminMode;
                setIsAdminMode(nextAdmin);
                if (nextAdmin) setActiveTab('admin');
                else setActiveTab('home');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isAdminMode
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title="Toggle between User App and Admin Dashboard"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAdminMode ? 'Admin Mode' : 'Admin'}</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">No notifications yet</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationRead(n.id);
                            if (n.linkTab) {
                              setIsAdminMode(false);
                              setActiveTab(n.linkTab);
                              setShowNotifications(false);
                            }
                          }}
                          className={`p-3 text-left hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                            !n.read ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">{n.timestamp}</span>
                          </div>
                          {n.linkTab && <ChevronRight className="w-4 h-4 text-slate-400 self-center" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sign Up / Switch Account Button */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-bold transition-all cursor-pointer"
              title="Register a new real user account with positive balance"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sign Up</span>
            </button>

            {/* Profile Avatar */}
            <button
              onClick={() => {
                setIsAdminMode(false);
                setActiveTab('profile');
              }}
              className="flex items-center gap-2 pl-1 group cursor-pointer focus:outline-none"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/30"
              />
              <div className="hidden xl:block text-left">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[90px]">
                    {user.name.split(' ')[0]}
                  </span>
                  {user.isKycVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <span className="text-[10px] text-slate-500 block leading-tight">@{user.username}</span>
              </div>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg animate-in slide-in-from-top-2">
          <button
            onClick={() => {
              setShowAuthModal(true);
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2"
          >
            <UserPlus className="w-5 h-5 text-emerald-600" />
            <span>Create Account / Sign Up (Bal &gt; 0)</span>
          </button>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id && !isAdminMode;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setIsAdminMode(false);
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </header>
  );
};
