---
name: kis-integration
description: "KIS API 클라이언트 구현, 토큰 관리, 다중 계좌 순회, 잔고 조회, 거래내역 동기화, 배당/인컴 감지, Cron Job. KIS API 호출, 증권 데이터, 토큰, rate limit, 잔고, 채권, 해외주식 관련 작업 시 반드시 이 스킬을 사용한다."
---

# KIS Integration — KIS API 클라이언트 & 라우트

## KIS API 클라이언트 구현

### 핵심 클래스: KISClient
```typescript
class KISClient {
  // 토큰 관리 (kis_token_cache 테이블)
  // Rate limit (실전 50ms, 모의 500ms)
  // 재시도 로직 (EGW00133 → 60초, EGW00201 → 100ms)
  // 에러 sanitization (계좌번호/금액 마스킹)
}
```

### 다중 계좌 매니저: AccountManager
```typescript
class AccountManager {
  // DB에서 활성 계좌 조회
  // 계좌별 순회 + 쓰로틀
  // 결과 집계 + 중복 제거
}
```

## API 라우트 구현 순서

### Priority 1: 잔고 조회
1. `/api/kis/balance` — TTTC8434R + TTTS3012R + CTSC8407R
2. `/api/kis/balance/domestic` — TTTC8434R
3. `/api/kis/balance/overseas` — TTTS3012R (NASD/NYSE/AMEX 3회)
4. `/api/kis/bonds` — CTSC8407R (페이지네이션)
5. `/api/kis/cash/overseas` — CTRP6504R + TTTC2101R

### Priority 2: 스냅샷 & 수익률
6. `/api/snapshots/capture` — 수동 스냅샷
7. `/api/cron/weekly-snapshot` — 주간 자동 스냅샷
8. `/api/performance/period-profit` — TTTC8708R

### Priority 3: 인컴
9. `/api/income/dividends/schedule` — HHKDB669102C0
10. `/api/income/rights/domestic` — CTRGA011R
11. `/api/income/rights/overseas` — CTRGT011R
12. `/api/cron/detect-income` — 자동 감지

## 핵심 Gotcha (반드시 준수)

상세 내용은 `docs/kis_api_guide.md` 참조.

1. **연금계좌**: TTTC8434R + FUND_STTL_ICLD_YN='Y' (전용 API 사용 금지)
2. **해외주식**: NASD/NYSE/AMEX 3회 호출, 중복 제거
3. **채권**: 20건 페이지네이션, tr_cont 헤더
4. **외화현금**: CTRP6504R 별도 호출 (모의투자 미지원)
5. **에러 마스킹**: 로그/응답에서 계좌번호는 뒤 4자리만

## 참조 문서
- `docs/kis_api_guide.md` — 검증된 패턴 + gotcha
- `docs/kis_api_catalog.md` — 350+ API 전체 카탈로그
- `docs/api_routes.md` — 라우트 설계
- `docs/database_schema.md` — DB 스키마
