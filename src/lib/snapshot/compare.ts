import type { HoldingSnapshot, SnapshotChanges } from './types';

/**
 * Compare two sets of holding_snapshots.
 * Groups by ticker (aggregated across accounts) to detect changes.
 */
export function compareSnapshots(
  previous: HoldingSnapshot[],
  current: HoldingSnapshot[],
): SnapshotChanges {
  const prevByTicker = aggregateByTicker(previous);
  const currByTicker = aggregateByTicker(current);

  const allTickers = new Set([
    ...prevByTicker.keys(),
    ...currByTicker.keys(),
  ]);

  const newItems: SnapshotChanges['newItems'] = [];
  const removedItems: SnapshotChanges['removedItems'] = [];
  const quantityChanges: SnapshotChanges['quantityChanges'] = [];
  const priceChanges: SnapshotChanges['priceChanges'] = [];

  let prevTotalValue = 0;
  let currTotalValue = 0;

  for (const [, agg] of prevByTicker) {
    prevTotalValue += agg.evaluation;
  }
  for (const [, agg] of currByTicker) {
    currTotalValue += agg.evaluation;
  }

  for (const ticker of allTickers) {
    const prev = prevByTicker.get(ticker);
    const curr = currByTicker.get(ticker);

    if (!prev && curr) {
      newItems.push({ ticker, name: curr.name });
      continue;
    }

    if (prev && !curr) {
      removedItems.push({ ticker, name: prev.name });
      continue;
    }

    if (prev && curr) {
      if (prev.quantity !== curr.quantity) {
        quantityChanges.push({
          ticker,
          name: curr.name,
          previousQty: prev.quantity,
          currentQty: curr.quantity,
        });
      }

      if (prev.currentPrice > 0 && curr.currentPrice > 0) {
        const changePercent =
          ((curr.currentPrice - prev.currentPrice) / prev.currentPrice) * 100;
        if (Math.abs(changePercent) >= 0.01) {
          priceChanges.push({
            ticker,
            name: curr.name,
            previousPrice: prev.currentPrice,
            currentPrice: curr.currentPrice,
            changePercent,
          });
        }
      }
    }
  }

  const totalValueChange = {
    previous: prevTotalValue,
    current: currTotalValue,
    changePercent:
      prevTotalValue > 0
        ? ((currTotalValue - prevTotalValue) / prevTotalValue) * 100
        : 0,
  };

  return {
    newItems,
    removedItems,
    quantityChanges,
    priceChanges,
    totalValueChange,
  };
}

interface AggregatedHolding {
  name: string | null;
  quantity: number;
  currentPrice: number;
  evaluation: number;
}

function aggregateByTicker(
  holdings: HoldingSnapshot[],
): Map<string, AggregatedHolding> {
  const map = new Map<string, AggregatedHolding>();

  for (const h of holdings) {
    const existing = map.get(h.ticker);
    if (existing) {
      existing.quantity += h.quantity;
      existing.evaluation += h.evaluation_amount;
      // Use the latest non-zero price
      if (h.current_price > 0) {
        existing.currentPrice = h.current_price;
      }
    } else {
      map.set(h.ticker, {
        name: h.name,
        quantity: h.quantity,
        currentPrice: h.current_price,
        evaluation: h.evaluation_amount,
      });
    }
  }

  return map;
}
