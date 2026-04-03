"use client";

import { cn } from "@/lib/utils";

interface MoneyDisplayProps {
  amount: number;
  currency?: "KRW" | "USD" | "EUR" | "CNY";
  showSign?: boolean;
  showColor?: boolean;
  className?: string;
}

const currencyFormatters: Record<string, Intl.NumberFormat> = {
  KRW: new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }),
  USD: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }),
  EUR: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }),
  CNY: new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  }),
};

export function MoneyDisplay({
  amount,
  currency = "KRW",
  showSign = false,
  showColor = true,
  className,
}: MoneyDisplayProps) {
  const formatter = currencyFormatters[currency] ?? currencyFormatters.KRW;
  const formatted = formatter.format(Math.abs(amount));
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";

  return (
    <span
      className={cn(
        "font-[family-name:var(--font-geist-mono)] tabular-nums",
        showColor && amount > 0 && "text-red-500",
        showColor && amount < 0 && "text-blue-500",
        showColor && amount === 0 && "text-gray-500",
        className,
      )}
    >
      {showSign && sign}
      {amount < 0 && !showSign ? `-${formatted}` : formatted}
    </span>
  );
}
