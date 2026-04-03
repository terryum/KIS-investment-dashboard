# 보안 아키텍처: 공개 레포 + 개인 자산 보호

> 이 프로젝트는 **공개 GitHub 레포**로 운영된다.
> KIS API 사용 예시와 자산관리 대시보드 템플릿을 공유하되,
> 개인 자산 정보와 인증 키는 **절대 노출되지 않도록** 설계한다.

---

## 1. 위협 모델

### 보호 대상

| 등급 | 대상 | 노출 시 위험 |
|------|------|------------|
| 🔴 치명 | KIS API 키 (appkey, appsecret) | 불법 자동매매, 자산 탈취 |
| 🔴 치명 | Supabase 서비스 키 | DB 전체 접근, 데이터 삭제 |
| 🔴 치명 | 계좌번호 | API 키와 결합 시 거래 가능 |
| 🟠 높음 | 자산 규모/구조 상세 | 개인 재무정보 노출 |
| 🟠 높음 | PIN 해시, 세션 토큰 | 대시보드 무단 접근 |
| 🟡 중간 | Vercel/OpenAI API 키 | 비용 발생, 서비스 남용 |
| 🟢 허용 | 투자 유형 일반 (주식/채권/부동산 투자한다는 사실) | 공개 가능 |
| 🟢 허용 | KIS API 호출 코드, 대시보드 UI 코드 | 공개 목적 |

### 공격 벡터

| 벡터 | 설명 | 대응 |
|------|------|------|
| Git 히스토리 | 실수로 커밋된 시크릿이 히스토리에 남음 | pre-commit 스캔, .gitignore 철저화 |
| 클라이언트 번들 | `NEXT_PUBLIC_*` 환경변수가 빌드에 포함 | 최소화, 시크릿 절대 사용 금지 |
| API 응답 | 서버가 자산 데이터를 클라이언트에 반환 | PIN 인증 필수, CORS 제한 |
| Vercel 로그 | 런타임 로그에 자산 데이터 기록 | 민감 데이터 로깅 금지 |
| Supabase 직접 접근 | anon key로 DB 직접 쿼리 | RLS 정책, 서버사이드 전용 |
| 에러 메시지 | 스택트레이스에 계좌번호 등 포함 | sanitized 에러 응답 |
| 하드코딩 | 코드에 계좌번호/금액 리터럴 | lint 규칙, 코드 리뷰 |

---

## 2. 아키텍처 원칙

### 원칙 1: 시크릿은 환경변수에만 존재한다

```
절대 커밋되면 안 되는 것:
- .env, .env.local, .env.production
- KIS appkey, appsecret
- 계좌번호 (어떤 형태로든)
- Supabase service role key
- OpenAI API key
- Vercel token
- PIN 해시값
- CRON_SECRET
```

프로젝트에는 `.env.example`만 커밋하며, 값은 플레이스홀더:

```bash
# .env.example (이 파일만 커밋)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
OPENAI_API_KEY=sk-your-key-here
PIN_HASH=your-pin-hash-here
CRON_SECRET=your-cron-secret-here
# KIS 계좌 정보는 Supabase accounts 테이블에 저장
# 환경변수에는 KIS 키를 넣지 않음 (DB 기반 다중 계좌 관리)
```

### 원칙 2: 클라이언트에 시크릿을 절대 보내지 않는다

```
✅ 허용: NEXT_PUBLIC_SUPABASE_URL (공개 URL)
✅ 허용: NEXT_PUBLIC_SUPABASE_ANON_KEY (RLS로 보호된 공개 키)

❌ 금지: NEXT_PUBLIC_ 접두사로 시크릿 노출
❌ 금지: 클라이언트 코드에서 KIS API 직접 호출
❌ 금지: 클라이언트 코드에서 service role key 사용
```

모든 KIS API 호출은 Next.js API Route (서버사이드)를 통해서만 수행.

### 원칙 3: DB에 저장된 시크릿도 보호한다

Supabase `accounts` 테이블에 KIS appkey/appsecret이 저장됨.

```sql
-- RLS 정책: anon key로는 accounts 테이블 접근 불가
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- 서비스 키로만 접근 가능 (서버사이드 전용)
CREATE POLICY "Service role only" ON accounts
  FOR ALL USING (false);
-- service_role은 RLS를 bypass하므로 서버에서만 접근 가능
```

### 원칙 4: 코드에 개인 데이터를 하드코딩하지 않는다

```
❌ 금지 예시:
const ACCOUNT_NO = "12345678-01";
const MY_TOTAL_ASSETS = 280000000;
if (ticker === "005930") // 특정 종목 하드코딩도 최소화

✅ 허용 예시:
const account = await getAccountFromDB(accountId);
const DEMO_ACCOUNT = "00000000-01"; // 예시용 더미 값
```

---

## 3. 레이어별 보안 구현

### 3-1. Git 레벨

#### .gitignore (엄격)
```gitignore
# 환경변수 - 모든 변형 차단
.env
.env.*
!.env.example

# Claude/MCP 설정 (개인 토큰 포함 가능)
.mcp.json

# Vercel 프로젝트 설정 (프로젝트 ID 등)
.vercel/

# OS/IDE
.DS_Store
*.swp
.idea/
.vscode/settings.json

# 의존성
node_modules/

# 빌드 산출물
.next/
out/
```

#### pre-commit 시크릿 스캔

[gitleaks](https://github.com/gitleaks/gitleaks) 또는 [git-secrets](https://github.com/awslabs/git-secrets)를 pre-commit hook으로 설치:

```bash
# gitleaks 설치 (macOS)
brew install gitleaks

# pre-commit hook 설정
# .husky/pre-commit
gitleaks protect --staged --verbose
```

커스텀 룰 추가 (`.gitleaks.toml`):

```toml
[extend]
useDefault = true

[[rules]]
id = "kis-appkey"
description = "KIS API App Key"
regex = '''PSbL[A-Za-z0-9]{20,}'''
tags = ["key", "kis"]

[[rules]]
id = "account-number"
description = "Korean securities account number"
regex = '''\d{8}-\d{2}'''
tags = ["account", "pii"]

[[rules]]
id = "supabase-service-key"
description = "Supabase service role key"
regex = '''eyJ[A-Za-z0-9_-]{100,}'''
tags = ["key", "supabase"]

[[rules]]
id = "hardcoded-amount"
description = "Large hardcoded KRW amounts (potential asset data)"
regex = '''\d{9,}'''
tags = ["pii", "amount"]

[allowlist]
paths = [
  '''\.env\.example''',
  '''docs/.*\.md''',
  '''.*\.test\.(ts|tsx)''',
]
```

#### GitHub 설정
- **Branch protection**: main 브랜치 직접 push 금지, PR 필수
- **Secret scanning**: GitHub 기본 제공 secret scanning 활성화
- **Dependabot**: 보안 취약점 자동 감지

### 3-2. 애플리케이션 레벨

#### API Route 인증 미들웨어

모든 API Route에 PIN 인증 검증 적용:

```typescript
// 모든 /api/* 라우트에 적용
export async function withAuth(request: Request) {
  const pin = request.headers.get('x-pin-token');
  if (!pin || !verifyPin(pin)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

#### Cron Job 인증

```typescript
// /api/cron/* 라우트
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

#### CORS 제한

```typescript
// next.config.js
headers: [
  {
    source: '/api/:path*',
    headers: [
      { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN || '' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
    ],
  },
],
```

#### 에러 응답 sanitization

```typescript
// 클라이언트에 반환하는 에러에서 민감 정보 제거
function sanitizeError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  // 계좌번호 패턴 마스킹
  return msg.replace(/\d{8}-\d{2}/g, '****-**')
            // API 키 마스킹
            .replace(/PSbL[A-Za-z0-9]+/g, '***KEY***')
            // 금액 마스킹 (9자리 이상)
            .replace(/\d{9,}/g, '***');
}
```

#### 로깅 정책

```typescript
// 민감 데이터 로깅 금지
// ❌ console.log(`Balance for ${accountNo}: ${totalValue}`);
// ✅ console.log(`Balance fetched for account [${accountNo.slice(-4)}]`);

function maskAccountNo(accountNo: string): string {
  return `****${accountNo.slice(-4)}`;
}
```

### 3-3. Supabase 레벨

#### RLS (Row Level Security) 정책

```sql
-- 모든 테이블에 RLS 활성화
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE holding_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets_master ENABLE ROW LEVEL SECURITY;

-- anon key로는 어떤 테이블도 직접 접근 불가
-- 모든 데이터 접근은 서버사이드 (service_role) 통해서만
CREATE POLICY "No direct access" ON accounts FOR ALL USING (false);
CREATE POLICY "No direct access" ON daily_snapshots FOR ALL USING (false);
-- ... (모든 테이블에 동일 적용)

-- app_settings만 PIN 검증용으로 제한적 읽기 허용
CREATE POLICY "Pin verification only" ON app_settings
  FOR SELECT USING (key = 'pin_hash');
```

#### Supabase 클라이언트 분리

```typescript
// lib/supabase/server.ts — 서버 전용 (API Routes에서만 사용)
import { createClient } from '@supabase/supabase-js';
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // ❌ 절대 클라이언트에 노출 금지
);

// lib/supabase/client.ts — 클라이언트용 (PIN 검증 등 제한적 용도)
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // RLS로 보호됨
);
// → 클라이언트에서는 RLS 정책에 의해 데이터 접근 불가
// → PIN 검증 등 최소한의 기능만 사용
```

### 3-4. Vercel 레벨

#### 환경변수 관리
- 모든 시크릿은 Vercel Dashboard 또는 `vercel env`로 관리
- Preview/Production 환경별 분리
- `vercel env pull`로 로컬에 `.env.local` 생성 (git에 미포함)

#### 접근 제한
- Vercel 프로젝트 설정에서 **Password Protection** 또는 **Vercel Authentication** 활성화 고려
- 프로덕션 URL을 공개하지 않음 (레포에 URL 미기재)

---

## 4. 공개 vs 비공개 경계

### 커밋되는 것 (공개)

| 파일/디렉토리 | 내용 |
|-------------|------|
| `src/` | 모든 애플리케이션 코드 (TypeScript/React) |
| `supabase/migrations/` | DB 스키마 DDL (데이터 없음) |
| `docs/` | 기술 문서, API 가이드, PRD |
| `.env.example` | 환경변수 템플릿 (값은 플레이스홀더) |
| `package.json` | 의존성 목록 |
| `next.config.js` | Next.js 설정 (시크릿 미포함) |
| `vercel.json` | Cron 스케줄 등 (CRON_SECRET은 환경변수) |
| `.gitleaks.toml` | 시크릿 스캔 설정 |
| `.husky/` | Git hooks |
| `README.md` | 사용 가이드, 설치 방법 |

### 커밋되지 않는 것 (비공개)

| 파일/디렉토리 | 내용 | 보호 방법 |
|-------------|------|----------|
| `.env.local` | 실제 API 키, DB 키 | .gitignore |
| `.env.production` | 프로덕션 키 | .gitignore |
| `.mcp.json` | MCP 설정 (GitHub PAT 등) | .gitignore |
| `.vercel/` | Vercel 프로젝트 링크 | .gitignore |
| Supabase 데이터 | 계좌정보, 자산, 스냅샷 | 클라우드 DB (로컬 파일 없음) |
| KIS API 응답 | 잔고, 체결 데이터 | 메모리에서만 처리, 파일 저장 안 함 |

### README.md 가이드

다른 사용자가 이 레포를 fork하여 자신의 KIS 계좌로 사용할 수 있도록:

```markdown
## 시작하기

1. 이 레포를 fork합니다
2. Supabase 프로젝트를 생성합니다
3. `.env.example`을 `.env.local`로 복사하고 본인의 키를 입력합니다
4. KIS API 키는 Supabase `accounts` 테이블에 등록합니다
5. `npm install && npm run dev`로 시작합니다

⚠️ 절대 `.env.local`을 커밋하지 마세요!
```

---

## 5. 개발 시 보안 체크리스트

### 코드 작성 시
- [ ] 환경변수/시크릿을 하드코딩하지 않았는가?
- [ ] 계좌번호, 금액 등 개인정보를 리터럴로 쓰지 않았는가?
- [ ] `NEXT_PUBLIC_` 접두사에 시크릿을 넣지 않았는가?
- [ ] 클라이언트 코드에서 KIS API를 직접 호출하지 않는가?
- [ ] 에러 메시지에 민감 정보가 포함되지 않는가?
- [ ] console.log에 자산 데이터를 출력하지 않는가?

### 커밋 전
- [ ] `gitleaks protect --staged` 통과 확인
- [ ] `git diff --staged`에서 시크릿 패턴 수동 확인
- [ ] `.env.example`만 커밋하고 `.env.local`은 미포함 확인

### 배포 전
- [ ] Vercel 환경변수가 올바르게 설정되었는가?
- [ ] Supabase RLS 정책이 활성화되었는가?
- [ ] 프로덕션 URL이 코드/문서에 노출되지 않았는가?

---

## 6. 테스트 데이터 전략

공개 레포이므로 테스트 코드에 실제 데이터를 사용할 수 없다.

### Mock 데이터 원칙
```typescript
// ✅ 테스트용 더미 데이터
const MOCK_HOLDINGS = [
  { ticker: 'SAMPLE01', name: '샘플주식A', quantity: 100, avgPrice: 50000 },
  { ticker: 'SAMPLE02', name: '샘플ETF', quantity: 50, avgPrice: 30000 },
];

// ✅ 더미 계좌번호
const MOCK_ACCOUNT = '00000000-01';

// ❌ 실제 데이터 절대 금지
```

### KIS API 응답 Mock
- 테스트용 KIS API 응답 fixture는 더미 데이터로 생성
- 실제 API 응답을 그대로 커밋하지 않음 (계좌번호/종목 포함 가능)

---

## 7. 사고 대응

### 시크릿이 커밋된 경우
1. **즉시** 해당 키 폐기/재발급 (KIS 앱키, Supabase 키 등)
2. `git filter-branch` 또는 `bfg-repo-cleaner`로 히스토리에서 제거
3. GitHub에 force push
4. GitHub Secret Scanning Alert 확인

### 의심스러운 접근 감지 시
1. KIS API 토큰 즉시 폐기
2. Supabase 키 로테이션
3. Vercel 환경변수 업데이트
4. PIN 변경
