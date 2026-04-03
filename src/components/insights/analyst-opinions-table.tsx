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

interface AnalystOpinion {
  stck_bsop_date: string;
  invt_opnn: string;
  stck_prpr: string;
  mbcr_name: string;
  goal_price: string;
}

interface AnalystOpinionsTableProps {
  opinions: AnalystOpinion[];
  ticker: string;
}

export function AnalystOpinionsTable({
  opinions,
  ticker,
}: AnalystOpinionsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          투자의견 {ticker && `(${ticker})`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {opinions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            투자의견 데이터가 없습니다. 종목을 선택하세요.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>증권사</TableHead>
                  <TableHead>의견</TableHead>
                  <TableHead className="text-right">목표가</TableHead>
                  <TableHead className="text-right">현재가</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opinions.map((o, i) => (
                  <TableRow key={`${o.stck_bsop_date}-${o.mbcr_name}-${i}`}>
                    <TableCell className="tabular-nums text-sm">
                      {o.stck_bsop_date}
                    </TableCell>
                    <TableCell className="text-sm">{o.mbcr_name}</TableCell>
                    <TableCell className="text-sm">{o.invt_opnn}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {parseInt(o.goal_price).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {parseInt(o.stck_prpr).toLocaleString()}
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
