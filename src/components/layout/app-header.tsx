"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { RefreshCw, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const today = format(new Date(), "yyyy년 M월 d일 (EEE)", { locale: ko });

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b bg-background">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold md:hidden">KIS 투자관리</h1>
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {today}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground sm:hidden">
          {today}
        </span>
        <Button variant="ghost" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Link href="/settings" className="md:hidden">
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
