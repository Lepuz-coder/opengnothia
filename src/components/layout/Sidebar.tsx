import { Brain, PanelLeftClose, PanelLeft } from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";
import { navItems } from "@/constants/navigation";
import { SidebarItem } from "./SidebarItem";
import { cn } from "@/lib/cn";

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        "h-screen flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)] transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-[var(--border-color)]", sidebarCollapsed && "justify-center px-2")}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0">
          <Brain className="w-5 h-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            OpenGnothia
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <SidebarItem
            key={item.path}
            path={item.path}
            label={item.label}
            icon={item.icon}
            collapsed={sidebarCollapsed}
          />
        ))}
      </nav>

      {/* Bottom bar */}
      <div className="px-3 py-4 border-t border-[var(--border-color)]">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          {sidebarCollapsed ? (
            <PanelLeft className="w-5 h-5" />
          ) : (
            <>
              <PanelLeftClose className="w-5 h-5" />
              <span>Daralt</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
