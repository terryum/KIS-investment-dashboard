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
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { TickerBadge } from "@/components/common/ticker-badge";
import { MoneyDisplay } from "@/components/common/money-display";
import type { WatchlistItem } from "./hooks";
import { useDeleteWatchlistItem } from "./hooks";

interface WatchlistTableProps {
  items: WatchlistItem[];
}

export function WatchlistTable({ items }: WatchlistTableProps) {
  const deleteItem = useDeleteWatchlistItem();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">관심 종목</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            관심 종목이 없습니다.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>종목</TableHead>
                  <TableHead>사유</TableHead>
                  <TableHead className="text-right">목표가</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <TickerBadge
                        ticker={item.ticker}
                        name={item.name ?? undefined}
                        market={
                          item.market as
                            | "KRX"
                            | "NASD"
                            | "NYSE"
                            | "AMEX"
                            | "BOND"
                            | undefined
                        }
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {item.reason ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.target_price != null ? (
                        <MoneyDisplay
                          amount={item.target_price}
                          showColor={false}
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => deleteItem.mutate(item.id)}
                        disabled={deleteItem.isPending}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
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
