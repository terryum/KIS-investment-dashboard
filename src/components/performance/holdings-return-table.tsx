"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/common/money-display";
import { PercentDisplay } from "@/components/common/percent-display";
import { ArrowUpDown } from "lucide-react";

export interface HoldingReturn {
  ticker: string;
  name: string;
  market: string;
  purchase_amount: number;
  evaluation_amount: number;
  pnl: number;
  pnl_percent: number;
}

type SortKey = "name" | "pnl" | "pnl_percent" | "evaluation_amount";

interface HoldingsReturnTableProps {
  holdings: HoldingReturn[];
}

export function HoldingsReturnTable({ holdings }: HoldingsReturnTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("pnl");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...holdings].sort((a, b) => {
    const mul = sortAsc ? 1 : -1;
    if (sortKey === "name") return mul * a.name.localeCompare(b.name);
    return mul * ((a[sortKey] ?? 0) - (b[sortKey] ?? 0));
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">종목별 수익률</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            종목별 수익률 데이터가 없습니다.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort("name")}
                    >
                      종목 <ArrowUpDown className="ml-1 size-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort("evaluation_amount")}
                    >
                      평가금액 <ArrowUpDown className="ml-1 size-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort("pnl")}
                    >
                      손익 <ArrowUpDown className="ml-1 size-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-medium"
                      onClick={() => handleSort("pnl_percent")}
                    >
                      수익률 <ArrowUpDown className="ml-1 size-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((h) => (
                  <TableRow key={h.ticker}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{h.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {h.ticker}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <MoneyDisplay amount={h.evaluation_amount} showColor={false} />
                    </TableCell>
                    <TableCell className="text-right">
                      <MoneyDisplay amount={h.pnl} showSign showColor />
                    </TableCell>
                    <TableCell className="text-right">
                      <PercentDisplay value={h.pnl_percent} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
