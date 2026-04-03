import {
  LayoutDashboard,
  Wallet,
  PieChart,
  TrendingUp,
  Lightbulb,
  BookOpen,
  Settings,
} from "lucide-react";
import type { NavItem } from "@/types/navigation";

export const mainNavItems: NavItem[] = [
  { label: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { label: "계좌별", href: "/accounts", icon: Wallet },
  { label: "자산배분", href: "/allocation", icon: PieChart },
  { label: "수익률", href: "/performance", icon: TrendingUp },
  { label: "마켓", href: "/insights", icon: Lightbulb },
  { label: "저널", href: "/journal", icon: BookOpen },
];

export const settingsNavItem: NavItem = {
  label: "설정",
  href: "/settings",
  icon: Settings,
};
