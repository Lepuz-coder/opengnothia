import { useState, useEffect } from "react";
import { PanelLeftClose, PanelLeft, FileText, Loader2, X } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { useAppStore } from "@/stores/useAppStore";
import { loadSettings } from "@/lib/store";
import { navItems } from "@/constants/navigation";
import { SidebarItem } from "./SidebarItem";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/i18n";

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, isNoteTaking, hasSeenNoteTutorial, setHasSeenNoteTutorial } = useAppStore();
  const { t } = useTranslation();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (isNoteTaking && !hasSeenNoteTutorial) {
      setShowTutorial(true);
    }
  }, [isNoteTaking, hasSeenNoteTutorial]);

  async function dismissTutorial() {
    setShowTutorial(false);
    setHasSeenNoteTutorial(true);
    const store = await loadSettings();
    await store.set("hasSeenNoteTutorial", true);
    await store.save();
  }

  return (
    <aside
      className={cn(
        "h-screen flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)] transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-[var(--border-color)]", sidebarCollapsed && "justify-center px-2")}>
        <img src={logoImg} alt="OpenGnothia" className="w-8 h-8 shrink-0" />
        {!sidebarCollapsed && (
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent leading-tight">
              OpenGnothia
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] font-medium">
              Know Thyself
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <SidebarItem
            key={item.path}
            path={item.path}
            label={t.nav[item.labelKey]}
            icon={item.icon}
            collapsed={sidebarCollapsed}
          />
        ))}
      </nav>

      {/* Bottom bar */}
      <div className="px-3 py-4 border-t border-[var(--border-color)] space-y-2">
        {isNoteTaking && (
          <div className="relative">
            <div className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--text-muted)] bg-[var(--bg-tertiary)] transition-all",
              sidebarCollapsed && "justify-center px-2",
              showTutorial && "ring-2 ring-primary-400/50"
            )}>
              {sidebarCollapsed ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary-400 shrink-0" />
              ) : (
                <>
                  <FileText className="w-4 h-4 text-primary-400 shrink-0" />
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-400 shrink-0" />
                  <span className="text-xs truncate">{t.sidebar.noteTaking}</span>
                </>
              )}
            </div>

            {showTutorial && (
              <div className="absolute bottom-0 left-full ml-3 w-72 z-50">
                <div className="absolute left-0 top-4 -translate-x-full">
                  <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-[var(--bg-secondary)]" />
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 shadow-xl">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-primary-400">{t.sidebar.info}</span>
                    <button
                      onClick={dismissTutorial}
                      className="p-0.5 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {t.sidebar.noteTutorial}
                  </p>
                  <button
                    onClick={dismissTutorial}
                    className="mt-3 w-full text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    {t.sidebar.understood}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          {sidebarCollapsed ? (
            <PanelLeft className="w-5 h-5" />
          ) : (
            <>
              <PanelLeftClose className="w-5 h-5" />
              <span>{t.sidebar.collapse}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
