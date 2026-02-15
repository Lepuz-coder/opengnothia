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

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/session", label: "Seans", icon: MessageSquare },
  { path: "/journal", label: "Günlük", icon: BookOpen },
  { path: "/dreams", label: "Rüyalar", icon: Moon },
  { path: "/insights", label: "İçgörüler", icon: Lightbulb },
  { path: "/tools", label: "Nefes Egzersizi", icon: Wind },
  { path: "/expenses", label: "Harcamalar", icon: Receipt },
  { path: "/settings", label: "Ayarlar", icon: Settings },
];
