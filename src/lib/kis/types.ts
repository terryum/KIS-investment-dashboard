// KIS API TypeScript interfaces

// --- Authentication ---

export interface KISTokenRequest {
  grant_type: 'client_credentials';
  appkey: string;
  appsecret: string;
}

export interface KISTokenResponse {
  access_token: string;
  access_token_token_expired: string; // "YYYY-MM-DD HH:mm:ss"
  token_type: string;
  expires_in: number;
}

// --- Common ---

export interface KISApiHeaders {
  authorization: string;
  appkey: string;
  appsecret: string;
  tr_id: string;
  tr_cont?: string;
  custtype?: string;
  hashkey?: string;
}

export interface KISApiResponse<T = unknown> {
  rt_cd: string;   // '0' = success
  msg_cd: string;
  msg1: string;
  output1?: T;
  output2?: unknown;
  ctx_area_fk100?: string;
  ctx_area_nk100?: string;
}

export interface KISErrorInfo {
  retry: boolean;
  delayMs: number;
  message: string;
}

// --- Account ---

export interface KISAccount {
  id: string;
  account_no: string;   // '12345678-01'
  alias: string | null;
  app_key: string;
  app_secret: string;
  account_type: string; // stock, pension, isa, cma
  is_active: boolean;
}

// --- Token Cache ---

export interface KISTokenCacheRow {
  id: string;
  account_id: string;
  access_token: string;
  token_expired: string;
  created_at: string;
  updated_at: string;
}

// --- Domestic Balance (TTTC8434R) ---

export interface KISDomesticHolding {
  pdno: string;               // ticker
  prdt_name: string;          // name
  hldg_qty: string;           // holding quantity
  pchs_avg_pric: string;      // avg purchase price
  pchs_amt: string;           // purchase amount
  prpr: string;               // current price
  evlu_amt: string;           // evaluation amount
  evlu_pfls_amt: string;      // unrealized PnL
  evlu_pfls_rt: string;       // PnL %
  evlu_erng_rt: string;       // return rate
  bfdy_cprs_icdc: string;     // daily change
  fltt_rt: string;            // fluctuation rate
}

export interface KISDomesticAccountSummary {
  dnca_tot_amt: string;       // total deposit
  scts_evlu_amt: string;      // securities evaluation
  tot_evlu_amt: string;       // total evaluation
  pchs_amt_smtl_amt: string;  // total purchase amount
  evlu_pfls_smtl_amt: string; // total unrealized PnL
  nass_amt: string;           // net asset amount
}

// --- Overseas Balance (TTTS3012R) ---

export interface KISOverseasHolding {
  ovrs_pdno: string;          // ticker
  ovrs_item_name: string;     // name
  cblc_qty13: string;         // holdable quantity
  ord_psbl_qty: string;       // orderable quantity
  pchs_avg_pric: string;      // avg price
  frcr_pchs_amt1: string;     // purchase amount (foreign)
  ovrs_now_pric1: string;     // current price
  frcr_evlu_pfls_amt: string; // unrealized PnL (foreign)
  evlu_pfls_rt1: string;      // PnL %
  ovrs_excg_cd: string;       // exchange code
  tr_crcy_cd: string;         // currency
}

export interface KISOverseasAccountSummary {
  frcr_pchs_amt1: string;     // total purchase (foreign)
  ovrs_rlzt_pfls_amt: string; // realized PnL
  ovrs_tot_pfls: string;      // total PnL
  tot_evlu_pfls_amt: string;  // total evaluation PnL
  ovrs_stck_evlu_amt: string; // stock evaluation amount
}

// --- Bond Balance (CTSC8407R) ---

export interface KISBondHolding {
  pdno: string;               // bond code (ISIN)
  prdt_name: string;          // bond name
  buy_dt: string;             // purchase date
  buy_sqno: string;           // purchase sequence
  bnd_buy_qty: string;        // quantity (face value)
  pchs_amt: string;           // purchase amount
  bond_evlu_amt: string;      // evaluation amount
  evlu_pfls_amt: string;      // unrealized PnL
  bnd_cpn_rt: string;         // coupon rate
  bnd_mty_dt: string;         // maturity date
  rflt_rt: string;            // return rate
}

// --- Foreign Cash (CTRP6504R) ---

export interface KISForeignCashOutput2 {
  frcr_dncl_amt_2: string;    // foreign deposit amount
  crcy_cd: string;            // currency code
}

// --- Aggregated Results ---

export type ExchangeCode = 'NASD' | 'NYSE' | 'AMEX';

export interface UnifiedBalance {
  domestic: {
    holdings: KISDomesticHolding[];
    summary: KISDomesticAccountSummary | null;
    accountNo: string;
  }[];
  overseas: {
    holdings: KISOverseasHolding[];
    summary: KISOverseasAccountSummary | null;
    accountNo: string;
  }[];
  bonds: {
    holdings: KISBondHolding[];
    accountNo: string;
  }[];
  foreignCash: {
    currency: string;
    amount: number;
    accountNo: string;
  }[];
}
