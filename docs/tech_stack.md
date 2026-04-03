# 기술 스택 결정

> 이 문서는 하네스 에이전트의 초기 가이드라인이다.
> 구현 과정에서 더 적합한 기술이 발견되면 에이전트가 제안/변경할 수 있다.

---

## 확정 스택

### 프레임워크: Next.js 16 (App Router)

| 항목 | 내용 |
|------|------|
| 버전 | `next@16` (최신 stable 16.2.x) |
| 라우터 | App Router (기본값) |
| React | 19 |
| 번들러 | Turbopack (기본 dev 번들러) |

**선택 이유**:
- 신규 프로젝트이므로 최신 안정 버전 사용
- Next.js 15는 이미 `latest` 태그가 아님 (16이 기본)
- `use cache` directive, Cache Components, PPR(Partial Prerendering) 활용 가능
- Server Components로 KIS API 호출을 서버에서만 수행 (보안)

> ⚠️ 원래 Next.js 15로 계획했으나, 16이 이미 stable이므로 변경.
> 에이전트가 호환성 문제 발견 시 15.5.x로 다운그레이드 가능.

---

### UI: shadcn/ui + Tailwind CSS v4

| 항목 | 내용 |
|------|------|
| shadcn CLI | `shadcn@4.1.x` (`npx shadcn@latest init`) |
| Tailwind CSS | `4.2.x` |

**shadcn/ui 선택 이유**:
- 컴포넌트 코드가 프로젝트에 복사되어 완전한 커스터마이징 가능
- Tailwind CSS와 자연스러운 통합
- 차트 컴포넌트 포함 (Recharts 기반)
- Vercel 생태계 (`vercel:shadcn` 스킬) 지원 우수

**Tailwind CSS v4 변경사항** (v3 대비):
- `tailwind.config.js` 대신 CSS `@theme` 블록으로 설정
- 자동 content 감지 (content 배열 불필요)
- `oklch` 기반 색상 시스템
- 빌드 속도 대폭 향상
- shadcn CLI v4+가 자동 감지하여 v4 호환 설정 생성

---

### 상태관리: Zustand 5 + TanStack React Query 5

| 항목 | 내용 |
|------|------|
| Zustand | `zustand@5.x` |
| React Query | `@tanstack/react-query@5.x` |

**역할 분담**:
- **Zustand**: 클라이언트 전역 상태 (인증, UI 설정, 선택된 계좌 등)
- **React Query**: 서버 상태 (KIS API 응답, Supabase 데이터, 캐싱)

**Zustand 5 주의사항**:
- 기본 export 제거됨. `import { create } from 'zustand'` 사용
- 미들웨어 명시적 import 필요

**React Query 캐싱 전략**:
- `staleTime: 2 * 60 * 1000` (2분) — 2분 이내 재요청은 캐시 사용
- `gcTime: 30 * 60 * 1000` (30분) — 30분 후 가비지 컬렉션
- IndexedDB 영구 캐시와 병행 (2단 캐싱)

---

### 차트: Recharts 3

| 항목 | 내용 |
|------|------|
| 버전 | `recharts@3.x` |

**선택 이유**:
- shadcn/ui 차트 컴포넌트가 Recharts 기반
- 파이/도넛, 바, 라인, 에리어 차트 등 대시보드에 필요한 차트 유형 지원
- TypeScript 지원 개선 (v3)

**활용 계획**:
- 대시보드: 파이/도넛 (자산배분), 바 (상위종목), 미니 라인 (추이)
- 자산배분: 도넛 + 바 차트 (인터랙티브)
- 수익률: 라인/에리어 차트 (시계열)
- 인컴: 바 차트 (월별), 파이 (유형별)

---

### DB: Supabase (PostgreSQL)

| 항목 | 내용 |
|------|------|
| 클라이언트 | `@supabase/supabase-js@2.x` |

**사용 방식**:
- **서버사이드 전용** (`supabaseAdmin`): service_role 키로 모든 데이터 접근
- **클라이언트**: anon 키만 사용, RLS로 민감 테이블 접근 차단
- 실시간 구독 불사용 (폴링 기반)
- 마이그레이션: `supabase/migrations/` 디렉토리

---

### AI: Vercel AI SDK v6 + OpenAI

| 항목 | 내용 |
|------|------|
| 코어 | `ai@6.x` |
| 프로바이더 | `@ai-sdk/openai@3.x` |
| 모델 | GPT-4o (기본), 비용 민감 작업은 GPT-4o-mini |

**활용 계획**:
- 자산배분 AI 인사이트 (`generateText` / `streamText`)
- ETF 이름 파싱 및 자산 분류 (`generateObject` — structured output)
- 마켓 인사이트 뉴스 요약 (`streamText`)
- 투자 저널 AI 코멘트 (`generateText`)

**AI SDK v6 주의사항**:
- `useChat` 훅 API가 이전 버전과 다름 — 공식 문서 반드시 참조
- 설치 후 `node_modules/ai/` 내 문서 확인 권장

---

### 배포: Vercel

| 항목 | 내용 |
|------|------|
| 배포 | Vercel (자동 배포) |
| 환경 | Preview + Production |
| Cron | 주간 스냅샷 + 인컴 감지 |
| 환경변수 | `vercel env` 관리 |

---

### 인증: 4자리 PIN

- 해시 저장 (Supabase `app_settings` 테이블)
- 세션 유지 (localStorage 또는 httpOnly cookie)
- 모든 API Route에 PIN 검증 미들웨어

---

### 외부 API

| API | 용도 |
|-----|------|
| KIS OpenAPI | 주식/채권/펀드 잔고, 거래내역, 시세, 배당 |
| 한국수출입은행 | 환율 (USD, CNY, EUR 등) |
| OpenAI (via Vercel AI SDK) | AI 인사이트, ETF 분류, 뉴스 요약 |

---

## 캐싱 아키텍처 (2단)

```
[사용자 요청]
    ↓
[React Query 캐시] ← staleTime 2분 이내면 즉시 반환
    ↓ (stale 또는 miss)
[IndexedDB 캐시] ← 영구 저장, 즉시 표시 + 백그라운드 리페치
    ↓ (miss)
[Next.js API Route → KIS API / Supabase]
    ↓
[응답] → IndexedDB 저장 → React Query 캐시 갱신 → UI 업데이트
```

---

## 개발 도구

| 도구 | 용도 |
|------|------|
| gitleaks | pre-commit 시크릿 스캔 |
| husky | Git hooks 관리 |
| TypeScript 5.x | 타입 안전성 |
| ESLint + Prettier | 코드 스타일 |

---

## 버전 요약

| 패키지 | 버전 |
|--------|------|
| `next` | 16.x |
| `react` / `react-dom` | 19.x |
| `shadcn` (CLI) | 4.x |
| `tailwindcss` | 4.x |
| `zustand` | 5.x |
| `@tanstack/react-query` | 5.x |
| `recharts` | 3.x |
| `@supabase/supabase-js` | 2.x |
| `ai` (Vercel AI SDK) | 6.x |
| `@ai-sdk/openai` | 3.x |
