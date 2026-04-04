import type { SnapshotSummary, ValidationWarning } from './types';

const VALUE_CHANGE_THRESHOLD = 30; // percent
const HOLDINGS_CHANGE_THRESHOLD = 0.5; // 50% change in count

/**
 * Validate a new snapshot against the previous one.
 * Returns warnings for anomalous changes.
 */
export function validateSnapshot(
  previous: SnapshotSummary | null,
  current: SnapshotSummary,
  previousHoldingCount: number,
  currentHoldingCount: number,
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // No previous snapshot — nothing to validate against
  if (!previous) return warnings;

  // Total value changed >30%
  if (previous.total_value > 0) {
    const valueChangePercent =
      ((current.total_value - previous.total_value) / previous.total_value) *
      100;

    if (Math.abs(valueChangePercent) > VALUE_CHANGE_THRESHOLD) {
      warnings.push({
        code: 'TOTAL_VALUE_CHANGE',
        message: `Total value changed by ${valueChangePercent.toFixed(1)}% since last snapshot`,
        severity: Math.abs(valueChangePercent) > 50 ? 'critical' : 'warning',
      });
    }
  }

  // Holdings count changed dramatically
  if (previousHoldingCount > 0) {
    const countChangeRatio =
      Math.abs(currentHoldingCount - previousHoldingCount) /
      previousHoldingCount;

    if (countChangeRatio > HOLDINGS_CHANGE_THRESHOLD) {
      warnings.push({
        code: 'HOLDINGS_COUNT_CHANGE',
        message: `Holdings count changed from ${previousHoldingCount} to ${currentHoldingCount}`,
        severity: 'warning',
      });
    }
  }

  // Any holding has 0 evaluation (checked externally, but flag if total is 0)
  if (current.total_value === 0 && previous.total_value > 0) {
    warnings.push({
      code: 'ZERO_TOTAL_VALUE',
      message: 'Current snapshot has zero total value',
      severity: 'critical',
    });
  }

  return warnings;
}
