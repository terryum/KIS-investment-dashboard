"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { mainNavItems, settingsNavItem } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function NavLink({
  href,
  isActive,
  icon: Icon,
  label,
  collapsed,
}: {
  href: string;
  isActive: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex items-center justify-between h-14 px-3 border-b">
        {!collapsed && (
          <span className="text-sm font-semibold truncate">KIS 투자관리</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="shrink-0"
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 py-2 space-y-1 px-2">
        {mainNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  render={
                    <NavLink
                      href={item.href}
                      isActive={isActive}
                      icon={item.icon}
                      label={item.label}
                      collapsed={collapsed}
                    />
                  }
                />
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }

          return (
            <div key={item.href}>
              <NavLink
                href={item.href}
                isActive={isActive}
                icon={item.icon}
                label={item.label}
                collapsed={collapsed}
              />
            </div>
          );
        })}
      </nav>

      <div className="border-t px-2 py-2">
        {(() => {
          const isActive = pathname.startsWith(settingsNavItem.href);

          if (collapsed) {
            return (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <NavLink
                      href={settingsNavItem.href}
                      isActive={isActive}
                      icon={settingsNavItem.icon}
                      label={settingsNavItem.label}
                      collapsed={collapsed}
                    />
                  }
                />
                <TooltipContent side="right">{settingsNavItem.label}</TooltipContent>
              </Tooltip>
            );
          }

          return (
            <NavLink
              href={settingsNavItem.href}
              isActive={isActive}
              icon={settingsNavItem.icon}
              label={settingsNavItem.label}
              collapsed={collapsed}
            />
          );
        })()}
      </div>
    </aside>
  );
}
