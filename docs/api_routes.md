# API 라우트 설계

> Next.js 16 App Router API Routes.
> 모든 라우트는 서버사이드 전용. PIN 인증 미들웨어 필수.
> 이 문서는 하네스 에이전트의 초기 가이드라인이다.

---

## 공통 사항

### 인증 미들웨어
```
모든 /api/* 라우트 → PIN 검증 (x-pin-token 헤더)
/api/cron/* 라우트 → CRON_SECRET 검증 (Authorization: Bearer)
/api/auth/* 라우트 → 인증 불필요 (PIN 설정/검증 자체)
```

### 응답 형식
```typescript
// 성공
{ data: T }
// 에러 (민감 정보 마스킹)
{ error: string, code?: string }
```

### KIS API 호출 원칙
- 서버사이드에서만 호출 (클라이언트 직접 호출 금지)
- Rate limit: 50ms 간격 쓰로틀
- 토큰 캐싱: `kis_token_cache` 테이블
- 에러 응답에서 계좌번호/금액 마스킹

---

## 라우트 목록

### 1. 인증 (`/api/auth`)

| Method | 경로 | 용도 |
|--------|------|------|
| POST | `/api/auth/verify` | PIN 검증 |
| POST | `/api/auth/setup` | 초기 PIN 설정 |

---

### 2. KIS 포트폴리오 (`/api/kis`)

| Method | 경로 | 용도 | KIS TR_ID |
|--------|------|------|-----------|
| GET | `/api/kis/balance` | 전체 계좌 잔고 통합 조회 | TTTC8434R, TTTS3012R, CTSC8407R |
| GET | `/api/kis/balance/domestic` | 국내주식 잔고 | TTTC8434R |
| GET | `/api/kis/balance/overseas` | 해외주식 잔고 (NASD/NYSE/AMEX) | TTTS3012R |
| GET | `/api/kis/bonds` | 채권 잔고 (페이지네이션) | CTSC8407R |
| GET | `/api/kis/account-balance` | 투자계좌 자산현황 (종합) | CTRP6548R |
| GET | `/api/kis/cash/domestic` | 국내 예수금 | TTTC8434R output2 |
| GET | `/api/kis/cash/overseas` | 해외 외화잔고 | CTRP6504R, TTTC2101R |
| GET | `/api/kis/price` | 현재가 조회 | FHKST01010100 |

**파라미터**:
- `?account_no=` — 특정 계좌만 조회 (미지정 시 전체)

---

### 3. 보유현황 (`/api/holdings`)

| Method | 경로 | 용도 |
|--------|------|------|
| GET | `/api/holdings/current` | 현재 보유종목 집계 (전 계좌 합산) |
| GET | `/api/holdings/history` | 과거 날짜 기준 보유현황 (스냅샷) |

**파라미터**:
- `?date=YYYY-MM-DD` — 특정 날짜 기준

---

### 4. 스냅샷 (`/api/snapshots`)

| Method | 경로 | 용도 |
|--------|------|------|
| GET | `/api/snapshots` | 스냅샷 목록 (기간 필터) |
| GET | `/api/snapshots/latest` | 최신 스냅샷 |
| POST | `/api/snapshots/capture` | 수동 스냅샷 즉시 캡처 |

**파라미터**:
- GET: `?from=&to=&type=weekly|manual`
- POST body: `{ label?: string }` — 수동 스냅샷 메모

---

### 5. 수익률 분석 (`/api/performance`)

| Method | 경로 | 용도 | KIS TR_ID |
|--------|------|------|-----------|
| GET | `/api/performance/returns` | 기간별 수익률 차트 데이터 | 스냅샷 기반 계산 |
| GET | `/api/performance/period-profit` | 기간 손익 일별합산 | TTTC8708R |
| GET | `/api/performance/trade-profit` | 기간별 매매손익 | TTTC8715R |
| GET | `/api/performance/overseas-profit` | 해외 기간손익 | TTTS3039R |
| GET | `/api/performance/benchmark` | 벤치마크 비교 (KOSPI, S&P500) | 외부 데이터 |

**파라미터**:
- `?period=1W|1M|3M|6M|YTD|1Y|ALL`

---

### 6. 현금흐름 (`/api/cash-flows`)

| Method | 경로 | 용도 |
|--------|------|------|
| GET | `/api/cash-flows` | 현금흐름 내역 조회 |
| GET | `/api/cash-flows/monthly` | 월별 순입금/순출금 요약 |
| POST | `/api/cash-flows` | 현금흐름 수동 입력 |
| PUT | `/api/cash-flows/[id]` | 현금흐름 수정 |
| DELETE | `/api/cash-flows/[id]` | 현금흐름 삭제 |

---

### 7. 인컴 (`/api/income`)

| Method | 경로 | 용도 | KIS TR_ID |
|--------|------|------|-----------|
| GET | `/api/income` | 인컴(배당/이자) 내역 조회 | |
| GET | `/api/income/summary` | 연도별 인컴 요약 | |
| GET | `/api/income/dividends/schedule` | 배당 예정 일정 | HHKDB669102C0 |
| GET | `/api/income/rights/domestic` | 국내 권리현황 | CTRGA011R |
| GET | `/api/income/rights/overseas` | 해외 권리내역 | CTRGT011R |

**파라미터**:
- `?year=2026&type=dividend|distribution|interest`

---

### 8. 자산 배분 (`/api/allocation`)

| Method | 경로 | 용도 |
|--------|------|------|
| GET | `/api/allocation/asset-class` | 자산군별 배분 |
| GET | `/api/allocation/country` | 국가별 배분 |
| GET | `/api/allocation/currency` | 통화별 배분 |
| GET | `/api/allocation/stock-structure` | 주식 구조 (ETF 분류) |
| GET | `/api/allocation/bond-structure` | 채권 구조 (만기/HTM-MTM) |
| GET | `/api/allocation/insights` | AI 인사이트 코멘트 |

---

### 9. 자산 분류 (`/api/assets`)

| Method | 경로 | 용도 |
|--------|------|------|
| GET | `/api/assets/tags` | 자산 태그 조회 |
| POST | `/api/assets/classify` | ETF 이름 기반 자동 분류 (AI) |
| PATCH | `/api/assets/[ticker]/tags` | 종목 태그 수동 수정 |

---

### 10. 수동 자산 (`/api/manual-assets`)

| Method | 경로 | 용도 |
|--------|------|------|
| GET | `/api/manual-assets` | 수동 자산 목록 |
| POST | `/api/manual-assets` | 수동 자산 추가 |
| PUT | `/api/manual-assets/[id]` | 수동 자산 수정 |
| DELETE | `/api/manual-assets/[id]` | 수동 자산 삭제 |

---

### 11. 거래내역 (`/api/transactions`)

| Method | 경로 | 용도 | KIS TR_ID |
|--------|------|------|-----------|
| GET | `/api/transactions/sync` | KIS에서 거래내역 동기화 | TTTC8001R, TTTS3035R |
| GET | `/api/transactions/[ticker]` | 종목별 거래이력 | |
| PATCH | `/api/transactions/[id]` | 거래 메모 수정 | |
| GET | `/api/transactions/period` | 기간 거래내역 (해외) | CTOS4001R |

---

### 12. 채권 정보 (`/api/bonds`)

| Method | 경로 | 용도 | KIS TR_ID |
|--------|------|------|-----------|
| GET | `/api/bonds/issue-info` | 채권 발행정보 (캐시) | CTPF1101R |
| GET | `/api/bonds/search` | 채권 검색 | CTPF1114R |
| GET | `/api/bonds/interest-rates` | 금리 종합 | FHPST07020000 |

---

### 13. 마켓 인사이트 (`/api/market`)

| Method | 경로 | 용도 | KIS TR_ID |
|--------|------|------|-----------|
| GET | `/api/market/news` | 보유종목 관련 뉴스 | 뉴스 API |
| GET | `/api/market/opinions` | 투자의견 (애널리스트) | FHKST663300C0 |
| GET | `/api/market/estimates` | 추정실적 | HHKST668300C0 |
| GET | `/api/market/dividend-rank` | 배당률 순위 | HHKDB13470100 |
| POST | `/api/market/summarize` | 콘텐츠 AI 요약 | OpenAI |

### 마켓 소스 (`/api/market/sources`)

| Method | 경로 | 용도 |
|--------|------|------|
| GET | `/api/market/sources` | 팔로우 소스 목록 |
| POST | `/api/market/sources` | 소스 추가 |
| PUT | `/api/market/sources/[id]` | 소스 수정 |
| DELETE | `/api/market/sources/[id]` | 소스 삭제 |
| POST | `/api/market/sources/recommend` | AI 소스 추천 |

---

### 14. 워치리스트 (`/api/watchlist`)

| Method | 경로 | 용도 |
|--------|------|------|
| GET | `/api/watchlist` | 관심 종목 목록 |
| POST | `/api/watchlist` | 관심 종목 추가 |
| DELETE | `/api/watchlist/[id]` | 관심 종목 삭제 |

---

### 15. 투자 저널 (`/api/journals`)

| Method | 경로 | 용도 |
|--------|------|------|
| GET | `/api/journals` | 저널 목록 (필터/검색) |
| GET | `/api/journals/[id]` | 저널 상세 |
| POST | `/api/journals` | 저널 작성 |
| PUT | `/api/journals/[id]` | 저널 수정 |
| DELETE | `/api/journals/[id]` | 저널 삭제 |

**파라미터**:
- `?ticker=&type=entry|exit|note|review&tag=&q=검색어`

---

### 16. AI 어드바이저 (`/api/advisor`)

| Method | 경로 | 용도 |
|--------|------|------|
| POST | `/api/advisor/chat` | AI 채팅 (Vercel AI SDK streamText) |

---

### 17. 환율 (`/api/exchange-rates`)

| Method | 경로 | 용도 |
|--------|------|------|
| GET | `/api/exchange-rates` | 최신 환율 조회 (한국수출입은행) |
| GET | `/api/exchange-rates/history` | 환율 이력 |

---

### 18. Cron Jobs (`/api/cron`)

| Method | 경로 | 스케줄 | 용도 |
|--------|------|--------|------|
| POST | `/api/cron/weekly-snapshot` | 매주 금요일 16:00 KST | 주간 스냅샷 캡처 |
| POST | `/api/cron/detect-income` | 매일 08:00 KST (평일) | 배당/이자 자동 감지 |
| POST | `/api/cron/sync-exchange-rates` | 매일 11:30 KST (평일) | 환율 저장 |

**vercel.json (또는 vercel.ts) Cron 설정**:
```json
{
  "crons": [
    { "path": "/api/cron/weekly-snapshot", "schedule": "0 7 * * 5" },
    { "path": "/api/cron/detect-income", "schedule": "0 23 * * 1-5" },
    { "path": "/api/cron/sync-exchange-rates", "schedule": "30 2 * * 1-5" }
  ]
}
```
> 스케줄은 UTC 기준. KST = UTC + 9.

---

### 19. 유틸리티 (`/api/utils`)

| Method | 경로 | 용도 |
|--------|------|------|
| GET | `/api/utils/holidays` | KIS 휴장일 조회 (chk-holiday) |
| GET | `/api/utils/overseas-holidays` | 해외 결제일/휴장일 (CTOS5011R) |

---

## 라우트 수 집계

| 카테고리 | 라우트 수 |
|---------|----------|
| 인증 | 2 |
| KIS 포트폴리오 | 8 |
| 보유현황 | 2 |
| 스냅샷 | 3 |
| 수익률 분석 | 5 |
| 현금흐름 | 5 |
| 인컴 | 5 |
| 자산 배분 | 6 |
| 자산 분류 | 3 |
| 수동 자산 | 4 |
| 거래내역 | 4 |
| 채권 정보 | 3 |
| 마켓 인사이트 | 10 |
| 워치리스트 | 3 |
| 투자 저널 | 5 |
| AI 어드바이저 | 1 |
| 환율 | 2 |
| Cron Jobs | 3 |
| 유틸리티 | 2 |
| **합계** | **~76** |
