import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Moon,
  Lightbulb,
  Wind,
  GraduationCap,
  Receipt,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Translations } from "@/i18n";

export interface NavItem {
  path: string;
  labelKey: keyof Translations["nav"];
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { path: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { path: "/session", labelKey: "session", icon: MessageSquare },
  { path: "/journal", labelKey: "journal", icon: BookOpen },
  { path: "/dreams", labelKey: "dreams", icon: Moon },
  { path: "/insights", labelKey: "insights", icon: Lightbulb },
  { path: "/tools", labelKey: "breathing", icon: Wind },
  { path: "/expenses", labelKey: "expenses", icon: Receipt },
  { path: "/schools", labelKey: "schools", icon: GraduationCap },
  { path: "/settings", labelKey: "settings", icon: Settings },
];
