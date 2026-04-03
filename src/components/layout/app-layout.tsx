"use client";

import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "./sidebar";
import { BottomTabBar } from "./bottom-tab-bar";
import { AppHeader } from "./app-header";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />

          <main className="flex-1 overflow-y-auto p-4 pb-18 md:pb-4">
            {children}
          </main>
        </div>

        <BottomTabBar />
      </div>
    </TooltipProvider>
  );
}
