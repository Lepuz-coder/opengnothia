import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { NoteTakingBanner } from "./NoteTakingBanner";
import { useAppStore } from "@/stores/useAppStore";

export function MainLayout() {
  const sidebarHidden = useAppStore((s) => s.sidebarHidden);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <NoteTakingBanner />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {!sidebarHidden && <Sidebar />}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className={sidebarHidden ? "" : "p-8"}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
