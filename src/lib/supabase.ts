import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  UserProfile,
  WalletTransaction,
  InvitedUser,
  BlogArticle,
  ChatConversation,
} from '../types';

// Retrieve Supabase environment variables from Vite
const supabaseUrl: string = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey: string = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.trim().length > 0 &&
  supabaseAnonKey.trim().length > 0 &&
  !supabaseUrl.includes('MY_SUPABASE') &&
  !supabaseUrl.includes('placeholder')
);

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn('Notice initializing Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
}

export interface SupabaseHealth {
  connected: boolean;
  configured: boolean;
  message: string;
}

/**
 * Tests connection to the configured Supabase instance
 */
export async function testSupabaseConnection(): Promise<SupabaseHealth> {
  if (!isSupabaseConfigured) {
    return {
      configured: false,
      connected: false,
      message: 'Supabase credentials (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) not yet configured in environment.',
    };
  }

  const client = getSupabase();
  if (!client) {
    return {
      configured: true,
      connected: false,
      message: 'Supabase client could not be initialized.',
    };
  }

  try {
    // Attempt a lightweight query
    const { error } = await client.from('mboka_profiles').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // Table might not exist yet or permissions issue
      return {
        configured: true,
        connected: true, // Server responded, connection is valid
        message: `Supabase connected (Table status: ${error.message}).`,
      };
    }
    return {
      configured: true,
      connected: true,
      message: 'Connected to Supabase PostgreSQL database successfully.',
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      message: `Failed to connect to Supabase: ${err?.message || 'Network error'}`,
    };
  }
}

export interface TableInstallStatus {
  table: string;
  name: string;
  exists: boolean;
  rowsCount: number;
  status: 'ready' | 'missing' | 'unreachable';
  message: string;
}

export interface DatabaseInstallReport {
  success: boolean;
  configured: boolean;
  connected: boolean;
  tables: TableInstallStatus[];
  message: string;
}

/**
 * Verifies all 4 Mboka tables and provisions initial seed records
 */
export async function installAndVerifyDatabase(sampleData?: {
  user?: UserProfile;
  transactions?: WalletTransaction[];
  articles?: BlogArticle[];
  invitedUsers?: InvitedUser[];
}): Promise<DatabaseInstallReport> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      configured: false,
      connected: false,
      message: 'Supabase credentials not configured yet in environment (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY).',
      tables: [
        { table: 'mboka_profiles', name: 'User & Agent Accounts', exists: false, rowsCount: 0, status: 'missing', message: 'Awaiting Supabase URL/Key' },
        { table: 'mboka_transactions', name: 'Ledger Audit Trail', exists: false, rowsCount: 0, status: 'missing', message: 'Awaiting Supabase URL/Key' },
        { table: 'mboka_articles', name: 'Creator Blog & Monetization', exists: false, rowsCount: 0, status: 'missing', message: 'Awaiting Supabase URL/Key' },
        { table: 'mboka_invited_users', name: 'Affiliate Squad Downlines', exists: false, rowsCount: 0, status: 'missing', message: 'Awaiting Supabase URL/Key' },
      ],
    };
  }

  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      configured: true,
      connected: false,
      message: 'Supabase client failed to initialize.',
      tables: [],
    };
  }

  const checkTable = async (tableName: string, name: string): Promise<TableInstallStatus> => {
    try {
      const { data, count, error } = await client
        .from(tableName)
        .select('*', { count: 'exact', head: false })
        .limit(5);

      if (error) {
        return {
          table: tableName,
          name,
          exists: false,
          rowsCount: 0,
          status: 'missing',
          message: error.message,
        };
      }
      return {
        table: tableName,
        name,
        exists: true,
        rowsCount: count ?? (data?.length || 0),
        status: 'ready',
        message: 'Table active and operational in Supabase.',
      };
    } catch (e: any) {
      return {
        table: tableName,
        name,
        exists: false,
        rowsCount: 0,
        status: 'unreachable',
        message: e?.message || 'Query error',
      };
    }
  };

  const tablesToCheck = [
    { table: 'mboka_profiles', name: 'User & Agent Accounts' },
    { table: 'mboka_transactions', name: 'Ledger Audit Trail' },
    { table: 'mboka_smartpay_events', name: 'SmartPay Webhook & IPN Events' },
    { table: 'mboka_articles', name: 'Creator Blog & Monetization' },
    { table: 'mboka_invited_users', name: 'Affiliate Squad Downlines' },
  ];

  const tableResults: TableInstallStatus[] = [];
  for (const t of tablesToCheck) {
    const res = await checkTable(t.table, t.name);
    tableResults.push(res);
  }

  // If tables exist and sample data provided, seed them
  if (sampleData) {
    if (sampleData.user) {
      await supabaseService.syncUserProfile(sampleData.user);
    }
    if (sampleData.transactions && sampleData.transactions.length > 0) {
      for (const tx of sampleData.transactions.slice(0, 5)) {
        await supabaseService.recordTransaction(tx);
      }
    }
    if (sampleData.articles && sampleData.articles.length > 0) {
      for (const art of sampleData.articles.slice(0, 3)) {
        await supabaseService.recordArticle(art);
      }
    }
    if (sampleData.invitedUsers && sampleData.invitedUsers.length > 0) {
      for (const inv of sampleData.invitedUsers.slice(0, 3)) {
        await supabaseService.recordInvitedUser(inv);
      }
    }
  }

  const allReady = tableResults.every((t) => t.status === 'ready');

  return {
    success: allReady,
    configured: true,
    connected: true,
    tables: tableResults,
    message: allReady
      ? 'All 4 Mboka database tables are verified, installed, and synchronized!'
      : 'Supabase connected! One or more tables need the initial SQL schema script executed in Supabase SQL Editor.',
  };
}

/**
 * Supabase synchronization service for Mboka
 */
export const supabaseService = {
  // Sync user profile
  async syncUserProfile(user: UserProfile): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    try {
      const { error } = await client.from('mboka_profiles').upsert({
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        referral_code: user.referralCode,
        is_kyc_verified: user.isKycVerified,
        wallet_pin: user.pin,
        updated_at: new Date().toISOString(),
      });
      if (error) console.warn('Supabase profile sync notice:', error.message);
      return !error;
    } catch (e) {
      console.warn('Supabase profile sync catch:', e);
      return false;
    }
  },

  // Save a new wallet transaction
  async recordTransaction(tx: WalletTransaction): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    try {
      const { error } = await client.from('mboka_transactions').insert({
        id: tx.id,
        reference: tx.reference,
        type: tx.type,
        amount: tx.amount,
        fee: tx.fee,
        description: tx.title || tx.notes || 'Mboka Ledger Transaction',
        status: tx.status,
        recipient_or_sender: tx.recipientOrSender,
        created_at: new Date().toISOString(),
      });
      if (error) console.warn('Supabase transaction insert notice:', error.message);
      return !error;
    } catch (e) {
      console.warn('Supabase transaction insert catch:', e);
      return false;
    }
  },

  // Sync a published article
  async recordArticle(article: BlogArticle): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    try {
      const { error } = await client.from('mboka_articles').upsert({
        id: article.id,
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        author: article.authorName,
        category: article.category,
        read_time: article.readTime,
        cover_image: article.coverImage,
        claps: article.likes,
        views: article.views,
        earnings_ksh: article.estimatedEarnings,
        created_at: new Date().toISOString(),
      });
      if (error) console.warn('Supabase article sync notice:', error.message);
      return !error;
    } catch (e) {
      console.warn('Supabase article sync catch:', e);
      return false;
    }
  },

  // Record an invited referral
  async recordInvitedUser(invite: InvitedUser): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    try {
      const { error } = await client.from('mboka_invited_users').upsert({
        id: invite.id,
        name: invite.name,
        phone: invite.phone,
        joined_date: invite.registeredDate,
        status: invite.status,
        bonus_earned: invite.earnedCommission,
        pos_volume_generated: 0,
      });
      if (error) console.warn('Supabase referral record notice:', error.message);
      return !error;
    } catch (e) {
      console.warn('Supabase referral record catch:', e);
      return false;
    }
  },

  // Record an incoming SmartPay webhook or IPN event
  async recordSmartPayEvent(event: {
    id: string;
    event_type: string;
    checkout_request_id?: string;
    merchant_request_id?: string;
    mpesa_receipt?: string;
    amount?: number;
    phone?: string;
    result_code?: number;
    result_desc?: string;
    raw_payload?: any;
    processed?: boolean;
  }): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    try {
      const { error } = await client.from('mboka_smartpay_events').insert({
        ...event,
        created_at: new Date().toISOString(),
      });
      if (error) console.warn('Supabase recordSmartPayEvent notice:', error.message);
      return !error;
    } catch (e) {
      console.warn('Supabase recordSmartPayEvent catch:', e);
      return false;
    }
  },

  // Fetch recent SmartPay webhook events from Supabase
  async getSmartPayEvents(): Promise<any[]> {
    const client = getSupabase();
    if (!client) return [];
    try {
      const { data, error } = await client
        .from('mboka_smartpay_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  },
};
