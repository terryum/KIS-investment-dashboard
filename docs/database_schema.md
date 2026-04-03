# 데이터베이스 스키마 설계

> Supabase (PostgreSQL). v1 스키마 기반 확장.
> 이 문서는 하네스 에이전트의 초기 가이드라인이다. 구현 시 개선 가능.

---

## 스키마 개요

### v1 테이블 현황 (12개 + 보조 3개)

| 테이블 | v2 상태 | 변경 내용 |
|--------|---------|----------|
| `accounts` | ✅ 유지 | |
| `assets_master` | ✅ 유지 | ETF 분류 필드 강화 |
| `daily_snapshots` | 🔄 변경 | → `snapshots` (주간 + 수동) |
| `holding_snapshots` | 🔄 변경 | 스냅샷 전략 변경 반영 |
| `transactions` | ✅ 유지 | |
| `income` | ✅ 유지 | |
| `manual_assets` | ✅ 유지 | 발행어음, RP 카테고리 추가 |
| `manual_assets_history` | ✅ 유지 | |
| `journals` | ✅ 유지 | |
| `chat_sessions` | ✅ 유지 | |
| `chat_messages` | ✅ 유지 | |
| `market_content` | 🔄 변경 | 소스 관리 체계 강화 |
| `app_settings` | ✅ 유지 | |
| `kis_token_cache` | ✅ 유지 | |
| `bond_issue_info` | ✅ 유지 | |
| `holdings_cache` | ✅ 유지 | |

### v2 신규 테이블

| 테이블 | 용도 |
|--------|------|
| `cash_flows` | 입출금 추적 (노동소득 유입 vs 투자수익 구분) |
| `market_sources` | 마켓 인사이트 팔로우 소스 관리 |
| `watchlist` | 관심 종목 워치리스트 |
| `exchange_rates` | 환율 기록 (v1에서 types에만 존재, 정식 테이블화) |

---

## 커스텀 타입 (Enum)

```sql
-- v1에서 유지
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

-- v2 신규
CREATE TYPE snapshot_type AS ENUM (
  'weekly',    -- 정기 금요일 16:00 KST
  'manual'     -- 사용자 수동 요청
);

CREATE TYPE cash_flow_type AS ENUM (
  'deposit',     -- 외부 → 증권계좌 입금
  'withdrawal',  -- 증권계좌 → 외부 출금
  'internal'     -- 계좌 간 이체 (수익률 영향 없음)
);

CREATE TYPE source_type AS ENUM (
  'youtube', 'blog', 'newsletter', 'analyst',
  'news', 'podcast', 'twitter', 'other'
);

CREATE TYPE source_perspective AS ENUM (
  'bullish', 'bearish', 'value', 'growth',
  'macro', 'bond', 'balanced', 'other'
);
```

---

## 테이블 상세

### accounts (증권 계좌)

v1과 동일. KIS API 인증 정보 포함.

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_no TEXT NOT NULL UNIQUE,  -- '12345678-01' 형식
  alias TEXT,                        -- '메인 주식', 'IRP' 등
  app_key TEXT NOT NULL,
  app_secret TEXT NOT NULL,
  account_type TEXT DEFAULT 'stock', -- stock, pension, isa, cma
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: service_role만 접근 (API 키 보호)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON accounts FOR ALL USING (false);
```

### assets_master (자산 마스터 + 분류 태그)

ETF 분류 필드를 강화.

```sql
CREATE TABLE assets_master (
  ticker TEXT PRIMARY KEY,              -- '005930', 'AAPL', 'KR1234567890' (채권)
  name TEXT NOT NULL,
  name_en TEXT,
  market_type TEXT,                      -- KRX, NASDAQ, NYSE, BOND, ETF 등
  asset_class TEXT,                      -- stock, bond, etf, reit, commodity, crypto, alternative
  currency TEXT DEFAULT 'KRW',           -- KRW, USD, CNY, EUR 등

  -- ETF 분류 (v2 강화)
  tags JSONB DEFAULT '{}',
  -- tags 구조:
  -- {
  --   "country": "US",
  --   "sector": "Tech",
  --   "style": "Growth",
  --   "real_asset_class": "bond",     -- ETF지만 실제 자산군 (채권ETF→bond, 금ETF→commodity)
  --   "real_currency": "CNY",         -- 실제 통화 (차이나ETF→CNY)
  --   "is_hedged": true,              -- (H), (합성) 여부
  --   "etf_structure": "broad",       -- broad, factor, sector, theme, individual
  --   "ai_classified": true,
  --   "ai_classified_at": "2026-04-04",
  --   "manual_override": false
  -- }

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_assets_master_tags ON assets_master USING GIN (tags);
```

### snapshots (포트폴리오 스냅샷 — v1 `daily_snapshots` 대체)

주간 + 수동 스냅샷 지원.

```sql
CREATE TABLE snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  snapshot_type snapshot_type NOT NULL DEFAULT 'weekly',
  label TEXT,                            -- 수동 스냅샷 시 메모 ('리밸런싱 전', '폭락 기록' 등)

  -- 자산 총액
  total_value NUMERIC NOT NULL,          -- 전체 평가금 (KRW)
  total_invested NUMERIC,                -- 총 투자원금
  cash_balance NUMERIC DEFAULT 0,
  manual_assets_total NUMERIC DEFAULT 0,

  -- 손익
  unrealized_pnl NUMERIC DEFAULT 0,
  realized_pnl_ytd NUMERIC DEFAULT 0,

  -- 현금흐름 (해당 기간)
  net_cash_inflow NUMERIC DEFAULT 0,     -- 해당 기간 순입금 (노동소득 유입)

  -- 상세 데이터
  details JSONB,                         -- 계좌별/자산군별 요약

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(date, snapshot_type)
);

CREATE INDEX idx_snapshots_date ON snapshots (date DESC);
```

### holding_snapshots (종목별 스냅샷)

스냅샷 시점의 종목별 보유 상세.

```sql
CREATE TABLE holding_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID REFERENCES snapshots(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  account_no TEXT NOT NULL,
  ticker TEXT NOT NULL,

  -- 종목 정보
  name TEXT,
  market TEXT,                           -- KRX, NASDAQ, BOND 등
  asset_type TEXT,                       -- stock, bond, etf, fund, els, rp, note 등

  -- 수량/가격
  quantity NUMERIC NOT NULL DEFAULT 0,
  avg_price NUMERIC DEFAULT 0,
  current_price NUMERIC DEFAULT 0,

  -- 금액
  purchase_amount NUMERIC DEFAULT 0,
  evaluation_amount NUMERIC DEFAULT 0,

  -- 손익
  pnl NUMERIC DEFAULT 0,
  pnl_percent NUMERIC DEFAULT 0,

  -- 통화
  currency TEXT DEFAULT 'KRW',
  exchange_rate NUMERIC DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(date, account_no, ticker)
);

CREATE INDEX idx_holding_snapshots_date ON holding_snapshots (date DESC);
CREATE INDEX idx_holding_snapshots_ticker ON holding_snapshots (ticker, date DESC);

ALTER TABLE holding_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON holding_snapshots FOR ALL USING (false);
```

### cash_flows (현금흐름 추적 — v2 신규)

노동소득 유입 vs 투자수익 구분의 핵심 테이블.

```sql
CREATE TABLE cash_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  account_no TEXT NOT NULL,

  flow_type cash_flow_type NOT NULL,
  amount NUMERIC NOT NULL,               -- 양수 = 입금, 음수 = 출금
  currency TEXT DEFAULT 'KRW',

  -- 분류
  description TEXT,                      -- '급여 이체', '생활비 출금' 등
  is_investment_related BOOLEAN DEFAULT false,  -- true = 투자 목적 (종목 매수 자금 등)

  -- 기간 집계용
  month TEXT GENERATED ALWAYS AS (to_char(date, 'YYYY-MM')) STORED,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cash_flows_date ON cash_flows (date DESC);
CREATE INDEX idx_cash_flows_month ON cash_flows (month);
CREATE INDEX idx_cash_flows_account ON cash_flows (account_no, date DESC);

ALTER TABLE cash_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON cash_flows FOR ALL USING (false);
```

### transactions (거래 내역)

v1과 동일 + kis_order_no.

```sql
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
```

### income (배당금/분배금/이자)

v1과 동일.

```sql
CREATE TABLE income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_no TEXT NOT NULL,
  date DATE NOT NULL,
  ticker TEXT,
  name TEXT,
  type income_type NOT NULL,
  amount NUMERIC NOT NULL,               -- 세후
  amount_gross NUMERIC,                  -- 세전
  tax NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_income_date ON income (date DESC);
CREATE INDEX idx_income_account ON income (account_no, date DESC);
CREATE INDEX idx_income_ticker ON income (ticker);
CREATE INDEX idx_income_year ON income (EXTRACT(YEAR FROM date));
```

### manual_assets (수동 자산)

발행어음, RP 카테고리 추가.

```sql
CREATE TABLE manual_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  -- 카테고리 값: real_estate, pension, deposit, loan, bond,
  --             els_dls, rp, note (발행어음), stock, other
  name TEXT NOT NULL,
  current_value NUMERIC NOT NULL,
  currency TEXT DEFAULT 'KRW',
  is_liability BOOLEAN DEFAULT false,
  account_no TEXT,                        -- 소속 증권사/계좌 (선택)
  purchase_amount NUMERIC,
  valued_at DATE,
  metadata JSONB DEFAULT '{}',
  -- metadata 구조 (카테고리별):
  -- bond: { maturity_date, coupon_rate, ytm, face_value }
  -- els_dls: { product_type, maturity_date, underlying }
  -- rp: { maturity_date, interest_rate }
  -- note: { issuer, maturity_date, interest_rate }  (발행어음)
  -- real_estate: { address, purchase_date, loan_amount }
  notes TEXT,
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### manual_assets_history (수동 자산 변동)

```sql
CREATE TABLE manual_assets_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES manual_assets(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### journals (투자 저널)

v1과 동일.

```sql
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
```

### market_sources (마켓 인사이트 소스 — v2 신규)

팔로우할 정보 소스 관리.

```sql
CREATE TABLE market_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                     -- '홍길동의 투자일기' 등
  url TEXT,
  type source_type NOT NULL,
  perspective source_perspective DEFAULT 'balanced',
  language TEXT DEFAULT 'ko',             -- ko, en
  topics TEXT[],                          -- ['주식', '채권', '매크로'] 등
  is_active BOOLEAN DEFAULT true,
  added_by TEXT DEFAULT 'user',           -- 'user' | 'agent'
  notes TEXT,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### market_content (마켓 콘텐츠)

v1 기반 + 소스 참조 추가.

```sql
CREATE TABLE market_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES market_sources(id),
  title TEXT NOT NULL,
  url TEXT,
  summary TEXT,                           -- AI 요약
  relevance_score NUMERIC,               -- 포트폴리오 관련도 (0-1)
  related_tickers TEXT[],
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_market_content_published ON market_content (published_at DESC);
CREATE INDEX idx_market_content_tickers ON market_content USING GIN (related_tickers);
```

### watchlist (관심 종목 — v2 신규)

```sql
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  name TEXT,
  market TEXT,
  reason TEXT,                            -- 관심 사유
  target_price NUMERIC,
  alert_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### exchange_rates (환율)

v1에서 types에만 존재하던 것을 정식 테이블화.

```sql
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  currency TEXT NOT NULL,                 -- USD, CNY, EUR 등
  rate NUMERIC NOT NULL,                  -- 1 외화 = N KRW
  source TEXT DEFAULT 'koreaexim',

  UNIQUE(date, currency)
);

CREATE INDEX idx_exchange_rates_date ON exchange_rates (date DESC, currency);
```

### 기타 유지 테이블

```sql
-- chat_sessions, chat_messages: v1과 동일 (AI 상담)
-- app_settings: v1과 동일 (PIN 등 설정값)
-- kis_token_cache: v1과 동일 (API 토큰 캐싱)
-- bond_issue_info: v1과 동일 (채권 발행정보 캐시)
-- holdings_cache: v1과 동일 (종목별 집계 캐시)
```

---

## 뷰 (Views)

```sql
-- 최신 스냅샷
CREATE VIEW v_latest_snapshot AS
SELECT * FROM snapshots
WHERE date = (SELECT MAX(date) FROM snapshots);

-- 연간 인컴 요약
CREATE VIEW v_income_summary_ytd AS
SELECT
  EXTRACT(YEAR FROM date) AS year,
  type,
  SUM(amount) AS total_amount,
  COUNT(*) AS count
FROM income
GROUP BY EXTRACT(YEAR FROM date), type;

-- 월별 현금흐름 요약
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

-- 최신 보유현황 집계
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
```

---

## RLS 정책 요약

모든 민감 테이블에 RLS 적용. anon key로는 접근 불가.

```sql
-- 민감 테이블: service_role만 접근
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_snapshots ENABLE ROW LEVEL SECURITY;  -- (또는 snapshots)
ALTER TABLE holding_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE kis_token_cache ENABLE ROW LEVEL SECURITY;

-- 각 테이블에 동일 정책
CREATE POLICY "Service role only" ON {table_name}
  FOR ALL USING (false);
-- service_role은 RLS bypass하므로 서버에서 정상 접근

-- app_settings: PIN 검증용 제한적 읽기
CREATE POLICY "Pin verification only" ON app_settings
  FOR SELECT USING (key = 'pin_hash');
```

---

## 마이그레이션 전략

v1 마이그레이션 파일(001~007)을 참조하되, v2는 새로운 단일 초기 마이그레이션으로 시작:

```
supabase/migrations/
  001_initial_schema.sql      -- 전체 테이블/뷰/인덱스/RLS (v2 통합)
  002_seed_app_settings.sql   -- PIN 등 초기 설정값
```

추후 스키마 변경은 순차적 마이그레이션 파일 추가.

---

## 테이블 수 집계

| 구분 | 수 |
|------|---|
| v1 유지 | 15 |
| v2 변경 | 2 (snapshots, market_content) |
| v2 신규 | 4 (cash_flows, market_sources, watchlist, exchange_rates) |
| **합계** | **19** |
