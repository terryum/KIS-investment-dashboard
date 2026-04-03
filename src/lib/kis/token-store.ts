import type { KISTokenCacheRow, KISTokenResponse } from './types';

const KIS_BASE_URL = 'https://openapi.koreainvestment.com:9443';
const TOKEN_REFRESH_BUFFER_MS = 60 * 60 * 1000; // refresh 1h before expiry
const MIN_TOKEN_ISSUE_INTERVAL_MS = 60 * 1000;   // 1 issuance per minute

let lastTokenIssueTime = 0;

/**
 * Get or refresh a KIS API access token.
 * Uses kis_token_cache table to avoid unnecessary re-issuance.
 * Same token is returned within 6h by KIS API, so we cache aggressively.
 */
export async function getOrRefreshToken(
  accountId: string,
  appKey: string,
  appSecret: string,
  supabaseAdmin: { from: (table: string) => any },
): Promise<string> {
  // 1. Check cache
  const { data: cached } = await supabaseAdmin
    .from('kis_token_cache')
    .select('access_token, token_expired')
    .eq('account_id', accountId)
    .single();

  if (cached && !isTokenExpiringSoon(cached.token_expired)) {
    return cached.access_token;
  }

  // 2. Rate limit: 1 token issuance per minute
  const now = Date.now();
  const elapsed = now - lastTokenIssueTime;
  if (elapsed < MIN_TOKEN_ISSUE_INTERVAL_MS) {
    await sleep(MIN_TOKEN_ISSUE_INTERVAL_MS - elapsed);
  }

  // 3. Issue new token
  const tokenResponse = await issueToken(appKey, appSecret);
  lastTokenIssueTime = Date.now();

  // 4. Upsert cache
  await supabaseAdmin.from('kis_token_cache').upsert(
    {
      account_id: accountId,
      access_token: tokenResponse.access_token,
      token_expired: tokenResponse.access_token_token_expired,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'account_id' },
  );

  return tokenResponse.access_token;
}

async function issueToken(
  appKey: string,
  appSecret: string,
): Promise<KISTokenResponse> {
  const res = await fetch(`${KIS_BASE_URL}/oauth2/tokenP`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: appKey,
      appsecret: appSecret,
    }),
  });

  if (!res.ok) {
    throw new Error(`Token issuance failed: ${res.status}`);
  }

  return res.json() as Promise<KISTokenResponse>;
}

function isTokenExpiringSoon(expiredStr: string): boolean {
  const expiry = new Date(expiredStr).getTime();
  return Date.now() > expiry - TOKEN_REFRESH_BUFFER_MS;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
