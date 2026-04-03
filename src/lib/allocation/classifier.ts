import type { AssetTags } from './types';

/**
 * Rule-based ETF name parser.
 * Extracts real_asset_class, country, real_currency, etf_structure, sector, is_hedged.
 */
export function classifyETF(name: string): AssetTags {
  const n = name;

  // --- Hedging detection (do first — affects currency) ---
  const is_hedged = /\(H\)|\(합성\)|합성H|환헤지/i.test(n);

  // --- Asset class ---
  let real_asset_class: AssetTags['real_asset_class'] = 'stock';
  if (/국고채|미국채|회사채|하이일드|채권|단기자금|머니마켓|통안채|국채|금리|bond|treasury/i.test(n)) {
    real_asset_class = 'bond';
  } else if (/골드|금선물|GOLD|은선물|원자재|commodity|WTI|원유|구리|농산물/i.test(n)) {
    real_asset_class = 'commodity';
  } else if (/비트코인|BTC|이더리움|ETH|크립토|crypto|디지털자산/i.test(n)) {
    real_asset_class = 'alternative';
  } else if (/리츠|REIT|부동산/i.test(n)) {
    real_asset_class = 'reit';
  }

  // --- Country ---
  let country: AssetTags['country'] = 'KR';
  if (/차이나|항셍|중국|CSI|상해|심천|홍콩|HSCEI|China/i.test(n)) {
    country = 'CN';
  } else if (/미국|나스닥|S&P|다우|NYSE|NASDAQ|US|Russell|필라델피아/i.test(n)) {
    country = 'US';
  } else if (/일본|TOPIX|닛케이|Nikkei|Japan/i.test(n)) {
    country = 'JP';
  } else if (/인도|NIFTY|India/i.test(n)) {
    country = 'IN';
  } else if (/유럽|EURO|STOXX|Europe|유로/i.test(n)) {
    country = 'EU';
  } else if (/이머징|신흥국|EM|Emerging/i.test(n)) {
    country = 'EM';
  } else if (/글로벌|Global|선진국|World|MSCI(?!.*Korea)/i.test(n)) {
    country = 'GLOBAL';
  } else if (/아시아|Asia|ASEAN|베트남|태국/i.test(n)) {
    country = 'ASIA';
  }

  // --- Currency ---
  let real_currency: AssetTags['real_currency'] = 'KRW';
  if (is_hedged) {
    // Hedged ETFs settle in KRW regardless of underlying
    real_currency = 'KRW';
  } else if (country === 'CN') {
    real_currency = 'CNY';
  } else if (country === 'US') {
    real_currency = 'USD';
  } else if (country === 'JP') {
    real_currency = 'JPY';
  } else if (country === 'EU') {
    real_currency = 'EUR';
  }
  // KR, ASIA, EM, GLOBAL default to KRW (domestic-listed ETF)

  // --- ETF structure ---
  let etf_structure: AssetTags['etf_structure'] = 'broad';
  const sector = detectSector(n);
  if (sector) {
    etf_structure = 'sector';
  } else if (/테마|Theme|2차전지|전기차|메타버스|클라우드|AI|로봇|수소|우주항공|게임/i.test(n)) {
    etf_structure = 'theme';
  } else if (/모멘텀|밸류|퀄리티|배당|고배당|성장|가치|로우볼|Quality|Value|Growth|Momentum|Dividend/i.test(n)) {
    etf_structure = 'factor';
  }

  return {
    real_asset_class,
    country,
    real_currency,
    etf_structure,
    ...(sector ? { sector } : {}),
    is_hedged,
  };
}

/** Detect sector from ETF name, return undefined if no sector match */
function detectSector(name: string): string | undefined {
  const sectorMap: [RegExp, string][] = [
    [/반도체|semiconductor/i, 'semiconductor'],
    [/바이오|헬스케어|의료|건강|bio|health/i, 'bio'],
    [/에너지|원유|석유|태양광|신재생|energy|solar/i, 'energy'],
    [/금융|은행|보험|증권|finance|bank/i, 'finance'],
    [/IT|소프트웨어|인터넷|플랫폼|tech/i, 'tech'],
    [/자동차|운송|transport|auto/i, 'auto'],
    [/소비재|필수소비|경기소비|consumer/i, 'consumer'],
    [/통신|커뮤니케이션|telecom|communication/i, 'telecom'],
    [/유틸리티|utility/i, 'utility'],
    [/철강|소재|화학|material|steel/i, 'material'],
    [/방산|defense|aerospace/i, 'defense'],
  ];

  for (const [pattern, sector] of sectorMap) {
    if (pattern.test(name)) return sector;
  }
  return undefined;
}
