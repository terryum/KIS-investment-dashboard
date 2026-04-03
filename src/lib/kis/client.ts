import type {
  KISApiResponse,
  KISBondHolding,
  KISDomesticAccountSummary,
  KISDomesticHolding,
  KISErrorInfo,
  KISForeignCashOutput2,
  KISOverseasAccountSummary,
  KISOverseasHolding,
  ExchangeCode,
} from './types';

const KIS_BASE_URL = 'https://openapi.koreainvestment.com:9443';

// Rate limiting
const THROTTLE_MS = 50;           // production: ~20 calls/sec
const THROTTLE_MS_PAPER = 500;    // paper trading: ~2 calls/sec

// Pension account product codes
const PENSION_PRODUCT_CODES = ['22', '29'];

/**
 * KIS API Client with token management, rate limiting, and retry logic.
 * All methods are server-side only.
 */
export class KISClient {
  private lastCallTime = 0;
  private isPaper: boolean;

  constructor(
    private readonly accessToken: string,
    private readonly appKey: string,
    private readonly appSecret: string,
    isPaper = false,
  ) {
    this.isPaper = isPaper;
  }

  // --- Domestic Balance (TTTC8434R) ---

  async getDomesticBalance(
    accountNo: string,
    productCode: string,
  ): Promise<{
    holdings: KISDomesticHolding[];
    summary: KISDomesticAccountSummary | null;
  }> {
    const isPension = PENSION_PRODUCT_CODES.includes(productCode);

    const params = new URLSearchParams({
      CANO: accountNo.slice(0, 8),
      ACNT_PRDT_CD: productCode,
      AFHR_FLPR_YN: 'N',
      OFL_YN: '',
      INQR_DVSN: '02',
      UNPR_DVSN: '01',
      FUND_STTL_ICLD_YN: isPension ? 'Y' : 'N',
      FNCG_AMT_AUTO_RDPT_YN: 'N',
      PRCS_DVSN: '00',
      CTX_AREA_FK100: '',
      CTX_AREA_NK100: '',
    });

    const data = await this.request<KISDomesticHolding[]>(
      '/uapi/domestic-stock/v1/trading/inquire-balance',
      'TTTC8434R',
      params,
    );

    return {
      holdings: Array.isArray(data.output1) ? data.output1 : [],
      summary: Array.isArray(data.output2)
        ? (data.output2[0] as KISDomesticAccountSummary) ?? null
        : (data.output2 as KISDomesticAccountSummary) ?? null,
    };
  }

  // --- Overseas Balance (TTTS3012R) ---

  async getOverseasBalance(
    accountNo: string,
    productCode: string,
    exchange: ExchangeCode,
  ): Promise<{
    holdings: KISOverseasHolding[];
    summary: KISOverseasAccountSummary | null;
  }> {
    const params = new URLSearchParams({
      CANO: accountNo.slice(0, 8),
      ACNT_PRDT_CD: productCode,
      OVRS_EXCG_CD: exchange,
      TR_CRCY_CD: 'USD',
      CTX_AREA_FK200: '',
      CTX_AREA_NK200: '',
    });

    const data = await this.request<KISOverseasHolding[]>(
      '/uapi/overseas-stock/v1/trading/inquire-balance',
      'TTTS3012R',
      params,
    );

    return {
      holdings: Array.isArray(data.output1) ? data.output1 : [],
      summary: Array.isArray(data.output2)
        ? (data.output2[0] as KISOverseasAccountSummary) ?? null
        : (data.output2 as KISOverseasAccountSummary) ?? null,
    };
  }

  /**
   * Fetch overseas balance across all 3 exchanges, deduplicate by ticker.
   */
  async getOverseasBalanceAll(
    accountNo: string,
    productCode: string,
  ): Promise<{
    holdings: KISOverseasHolding[];
    summary: KISOverseasAccountSummary | null;
  }> {
    const exchanges: ExchangeCode[] = ['NASD', 'NYSE', 'AMEX'];
    const allHoldings: KISOverseasHolding[] = [];
    let lastSummary: KISOverseasAccountSummary | null = null;

    for (const exchange of exchanges) {
      const result = await this.getOverseasBalance(
        accountNo,
        productCode,
        exchange,
      );
      allHoldings.push(...result.holdings);
      if (result.summary) lastSummary = result.summary;
    }

    // Deduplicate by ticker — keep first occurrence
    const seen = new Set<string>();
    const deduplicated = allHoldings.filter((h) => {
      if (seen.has(h.ovrs_pdno)) return false;
      seen.add(h.ovrs_pdno);
      return true;
    });

    return { holdings: deduplicated, summary: lastSummary };
  }

  // --- Bond Balance (CTSC8407R) with pagination ---

  async getBondBalance(
    accountNo: string,
    productCode: string,
  ): Promise<KISBondHolding[]> {
    const allBonds: KISBondHolding[] = [];
    let trCont = 'N'; // first page
    const seenKeys = new Set<string>();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const params = new URLSearchParams({
        CANO: accountNo.slice(0, 8),
        ACNT_PRDT_CD: productCode,
        BND_BUY_DVSN_CD: '',
        BND_PR_DVSN_CD: '',
        CTX_AREA_FK100: '',
        CTX_AREA_NK100: '',
      });

      const { data, responseTrCont } = await this.requestWithTrCont<
        KISBondHolding[]
      >(
        '/uapi/domestic-bond/v1/trading/inquire-balance',
        'CTSC8407R',
        params,
        trCont,
      );

      const holdings = Array.isArray(data.output1) ? data.output1 : [];

      for (const bond of holdings) {
        const key = `${bond.pdno}|${bond.buy_dt}|${bond.buy_sqno}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allBonds.push(bond);
        }
      }

      // 'D' = last page, 'M' = more pages
      if (responseTrCont !== 'M' || holdings.length === 0) break;
      trCont = '';
    }

    return allBonds;
  }

  // --- Foreign Cash (CTRP6504R) ---

  async getForeignCash(
    accountNo: string,
    productCode: string,
  ): Promise<{ currency: string; amount: number }[]> {
    if (this.isPaper) {
      // CTRP6504R is not supported in paper trading
      return [];
    }

    const params = new URLSearchParams({
      CANO: accountNo.slice(0, 8),
      ACNT_PRDT_CD: productCode,
      WCRC_FRCR_DVSN_CD: '02',
      NATN_CD: '',
      TR_MKET_CD: '',
      INQR_DVSN_CD: '',
    });

    const data = await this.request<unknown>(
      '/uapi/overseas-stock/v1/trading/inquire-present-balance',
      'CTRP6504R',
      params,
    );

    // output2 can be array or object
    const output2 = data.output2;
    const items: KISForeignCashOutput2[] = Array.isArray(output2)
      ? output2
      : output2
        ? [output2 as KISForeignCashOutput2]
        : [];

    return items
      .filter((item) => parseFloat(item.frcr_dncl_amt_2) > 0)
      .map((item) => ({
        currency: item.crcy_cd,
        amount: parseFloat(item.frcr_dncl_amt_2),
      }));
  }

  // --- Core request methods ---

  private async request<T>(
    path: string,
    trId: string,
    params: URLSearchParams,
  ): Promise<KISApiResponse<T>> {
    await this.throttle();

    const url = `${KIS_BASE_URL}${path}?${params.toString()}`;
    const headers = this.buildHeaders(trId);

    const res = await fetchWithRetry(url, { headers });
    const json = (await res.json()) as KISApiResponse<T>;

    if (json.rt_cd !== '0') {
      const errorInfo = handleKISError(json.msg_cd, json.msg1);
      if (errorInfo.retry) {
        await sleep(errorInfo.delayMs);
        return this.request<T>(path, trId, params);
      }
      throw new KISApiError(json.msg_cd, errorInfo.message);
    }

    return json;
  }

  private async requestWithTrCont<T>(
    path: string,
    trId: string,
    params: URLSearchParams,
    trCont: string,
  ): Promise<{ data: KISApiResponse<T>; responseTrCont: string }> {
    await this.throttle();

    const url = `${KIS_BASE_URL}${path}?${params.toString()}`;
    const headers = this.buildHeaders(trId, trCont);

    const res = await fetchWithRetry(url, { headers });
    const json = (await res.json()) as KISApiResponse<T>;
    const responseTrCont = res.headers.get('tr_cont') ?? 'D';

    if (json.rt_cd !== '0') {
      const errorInfo = handleKISError(json.msg_cd, json.msg1);
      if (errorInfo.retry) {
        await sleep(errorInfo.delayMs);
        return this.requestWithTrCont<T>(path, trId, params, trCont);
      }
      throw new KISApiError(json.msg_cd, errorInfo.message);
    }

    return { data: json, responseTrCont };
  }

  private buildHeaders(
    trId: string,
    trCont?: string,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
      authorization: `Bearer ${this.accessToken}`,
      appkey: this.appKey,
      appsecret: this.appSecret,
      tr_id: trId,
      custtype: 'P',
    };
    if (trCont !== undefined) {
      headers.tr_cont = trCont;
    }
    return headers;
  }

  private async throttle(): Promise<void> {
    const minInterval = this.isPaper ? THROTTLE_MS_PAPER : THROTTLE_MS;
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < minInterval) {
      await sleep(minInterval - elapsed);
    }
    this.lastCallTime = Date.now();
  }
}

// --- Error handling ---

export class KISApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'KISApiError';
  }
}

function handleKISError(msgCd: string, msg1: string): KISErrorInfo {
  switch (msgCd) {
    case 'EGW00133': // token issuance rate limit
      return { retry: true, delayMs: 60_000, message: 'Token rate limited' };
    case 'EGW00201': // per-second call limit
      return { retry: true, delayMs: 100, message: 'Rate limited' };
    case 'OPSQ0013': // outside business hours
      return { retry: false, delayMs: 0, message: '영업시간 외' };
    default:
      return { retry: false, delayMs: 0, message: msg1 || 'Unknown KIS error' };
  }
}

// --- Utilities ---

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxRetries = 2,
): Promise<Response> {
  let lastError: Error | null = null;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || res.status < 500) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
    if (i < maxRetries) await sleep(1000 * (i + 1));
  }
  throw lastError!;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Sensitive data sanitization ---

/**
 * Mask account number: show last 4 digits only.
 */
export function maskAccountNo(accountNo: string): string {
  if (accountNo.length <= 4) return '****';
  return `****${accountNo.slice(-4)}`;
}

/**
 * Mask monetary amounts: replace digits with * for amounts with 9+ digits.
 */
export function maskAmount(value: string | number): string {
  const str = String(value);
  if (str.replace(/[^0-9]/g, '').length >= 9) {
    return '***masked***';
  }
  return str;
}

/**
 * Sanitize an error object for safe logging/response.
 */
export function sanitizeError(
  error: unknown,
  accountNo?: string,
): { message: string; code?: string } {
  const masked = accountNo ? maskAccountNo(accountNo) : undefined;
  if (error instanceof KISApiError) {
    return {
      message: masked
        ? `KIS error for account [${masked}]: ${error.message}`
        : error.message,
      code: error.code,
    };
  }
  const msg =
    error instanceof Error ? error.message : 'An unexpected error occurred';
  // Strip any account numbers from message
  const sanitized = msg.replace(/\d{8}-?\d{2}/g, (match) =>
    maskAccountNo(match),
  );
  return { message: sanitized };
}
