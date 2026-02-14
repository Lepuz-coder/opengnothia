import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { useAppStore } from "@/stores/useAppStore";

export function MainLayout() {
  const sidebarHidden = useAppStore((s) => s.sidebarHidden);

  return (
    <div className="flex h-screen overflow-hidden">
      {!sidebarHidden && <Sidebar />}
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className={sidebarHidden ? "" : "p-8"}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
