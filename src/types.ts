export type ActiveTab = 'home' | 'wallet' | 'affiliate' | 'blog' | 'chat' | 'pos' | 'profile' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  phone: string;
  email: string;
  avatar: string;
  referralCode: string;
  isKycVerified: boolean;
  role: 'user' | 'merchant' | 'admin';
  joinedDate: string;
  pin: string; // 4-digit transaction PIN
  walletPin?: string;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer_out' | 'transfer_in' | 'pos_purchase' | 'affiliate_payout' | 'blog_payout' | 'pos_commission';

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  title: string;
  category: 'wallet' | 'affiliate' | 'blog' | 'pos' | 'p2p';
  amount: number; // in KSh
  fee: number;
  date: string;
  reference: string;
  status: 'completed' | 'pending' | 'failed';
  recipientOrSender?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface InvitedUser {
  id: string;
  name: string;
  phone: string;
  registeredDate: string;
  status: 'registered' | 'active' | 'qualified';
  earnedCommission: number;
}

export interface BlogArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'Business & Hustle' | 'Technology' | 'Agribusiness' | 'Personal Finance' | 'Community Stories';
  coverImage: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  date: string;
  readTime: string;
  views: number;
  likes: number;
  userLiked?: boolean;
  commentsCount: number;
  adImpressions: number;
  estimatedEarnings: number;
  isFeatured?: boolean;
  isApproved: boolean;
}

export interface BlogComment {
  id: string;
  articleId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  mediaType?: 'image' | 'voice' | 'receipt';
  mediaUrl?: string;
}

export interface ChatConversation {
  id: string;
  name: string;
  avatar: string;
  isGroup: boolean;
  badge?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  membersCount?: number;
  description?: string;
  messages: ChatMessage[];
}

export interface PosReceipt {
  receiptNumber: string;
  serviceType: 'airtime' | 'kplc' | 'tv';
  serviceName: string;
  accountOrPhone: string;
  amount: number;
  fee: number;
  date: string;
  token?: string; // 20-digit KPLC token
  units?: number; // kWh for KPLC
  provider: string;
  operator: string;
  cashbackEarned?: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'wallet' | 'affiliate' | 'blog' | 'pos' | 'security' | 'system';
  timestamp: string;
  read: boolean;
  linkTab?: ActiveTab;
}
