# KIS Open API 전체 카탈로그

> 최종 업데이트: 2026-04-04
> 소스: [API Portal](https://apiportal.koreainvestment.com/), [GitHub](https://github.com/koreainvestment/open-trading-api)

---

## 개요

KIS Open API는 약 350+개 REST API와 80+개 WebSocket API를 제공한다.
이 문서는 **우리 프로젝트(투자관리 대시보드)에 필요한 API를 중심으로** 정리하되,
향후 활용 가능한 API도 카테고리별로 빠짐없이 기록한다.

### API 도메인
| 환경 | REST | WebSocket |
|------|------|-----------|
| 실전 | `https://openapi.koreainvestment.com:9443` | `ws://ops.koreainvestment.com:21000` |
| 모의 | `https://openapivts.koreainvestment.com:29443` | `ws://ops.koreainvestment.com:31000` |

### 계좌 상품코드
| 코드 | 계좌 유형 |
|------|----------|
| `01` | 위탁계좌 (주식/일반) |
| `03` | 국내선물옵션 |
| `08` | 해외선물옵션 |
| `21` | CMA (API 미지원) |
| `22` | 개인연금 |
| `29` | 퇴직연금 (IRP) |

### Rate Limit
| 환경 | 제한 | 비고 |
|------|------|------|
| 실전 | ~20회/초 (50ms 간격) | 일부 heavy API는 1회/초 권장 |
| 모의 | ~2회/초 (500ms 간격) | `EGW00201` = 초과 에러 |
| 토큰 발급 | 1회/분 | `EGW00133` 에러 시 60초 대기 |

---

## 1. 인증 (4개 API)

| API | 엔드포인트 | 용도 |
|-----|----------|------|
| 접근토큰 발급 | `POST /oauth2/tokenP` | REST API 인증 (24시간 유효, 6시간 내 재요청 시 동일 토큰) |
| 접근토큰 폐기 | `POST /oauth2/revokeP` | 토큰 만료 처리 |
| Hashkey | `POST /uapi/hashkey` | POST 요청 body 해싱 (주문 등) |
| WebSocket 접속키 | `POST /oauth2/Approval` | 실시간 데이터 구독용 |

---

## 2. 국내주식 - 주문/계좌 (22개+ API)

### 🔵 프로젝트에 사용하는 API

| TR_ID | 엔드포인트 | 용도 | v1 사용 | 비고 |
|-------|----------|------|---------|------|
| **TTTC8434R** | `/uapi/domestic-stock/v1/trading/inquire-balance` | 국내주식 잔고조회 | ✅ | 핵심 API. 연금계좌(22,29)도 `FUND_STTL_ICLD_YN='Y'`로 조회 가능 |
| **TTTC8494R** | `/uapi/domestic-stock/v1/trading/inquire-balance-rlz-pl` | 잔고 + 실현손익 | ⚠️ 부분 | v1에서는 `TTTC8808R`로 사용. 실현손익 포함 버전 |
| **TTTC8001R** | `/uapi/domestic-stock/v1/trading/inquire-daily-ccld` | 일별 주문체결 내역 | ✅ | 거래 이력 조회 |
| **CTRP6548R** | `/uapi/domestic-stock/v1/trading/inquire-account-balance` | 투자계좌 자산현황 | ❌ 미사용 | 🆕 **계좌 전체 자산 종합 조회** (주식+채권+펀드+현금 통합) |
| **TTTC8708R** | `/uapi/domestic-stock/v1/trading/inquire-period-profit` | 기간손익 일별합산 | ❌ 미사용 | 🆕 **수익률 분석에 활용 가능** |
| **TTTC8715R** | `/uapi/domestic-stock/v1/trading/inquire-period-trade-profit` | 기간별 매매손익 | ❌ 미사용 | 🆕 **실현손익 추적에 활용 가능** |
| **CTRGA011R** | `/uapi/domestic-stock/v1/trading/period-rights` | 기간 계좌 권리현황 | ❌ 미사용 | 🆕 **배당/유무상증자/분할 등 권리 이벤트 조회** |

### 연금 전용 API

| TR_ID | 엔드포인트 | 용도 | v1 상태 |
|-------|----------|------|---------|
| TTTC2208R | `pension/inquire-balance` | 퇴직연금 잔고 | ❌ 작동안함 |
| TTTC2202R | `pension/inquire-present-balance` | 퇴직연금 결제기준잔고 | ❌ 미테스트 |
| TTTC2201R | `pension/inquire-daily-ccld` | 퇴직연금 일별체결 | ❌ 미테스트 |
| TTTC0506R | `pension/inquire-deposit` | 퇴직연금 예수금 | ❌ 작동안함 |
| TTTC0503R | `pension/inquire-psbl-order` | 퇴직연금 매수가능 | ❌ 미테스트 |

> ⚠️ **v1 교훈**: 연금 전용 API는 작동하지 않음. `TTTC8434R` + `FUND_STTL_ICLD_YN='Y'`로 대체.
> v2에서 다시 테스트해볼 가치는 있으나, fallback으로 기존 방식 유지 필요.

### 참고용 (주문/기타)

| API | 용도 | 프로젝트 관련도 |
|-----|------|--------------|
| order-cash | 주식 매수/매도 주문 | 낮음 (조회 전용 대시보드) |
| order-rvsecncl | 주문 정정/취소 | 낮음 |
| inquire-psbl-order | 매수 가능 금액 | 낮음 |
| inquire-psbl-sell | 매도 가능 수량 | 낮음 |
| order-resv | 예약 주문 | 낮음 |
| intgr-margin (TTTC0869R) | 통합증거금 현황 | 중간 (자산 현황 보조) |

---

## 3. 국내주식 - 시세/기본정보 (25개+ API)

### 🔵 프로젝트에 사용하는 API

| TR_ID | 엔드포인트 | 용도 | v1 사용 |
|-------|----------|------|---------|
| **FHKST01010100** | `inquire-price` | 현재가 시세 | ✅ |
| **FHKST03010100** | `inquire-daily-itemchartprice` | 기간별 차트 (일/주/월/년) | ❌ 미사용 | 🆕 **수익률 차트에 활용** |
| | `inquire-time-itemchartprice` | 분봉 차트 | ❌ | 실시간 불필요 |

### 참고용 (시세)

| API | 용도 |
|-----|------|
| inquire-ccnl | 체결가 |
| inquire-daily-price | 일별 시세 |
| inquire-asking-price-exp-ccn | 호가/예상체결 |
| inquire-investor | 투자자별 매매동향 |
| inquire-member | 회원사별 매매동향 |
| inquire-vi-status | VI 발동 현황 |
| overtime-* | 시간외 시세 관련 |

---

## 4. 국내주식 - 종목정보/재무 (35개 API)

### 🔵 프로젝트에 사용하는 API

| TR_ID | 엔드포인트 | 용도 | v1 사용 |
|-------|----------|------|---------|
| **HHKDB669102C0** | `ksdinfo/dividend` | KSD 배당일정 | ❌ 미사용 | 🆕 **인컴 추적 핵심! 배당 예정일/금액 조회** |
| **HHKDB13470100** | `ranking/dividend-rate` | 배당률 순위 | ❌ 미사용 | 🆕 **마켓인사이트에서 배당주 발굴** |
| **HHKST668300C0** | `estimate-perform` | 추정 실적 | ❌ 미사용 | 🆕 **마켓인사이트에서 실적 전망** |
| **FHKST663300C0** | `invest-opinion` | 투자의견 (증권사 리포트) | ❌ 미사용 | 🆕 **마켓인사이트에서 애널리스트 의견** |
| | `invest-opbysec` | 증권사별 투자의견 | ❌ 미사용 | 🆕 |

### 재무제표 API (마켓인사이트 참고)

| API | 용도 |
|-----|------|
| finance-balance-sheet | 대차대조표 |
| finance-income-statement | 손익계산서 |
| finance-financial-ratio | 재무비율 |
| finance-profit-ratio | 수익성비율 |
| finance-growth-ratio | 성장성비율 |
| finance-stability-ratio | 안정성비율 |
| finance-other-major-ratios | 기타 주요비율 |

### KSD 정보 (배당 외)

| API | 용도 |
|-----|------|
| ksdinfo/bonus-issue | 무상증자 일정 |
| ksdinfo/paidin-capin | 유상증자 일정 |
| ksdinfo/cap-dcrs | 감자 일정 |
| ksdinfo/merger-split | 합병/분할 일정 |
| ksdinfo/rev-split | 주식병합 일정 |
| ksdinfo/sharehld-meet | 주주총회 일정 |
| ksdinfo/pub-offer | 공모 일정 |
| ksdinfo/list-info | 상장정보 일정 |

---

## 5. 국내주식 - 순위분석 (26개 API)

| API | 용도 | 프로젝트 관련도 |
|-----|------|--------------|
| **dividend-rate** | 배당률 순위 | 🔵 높음 (마켓인사이트) |
| volume-rank | 거래량 순위 | 중간 |
| fluctuation | 등락률 순위 | 중간 |
| market-cap | 시가총액 순위 | 중간 |
| near-new-highlow | 신고가/신저가 근접 | 중간 |
| top-interest-stock | 관심 종목 상위 | 낮음 |
| hts-top-view | HTS 조회 상위 20 | 낮음 |
| 기타 20개+ | 다양한 순위 분석 | 낮음 |

---

## 6. 국내주식 - 시장분석 (27개 API)

| API | 용도 | 프로젝트 관련도 |
|-----|------|--------------|
| psearch-title / psearch-result | 조건검색 | 중간 (마켓인사이트 종목 발굴) |
| foreign-institution-total | 외국인/기관 종합 | 중간 |
| investor-trade-by-stock-daily | 투자자별 종목 매매 | 중간 |
| program-trade-* | 프로그램 매매 | 낮음 |
| credit-balance | 신용잔고 | 낮음 |
| short-sale | 공매도 | 낮음 |
| news-title | 시장 뉴스 | 🔵 높음 (마켓인사이트) |

---

## 7. 국내채권 (15개 REST + 3 WebSocket)

### 🔵 프로젝트에 사용하는 API

| TR_ID | 엔드포인트 | 용도 | v1 사용 |
|-------|----------|------|---------|
| **CTSC8407R** | `inquire-balance` | 채권 잔고조회 | ✅ | 페이지당 20건, `tr_cont` 페이지네이션 |
| **CTPF1101R** | `issue-info` | 채권 발행정보 | ✅ | 쿠폰율, 이자지급일, 만기일 등 |
| **CTPF1114R** | `search-bond-info` | 채권 검색/기본정보 | ❌ 미사용 | 🆕 채권 탐색에 활용 가능 |
| **CTPF2005R** | `avg-unit` | 채권 평균단가 | ❌ 미사용 | 🆕 채권 평가에 활용 가능 |
| **FHPST07020000** | `comp-interest` | 금리 종합 | ❌ 미사용 | 🆕 **채권 분석에 금리 환경 파악** |

### 참고용

| API | 용도 |
|-----|------|
| inquire-price | 채권 현재가 시세 |
| inquire-asking-price | 채권 호가 |
| inquire-ccnl | 채권 체결 |
| inquire-daily-price | 채권 일별시세 |
| inquire-daily-itemchartprice | 채권 기간차트 |
| buy / sell / order-rvsecncl | 채권 매수/매도/정정취소 |
| inquire-daily-ccld | 채권 일별체결내역 |
| inquire-psbl-order | 채권 매수가능금액 |

---

## 8. 해외주식 - 주문/계좌 (18개 API)

### 🔵 프로젝트에 사용하는 API

| TR_ID | 엔드포인트 | 용도 | v1 사용 | 비고 |
|-------|----------|------|---------|------|
| **TTTS3012R** | `inquire-balance` | 해외주식 잔고 | ✅ | NASD/NYSE/AMEX 각각 호출 필요 |
| **CTRP6504R** | `inquire-present-balance` | 결제기준 잔고 (외화현금) | ✅ | 외화 예수금 조회. 모의투자 미지원 |
| **CTRP6010R** | `inquire-paymt-stdr-balance` | 수익기준 잔고 | ❌ 미사용 | 🆕 결제기준과 다른 관점의 잔고 |
| **TTTS3035R** | `inquire-ccnl` | 해외주식 체결내역 | ✅ | 거래 이력 |
| **TTTS3039R** | `inquire-period-profit` | 기간 손익 | ❌ 미사용 | 🆕 **해외주식 수익률 분석에 핵심** |
| **CTOS4001R** | `inquire-period-trans` | 기간 거래내역 | ❌ 미사용 | 🆕 **배당 수령 등 거래 유형별 조회** |
| **TTTC2101R** | `foreign-margin` | 외화잔고 (통화별) | ❌ 미사용 | 🆕 **통화별 현금 잔고 상세** |
| **CTRGT011R** | `period-rights` | 기간 권리내역 | ❌ 미사용 | 🆕 **해외주식 배당/권리 이벤트 조회 (인컴 자동감지 핵심!)** |

### 참고용

| API | 용도 |
|-----|------|
| order / daytime-order | 해외주식 주문 |
| order-rvsecncl | 주문 정정/취소 |
| order-resv / order-resv-ccnl | 예약 주문 |
| inquire-nccs | 미체결 내역 |
| inquire-psamount | 매수 가능 금액 |
| algo-ordno / inquire-algo-ccnl | TWAP/VWAP 주문 (2026년 신규) |

---

## 9. 해외주식 - 시세/분석 (25개+ API)

### 🔵 프로젝트에 사용하는 API

| API | 용도 | v1 사용 |
|-----|------|---------|
| price / price-detail | 해외주식 현재가 | ❌ (v1은 잔고 API의 현재가 사용) |
| inquire-daily-chartprice | 기간별 차트 | ❌ | 🆕 해외주식 수익률 차트 |
| **countries-holiday (CTOS5011R)** | 해외 결제일/휴장일 | ❌ 미사용 | 🆕 스냅샷 스케줄링에 활용 |
| news-title / brknews-title | 해외 뉴스 | ❌ 미사용 | 🆕 마켓인사이트 |
| search-info | 종목 기본정보 | ❌ | 종목 메타데이터 |

### 순위 분석 (12개)
시가총액, 등락률, 거래량, 거래대금, 신고가/신저가 등

---

## 10. ETF/ETN 전용 (6개 API)

| API | 용도 | v1 사용 |
|-----|------|---------|
| inquire-price | ETF/ETN 현재가 (NAV 포함) | ❌ |
| nav-comparison-trend | NAV 비교추이 (종목별) | ❌ |
| nav-comparison-daily-trend | NAV 비교추이 (일별) | ❌ |
| nav-comparison-time-trend | NAV 비교추이 (분별) | ❌ |
| **inquire-component-stock-price** | **ETF 구성종목 시세** | ❌ 미사용 | 🆕 **자산배분 look-through 분석에 활용 가능** |

---

## 11. 선물옵션 (국내 23개 + 해외 35개)

프로젝트에서 직접 사용하지 않으나, 선물옵션 계좌(03, 08)를 가진 경우 참고.

### 국내 선물옵션 주요 API
- inquire-balance: 잔고 현황
- inquire-deposit: 총자산 현황
- inquire-ccnl: 체결 내역

### 해외 선물옵션 주요 API
- inquire-unpd: 미결제 약정
- inquire-deposit: 예탁금
- inquire-period-trans: 기간 거래내역

---

## 12. ELW (21개 REST + 3 WebSocket)

프로젝트에서 직접 사용하지 않음. ELW 시세/검색/순위 API 제공.

---

## 13. WebSocket 실시간 API (80개+)

| 카테고리 | API 수 | 주요 항목 |
|---------|--------|----------|
| 국내주식 (KRX/NXT/통합) | 26 | 실시간 체결, 호가, 예상체결, 체결통보 |
| 국내채권 | 3 | 채권 체결, 호가, 지수 |
| 해외주식 | 4 | 실시간 체결(지연), 호가, 체결통보 |
| 국내선물옵션 | 20 | 지수/주식/상품 선물옵션 |
| 해외선물옵션 | 4 | 체결, 호가, 주문/체결 통보 |
| ETF/ETN | 1 | ETF NAV 추이 |
| ELW | 3 | ELW 체결, 호가, 예상체결 |

> 프로젝트에서는 WebSocket 불필요 (폴링 기반 대시보드). 향후 실시간 알림 기능 추가 시 고려.

---

## v2에서 새로 활용할 API 요약

### 🔴 핵심 (반드시 활용)

| TR_ID | 이름 | 활용 메뉴 | 설명 |
|-------|------|----------|------|
| **HHKDB669102C0** | KSD 배당일정 | 수익률 분석 | 국내주식 배당 예정일/금액 자동 조회 |
| **CTRGT011R** | 해외 기간 권리내역 | 수익률 분석 | 해외주식 배당/권리 이벤트 (인컴 자동감지) |
| **CTRGA011R** | 국내 기간 권리현황 | 수익률 분석 | 국내주식 배당/증자/분할 등 권리 이벤트 |
| **TTTC8708R** | 기간손익 일별합산 | 수익률 분석 | 기간별 손익 데이터 (스냅샷 보완) |
| **CTRP6548R** | 투자계좌 자산현황 | 대시보드 | 계좌 전체 자산 종합 조회 (주식+채권+펀드+현금) |

### 🟡 유용 (활용 권장)

| TR_ID | 이름 | 활용 메뉴 | 설명 |
|-------|------|----------|------|
| **TTTC8715R** | 기간별 매매손익 | 수익률 분석 | 실현손익 상세 |
| **TTTS3039R** | 해외 기간손익 | 수익률 분석 | 해외주식 기간별 손익 |
| **CTOS4001R** | 해외 기간거래내역 | 수익률 분석 | 해외주식 거래유형별 조회 |
| **TTTC2101R** | 외화잔고 | 계좌별 현황 | 통화별 외화 현금 상세 |
| **FHPST07020000** | 금리종합 | 자산 배분 | 국내 금리 환경 조회 |
| **FHKST663300C0** | 투자의견 | 마켓인사이트 | 증권사 애널리스트 의견 |
| **HHKST668300C0** | 추정실적 | 마켓인사이트 | 컨센서스 실적 전망 |
| **HHKDB13470100** | 배당률순위 | 마켓인사이트 | 고배당주 발굴 |
| **CTOS5011R** | 해외 결제일/휴장일 | 인프라 | 스냅샷 스케줄링 최적화 |

### 🟢 향후 고려

| API | 활용 메뉴 | 설명 |
|-----|----------|------|
| inquire-component-stock-price | 자산 배분 | ETF 구성종목 look-through |
| psearch-title/result | 마켓인사이트 | 조건검색 기반 종목 발굴 |
| news-title (국내/해외) | 마켓인사이트 | 뉴스 자동 수집 |
| FHKST03010100 (기간별 차트) | 수익률 분석 | 종목별 차트 데이터 |

---

## v1 교훈 및 주의사항

### 작동하지 않는 API
| TR_ID | 문제 | 대안 |
|-------|------|------|
| TTTC2208R | 퇴직연금 잔고 - 데이터 없음 반환 | `TTTC8434R` + `FUND_STTL_ICLD_YN='Y'` |
| TTTC0506R | 퇴직연금 예수금 - 0원 반환 | 위와 동일 |

### API 미지원 자산 (수동입력 필수)
- 해외채권
- ELS/DLS
- RP (환매조건부채권)
- CMA 계좌 자산 (상품코드 21)
- 부동산, IRP 적립금 상세

### 핵심 Gotcha
1. **해외주식 잔고는 거래소별 3회 호출** (NASD, NYSE, AMEX)
2. **채권 잔고는 20건 페이지네이션** (`tr_cont` 헤더 사용)
3. **외화 현금은 별도 API** (`CTRP6504R`) - 잔고 API에 미포함
4. **연금계좌는 일반 API + 파라미터 플래그**로 조회
5. **토큰 6시간 내 재요청 시 동일 토큰** 반환 (캐싱 주의)
6. **모의투자 TR_ID는 첫 글자가 V** (`TTTC` → `VTTC`)
7. **CTRP6504R은 모의투자 미지원**

---

## API 업데이트 추적

### 2026년 신규/변경사항
- **MCP 통합**: KIS Code Assistant MCP + KIS Trading MCP 제공 (GitHub `/MCP/` 디렉토리)
- **NXT 시장 지원**: 다수 시세 API에 KRX/NXT/통합 변형 추가
- **TWAP/VWAP 주문**: 해외주식 알고리즘 주문 (`algo-ordno`, `inquire-algo-ccnl`)
- **Strategy Builder**: 80개 기술지표 기반 전략 설계 도구
- **Backtester**: Docker 기반 QuantConnect Lean 백테스팅

### 업데이트 모니터링 방법
1. GitHub Watch: `koreainvestment/open-trading-api` 릴리스 노트
2. API Portal 공지사항: https://apiportal.koreainvestment.com/
3. 주기적으로 GitHub 커밋 확인: 새 API 함수 추가 여부

---

## 전체 API 수 집계

| 카테고리 | REST | WebSocket | 합계 |
|---------|------|-----------|------|
| 인증 | 4 | - | 4 |
| 국내주식 (주문/계좌) | 22 | - | 22 |
| 국내주식 (시세/기본) | 25+ | 26 | 51+ |
| 국내주식 (종목정보/재무) | 35 | - | 35 |
| 국내주식 (시장분석) | 27 | - | 27 |
| 국내주식 (순위분석) | 26 | - | 26 |
| 국내채권 | 15 | 3 | 18 |
| 해외주식 (주문/계좌) | 18 | - | 18 |
| 해외주식 (시세/분석) | 25+ | 4 | 29+ |
| 국내선물옵션 | 23 | 20 | 43 |
| 해외선물옵션 | 35 | 4 | 39 |
| ELW | 21 | 3 | 24 |
| ETF/ETN | 6 | 1 | 7 |
| **합계** | **~280+** | **~80+** | **~350+** |
