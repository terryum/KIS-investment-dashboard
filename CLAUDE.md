# CLAUDE.md — KIS 투자관리 대시보드

## 프로젝트
KIS OpenAPI 기반 개인 자산관리 대시보드. **공개 GitHub 레포**.

## 기술 스택
Next.js 16 (App Router) · shadcn/ui · Tailwind CSS v4 · Zustand 5 · React Query 5 · Recharts 3 · Supabase · Vercel AI SDK v6 · TypeScript strict

## 절대 하지 말 것 (NEVER)
- 계좌번호, API 키, 자산 금액을 코드/문서에 하드코딩
- `NEXT_PUBLIC_` 환경변수에 시크릿 저장
- 클라이언트에서 KIS API 직접 호출 (반드시 API Route 경유)
- console.log에 자산 데이터 출력
- 에러 응답에 계좌번호/금액 포함 (마스킹 필수)
- `.env.*`, `.private/`, `.vercel/` 을 커밋
- 실제 KIS API 응답을 테스트 fixture로 커밋

## 반드시 할 것 (ALWAYS)
- 모든 API Route에 PIN 인증 미들웨어 적용 (/api/auth/* 제외)
- Cron 라우트에 CRON_SECRET 검증
- Supabase 민감 테이블에 RLS 활성화 (service_role only)
- 연금계좌(22, 29): `FUND_STTL_ICLD_YN='Y'` 파라미터 사용
- 해외주식: NASD/NYSE/AMEX 3회 호출 + 중복 제거
- 채권: `tr_cont` 헤더로 페이지네이션 (20건/페이지)
- 외화현금: `CTRP6504R` 별도 호출
- 금액 표시: 빨간=상승/양수, 파란=하락/음수 (한국 금융 컨벤션)
- ETF 분류: 채권ETF→'bond', 금ETF→'commodity', (H)/(합성)→KRW

## 주요 참조 문서
- `PRD.md` — 제품 요구사항
- `docs/kis_api_guide.md` — KIS API 패턴 + gotcha
- `docs/kis_api_catalog.md` — 350+ API 카탈로그
- `docs/security_architecture.md` — 보안 아키텍처
- `docs/database_schema.md` — DB 스키마 (19개 테이블)
- `.private/my_context.md` — 비공개 개인 컨텍스트 (gitignored)

## 문서 = 가이드라인
PRD, feature_list, 기술 문서는 하네스 에이전트의 초기 입력이다. 더 좋은 구조를 발견하면 자유롭게 개선하라.

## 커밋 전
`gitleaks protect --staged --verbose` 통과 확인.
