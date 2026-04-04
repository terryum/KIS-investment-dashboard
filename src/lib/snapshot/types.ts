export interface HoldingSnapshot {
  id: string;
  snapshot_id: string;
  date: string;
  account_no: string;
  ticker: string;
  name: string | null;
  market: string | null;
  asset_type: string | null;
  quantity: number;
  avg_price: number;
  current_price: number;
  purchase_amount: number;
  evaluation_amount: number;
  pnl: number;
  pnl_percent: number;
  currency: string;
  exchange_rate: number;
  created_at: string;
}

export interface SnapshotSummary {
  id: string;
  date: string;
  snapshot_type: string;
  label: string | null;
  total_value: number;
  total_invested: number | null;
  cash_balance: number;
  manual_assets_total: number;
  unrealized_pnl: number;
  realized_pnl_ytd: number;
  net_cash_inflow: number;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface SnapshotChanges {
  newItems: { ticker: string; name: string | null }[];
  removedItems: { ticker: string; name: string | null }[];
  quantityChanges: {
    ticker: string;
    name: string | null;
    previousQty: number;
    currentQty: number;
  }[];
  priceChanges: {
    ticker: string;
    name: string | null;
    previousPrice: number;
    currentPrice: number;
    changePercent: number;
  }[];
  totalValueChange: {
    previous: number;
    current: number;
    changePercent: number;
  };
}

export interface ValidationWarning {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}
