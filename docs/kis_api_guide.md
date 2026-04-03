# KIS API 통합 가이드

> v1에서 검증된 패턴 + v2 신규 API.
> 전체 API 카탈로그는 `kis_api_catalog.md` 참조.
> 이 문서는 하네스 에이전트의 초기 가이드라인이다.

---

## 인증

### 토큰 발급
```
POST /oauth2/tokenP
Body: { grant_type: "client_credentials", appkey, appsecret }
```
- 유효기간: 24시간
- **6시간 내 재요청 시 동일 토큰 반환** (캐싱 시 주의)
- 발급 시 카카오톡 알림 발송
- `kis_token_cache` 테이블에 저장하여 불필요한 재발급 방지
- 토큰 발급 Rate Limit: **1회/분** (`EGW00133` 에러 시 60초 대기)

### Hashkey
```
POST /uapi/hashkey
```
- POST 요청 body를 해싱. 주문 등에 필요.
- GET 요청에는 불필요.

---

## 핵심 API (잔고 조회)

### 국내주식 잔고 — `TTTC8434R`

```
GET /uapi/domestic-stock/v1/trading/inquire-balance
```

| 헤더/파라미터 | 값 | 비고 |
|-------------|---|------|
| tr_id | TTTC8434R | |
| CANO | 계좌번호 앞 8자리 | |
| ACNT_PRDT_CD | 상품코드 2자리 | 01, 22, 29 등 |
| FUND_STTL_ICLD_YN | **'Y'** | ⚠️ 연금계좌(22, 29) 필수! 펀드 결제 포함 |
| AFHR_FLPR_YN | 'N' | |
| CTX_AREA_FK100/NK100 | '' | 페이지네이션용 |

**응답**:
- `output1[]`: 보유 종목 리스트
- `output2[]`: 계좌 요약 (예수금 `dnca_tot_amt`, 평가금 등)

**⚠️ v1 교훈**: 연금 전용 API(`TTTC2208R`, `TTTC0506R`)는 작동하지 않음. 반드시 이 API + `FUND_STTL_ICLD_YN='Y'` 사용.

---

### 해외주식 잔고 — `TTTS3012R`

```
GET /uapi/overseas-stock/v1/trading/inquire-balance
```

| 파라미터 | 값 | 비고 |
|---------|---|------|
| OVRS_EXCG_CD | NASD / NYSE / AMEX | ⚠️ **거래소별 3회 호출 필수** |
| TR_CRCY_CD | USD | |

**⚠️ 외화 현금 미포함**: 별도로 `CTRP6504R` 호출 필요.
**⚠️ 중복 제거**: 동일 종목이 여러 거래소에 나올 수 있음. ticker 기준 첫 번째 결과 사용.

---

### 해외 외화잔고 — `CTRP6504R`

```
GET /uapi/overseas-stock/v1/trading/inquire-present-balance
```

- output2의 `frcr_dncl_amt_2` = 외화 예수금
- ⚠️ **모의투자 미지원** (실전 전용)
- ⚠️ output2가 배열 또는 객체일 수 있음: `Array.isArray()` 체크 필요

---

### 채권 잔고 — `CTSC8407R`

```
GET /uapi/domestic-bond/v1/trading/inquire-balance
```

- ⚠️ **페이지당 최대 20건**
- 페이지네이션: `tr_cont` 헤더 사용
  - 요청: `tr_cont: 'N'` (첫 페이지), `tr_cont: ''` (다음)
  - 응답: `tr_cont: 'M'` (더 있음), `tr_cont: 'D'` (마지막)
- 중복 체크: `pdno|buy_dt|buy_sqno` 복합키

---

### 투자계좌 자산현황 — `CTRP6548R` (v2 신규)

```
GET /uapi/domestic-stock/v1/trading/inquire-account-balance
```

- 주식+채권+펀드+현금을 **한번에** 조회
- 계좌 전체 요약에 유용

---

## 수익률 관련 API (v2 신규)

### 기간손익 일별합산 — `TTTC8708R`

```
GET /uapi/domestic-stock/v1/trading/inquire-period-profit
```
- 국내주식 기간별 손익 일별 데이터
- 스냅샷 보완용

### 기간별 매매손익 — `TTTC8715R`

```
GET /uapi/domestic-stock/v1/trading/inquire-period-trade-profit
```
- 실현손익 상세 추적

### 해외 기간손익 — `TTTS3039R`

```
GET /uapi/overseas-stock/v1/trading/inquire-period-profit
```

---

## 배당/인컴 API (v2 신규)

### KSD 배당일정 — `HHKDB669102C0`

```
GET /uapi/domestic-stock/v1/ksdinfo/dividend
```
- 국내주식 배당 예정일/금액
- 인컴 자동감지 Cron의 핵심 데이터

### 국내 기간 권리현황 — `CTRGA011R`

```
GET /uapi/domestic-stock/v1/trading/period-rights
```
- 배당, 유무상증자, 분할 등 권리 이벤트

### 해외 기간 권리내역 — `CTRGT011R`

```
GET /uapi/overseas-price/v1/quotations/period-rights
```
- 해외주식 배당/권리 이벤트
- 권리유형 필터: 01=유상, 02=무상, 03=배당

---

## 마켓 인사이트 API (v2 신규)

### 투자의견 — `FHKST663300C0`

```
GET /uapi/domestic-stock/v1/quotations/invest-opinion
```

### 추정실적 — `HHKST668300C0`

```
GET /uapi/domestic-stock/v1/quotations/estimate-perform
```

### 배당률순위 — `HHKDB13470100`

```
GET /uapi/domestic-stock/v1/ranking/dividend-rate
```

---

## 채권 발행정보 — `CTPF1101R`

```
GET /uapi/domestic-bond/v1/quotations/issue-info
```

- 쿠폰율, 이자지급일, 만기일, 액면가
- `bond_issue_info` 테이블에 캐싱 (자주 변하지 않음)
- 표면이율 vs 실질이율(YTM) 계산에 필요

---

## Rate Limit 대응

```typescript
// 실전 환경: 50ms 간격 (~20회/초)
const THROTTLE_MS = 50;

// 모의투자 환경: 500ms 간격 (~2회/초)
const THROTTLE_MS_PAPER = 500;

// 계좌 간 전환 시 추가 대기
const ACCOUNT_SWITCH_DELAY = 100;

// 토큰 발급 에러 시
// EGW00133 → 60초 대기 후 재시도
// EGW00201 → 초당 거래건수 초과, 100ms 후 재시도
```

---

## 다중 계좌 순회 패턴

```typescript
async function fetchAllAccounts() {
  const accounts = await getActiveAccounts(); // DB에서 활성 계좌 조회

  const results = [];
  for (const account of accounts) {
    // 계좌별 토큰 확인/갱신
    const token = await getOrRefreshToken(account);

    // 국내주식 잔고
    const domestic = await fetchWithThrottle(() =>
      getDomesticBalance(account, token)
    );

    // 해외주식 잔고 (3회 호출)
    for (const exchange of ['NASD', 'NYSE', 'AMEX']) {
      const overseas = await fetchWithThrottle(() =>
        getOverseasBalance(account, token, exchange)
      );
      results.push(...overseas);
    }

    // 채권 잔고 (페이지네이션)
    const bonds = await fetchAllBondPages(account, token);

    // 계좌 간 대기
    await sleep(ACCOUNT_SWITCH_DELAY);
  }

  return deduplicateByTicker(results);
}
```

---

## API 지원 여부 확인 필요 (v2 TODO)

| 자산 | 확인 사항 |
|------|----------|
| CMA 계좌 내 해외채권 | API 조회 가능 여부 테스트 |
| RP (환매조건부채권) | 잔고 조회 API 존재 여부 |
| 발행어음 | 잔고 조회 API 존재 여부 |

→ 미지원 확인 시 `manual_assets`로 대체

---

## 에러 처리 패턴

```typescript
// 에러 응답에서 민감 정보 마스킹
function handleKISError(error: any, accountNo: string) {
  const maskedAccount = `****${accountNo.slice(-4)}`;
  console.error(`KIS API error for account [${maskedAccount}]:`, error.rt_cd);

  // 공통 에러 코드
  switch (error.msg_cd) {
    case 'EGW00133': // 토큰 발급 제한
      return { retry: true, delayMs: 60000 };
    case 'EGW00201': // 초당 건수 초과
      return { retry: true, delayMs: 100 };
    case 'OPSQ0013': // 영업시간 외
      return { retry: false, message: '영업시간 외' };
    default:
      return { retry: false, message: error.msg1 || 'Unknown error' };
  }
}
```
