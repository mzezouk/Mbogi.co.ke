-- ====================================================================
-- MBOKA DIGITAL ECOSYSTEM - SUPABASE POSTGRESQL SCHEMA INITIALIZATION
-- ====================================================================
-- This script provisions the complete relational database for Mboka:
-- 1. mboka_profiles: User identities, KYC verification, wallet PINs & roles
-- 2. mboka_transactions: Central double-entry cash ledger & receipts
-- 3. mboka_articles: Creator blog posts, readership stats & ad revenue
-- 4. mboka_invited_users: Multi-tier affiliate downline & commissions
-- ====================================================================

-- 1. Profiles Table (Users, Agents, Merchants & Admins)
CREATE TABLE IF NOT EXISTS mboka_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  role TEXT DEFAULT 'Standard User',
  referral_code TEXT UNIQUE,
  is_kyc_verified BOOLEAN DEFAULT FALSE,
  wallet_pin TEXT DEFAULT '1234',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Central Cash Ledger & Transactions
CREATE TABLE IF NOT EXISTS mboka_transactions (
  id TEXT PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- deposit, withdrawal, p2p_transfer, pos_sale, affiliate_payout, blog_claim
  amount NUMERIC NOT NULL CHECK (amount > 0),
  fee NUMERIC DEFAULT 0,
  description TEXT,
  status TEXT DEFAULT 'completed', -- completed, pending, failed
  recipient_or_sender TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast ledger lookups by reference or date
CREATE INDEX IF NOT EXISTS idx_mboka_tx_created ON mboka_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mboka_tx_ref ON mboka_transactions(reference);

-- 3. Creator Blog Articles & Monetization
CREATE TABLE IF NOT EXISTS mboka_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  author TEXT NOT NULL,
  category TEXT DEFAULT 'Business & Hustle',
  read_time TEXT DEFAULT '3 min read',
  cover_image TEXT,
  claps INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  earnings_ksh NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Affiliate Downlines & Commission Tracking
CREATE TABLE IF NOT EXISTS mboka_invited_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  joined_date TEXT,
  status TEXT DEFAULT 'qualified', -- qualified, pending_verification
  bonus_earned NUMERIC DEFAULT 150,
  pos_volume_generated NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE mboka_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mboka_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mboka_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mboka_invited_users ENABLE ROW LEVEL SECURITY;

-- Allow public read & write access for authenticated web app client operations
CREATE POLICY "Public Read mboka_profiles" ON mboka_profiles FOR SELECT USING (true);
CREATE POLICY "Public Write mboka_profiles" ON mboka_profiles FOR ALL USING (true);

CREATE POLICY "Public Read mboka_transactions" ON mboka_transactions FOR SELECT USING (true);
CREATE POLICY "Public Insert mboka_transactions" ON mboka_transactions FOR ALL USING (true);

CREATE POLICY "Public Read mboka_articles" ON mboka_articles FOR SELECT USING (true);
CREATE POLICY "Public Write mboka_articles" ON mboka_articles FOR ALL USING (true);

CREATE POLICY "Public Read mboka_invited_users" ON mboka_invited_users FOR SELECT USING (true);
CREATE POLICY "Public Write mboka_invited_users" ON mboka_invited_users FOR ALL USING (true);

-- ====================================================================
-- INITIAL SEED DATA (Default System User & Demo Transactions)
-- ====================================================================
INSERT INTO mboka_profiles (id, name, phone, email, role, referral_code, is_kyc_verified, wallet_pin)
VALUES 
  ('usr_main_01', 'Brian Mwangi', '+254 712 345 678', 'brian.mwangi@mboka.co.ke', 'Super Admin & Merchant', 'MBOKA-9042', true, '1234')
ON CONFLICT (id) DO NOTHING;

INSERT INTO mboka_transactions (id, reference, type, amount, fee, description, status, recipient_or_sender)
VALUES 
  ('tx_init_01', 'MBK-DEP-8841', 'deposit', 5000, 0, 'M-Pesa Express Deposit to Working Float', 'completed', '+254 712 345 678'),
  ('tx_init_02', 'MBK-POS-9932', 'pos_sale', 1000, 0, 'KPLC Prepaid Electricity Token Sale', 'completed', 'Meter: 14285739201')
ON CONFLICT (id) DO NOTHING;
