import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";

export function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
