import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        isMobileOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="min-h-screen lg:pl-64">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Breadcrumbs />
        <main className="px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
