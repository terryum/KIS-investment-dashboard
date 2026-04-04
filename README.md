# KIS Stock Dashboard

한국투자증권(KIS) OpenAPI 기반 개인 자산관리 대시보드.

다수의 증권 계좌와 수동 자산(타 증권사, 부동산, 예금 등)을 통합하여 총 자산 현황, 자산 배분, 수익률, 시장 인사이트, 투자 저널을 하나의 화면에서 관리합니다.

## 주요 기능

| 메뉴 | 설명 |
|------|------|
| **대시보드** | 총 자산, 손익, 자산군 비중, 상위 종목, 최근 인컴 |
| **계좌별 현황** | 계좌 단위 보유 종목 상세, 수동 자산 관리 |
| **자산 배분** | 자산군/국가/통화/주식구조/채권구조 5차원 분석 |
| **수익률 분석** | 주간 스냅샷 기반 수익률, 현금흐름 추적, 배당/이자 |
| **마켓 인사이트** | 뉴스, 투자의견, 팔로우 소스 관리, AI 요약 |
| **투자 저널** | 매매 기록, 판단 근거, 사후 결과 분석 |

## 기술 스택

- **Frontend**: Next.js 16 (App Router), shadcn/ui, Tailwind CSS v4, Recharts 3
- **State**: Zustand 5, TanStack React Query 5, IndexedDB 캐시
- **Backend**: Next.js API Routes (서버사이드 전용)
- **DB**: Supabase (PostgreSQL)
- **AI**: Vercel AI SDK v6 + OpenAI GPT-4o
- **배포**: Vercel (Cron Jobs 포함)
- **보안**: PIN 인증, httpOnly 쿠키, gitleaks pre-commit, Supabase RLS

## 시작하기

### 1. Fork & Clone

```bash
# 이 레포를 fork한 뒤 clone
git clone https://github.com/YOUR_USERNAME/KIS-stock-dashboard.git
cd KIS-stock-dashboard
npm install
```

### 2. Supabase 설정

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 마이그레이션 실행:

```sql
-- supabase/migrations/001_initial_schema.sql 내용을 복사하여 실행
-- supabase/migrations/002_login_history.sql 내용을 복사하여 실행
```

3. Project URL, anon key, service role key를 복사

### 3. KIS API 키 발급

1. [KIS API Portal](https://apiportal.koreainvestment.com/)에서 앱 등록
2. 각 증권 계좌별로 앱 키(appkey)와 시크릿(appsecret) 발급
3. Supabase `accounts` 테이블에 계좌 정보 등록:

```sql
INSERT INTO accounts (account_no, alias, app_key, app_secret, account_type, is_active)
VALUES
  ('계좌번호-상품코드', '별명', '앱키', '앱시크릿', 'stock', true);

-- account_type: stock(위탁), pension(연금), isa, cma
-- 상품코드: 01(위탁), 22(개인연금), 29(퇴직연금IRP)
-- CMA(21)는 API 미지원 → 수동 자산으로 관리
```

### 4. PIN 설정

4자리 PIN의 SHA-256 해시를 생성하여 Supabase에 저장:

```bash
# PIN 해시 생성 (예: PIN이 1234인 경우)
echo -n "1234" | shasum -a 256 | awk '{print $1}'
```

```sql
INSERT INTO app_settings (key, value)
VALUES ('pin_hash', '"여기에_위에서_생성한_해시값"'::jsonb);
```

### 5. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local`을 열어 실제 값으로 채우세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
KOREAEXIM_API_KEY=your-eximbank-api-key
PIN_HASH=your-pin-sha256-hash
CRON_SECRET=any-random-string-for-cron-auth
```

> `.env.local`은 `.gitignore`에 포함되어 있으므로 절대 커밋되지 않습니다.

### 6. 로컬 실행

```bash
npm run dev
```

http://localhost:3000 에서 PIN을 입력하여 로그인하세요.

### 7. Vercel 배포 (선택)

```bash
npm i -g vercel
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENAI_API_KEY
vercel env add KOREAEXIM_API_KEY
vercel env add PIN_HASH
vercel env add CRON_SECRET
vercel deploy --prod
```

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지 + API Routes
│   ├── dashboard/          # 대시보드
│   ├── accounts/           # 계좌별 현황
│   ├── allocation/         # 자산 배분
│   ├── performance/        # 수익률 분석
│   ├── insights/           # 마켓 인사이트
│   ├── journal/            # 투자 저널
│   └── api/                # 서버사이드 API (46+ 라우트)
├── components/             # React 컴포넌트 (60+)
├── hooks/                  # React Query 훅
├── lib/
│   ├── kis/                # KIS API 클라이언트 (토큰, rate limit, 다중계좌)
│   ├── supabase/           # Supabase 클라이언트 (서버/클라이언트 분리)
│   ├── allocation/         # ETF 분류 + 5차원 자산배분 엔진
│   ├── cache/              # IndexedDB 2단 캐시
│   └── auth/               # PIN 인증 미들웨어
├── stores/                 # Zustand 스토어
└── types/                  # TypeScript 타입
docs/                       # 기술 문서
├── kis_api_guide.md        # KIS API 통합 가이드 + 실전 레슨
├── kis_api_catalog.md      # KIS API 전체 카탈로그 (350+)
├── database_schema.md      # DB 스키마 (22 테이블)
├── api_routes.md           # API 라우트 설계 (46+)
├── security_architecture.md # 보안 아키텍처
└── ...
supabase/migrations/        # DB 마이그레이션 SQL
```

## 공개 vs 비공개

이 레포는 **공개**입니다. KIS API 활용 예시와 자산관리 대시보드 템플릿을 제공합니다.

| 공개 (이 레포에 포함) | 비공개 (포함되지 않음) |
|---------------------|---------------------|
| 모든 소스 코드 | API 키, 시크릿 |
| DB 스키마 (DDL) | 실제 DB 데이터 |
| `.env.example` (플레이스홀더) | `.env.local` (실제 값) |
| KIS API 가이드 | 계좌번호, 자산 정보 |
| 보안 아키텍처 문서 | 배포 URL |

### 보안

- **gitleaks**: pre-commit 훅으로 시크릿 자동 스캔
- **Supabase RLS**: 모든 민감 테이블에 Row Level Security 적용
- **httpOnly 쿠키**: PIN 인증 토큰은 httpOnly + secure + sameSite=strict
- **에러 sanitization**: API 에러 응답에서 계좌번호/금액 자동 마스킹
- **서버사이드 전용**: KIS API는 클라이언트에서 직접 호출하지 않음

## KIS API 주의사항

이 프로젝트를 개발하면서 발견한 KIS API의 주요 이슈들입니다. 상세 내용은 [`docs/kis_api_guide.md`](docs/kis_api_guide.md)를 참조하세요.

| 이슈 | 요약 |
|------|------|
| 채권 API 필드명 | `output1`이 아닌 `output`에 데이터 반환 |
| 채권 페이지네이션 | `FK200/NK200` 사용 (FK100이 아님), 첫 페이지 `tr_cont=''` |
| CMA 계좌 | 상품코드 21은 API 미지원 → 수동 관리 필요 |
| 해외주식 중복 | NASD+AMEX 양쪽에서 동일 종목 반환 → 중복 제거 필수 |
| 연금 계좌 | 전용 API 미작동, `TTTC8434R` + `FUND_STTL_ICLD_YN='Y'` 사용 |
| 채권 평가금 | `evlu_amt` 필드 없음, 매입금(`buy_amt`)만 제공 |

## 기여

KIS API 관련 이슈나 개선 사항을 발견하시면 [Issues](https://github.com/terryum/KIS-stock-dashboard/issues)에 등록해주세요.

## 라이선스

MIT
