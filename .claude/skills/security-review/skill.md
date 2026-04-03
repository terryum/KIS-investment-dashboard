---
name: security-review
description: "시크릿 스캔, 보안 코드 리뷰, Supabase RLS 검증, 에러 sanitization, pre-commit 훅, 공개 레포 안전성 검증. 보안 리뷰, 시크릿 노출 확인, RLS, 인증 미들웨어, .gitignore 관련 작업 시 반드시 이 스킬을 사용한다."
---

# Security Review — 보안 검증

## 검증 체크리스트

### 1. 시크릿 노출 검사
```bash
# 전체 소스에서 시크릿 패턴 탐색
gitleaks detect --source . --verbose
```

수동 패턴 검사:
- 계좌번호 패턴: `/\d{8}-\d{2}/`
- API 키 패턴: `/PSbL[A-Za-z0-9]{20,}/`
- 대형 금액: `/\d{9,}/` (9자리 이상 숫자)
- Supabase 키: `/eyJ[A-Za-z0-9_-]{100,}/`

### 2. 환경변수 검사
- `NEXT_PUBLIC_` 접두사에 시크릿 없는지 확인
- .env.example에 실제 값 없는지 확인
- .gitignore에 .env*, .private/, .vercel/ 포함 확인

### 3. RLS 검증
모든 민감 테이블에 RLS + "Service role only" 정책 확인:
- accounts, snapshots, holding_snapshots, transactions
- income, cash_flows, manual_assets, journals, kis_token_cache

### 4. API 인증 검증
- 모든 /api/* 라우트에 PIN 미들웨어 적용 확인
- /api/cron/* 에 CRON_SECRET 검증 확인
- /api/auth/* 는 인증 불필요 확인

### 5. 에러 sanitization 검증
- API 에러 응답에서 계좌번호 마스킹 확인
- console.log에 자산 데이터 미출력 확인
- 스택트레이스에 민감 정보 미포함 확인

### 6. 클라이언트 보안
- 클라이언트에서 KIS API 직접 호출 없는지 확인
- 클라이언트에서 service_role 키 사용 없는지 확인

## 참조 문서
- `docs/security_architecture.md` — 전체 보안 아키텍처
