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
import type { Income } from "./hooks";

interface IncomeTableProps {
  incomes: Income[];
}

const typeLabels: Record<string, string> = {
  dividend: "배당",
  distribution: "분배",
  interest: "이자",
};

const typeColors: Record<string, string> = {
  dividend: "bg-red-100 text-red-700 border-red-200",
  distribution: "bg-purple-100 text-purple-700 border-purple-200",
  interest: "bg-green-100 text-green-700 border-green-200",
};

export function IncomeTable({ incomes }: IncomeTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">인컴 내역</CardTitle>
      </CardHeader>
      <CardContent>
        {incomes.length === 0 ? (
          <p className="text-sm text-muted-foreground">내역이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>종목</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomes.map((inc) => (
                  <TableRow key={inc.id}>
                    <TableCell className="tabular-nums text-sm">
                      {inc.date}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={typeColors[inc.type] ?? ""}
                      >
                        {typeLabels[inc.type] ?? inc.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {inc.name ?? inc.ticker ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <MoneyDisplay
                        amount={inc.amount}
                        currency={inc.currency as "KRW" | "USD"}
                        showColor={false}
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
