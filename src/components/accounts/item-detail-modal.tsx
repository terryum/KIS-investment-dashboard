"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoneyDisplay } from "@/components/common/money-display";
import { PercentDisplay } from "@/components/common/percent-display";
import { TickerBadge } from "@/components/common/ticker-badge";
import type { AggregatedHolding } from "@/hooks/use-portfolio";
import type { AssetTags } from "@/lib/allocation/types";

/* ── Option definitions with Korean labels ── */

const ASSET_CLASS_OPTIONS: { value: AssetTags["real_asset_class"]; label: string }[] = [
  { value: "stock", label: "주식" },
  { value: "bond", label: "채권" },
  { value: "commodity", label: "원자재/금" },
  { value: "alternative", label: "대체투자" },
  { value: "reit", label: "리츠" },
];

const COUNTRY_OPTIONS: { value: AssetTags["country"]; label: string }[] = [
  { value: "KR", label: "한국" },
  { value: "US", label: "미국" },
  { value: "CN", label: "중국" },
  { value: "JP", label: "일본" },
  { value: "IN", label: "인도" },
  { value: "EU", label: "유럽" },
  { value: "ASIA", label: "아시아" },
  { value: "EM", label: "이머징" },
  { value: "GLOBAL", label: "글로벌" },
];

const CURRENCY_OPTIONS: { value: AssetTags["real_currency"]; label: string }[] = [
  { value: "KRW", label: "KRW" },
  { value: "USD", label: "USD" },
  { value: "CNY", label: "CNY" },
  { value: "JPY", label: "JPY" },
  { value: "EUR", label: "EUR" },
];

const ETF_STRUCTURE_OPTIONS: { value: AssetTags["etf_structure"] | ""; label: string }[] = [
  { value: "", label: "없음" },
  { value: "broad", label: "시장전체" },
  { value: "factor", label: "팩터" },
  { value: "sector", label: "섹터" },
  { value: "theme", label: "테마" },
  { value: "individual", label: "개별주" },
];

const SECTOR_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "없음" },
  { value: "tech", label: "IT/기술" },
  { value: "bio", label: "바이오" },
  { value: "energy", label: "에너지" },
  { value: "finance", label: "금융" },
  { value: "semiconductor", label: "반도체" },
  { value: "auto", label: "자동차" },
  { value: "consumer", label: "소비재" },
];

const HEDGED_OPTIONS: { value: string; label: string }[] = [
  { value: "true", label: "예" },
  { value: "false", label: "아니오" },
];

interface ItemDetailModalProps {
  holding: AggregatedHolding | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ItemDetailModal({
  holding,
  open,
  onOpenChange,
}: ItemDetailModalProps) {
  const [tags, setTags] = useState<Partial<AssetTags> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  // Fetch current tags when modal opens
  useEffect(() => {
    if (!open || !holding) {
      setTags(null);
      setSaveStatus("idle");
      return;
    }

    fetch(`/api/assets/${encodeURIComponent(holding.ticker)}/tags`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.data?.tags) setTags(d.data.tags);
        else setTags({});
      })
      .catch(() => setTags({}));
  }, [open, holding]);

  const saveTag = useCallback(
    async (field: string, value: unknown) => {
      if (!holding) return;
      setSaving(true);
      setSaveStatus("idle");
      try {
        const res = await fetch(
          `/api/assets/${encodeURIComponent(holding.ticker)}/tags`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tags: { [field]: value, manual_override: true } }),
          },
        );
        if (res.ok) {
          const d = await res.json();
          setTags(d.data?.tags ?? { ...tags, [field]: value });
          setSaveStatus("saved");
        } else {
          setSaveStatus("error");
        }
      } catch {
        setSaveStatus("error");
      } finally {
        setSaving(false);
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    },
    [holding, tags],
  );

  if (!holding) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <TickerBadge
              ticker={holding.ticker}
              name={holding.name}
              market={holding.market as "KRX" | "NASD" | "NYSE" | "AMEX" | "BOND"}
            />
          </DialogTitle>
          <DialogDescription>종목 상세 정보</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <div>
            <p className="text-xs text-muted-foreground">수량</p>
            <p className="font-[family-name:var(--font-geist-mono)] tabular-nums text-sm">
              {holding.quantity.toLocaleString()}주
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">현재가</p>
            <MoneyDisplay
              amount={holding.current_price}
              currency={holding.currency === "KRW" ? "KRW" : "USD"}
              showColor={false}
              className="text-sm"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">평균단가</p>
            <MoneyDisplay
              amount={holding.avg_price}
              currency={holding.currency === "KRW" ? "KRW" : "USD"}
              showColor={false}
              className="text-sm"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">평가금액</p>
            <MoneyDisplay
              amount={holding.evaluation_amount}
              currency={holding.currency === "KRW" ? "KRW" : "USD"}
              showColor={false}
              className="text-sm"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">매입금액</p>
            <MoneyDisplay
              amount={holding.purchase_amount}
              currency={holding.currency === "KRW" ? "KRW" : "USD"}
              showColor={false}
              className="text-sm"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">평가손익</p>
            <div className="flex items-center gap-1">
              <MoneyDisplay
                amount={holding.pnl}
                currency={holding.currency === "KRW" ? "KRW" : "USD"}
                showSign
                showColor
                className="text-sm"
              />
            </div>
            <PercentDisplay value={holding.pnl_percent} className="text-xs" />
          </div>
        </div>

        {/* ── 분류 태그 편집 ── */}
        {tags !== null && (
          <div className="border-t pt-3 mt-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">분류 태그</p>
              {saveStatus === "saved" && (
                <span className="text-xs text-emerald-600">저장됨</span>
              )}
              {saveStatus === "error" && (
                <span className="text-xs text-destructive">저장 실패</span>
              )}
              {saving && (
                <span className="text-xs text-muted-foreground">저장 중...</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <TagSelect
                label="자산군"
                value={tags.real_asset_class ?? ""}
                options={ASSET_CLASS_OPTIONS}
                onValueChange={(v) => saveTag("real_asset_class", v)}
              />
              <TagSelect
                label="국가"
                value={tags.country ?? ""}
                options={COUNTRY_OPTIONS}
                onValueChange={(v) => saveTag("country", v)}
              />
              <TagSelect
                label="통화"
                value={tags.real_currency ?? ""}
                options={CURRENCY_OPTIONS}
                onValueChange={(v) => saveTag("real_currency", v)}
              />
              <TagSelect
                label="ETF 구조"
                value={tags.etf_structure ?? ""}
                options={ETF_STRUCTURE_OPTIONS}
                onValueChange={(v) => saveTag("etf_structure", v || undefined)}
              />
              <TagSelect
                label="섹터"
                value={tags.sector ?? ""}
                options={SECTOR_OPTIONS}
                onValueChange={(v) => saveTag("sector", v || undefined)}
              />
              <TagSelect
                label="헤지"
                value={tags.is_hedged === true ? "true" : tags.is_hedged === false ? "false" : ""}
                options={HEDGED_OPTIONS}
                onValueChange={(v) => saveTag("is_hedged", v === "true")}
              />
            </div>

            {tags.manual_override && (
              <p className="text-xs text-muted-foreground mt-2">수동 분류 적용됨</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Reusable tag select field ── */

function TagSelect({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onValueChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <Select value={value} onValueChange={(v) => { if (v !== null) onValueChange(v); }}>
        <SelectTrigger size="sm" className="w-full">
          <SelectValue placeholder="선택" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
