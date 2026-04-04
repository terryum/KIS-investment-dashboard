import { KISClient, sanitizeError, maskAccountNo } from './client';
import { getOrRefreshToken } from './token-store';
import type {
  KISAccount,
  KISBondHolding,
  KISDomesticAccountSummary,
  KISDomesticHolding,
  KISOverseasAccountSummary,
  KISOverseasHolding,
  UnifiedBalance,
} from './types';

const ACCOUNT_SWITCH_DELAY_MS = 100;

/**
 * Multi-account orchestrator.
 * Loops through all active accounts, throttles, and deduplicates results.
 */
export class AccountManager {
  constructor(
    private readonly supabaseAdmin: { from: (table: string) => any },
  ) {}

  /**
   * Fetch all active accounts from DB.
   */
  async getActiveAccounts(): Promise<KISAccount[]> {
    const { data, error } = await this.supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('is_active', true);

    if (error) throw new Error('Failed to fetch accounts');
    return (data ?? []) as KISAccount[];
  }

  /**
   * Create a KISClient for a specific account, handling token refresh.
   */
  async createClient(account: KISAccount): Promise<KISClient> {
    const token = await getOrRefreshToken(
      account.id,
      account.app_key,
      account.app_secret,
      this.supabaseAdmin,
    );

    return new KISClient(
      token,
      account.app_key,
      account.app_secret,
      false, // TODO: detect paper trading from account config
    );
  }

  /**
   * Fetch unified balance across all active accounts.
   */
  async fetchUnifiedBalance(
    filterAccountNo?: string,
  ): Promise<UnifiedBalance> {
    const accounts = await this.getActiveAccounts();
    // Filter by specific account if requested, and exclude CMA (product code 21) which is API-unsupported
    const filtered = (filterAccountNo
      ? accounts.filter((a) => a.account_no === filterAccountNo)
      : accounts
    ).filter((a) => {
      const productCode = a.account_no.split('-')[1];
      return productCode !== '21'; // CMA accounts are not queryable via KIS API
    });

    const result: UnifiedBalance = {
      domestic: [],
      overseas: [],
      bonds: [],
      foreignCash: [],
    };

    for (const account of filtered) {
      try {
        const client = await this.createClient(account);
        const [cano, productCode] = account.account_no.split('-');

        // Domestic balance
        const domestic = await client.getDomesticBalance(
          account.account_no,
          productCode,
        );
        if (domestic.holdings.length > 0 || domestic.summary) {
          result.domestic.push({
            holdings: domestic.holdings,
            summary: domestic.summary,
            accountNo: account.account_no,
          });
        }

        // Overseas balance (3 exchanges, deduplicated)
        const overseas = await client.getOverseasBalanceAll(
          account.account_no,
          productCode,
        );
        if (overseas.holdings.length > 0 || overseas.summary) {
          result.overseas.push({
            holdings: overseas.holdings,
            summary: overseas.summary,
            accountNo: account.account_no,
          });
        }

        // Bond balance (paginated)
        const bonds = await client.getBondBalance(
          account.account_no,
          productCode,
        );
        if (bonds.length > 0) {
          result.bonds.push({
            holdings: bonds,
            accountNo: account.account_no,
          });
        }

        // Foreign cash
        const foreignCash = await client.getForeignCash(
          account.account_no,
          productCode,
        );
        for (const cash of foreignCash) {
          result.foreignCash.push({
            ...cash,
            accountNo: account.account_no,
          });
        }

        // Delay between account switches
        if (filtered.indexOf(account) < filtered.length - 1) {
          await sleep(ACCOUNT_SWITCH_DELAY_MS);
        }
      } catch (err) {
        const sanitized = sanitizeError(err, account.account_no);
        // Log with masked account number only
        console.error(
          `Balance fetch failed for [${maskAccountNo(account.account_no)}]:`,
          sanitized.message,
        );
        // Continue to next account instead of failing entirely
      }
    }

    return result;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
