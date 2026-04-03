---
name: kis-dashboard-orchestrator
description: "KIS 투자관리 대시보드 전체 빌드를 조율하는 오케스트레이터. 7명의 에이전트 팀(Architect, Backend, Frontend, Asset-Intelligence, Market-Intelligence, Security, QA)을 Phase별로 구성하여 프로젝트를 완성한다. '빌드 시작', '구현 시작', '개발 시작' 요청 시 반드시 이 스킬을 사용한다."
---

# KIS Dashboard Orchestrator

## 실행 모드: 에이전트 팀

## 에이전트 구성

| 팀원 | Agent 정의 | 타입 | 스킬 | 역할 |
|------|-----------|------|------|------|
| architect | .claude/agents/architect.md | general-purpose | scaffold | 프로젝트 구조, 스캐폴딩 |
| backend | .claude/agents/backend.md | general-purpose | kis-integration | API, DB, KIS 클라이언트 |
| frontend | .claude/agents/frontend.md | general-purpose | ui-page | 페이지, 컴포넌트, 차트 |
| asset-intel | .claude/agents/asset-intelligence.md | general-purpose | asset-classification | ETF 분류, 배분 계산 |
| market-intel | .claude/agents/market-intelligence.md | general-purpose | market-sources | 소스 관리, 뉴스, AI 요약 |
| security | .claude/agents/security.md | general-purpose | security-review | 보안 리뷰, RLS, 시크릿 스캔 |
| qa | .claude/agents/qa.md | general-purpose | integration-qa | 타입 교차 검증, 경계면 버그 |

**모든 에이전트: model: "opus"**

## 워크플로우

### Phase 0: 준비
1. 프로젝트 문서 확인:
   - `PRD.md`, `feature_list.md`
   - `docs/` 전체 (tech_stack, database_schema, api_routes, ui_spec, kis_api_guide, caching_strategy, security_architecture, kis_api_catalog)
   - `.private/my_context.md` (비공개 컨텍스트)
2. `_workspace/` 디렉토리 생성

### Phase 1: 스캐폴딩 (Architect 단독)

**팀 구성**: architect + security (2명)

```
TeamCreate(team_name: "phase1-scaffold", members: [
  { name: "architect", agent_type: "general-purpose", model: "opus",
    prompt: "scaffold 스킬을 읽고 프로젝트를 초기화하라. docs/tech_stack.md, docs/ui_spec.md, docs/security_architecture.md를 참조한다." },
  { name: "security", agent_type: "general-purpose", model: "opus",
    prompt: "architect가 생성한 파일들의 보안을 검증하라. security-review 스킬을 읽고 .gitignore, .env.example, gitleaks 설정을 확인한다." }
])

TaskCreate(tasks: [
  { title: "프로젝트 스캐폴딩", assignee: "architect" },
  { title: "초기 보안 검증", assignee: "security", depends_on: ["프로젝트 스캐폴딩"] }
])
```

**산출물**:
- Next.js 16 프로젝트 구조
- shadcn/ui + Tailwind v4 설정
- 레이아웃 셸 (사이드바 + 하단탭)
- 보안 기반 (.gitignore, .env.example, gitleaks, husky)

### Phase 2: 핵심 인프라 (Backend + Frontend + Security 병렬)

**Phase 1 팀 정리 후 새 팀 구성**: backend + frontend + asset-intel + security + qa (5명)

```
TeamCreate(team_name: "phase2-core", members: [
  { name: "backend", ..., prompt: "kis-integration 스킬을 읽고 KIS API 클라이언트, 인증 미들웨어, DB 마이그레이션을 구현하라." },
  { name: "frontend", ..., prompt: "ui-page 스킬을 읽고 공통 컴포넌트(MoneyDisplay, PinLogin 등)와 React Query Provider를 구현하라." },
  { name: "asset-intel", ..., prompt: "asset-classification 스킬을 읽고 ETF 분류 로직과 배분 계산 엔진을 구현하라." },
  { name: "security", ..., prompt: "security-review 스킬로 Phase 2 산출물의 보안을 점검하라." },
  { name: "qa", ..., prompt: "integration-qa 스킬로 API-Hook 타입 교차 검증을 점진적으로 수행하라." }
])

TaskCreate(tasks: [
  // Backend (병렬)
  { title: "KIS API 클라이언트", assignee: "backend" },
  { title: "DB 마이그레이션", assignee: "backend" },
  { title: "PIN 인증 미들웨어", assignee: "backend" },
  { title: "환율 API 연동", assignee: "backend" },
  { title: "잔고 조회 API (domestic/overseas/bonds)", assignee: "backend",
    depends_on: ["KIS API 클라이언트", "DB 마이그레이션"] },

  // Frontend (병렬)
  { title: "공통 컴포넌트", assignee: "frontend" },
  { title: "React Query + Zustand Provider", assignee: "frontend" },
  { title: "IndexedDB 캐시 레이어", assignee: "frontend" },
  { title: "PIN 로그인 페이지", assignee: "frontend",
    depends_on: ["PIN 인증 미들웨어"] },

  // Asset Intelligence (병렬)
  { title: "ETF 분류 로직", assignee: "asset-intel" },
  { title: "자산배분 계산 엔진", assignee: "asset-intel" },

  // QA (점진적)
  { title: "Phase 2 QA", assignee: "qa",
    depends_on: ["잔고 조회 API", "공통 컴포넌트"] }
])
```

### Phase 3: 페이지 구현 (Frontend + Backend 병렬)

**팀 재구성**: backend + frontend + asset-intel + market-intel + qa (5명)

```
TaskCreate(tasks: [
  // 대시보드 + 계좌 (P0)
  { title: "대시보드 API", assignee: "backend" },
  { title: "대시보드 페이지", assignee: "frontend", depends_on: ["대시보드 API"] },
  { title: "계좌별 현황 API", assignee: "backend" },
  { title: "계좌별 현황 페이지", assignee: "frontend", depends_on: ["계좌별 현황 API"] },
  { title: "수동 자산 CRUD API", assignee: "backend" },
  { title: "수동 자산 UI", assignee: "frontend", depends_on: ["수동 자산 CRUD API"] },

  // 자산배분 (P0-P1)
  { title: "자산배분 API", assignee: "backend" },
  { title: "자산배분 페이지", assignee: "frontend",
    depends_on: ["자산배분 API", "ETF 분류 로직"] },

  // 수익률 분석 (P0-P1)
  { title: "스냅샷 API + Cron", assignee: "backend" },
  { title: "현금흐름 API", assignee: "backend" },
  { title: "인컴 API", assignee: "backend" },
  { title: "수익률 분석 페이지", assignee: "frontend",
    depends_on: ["스냅샷 API + Cron", "현금흐름 API", "인컴 API"] },

  // 마켓 인사이트 (P1)
  { title: "마켓 소스 관리 API", assignee: "market-intel" },
  { title: "마켓 뉴스/AI 요약 API", assignee: "market-intel" },
  { title: "마켓 인사이트 페이지", assignee: "frontend",
    depends_on: ["마켓 소스 관리 API", "마켓 뉴스/AI 요약 API"] },

  // 투자 저널 (P1)
  { title: "저널 CRUD API", assignee: "backend" },
  { title: "저널 페이지", assignee: "frontend", depends_on: ["저널 CRUD API"] },

  // QA (점진적)
  { title: "대시보드+계좌 QA", assignee: "qa",
    depends_on: ["대시보드 페이지", "계좌별 현황 페이지"] },
  { title: "배분+수익률 QA", assignee: "qa",
    depends_on: ["자산배분 페이지", "수익률 분석 페이지"] },
  { title: "인사이트+저널 QA", assignee: "qa",
    depends_on: ["마켓 인사이트 페이지", "저널 페이지"] }
])
```

### Phase 4: 보안 + 최종 QA

**팀 재구성**: security + qa (2명)

```
TaskCreate(tasks: [
  { title: "전체 보안 리뷰", assignee: "security" },
  { title: "전체 통합 QA (ICV-1~4 + 빌드)", assignee: "qa" },
  { title: "보안 리포트 작성", assignee: "security",
    depends_on: ["전체 보안 리뷰"] },
  { title: "QA 리포트 작성", assignee: "qa",
    depends_on: ["전체 통합 QA"] }
])
```

### Phase 5: 정리

1. 산출물 확인: 모든 페이지 빌드 성공, QA 통과, 보안 검증 통과
2. `_workspace/` 보존 (감사 추적)
3. 팀 정리

## 에러 핸들링

| 에러 유형 | 대응 |
|----------|------|
| KIS API 연동 실패 | Mock 데이터로 개발 계속, 실전 테스트는 Phase 4에서 |
| 빌드 에러 | QA가 에러 분석 → 해당 에이전트에 수정 요청 |
| 타입 불일치 | QA가 양쪽 비교 → 수정 요청 |
| 시크릿 노출 | Security가 즉시 경고 → 해당 코드 수정 |
| 패키지 호환성 | Architect가 대체 버전 탐색 |

## 테스트 시나리오

### 정상 흐름
1. Phase 0 → 문서 확인
2. Phase 1 → 스캐폴딩 + 보안 기반 완료
3. Phase 2 → KIS 클라이언트 + DB + 공통 컴포넌트 완료
4. Phase 3 → 6개 페이지 구현 + 점진적 QA
5. Phase 4 → 전체 보안 리뷰 + 최종 QA
6. Phase 5 → npm run build 성공, 리포트 생성

### 에러 흐름
1. Phase 2에서 KIS API 토큰 발급 실패
2. Backend가 Mock 모드로 전환, Frontend는 Mock 데이터로 개발
3. Phase 4에서 실전 토큰으로 재시도
4. QA가 Mock→실전 전환 시 shape 변경 여부 검증
