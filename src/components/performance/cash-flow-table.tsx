"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoneyDisplay } from "@/components/common/money-display";
import type { CashFlow } from "./hooks";

interface CashFlowTableProps {
  cashFlows: CashFlow[];
}

const flowTypeLabels: Record<string, string> = {
  deposit: "입금",
  withdrawal: "출금",
  internal: "내부이체",
};

export function CashFlowTable({ cashFlows }: CashFlowTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">입출금 내역</CardTitle>
      </CardHeader>
      <CardContent>
        {cashFlows.length === 0 ? (
          <p className="text-sm text-muted-foreground">내역이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashFlows.map((cf) => (
                  <TableRow key={cf.id}>
                    <TableCell className="tabular-nums text-sm">
                      {cf.date}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {flowTypeLabels[cf.flow_type] ?? cf.flow_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {cf.description ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <MoneyDisplay
                        amount={cf.amount}
                        currency={cf.currency as "KRW" | "USD"}
                        showSign
                        showColor
                      />
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
