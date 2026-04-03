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

interface EarningsEstimate {
  stck_bsop_date: string;
  eps: string;
  bps: string;
  roe_val: string;
  per_val: string;
  pbr_val: string;
}

interface EstimatedEarningsTableProps {
  estimates: EarningsEstimate[];
  ticker: string;
}

export function EstimatedEarningsTable({
  estimates,
  ticker,
}: EstimatedEarningsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          추정실적 {ticker && `(${ticker})`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {estimates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            추정실적 데이터가 없습니다. 종목을 선택하세요.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>기간</TableHead>
                  <TableHead className="text-right">EPS</TableHead>
                  <TableHead className="text-right">BPS</TableHead>
                  <TableHead className="text-right">ROE</TableHead>
                  <TableHead className="text-right">PER</TableHead>
                  <TableHead className="text-right">PBR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimates.map((e, i) => (
                  <TableRow key={`${e.stck_bsop_date}-${i}`}>
                    <TableCell className="tabular-nums text-sm">
                      {e.stck_bsop_date}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {parseInt(e.eps).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {parseInt(e.bps).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {parseFloat(e.roe_val).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {parseFloat(e.per_val).toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {parseFloat(e.pbr_val).toFixed(2)}
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
