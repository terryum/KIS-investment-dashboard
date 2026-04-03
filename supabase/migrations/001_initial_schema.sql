-- ============================================================
-- KIS Investment Dashboard — Initial Schema (v2)
-- All 19 tables, 6+ enums, 4 views, indexes, RLS
-- ============================================================

-- =========================
-- Custom Enums
-- =========================

CREATE TYPE transaction_type AS ENUM (
  'buy', 'sell', 'deposit', 'withdraw',
  'transfer_in', 'transfer_out'
);

CREATE TYPE income_type AS ENUM (
  'dividend', 'distribution', 'interest', 'other'
);

CREATE TYPE journal_type AS ENUM (
  'entry', 'exit', 'note', 'review'
);

CREATE TYPE chat_role AS ENUM (
  'user', 'assistant', 'system'
);

CREATE TYPE snapshot_type AS ENUM (
  'weekly', 'manual'
);

CREATE TYPE cash_flow_type AS ENUM (
  'deposit', 'withdrawal', 'internal'
);

CREATE TYPE source_type AS ENUM (
  'youtube', 'blog', 'newsletter', 'analyst',
  'news', 'podcast', 'twitter', 'other'
);

CREATE TYPE source_perspective AS ENUM (
  'bullish', 'bearish', 'value', 'growth',
  'macro', 'bond', 'balanced', 'other'
);


-- =========================
-- 1. accounts
-- =========================

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_no TEXT NOT NULL UNIQUE,
  alias TEXT,
  app_key TEXT NOT NULL,
  app_secret TEXT NOT NULL,
  account_type TEXT DEFAULT 'stock',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON accounts FOR ALL USING (false);


-- =========================
-- 2. assets_master
-- =========================

CREATE TABLE assets_master (
  ticker TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  market_type TEXT,
  asset_class TEXT,
  currency TEXT DEFAULT 'KRW',
  tags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_assets_master_tags ON assets_master USING GIN (tags);


-- =========================
-- 3. snapshots (replaces daily_snapshots)
-- =========================

CREATE TABLE snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  snapshot_type snapshot_type NOT NULL DEFAULT 'weekly',
  label TEXT,
  total_value NUMERIC NOT NULL,
  total_invested NUMERIC,
  cash_balance NUMERIC DEFAULT 0,
  manual_assets_total NUMERIC DEFAULT 0,
  unrealized_pnl NUMERIC DEFAULT 0,
  realized_pnl_ytd NUMERIC DEFAULT 0,
  net_cash_inflow NUMERIC DEFAULT 0,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, snapshot_type)
);

CREATE INDEX idx_snapshots_date ON snapshots (date DESC);

ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON snapshots FOR ALL USING (false);


-- =========================
-- 4. holding_snapshots
-- =========================

CREATE TABLE holding_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID REFERENCES snapshots(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  account_no TEXT NOT NULL,
  ticker TEXT NOT NULL,
  name TEXT,
  market TEXT,
  asset_type TEXT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  avg_price NUMERIC DEFAULT 0,
  current_price NUMERIC DEFAULT 0,
  purchase_amount NUMERIC DEFAULT 0,
  evaluation_amount NUMERIC DEFAULT 0,
  pnl NUMERIC DEFAULT 0,
  pnl_percent NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'KRW',
  exchange_rate NUMERIC DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, account_no, ticker)
);

CREATE INDEX idx_holding_snapshots_date ON holding_snapshots (date DESC);
CREATE INDEX idx_holding_snapshots_ticker ON holding_snapshots (ticker, date DESC);

ALTER TABLE holding_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON holding_snapshots FOR ALL USING (false);


-- =========================
-- 5. cash_flows
-- =========================

CREATE TABLE cash_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  account_no TEXT NOT NULL,
  flow_type cash_flow_type NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'KRW',
  description TEXT,
  is_investment_related BOOLEAN DEFAULT false,
  month TEXT GENERATED ALWAYS AS (to_char(date, 'YYYY-MM')) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cash_flows_date ON cash_flows (date DESC);
CREATE INDEX idx_cash_flows_month ON cash_flows (month);
CREATE INDEX idx_cash_flows_account ON cash_flows (account_no, date DESC);

ALTER TABLE cash_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON cash_flows FOR ALL USING (false);


-- =========================
-- 6. transactions
-- =========================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_no TEXT NOT NULL,
  date DATE NOT NULL,
  type transaction_type NOT NULL,
  ticker TEXT,
  name TEXT,
  qty NUMERIC DEFAULT 0,
  price NUMERIC DEFAULT 0,
  amount NUMERIC NOT NULL,
  fee NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  realized_pnl NUMERIC,
  notes TEXT,
  kis_order_no TEXT,
  kis_order_time TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transactions_date ON transactions (date DESC);
CREATE INDEX idx_transactions_account ON transactions (account_no, date DESC);
CREATE INDEX idx_transactions_ticker ON transactions (ticker, date DESC);
CREATE INDEX idx_transactions_type ON transactions (type);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON transactions FOR ALL USING (false);


-- =========================
-- 7. income
-- =========================

CREATE TABLE income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_no TEXT NOT NULL,
  date DATE NOT NULL,
  ticker TEXT,
  name TEXT,
  type income_type NOT NULL,
  amount NUMERIC NOT NULL,
  amount_gross NUMERIC,
  tax NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_income_date ON income (date DESC);
CREATE INDEX idx_income_account ON income (account_no, date DESC);
CREATE INDEX idx_income_ticker ON income (ticker);
CREATE INDEX idx_income_year ON income (EXTRACT(YEAR FROM date));

ALTER TABLE income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON income FOR ALL USING (false);


-- =========================
-- 8. manual_assets
-- =========================

CREATE TABLE manual_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  current_value NUMERIC NOT NULL,
  currency TEXT DEFAULT 'KRW',
  is_liability BOOLEAN DEFAULT false,
  account_no TEXT,
  purchase_amount NUMERIC,
  valued_at DATE,
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE manual_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON manual_assets FOR ALL USING (false);


-- =========================
-- 9. manual_assets_history
-- =========================

CREATE TABLE manual_assets_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES manual_assets(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- =========================
-- 10. journals
-- =========================

CREATE TABLE journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT,
  transaction_id UUID REFERENCES transactions(id),
  type journal_type NOT NULL DEFAULT 'note',
  title TEXT NOT NULL,
  content TEXT,
  entry_price NUMERIC,
  target_price NUMERIC,
  stop_loss_price NUMERIC,
  exit_price NUMERIC,
  holding_days INTEGER,
  realized_return NUMERIC,
  tags JSONB DEFAULT '[]',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_journals_ticker ON journals (ticker);
CREATE INDEX idx_journals_created ON journals (created_at DESC);
CREATE INDEX idx_journals_tags ON journals USING GIN (tags);

ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON journals FOR ALL USING (false);


-- =========================
-- 11. market_sources
-- =========================

CREATE TABLE market_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT,
  type source_type NOT NULL,
  perspective source_perspective DEFAULT 'balanced',
  language TEXT DEFAULT 'ko',
  topics TEXT[],
  is_active BOOLEAN DEFAULT true,
  added_by TEXT DEFAULT 'user',
  notes TEXT,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- =========================
-- 12. market_content
-- =========================

CREATE TABLE market_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES market_sources(id),
  title TEXT NOT NULL,
  url TEXT,
  summary TEXT,
  relevance_score NUMERIC,
  related_tickers TEXT[],
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_market_content_published ON market_content (published_at DESC);
CREATE INDEX idx_market_content_tickers ON market_content USING GIN (related_tickers);


-- =========================
-- 13. watchlist
-- =========================

CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  name TEXT,
  market TEXT,
  reason TEXT,
  target_price NUMERIC,
  alert_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- =========================
-- 14. exchange_rates
-- =========================

CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  source TEXT DEFAULT 'koreaexim',
  UNIQUE(date, currency)
);

CREATE INDEX idx_exchange_rates_date ON exchange_rates (date DESC, currency);


-- =========================
-- 15. chat_sessions
-- =========================

CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- =========================
-- 16. chat_messages
-- =========================

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role chat_role NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_messages_session ON chat_messages (session_id, created_at);


-- =========================
-- 17. app_settings
-- =========================

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pin verification only" ON app_settings
  FOR SELECT USING (key = 'pin_hash');


-- =========================
-- 18. kis_token_cache
-- =========================

CREATE TABLE kis_token_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT NOT NULL,
  token_expired TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE kis_token_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON kis_token_cache FOR ALL USING (false);


-- =========================
-- 19. bond_issue_info
-- =========================

CREATE TABLE bond_issue_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_code TEXT NOT NULL UNIQUE,
  bond_name TEXT,
  coupon_rate NUMERIC,
  interest_payment_cycle TEXT,
  maturity_date DATE,
  face_value NUMERIC,
  issue_date DATE,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- =========================
-- 20. holdings_cache (aggregated holdings)
-- =========================

CREATE TABLE holdings_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  account_no TEXT NOT NULL,
  name TEXT,
  market TEXT,
  asset_type TEXT,
  quantity NUMERIC DEFAULT 0,
  avg_price NUMERIC DEFAULT 0,
  current_price NUMERIC DEFAULT 0,
  purchase_amount NUMERIC DEFAULT 0,
  evaluation_amount NUMERIC DEFAULT 0,
  pnl NUMERIC DEFAULT 0,
  pnl_percent NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'KRW',
  exchange_rate NUMERIC DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ticker, account_no)
);

ALTER TABLE holdings_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON holdings_cache FOR ALL USING (false);


-- =========================
-- Views
-- =========================

-- Latest snapshot
CREATE VIEW v_latest_snapshot AS
SELECT * FROM snapshots
WHERE date = (SELECT MAX(date) FROM snapshots);

-- YTD income summary
CREATE VIEW v_income_summary_ytd AS
SELECT
  EXTRACT(YEAR FROM date) AS year,
  type,
  SUM(amount) AS total_amount,
  COUNT(*) AS count
FROM income
GROUP BY EXTRACT(YEAR FROM date), type;

-- Monthly cash flows
CREATE VIEW v_monthly_cash_flows AS
SELECT
  month,
  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS total_inflow,
  SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END) AS total_outflow,
  SUM(amount) AS net_flow
FROM cash_flows
WHERE flow_type != 'internal'
GROUP BY month
ORDER BY month DESC;

-- Aggregated holdings (latest snapshot)
CREATE VIEW v_holdings_aggregated AS
SELECT
  ticker,
  name,
  SUM(quantity) AS total_quantity,
  SUM(purchase_amount) AS total_purchase,
  SUM(evaluation_amount) AS total_evaluation,
  CASE
    WHEN SUM(purchase_amount) > 0
    THEN (SUM(evaluation_amount) - SUM(purchase_amount)) / SUM(purchase_amount) * 100
    ELSE 0
  END AS pnl_percent,
  currency
FROM holding_snapshots
WHERE date = (SELECT MAX(date) FROM holding_snapshots)
GROUP BY ticker, name, currency;
