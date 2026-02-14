import { NavLink } from "react-router";
import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

interface SidebarItemProps {
  path: string;
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
}

export function SidebarItem({ path, label, icon: Icon, collapsed }: SidebarItemProps) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-primary-900/30 text-primary-300"
            : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
          collapsed && "justify-center px-2"
        )
      }
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}
