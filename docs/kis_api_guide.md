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

---

## 실전에서 발견한 이슈 (Lessons Learned)

> KIS API는 문서와 실제 동작이 다른 경우가 있습니다.
> 이 섹션은 실제 호출에서 발견한 차이점을 기록합니다.
> 날짜를 함께 기록하여 추후 KIS 측 수정 여부를 확인할 수 있도록 합니다.

### [2026-04-04] 채권 잔고 API (CTSC8407R) 응답 필드명 불일치

**문제**: 공식 문서와 다른 API 대부분은 `output1`, `output2` 필드를 사용하지만, 채권 잔고 API는 **`output`** 필드에 데이터를 반환합니다.

```
# 일반 API (주식 등)
{ "output1": [...], "output2": {...}, "rt_cd": "0" }

# 채권 API (CTSC8407R)
{ "output": [...], "rt_cd": "0" }   ← output1이 아닌 output!
```

**영향**: `data.output1`로 접근하면 항상 빈 배열이 되어 채권이 0건으로 보입니다.

**해결**: `data.output ?? data.output1` 순서로 fallback 처리.

### [2026-04-04] 채권 API 페이지네이션 컨텍스트 필드명 불일치

**문제**: 주식 API는 `ctx_area_fk100/nk100`을 사용하지만, 채권 API는 **`ctx_area_fk200/nk200`**을 사용합니다.

```
# 주식 API 응답
{ "ctx_area_fk100": "...", "ctx_area_nk100": "..." }

# 채권 API (CTSC8407R) 응답
{ "ctx_area_fk200": "!^!^null...", "ctx_area_nk200": "KR6310101EB1!^20241125!^1" }
```

**주의**: fk200/nk200 값에 `!^`, 공백, `null` 등 특수문자가 포함될 수 있으므로 URL 인코딩이 필수입니다.

**페이지네이션 프로토콜** (검증 완료 — 21건 이상 조회 성공):

| 항목 | 첫 페이지 | 다음 페이지 |
|------|----------|-----------|
| 헤더 `tr_cont` | `""` (빈 문자열) | `"N"` |
| 파라미터 `CTX_AREA_FK200` | `""` (빈 문자열) | 이전 응답 body의 `ctx_area_fk200` 값 |
| 파라미터 `CTX_AREA_NK200` | `""` (빈 문자열) | 이전 응답 body의 `ctx_area_nk200` 값 |
| 종료 조건 | — | 응답 헤더 `tr_cont`가 `"M"`이 아닌 경우 (`"D"` 또는 `"E"`) |

**주의**: `CTX_AREA_FK100/NK100`이 아닌 **FK200/NK200**을 사용해야 합니다! 첫 페이지 `tr_cont`가 `"N"`이면 안 되고 **빈 문자열**이어야 합니다.

**해결**: `urllib.parse.urlencode()` 또는 `encodeURIComponent()`로 파라미터 인코딩.

### [2026-04-04] CMA 계좌 (상품코드 21) API 미지원 확인

**문제**: CMA 계좌(상품코드 21)에 대해 TTTC8434R(국내주식 잔고)을 호출하면 에러 반환.

```
{ "rt_cd": "7", "msg1": "위탁계좌인 경우만 조회가능합니다." }
```

**영향**: CMA 내 해외채권, RP, 발행어음 등 모든 자산을 API로 조회할 수 없습니다.

**해결**: CMA 계좌(상품코드 21)는 API 호출에서 제외하고, `manual_assets` 테이블로 수동 관리.

### [2026-04-04] 해외주식 NASD/AMEX 중복 반환

**문제**: TTTS3012R로 NASD와 AMEX를 각각 호출하면 동일 종목이 양쪽에서 모두 반환됩니다.

```
[NASD] PROSHARES BITCOIN: 903주, $8,317
[AMEX] PROSHARES BITCOIN: 903주, $8,317   ← 동일 데이터!
```

**영향**: 중복 제거 안 하면 해외주식 평가금이 2배로 계산됩니다.

**해결**: `ovrs_pdno` (해외 종목코드) 기준으로 Set 중복 제거, 첫 번째 결과만 유지.

### [2026-04-04] 연금 전용 API 미작동

**문제**: 퇴직연금/개인연금 전용 API(`TTTC2208R`, `TTTC0506R`)가 데이터를 반환하지 않거나 0원을 반환합니다.

**해결**: 일반 국내주식 API(`TTTC8434R`)에 `FUND_STTL_ICLD_YN='Y'` 파라미터를 추가하면 연금 계좌(상품코드 22, 29)도 정상 조회됩니다.

### [2026-04-04] 토큰 발급 Rate Limit

**문제**: 동일 app_key로 1분 내 토큰을 재발급하면 `EGW00133` 에러 발생.

```
{ "error_code": "EGW00133", "error_description": "접근토큰 발급 잠시 후 다시 시도하세요(1분당 1회)" }
```

**주의**: 6시간 이내 재요청 시 동일 토큰이 반환되므로, 실제로는 캐싱하면 재발급이 거의 불필요합니다. 하지만 다중 계좌 시 각 계좌의 app_key가 다르면 각각 토큰 발급이 필요하고, 순차적으로 1분씩 대기해야 합니다.

**해결**: `kis_token_cache` 테이블에 토큰을 저장하고, 만료 1시간 전에만 갱신.

### [2026-04-04] TTTC8434R은 주식/ETF만 조회

**문제**: 국내주식 잔고 API(TTTC8434R)로는 **채권, ELS, RP, 발행어음이 조회되지 않습니다**. 이름이 "주식잔고"이지만 실제로는 주식과 ETF만 반환합니다.

**영향**: 채권이 있는 계좌(위탁, ISA, IRP 등)에서 총 자산이 과소 계산됩니다.

**해결**: 통합 잔고 조회 시 반드시 채권 API(CTSC8407R)를 별도 호출하여 합산해야 합니다.

### [2026-04-04] 채권 잔고 API에 평가금(시가) 필드 없음

**문제**: CTSC8407R 응답에 `evlu_amt`(평가금) 필드가 **존재하지 않습니다**. 반환되는 금액 관련 필드는 `buy_amt`(매입금)뿐입니다.

```
실제 반환 필드: pdno, prdt_name, buy_dt, buy_sqno, cblc_qty, agrx_qty,
               sprx_qty, exdt, buy_erng_rt, buy_unpr, buy_amt, ord_psbl_qty

기대했던 필드: evlu_amt (평가금) ← 없음!
```

**영향**: 채권의 현재 평가금을 바로 알 수 없고, 매입금만 알 수 있습니다. 장외채권의 경우 시가평가가 복잡하여 매입금과 평가금 사이에 차이가 클 수 있습니다.

**해결 방안**:
1. `buy_amt`(매입금)을 평가금 근사치로 사용 (가장 단순)
2. 채권 발행정보 API(`CTPF1101R`)에서 쿠폰율/만기일을 가져와 이론적 평가금 계산
3. 채권 시세 API(`inquire-price`)로 현재가를 조회하여 `cblc_qty × 현재가`로 계산
4. 사용자가 `manual_assets`에 평가금을 수동 입력

**위탁1770 실제 데이터** (2026-04-04):
- 채권 21건 조회 성공 (페이지네이션 수정 후)
- 매입금 합계: 97,624,567원
- 기재된 국내채권 평가금: 95,994,956원
- 차이: 약 +1,630,000원 (매입금 vs 평가금 차이)
