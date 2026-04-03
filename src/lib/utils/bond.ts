import type { MaturityBracket } from '../allocation/types';

/** Calculate days from now until maturity date */
export function daysToMaturity(maturityDate: string): number {
  const maturity = new Date(maturityDate);
  const now = new Date();
  const diffMs = maturity.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/** Map a maturity date to a bracket */
export function getMaturityBracket(maturityDate: string): MaturityBracket {
  const days = daysToMaturity(maturityDate);
  if (days <= 365) return '1Y';
  if (days <= 365 * 3) return '1-3Y';
  if (days <= 365 * 5) return '3-5Y';
  if (days <= 365 * 10) return '5-10Y';
  return '10Y+';
}

/**
 * Approximate Yield to Maturity (simple YTM formula).
 * YTM ≈ (coupon + (faceValue - purchasePrice) / yearsToMaturity) / ((faceValue + purchasePrice) / 2)
 *
 * @param couponRate  Annual coupon rate as decimal (e.g. 0.035 for 3.5%)
 * @param purchasePrice  Price paid per unit
 * @param faceValue  Face value per unit (typically 10000 KRW for domestic bonds)
 * @param yearsToMaturity  Remaining years to maturity
 * @returns YTM as decimal (e.g. 0.042 for 4.2%)
 */
export function calculateYTM(
  couponRate: number,
  purchasePrice: number,
  faceValue: number,
  yearsToMaturity: number,
): number {
  if (yearsToMaturity <= 0 || purchasePrice <= 0) return 0;
  const annualCoupon = couponRate * faceValue;
  const capitalGainPerYear = (faceValue - purchasePrice) / yearsToMaturity;
  const avgPrice = (faceValue + purchasePrice) / 2;
  return (annualCoupon + capitalGainPerYear) / avgPrice;
}
