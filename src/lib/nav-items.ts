import {
  LayoutDashboard,
  Landmark,
  ArrowLeftRight,
  PiggyBank,
  Receipt,
  Wallet,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Accounts", href: "/accounts", icon: Landmark },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Budget", href: "/budget", icon: PiggyBank },
  { label: "Bills", href: "/bills", icon: Receipt },
  { label: "Paycheck", href: "/paycheck", icon: Wallet },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Net Worth", href: "/net-worth", icon: TrendingUp },
];
