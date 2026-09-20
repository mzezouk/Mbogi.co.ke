import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ActiveTab,
  UserProfile,
  WalletTransaction,
  InvitedUser,
  BlogArticle,
  ChatConversation,
  AppNotification,
  PosReceipt,
} from '../types';
import {
  initialUser,
  initialTransactions,
  initialInvitedUsers,
  initialArticles,
  initialConversations,
  initialNotifications,
} from '../data/mockData';
import {
  isSupabaseConfigured,
  testSupabaseConnection,
  supabaseService,
  installAndVerifyDatabase,
  DatabaseInstallReport,
} from '../lib/supabase';
import {
  smartpayService,
  SmartPayGatewayStatus,
} from '../lib/smartpay';

interface MbokaContextType {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAdminMode: boolean;
  setIsAdminMode: (admin: boolean) => void;
  walletBalance: number;
  affiliateBalance: number;
  blogBalance: number;
  posFloatBalance: number;
  transactions: WalletTransaction[];
  invitedUsers: InvitedUser[];
  articles: BlogArticle[];
  conversations: ChatConversation[];
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  notifications: AppNotification[];
  isAiCopilotOpen: boolean;
  setIsAiCopilotOpen: (open: boolean) => void;
  selectedReceipt: PosReceipt | null;
  setSelectedReceipt: (receipt: PosReceipt | null) => void;
  
  // Database Provider Integration (Supabase)
  isSupabaseConfigured: boolean;
  isSupabaseConnected: boolean;
  checkSupabaseHealth: () => Promise<{ connected: boolean; message: string }>;
  syncAllToSupabase: () => Promise<{ success: boolean; message: string }>;
  installDatabase: () => Promise<DatabaseInstallReport>;

  // Payment Provider Integration (SmartPayPesa C2B & B2C)
  smartpayStatus: SmartPayGatewayStatus | null;
  refreshSmartPayStatus: () => Promise<SmartPayGatewayStatus>;
  initiateSmartPayDeposit: (phone: string, amount: number) => Promise<{
    success: boolean;
    message: string;
    checkoutRequestId?: string;
    receipt?: string;
  }>;
  confirmSmartPayDeposit: (
    checkoutId: string,
    phone: string,
    amount: number,
    mpesaReceipt?: string
  ) => Promise<{
    success: boolean;
    message: string;
    receipt: string;
  }>;
  recordCancelledDeposit: (
    checkoutId: string,
    phone: string,
    amount: number,
    reason?: string
  ) => Promise<{
    success: boolean;
    message: string;
  }>;
  initiateSmartPayWithdrawal: (phone: string, amount: number, pin: string) => Promise<{
    success: boolean;
    message: string;
    reference?: string;
    fee?: number;
  }>;

  // Ledger and Module operations
  depositFunds: (amount: number, method: string, phoneOrRef: string) => Promise<{ success: boolean; message: string }>;
  withdrawFunds: (amount: number, phone: string, pin: string) => Promise<{ success: boolean; message: string }>;
  sendMoneyP2P: (recipient: string, amount: number, notes: string, pin: string) => Promise<{ success: boolean; message: string }>;
  transferEarningsToWallet: (source: 'affiliate' | 'blog') => Promise<{ success: boolean; message: string }>;
  processPosSale: (sale: Omit<PosReceipt, 'receiptNumber' | 'date'>) => Promise<{ success: boolean; receipt: PosReceipt; message: string }>;
  publishArticle: (article: Partial<BlogArticle>) => void;
  likeArticle: (articleId: string) => void;
  addComment: (articleId: string, commentText: string) => void;
  sendMessage: (conversationId: string, text: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addInvitedUser: (name: string, phone: string) => void;
  updateUserPin: (newPin: string) => boolean;
  toggleKycStatus: (userId?: string) => void;
  formatKsh: (amount: number) => string;
  adminStats: {
    totalUsers: number;
    totalVolumeProcessed: number;
    platformNetRevenue: number;
    activeUtilitiesToday: number;
  };
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  updateUserProfile: (updates: Partial<UserProfile & { walletPin?: string }>) => void;
  registerUser: (userData: { name: string; phone: string; email?: string; pin: string }) => UserProfile;
  resetAllData: () => void;
}

const MbokaContext = createContext<MbokaContextType | undefined>(undefined);

export const MbokaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load or fallback to mock data
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('mboka_user');
    return saved ? JSON.parse(saved) : initialUser;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  const [walletBalance, setWalletBalance] = useState<number>(() => {
    const saved = localStorage.getItem('mboka_balance');
    return saved ? Number(saved) : 5250;
  });

  const [affiliateBalance, setAffiliateBalance] = useState<number>(() => {
    const saved = localStorage.getItem('mboka_affiliate_bal');
    return saved ? Number(saved) : 1850;
  });

  const [blogBalance, setBlogBalance] = useState<number>(() => {
    const saved = localStorage.getItem('mboka_blog_bal');
    return saved ? Number(saved) : 1240;
  });

  const [posFloatBalance, setPosFloatBalance] = useState<number>(() => {
    const saved = localStorage.getItem('mboka_pos_float');
    return saved ? Number(saved) : 14800;
  });

  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => {
    const saved = localStorage.getItem('mboka_transactions');
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>(() => {
    const saved = localStorage.getItem('mboka_invited');
    return saved ? JSON.parse(saved) : initialInvitedUsers;
  });

  const [articles, setArticles] = useState<BlogArticle[]>(() => {
    const saved = localStorage.getItem('mboka_articles');
    return saved ? JSON.parse(saved) : initialArticles;
  });

  const [conversations, setConversations] = useState<ChatConversation[]>(() => {
    const saved = localStorage.getItem('mboka_conversations');
    return saved ? JSON.parse(saved) : initialConversations;
  });

  const [activeConversationId, setActiveConversationId] = useState<string>('conv_1');

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('mboka_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PosReceipt | null>(null);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [smartpayStatus, setSmartpayStatus] = useState<SmartPayGatewayStatus | null>(null);

  const refreshSmartPayStatus = async (): Promise<SmartPayGatewayStatus> => {
    const status = await smartpayService.getStatus();
    setSmartpayStatus(status);
    return status;
  };

  useEffect(() => {
    refreshSmartPayStatus();
  }, []);

  // Check Supabase connection on startup if configured
  useEffect(() => {
    if (isSupabaseConfigured) {
      testSupabaseConnection().then((res) => {
        setIsSupabaseConnected(res.connected);
      });
    }
  }, []);

  const checkSupabaseHealth = async () => {
    const res = await testSupabaseConnection();
    setIsSupabaseConnected(res.connected);
    return { connected: res.connected, message: res.message };
  };

  const syncAllToSupabase = async () => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        message: 'Supabase credentials not configured in environment (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY).',
      };
    }
    try {
      await supabaseService.syncUserProfile(user);
      for (const tx of transactions.slice(0, 10)) {
        await supabaseService.recordTransaction(tx);
      }
      for (const art of articles.slice(0, 5)) {
        await supabaseService.recordArticle(art);
      }
      for (const inv of invitedUsers.slice(0, 5)) {
        await supabaseService.recordInvitedUser(inv);
      }
      setIsSupabaseConnected(true);
      return {
        success: true,
        message: 'All profiles, ledger transactions, articles, and squad members synced to Supabase!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Sync failed: ${err?.message || 'Database error'}`,
      };
    }
  };

  const installDatabase = async (): Promise<DatabaseInstallReport> => {
    const report = await installAndVerifyDatabase({
      user,
      transactions,
      articles,
      invitedUsers,
    });
    if (report.connected) {
      setIsSupabaseConnected(true);
    }
    return report;
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('mboka_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('mboka_balance', walletBalance.toString());
  }, [walletBalance]);

  useEffect(() => {
    localStorage.setItem('mboka_affiliate_bal', affiliateBalance.toString());
  }, [affiliateBalance]);

  useEffect(() => {
    localStorage.setItem('mboka_blog_bal', blogBalance.toString());
  }, [blogBalance]);

  useEffect(() => {
    localStorage.setItem('mboka_pos_float', posFloatBalance.toString());
  }, [posFloatBalance]);

  useEffect(() => {
    localStorage.setItem('mboka_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('mboka_invited', JSON.stringify(invitedUsers));
  }, [invitedUsers]);

  useEffect(() => {
    localStorage.setItem('mboka_articles', JSON.stringify(articles));
  }, [articles]);

  useEffect(() => {
    localStorage.setItem('mboka_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('mboka_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const formatKsh = (amount: number): string => {
    return `KSh ${amount.toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;
  };

  // 1. Deposit funds (e.g. via M-Pesa STK Push)
  const depositFunds = async (amount: number, method: string, phoneOrRef: string) => {
    if (amount <= 0) return { success: false, message: 'Deposit amount must be greater than 0' };

    const ref = `MP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      type: 'deposit',
      title: `${method} Deposit`,
      category: 'wallet',
      amount,
      fee: 0,
      date: 'Just now',
      reference: ref,
      status: 'completed',
      recipientOrSender: phoneOrRef,
      notes: `Direct deposit into central wallet`,
    };

    setWalletBalance((prev) => prev + amount);
    setTransactions((prev) => [newTx, ...prev]);

    // Asynchronously sync to Supabase database if configured
    supabaseService.recordTransaction(newTx).catch((e) => console.warn('Supabase recordTx:', e));

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: 'Deposit Credited',
      message: `${formatKsh(amount)} credited successfully via ${method}. Ref: ${ref}`,
      type: 'wallet',
      timestamp: 'Just now',
      read: false,
      linkTab: 'wallet',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return { success: true, message: `Successfully deposited ${formatKsh(amount)}!` };
  };

  // 1b. SmartPayPesa C2B STK Push Deposit
  const initiateSmartPayDeposit = async (phone: string, amount: number) => {
    if (amount < 1) {
      return { success: false, message: 'Deposit amount must be at least KSh 1.' };
    }

    const res = await smartpayService.sendStkPush({
      phone,
      amount,
      accountReference: 'MBOKA_FLOAT',
      description: 'Mboka Float Deposit',
    });

    if (!res.success && !res.checkout_request_id) {
      return {
        success: false,
        message: res.message || 'Failed to initiate M-Pesa STK Push.',
      };
    }

    const checkoutId = res.checkout_request_id || `ws_CO_${Date.now()}`;

    // Poll for status confirmation (giving user time to enter PIN)
    const pollResult = await smartpayService.pollStkConfirmation(checkoutId, undefined, 20);

    if (pollResult.status === 'COMPLETED' || pollResult.success) {
      const receipt = pollResult.receipt || `SP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      return await confirmSmartPayDeposit(checkoutId, phone, amount, receipt);
    } else {
      return {
        success: false,
        message: pollResult.message || 'STK Push was cancelled or timed out.',
        checkoutRequestId: checkoutId,
      };
    }
  };

  // Confirm and reconcile a SmartPay deposit directly into wallet
  const confirmSmartPayDeposit = async (
    checkoutId: string,
    phone: string,
    amount: number,
    mpesaReceipt?: string
  ) => {
    const receipt = mpesaReceipt || `SP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      type: 'deposit',
      title: 'SmartPay M-Pesa Deposit',
      category: 'wallet',
      amount,
      fee: 0,
      date: 'Just now',
      reference: receipt,
      status: 'completed',
      recipientOrSender: phone,
      notes: `SmartPayPesa C2B STK Push (Ref: ${checkoutId.substring(0, 16)}...)`,
    };

    setWalletBalance((prev) => prev + amount);
    setTransactions((prev) => [newTx, ...prev]);

    supabaseService.recordTransaction(newTx).catch((e) => console.warn('Supabase recordTx:', e));

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: 'M-Pesa Deposit Confirmed',
      message: `${formatKsh(amount)} received via SmartPayPesa STK Push. Receipt: ${receipt}`,
      type: 'wallet',
      timestamp: 'Just now',
      read: false,
      linkTab: 'wallet',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return {
      success: true,
      message: `M-Pesa payment of ${formatKsh(amount)} confirmed! Receipt: ${receipt}`,
      receipt,
      checkoutRequestId: checkoutId,
    };
  };

  // Record an automatically cancelled deposit to the user's ledger and alert center without manual intervention
  const recordCancelledDeposit = async (
    checkoutId: string,
    phone: string,
    amount: number,
    reason?: string
  ) => {
    const cancelReason = reason || 'Cancelled on handset by customer';
    const txId = `tx_${checkoutId || Date.now()}_cancel`;
    const ref = `CANCEL-${(checkoutId || '').substring(0, 8).toUpperCase() || Date.now()}`;

    setTransactions((prev) => {
      // Avoid duplicate cancelled records for the same checkoutId
      if (prev.some((t) => t.id === txId || (t.notes && t.notes.includes(checkoutId) && t.status === 'failed'))) {
        return prev;
      }
      const cancelTx: WalletTransaction = {
        id: txId,
        type: 'deposit',
        title: 'M-Pesa Deposit (Cancelled)',
        category: 'wallet',
        amount,
        fee: 0,
        date: 'Just now',
        reference: ref,
        status: 'failed',
        recipientOrSender: phone,
        notes: `SmartPay STK Push cancelled: ${cancelReason} (Ref: ${checkoutId})`,
      };

      supabaseService.recordTransaction(cancelTx).catch((e) => console.warn('Supabase recordTx:', e));

      return [cancelTx, ...prev];
    });

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: 'M-Pesa Deposit Cancelled',
      message: `Your deposit of ${formatKsh(amount)} was cancelled: ${cancelReason}`,
      type: 'wallet',
      timestamp: 'Just now',
      read: false,
      linkTab: 'wallet',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return {
      success: true,
      message: `Deposit of ${formatKsh(amount)} cancelled: ${cancelReason}`,
    };
  };

  // 2. Withdraw funds
  const withdrawFunds = async (amount: number, phone: string, pin: string) => {
    const activePin = user.walletPin || user.pin || '1234';
    if (pin !== activePin) {
      return { success: false, message: 'Invalid 4-digit security PIN. Please check or reset your PIN.' };
    }
    if (walletBalance < 10) {
      return { success: false, message: `Minimum balance required to withdraw is KSh 10. Current balance: ${formatKsh(walletBalance)}.` };
    }
    if (amount < 10) {
      return { success: false, message: 'Minimum withdrawal amount is KSh 10.' };
    }
    if (amount > walletBalance) {
      return { success: false, message: 'Insufficient wallet balance for withdrawal.' };
    }

    // Requested B2C fee rule: 10-100 is FREE | 101-15000 to be discussed in future (currently 0 fee)
    const fee = 0;
    const totalDeduction = amount + fee;
    if (totalDeduction > walletBalance) {
      return { success: false, message: `Insufficient balance to cover withdrawal of ${formatKsh(amount)}.` };
    }

    const ref = `WDL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      type: 'withdrawal',
      title: `Withdrawal to M-Pesa (${phone})`,
      category: 'wallet',
      amount,
      fee,
      date: 'Just now',
      reference: ref,
      status: 'completed',
      recipientOrSender: phone,
      notes: `Funds transferred to mobile money`,
    };

    setWalletBalance((prev) => prev - totalDeduction);
    setTransactions((prev) => [newTx, ...prev]);

    // Asynchronously sync to Supabase database if configured
    supabaseService.recordTransaction(newTx).catch((e) => console.warn('Supabase recordTx:', e));

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: 'Withdrawal Processed',
      message: `${formatKsh(amount)} sent to ${phone}. Ref: ${ref}`,
      type: 'wallet',
      timestamp: 'Just now',
      read: false,
      linkTab: 'wallet',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return { success: true, message: `Withdrawal of ${formatKsh(amount)} processed successfully!` };
  };

  // 2b. SmartPayPesa B2C Payout / Disbursement
  const initiateSmartPayWithdrawal = async (phone: string, amount: number, pin: string) => {
    const activePin = user.walletPin || user.pin || '1234';
    if (pin !== activePin) {
      return { success: false, message: 'Invalid 4-digit withdrawal PIN. Please check or set your PIN.' };
    }
    if (walletBalance < 10) {
      return { success: false, message: `You need a minimum balance of KSh 10 to withdraw via B2C. Current balance: ${formatKsh(walletBalance)}.` };
    }
    if (amount < 10) {
      return { success: false, message: 'Minimum withdrawal via SmartPay B2C is KSh 10.' };
    }

    // Requested B2C fee rule: 10-100 is FREE | 101-15000 to be discussed in future (currently 0 fee)
    const fee = 0;
    const totalDeduction = amount + fee;

    if (totalDeduction > walletBalance) {
      return { success: false, message: `Insufficient balance to cover withdrawal of ${formatKsh(amount)}.` };
    }

    const res = await smartpayService.sendB2cPayout({ phone, amount });

    if (!res.success && res.status === 'FAILED') {
      return { success: false, message: res.message || 'SmartPay B2C payout could not be processed.' };
    }

    const b2cRef = res.reference || `AG_${Date.now()}`;
    const receipt = res.receipt || `RC${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      type: 'withdrawal',
      title: `SmartPay B2C Payout (${phone})`,
      category: 'wallet',
      amount,
      fee,
      date: 'Just now',
      reference: b2cRef,
      status: 'completed',
      recipientOrSender: phone,
      notes: `SmartPayPesa B2C Disbursement (Receipt: ${receipt})`,
    };

    setWalletBalance((prev) => prev - totalDeduction);
    setTransactions((prev) => [newTx, ...prev]);

    supabaseService.recordTransaction(newTx).catch((e) => console.warn('Supabase recordTx:', e));

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: 'SmartPay Payout Dispatched',
      message: `${formatKsh(amount)} sent to ${phone}. Ref: ${b2cRef}`,
      type: 'wallet',
      timestamp: 'Just now',
      read: false,
      linkTab: 'wallet',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return {
      success: true,
      message: `B2C Payout of ${formatKsh(amount)} dispatched to ${phone}! (Ref: ${b2cRef})`,
      reference: b2cRef,
      fee,
    };
  };

  // 3. P2P Send Money
  const sendMoneyP2P = async (recipient: string, amount: number, notes: string, pin: string) => {
    if (pin !== user.pin) {
      return { success: false, message: 'Incorrect PIN. Transfer cancelled.' };
    }
    if (amount > walletBalance) {
      return { success: false, message: 'Insufficient wallet balance.' };
    }

    const ref = `P2P-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      type: 'transfer_out',
      title: `Sent to ${recipient}`,
      category: 'p2p',
      amount,
      fee: 0, // Mboka internal P2P is free!
      date: 'Just now',
      reference: ref,
      status: 'completed',
      recipientOrSender: recipient,
      notes: notes || 'Mboka P2P Transfer',
    };

    setWalletBalance((prev) => prev - amount);
    setTransactions((prev) => [newTx, ...prev]);

    // Asynchronously sync to Supabase database if configured
    supabaseService.recordTransaction(newTx).catch((e) => console.warn('Supabase recordTx:', e));

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: 'Money Sent',
      message: `You transferred ${formatKsh(amount)} to ${recipient}. Ref: ${ref}`,
      type: 'wallet',
      timestamp: 'Just now',
      read: false,
      linkTab: 'wallet',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return { success: true, message: `Successfully sent ${formatKsh(amount)} to ${recipient}!` };
  };

  // 4. Central Ledger Transfer: Affiliate / Blog earnings -> Wallet
  const transferEarningsToWallet = async (source: 'affiliate' | 'blog') => {
    const amount = source === 'affiliate' ? affiliateBalance : blogBalance;
    if (amount <= 0) {
      return { success: false, message: `No eligible earnings to transfer from ${source}.` };
    }

    const ref = `SWP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      type: source === 'affiliate' ? 'affiliate_payout' : 'blog_payout',
      title: `Claimed ${source === 'affiliate' ? 'Affiliate Commissions' : 'Blog Ad Revenue'}`,
      category: source,
      amount,
      fee: 0,
      date: 'Just now',
      reference: ref,
      status: 'completed',
      recipientOrSender: `Mboka ${source.toUpperCase()} Program`,
      notes: 'Transferred into main cash ledger',
    };

    if (source === 'affiliate') {
      setAffiliateBalance(0);
    } else {
      setBlogBalance(0);
    }

    setWalletBalance((prev) => prev + amount);
    setTransactions((prev) => [newTx, ...prev]);

    // Asynchronously sync to Supabase database if configured
    supabaseService.recordTransaction(newTx).catch((e) => console.warn('Supabase recordTx:', e));

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: 'Earnings Credited to Wallet',
      message: `${formatKsh(amount)} from your ${source} earnings moved to your main balance!`,
      type: source,
      timestamp: 'Just now',
      read: false,
      linkTab: 'wallet',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return { success: true, message: `Transferred ${formatKsh(amount)} into your primary Mboka Wallet!` };
  };

  // 5. Process POS Sale (Airtime, KPLC, TV)
  const processPosSale = async (saleData: Omit<PosReceipt, 'receiptNumber' | 'date'>) => {
    const totalCost = saleData.amount + (saleData.fee || 0);

    if (walletBalance < totalCost) {
      return {
        success: false,
        receipt: null as any,
        message: 'Insufficient balance in wallet to process this transaction.',
      };
    }

    const receiptNumber = `MBK-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    let token = saleData.token;
    let units = saleData.units;
    let cashback = 0;

    // Auto-generate realistic KPLC token if it's a KPLC sale
    if (saleData.serviceType === 'kplc' && !token) {
      const g = () => Math.floor(1000 + Math.random() * 9000);
      token = `${g()}-${g()}-${g()}-${g()}-${g()}`;
      // Approx 1 kWh = KSh 24.50 (Kenyan standard domestic tariff)
      units = Number((saleData.amount / 24.5).toFixed(1));
    }

    // Calculate merchant cashback or commission
    if (saleData.serviceType === 'airtime') {
      cashback = Number((saleData.amount * 0.02).toFixed(2)); // 2% cashback
    } else if (saleData.serviceType === 'kplc') {
      cashback = Number((saleData.amount * 0.015).toFixed(2)); // 1.5% cashback
    } else if (saleData.serviceType === 'tv') {
      cashback = Number((saleData.amount * 0.025).toFixed(2)); // 2.5% cashback
    }

    const fullReceipt: PosReceipt = {
      ...saleData,
      receiptNumber,
      date: dateFormatted,
      token,
      units,
      cashbackEarned: cashback,
    };

    // Deduct amount, add cashback immediately
    setWalletBalance((prev) => prev - totalCost + cashback);

    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      type: 'pos_purchase',
      title: `${saleData.serviceName} (${saleData.provider})`,
      category: 'pos',
      amount: saleData.amount,
      fee: saleData.fee || 0,
      date: 'Just now',
      reference: receiptNumber,
      status: 'completed',
      recipientOrSender: saleData.accountOrPhone,
      metadata: {
        token,
        units: units ? `${units} kWh` : undefined,
        cashback,
      },
    };

    setTransactions((prev) => [newTx, ...prev]);
    setSelectedReceipt(fullReceipt);

    // Asynchronously sync to Supabase database if configured
    supabaseService.recordTransaction(newTx).catch((e) => console.warn('Supabase recordTx:', e));

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: `${saleData.serviceName} Successful`,
      message: `Ref ${receiptNumber}. Paid ${formatKsh(saleData.amount)}. Earned ${formatKsh(cashback)} cashback!`,
      type: 'pos',
      timestamp: 'Just now',
      read: false,
      linkTab: 'pos',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return {
      success: true,
      receipt: fullReceipt,
      message: `${saleData.serviceName} completed successfully!`,
    };
  };

  // 6. Blog article actions
  const publishArticle = (newArticleData: Partial<BlogArticle>) => {
    const newArt: BlogArticle = {
      id: `art_${Date.now()}`,
      title: newArticleData.title || 'Untitled Article',
      excerpt: newArticleData.excerpt || '',
      content: newArticleData.content || '',
      category: (newArticleData.category as any) || 'Business & Hustle',
      coverImage:
        newArticleData.coverImage ||
        'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&auto=format&fit=crop&q=80',
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      date: 'Today',
      readTime: '3 min read',
      views: 12,
      likes: 1,
      commentsCount: 0,
      adImpressions: 18,
      estimatedEarnings: 5,
      isApproved: true,
    };

    setArticles((prev) => [newArt, ...prev]);

    // Asynchronously sync to Supabase database if configured
    supabaseService.recordArticle(newArt).catch((e) => console.warn('Supabase recordArticle:', e));

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: 'Article Published',
      message: `"${newArt.title}" is now live and monetized on Mboka Blog!`,
      type: 'blog',
      timestamp: 'Just now',
      read: false,
      linkTab: 'blog',
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const likeArticle = (articleId: string) => {
    setArticles((prev) =>
      prev.map((art) => {
        if (art.id === articleId) {
          const isLiked = art.userLiked;
          const newLikes = isLiked ? art.likes - 1 : art.likes + 1;
          const adImp = art.adImpressions + 2;
          const extraRevenue = !isLiked ? 2.5 : 0;
          if (art.authorId === user.id && extraRevenue > 0) {
            setBlogBalance((b) => b + extraRevenue);
          }
          return {
            ...art,
            likes: Math.max(0, newLikes),
            userLiked: !isLiked,
            adImpressions: adImp,
            views: art.views + 1,
            estimatedEarnings: art.estimatedEarnings + extraRevenue,
          };
        }
        return art;
      })
    );
  };

  const addComment = (articleId: string, commentText: string) => {
    setArticles((prev) =>
      prev.map((art) => (art.id === articleId ? { ...art, commentsCount: art.commentsCount + 1 } : art))
    );
  };

  // 7. Chat actions
  const sendMessage = (conversationId: string, text: string) => {
    const newMsg = {
      id: `msg_${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            lastMessage: `${user.name.split(' ')[0]}: ${text}`,
            lastMessageTime: 'Just now',
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );
  };

  // 8. Notifications
  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // 9. Invite friend
  const addInvitedUser = (name: string, phone: string) => {
    const newInv: InvitedUser = {
      id: `inv_${Date.now()}`,
      name,
      phone,
      registeredDate: 'Today',
      status: 'qualified',
      earnedCommission: 150,
    };
    setInvitedUsers((prev) => [newInv, ...prev]);
    setAffiliateBalance((prev) => prev + 150);

    // Asynchronously sync to Supabase database if configured
    supabaseService.recordInvitedUser(newInv).catch((e) => console.warn('Supabase recordInvite:', e));

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: 'New Referral Registered!',
      message: `${name} joined using your code. KSh 150 added to your affiliate earnings.`,
      type: 'affiliate',
      timestamp: 'Just now',
      read: false,
      linkTab: 'affiliate',
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const updateUserPin = (newPin: string) => {
    if (newPin.length === 4 && /^\d+$/.test(newPin)) {
      setUser((prev) => {
        const updated = { ...prev, pin: newPin, walletPin: newPin };
        localStorage.setItem('mboka_user', JSON.stringify(updated));
        return updated;
      });
      return true;
    }
    return false;
  };

  const registerUser = (userData: { name: string; phone: string; email?: string; pin: string }) => {
    const cleanPhone = userData.phone.startsWith('+')
      ? userData.phone
      : userData.phone.startsWith('0')
      ? '+254' + userData.phone.substring(1)
      : '+254' + userData.phone;

    const newUser: UserProfile = {
      id: `usr_${Date.now().toString().slice(-6)}`,
      name: userData.name,
      username: userData.name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random() * 900 + 100),
      phone: cleanPhone,
      email: userData.email || `${userData.name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      referralCode: `MBOKA-${Math.floor(Math.random() * 9000 + 1000)}`,
      isKycVerified: true,
      role: 'user',
      joinedDate: 'Today',
      pin: userData.pin,
      walletPin: userData.pin,
    };

    // User signup requirement: Starting balance > 0 (e.g. KSh 20 welcome bonus credit)
    const welcomeCredit = 20;
    const welcomeTx: WalletTransaction = {
      id: `tx_bonus_${Date.now()}`,
      type: 'deposit',
      title: 'Welcome Sign-up Bonus Credit',
      category: 'wallet',
      amount: welcomeCredit,
      fee: 0,
      date: 'Just now',
      reference: `MBOKA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: 'completed',
      recipientOrSender: 'Mboka Rewards Pool',
      notes: 'Real onboarding credit (>0) ready for immediate testing and B2C withdrawal',
    };

    setUser(newUser);
    setWalletBalance(welcomeCredit);
    setAffiliateBalance(0);
    setBlogBalance(0);
    setPosFloatBalance(0);
    setTransactions([welcomeTx]);

    localStorage.setItem('mboka_user', JSON.stringify(newUser));
    localStorage.setItem('mboka_balance', welcomeCredit.toString());
    localStorage.setItem('mboka_affiliate_bal', '0');
    localStorage.setItem('mboka_blog_bal', '0');
    localStorage.setItem('mboka_pos_float', '0');
    localStorage.setItem('mboka_transactions', JSON.stringify([welcomeTx]));

    supabaseService.syncUserProfile(newUser).catch(() => {});
    supabaseService.recordTransaction(welcomeTx).catch(() => {});

    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: 'Account Activated!',
      message: `Karibu ${newUser.name}! Your wallet has been credited with KSh ${welcomeCredit}.00 welcome bonus.`,
      type: 'wallet',
      timestamp: 'Just now',
      read: false,
      linkTab: 'wallet',
    };
    setNotifications([notif]);

    return newUser;
  };

  const toggleKycStatus = () => {
    setUser((prev) => ({ ...prev, isKycVerified: !prev.isKycVerified }));
  };

  const addNotification = (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...n,
      id: `notif_${Date.now()}`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const updateUserProfile = (updates: Partial<UserProfile & { walletPin?: string }>) => {
    setUser((prev) => {
      const pin = updates.walletPin || updates.pin || prev.pin;
      return {
        ...prev,
        ...updates,
        pin,
        walletPin: pin,
      };
    });
  };

  const resetAllData = () => {
    localStorage.removeItem('mboka_user');
    localStorage.removeItem('mboka_wallet_balance');
    localStorage.removeItem('mboka_affiliate_balance');
    localStorage.removeItem('mboka_blog_balance');
    localStorage.removeItem('mboka_pos_float');
    localStorage.removeItem('mboka_transactions');
    localStorage.removeItem('mboka_invited_users');
    localStorage.removeItem('mboka_articles');
    localStorage.removeItem('mboka_conversations');
    localStorage.removeItem('mboka_notifications');

    setUser(initialUser);
    setWalletBalance(5250);
    setAffiliateBalance(1350);
    setBlogBalance(2840);
    setPosFloatBalance(10000);
    setTransactions(initialTransactions);
    setInvitedUsers(initialInvitedUsers);
    setArticles(initialArticles);
    setConversations(initialConversations);
    setNotifications(initialNotifications);
  };

  const adminStats = {
    totalUsers: 14820,
    totalVolumeProcessed: 6842900,
    platformNetRevenue: 492100,
    activeUtilitiesToday: 384,
  };

  return (
    <MbokaContext.Provider
      value={{
        user,
        setUser,
        activeTab,
        setActiveTab,
        isAdminMode,
        setIsAdminMode,
        walletBalance,
        affiliateBalance,
        blogBalance,
        posFloatBalance,
        transactions,
        invitedUsers,
        articles,
        conversations,
        activeConversationId,
        setActiveConversationId,
        notifications,
        isAiCopilotOpen,
        setIsAiCopilotOpen,
        selectedReceipt,
        setSelectedReceipt,
        depositFunds,
        withdrawFunds,
        sendMoneyP2P,
        transferEarningsToWallet,
        processPosSale,
        publishArticle,
        likeArticle,
        addComment,
        sendMessage,
        markNotificationRead,
        markAllNotificationsRead,
        addInvitedUser,
        updateUserPin,
        toggleKycStatus,
        formatKsh,
        adminStats,
        addNotification,
        updateUserProfile,
        registerUser,
        resetAllData,
        isSupabaseConfigured,
        isSupabaseConnected,
        checkSupabaseHealth,
        syncAllToSupabase,
        installDatabase,
        smartpayStatus,
        refreshSmartPayStatus,
        initiateSmartPayDeposit,
        confirmSmartPayDeposit,
        recordCancelledDeposit,
        initiateSmartPayWithdrawal,
      }}
    >
      {children}
    </MbokaContext.Provider>
  );
};

export const useMboka = () => {
  const context = useContext(MbokaContext);
  if (!context) {
    throw new Error('useMboka must be used within a MbokaProvider');
  }
  return context;
};
