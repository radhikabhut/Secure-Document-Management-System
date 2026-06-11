import { X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { getVisibleNavItems } from "@/components/layout/nav-items";
import { useAuthStore } from "@/store/auth-store";

interface SidebarProps {
  isMobileOpen: boolean;
  onClose: () => void;
}

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition",
    isActive
      ? "bg-blue-50 text-blue-700"
      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
  ].join(" ");

export function Sidebar({ isMobileOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const visibleNavItems = getVisibleNavItems(user);

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/login", { replace: true });
  };

  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
        <div>
          <p className="text-base font-semibold text-slate-950">DocuVault</p>
          <p className="text-xs font-medium text-slate-500">Secure DMS</p>
        </div>
        <button
          aria-label="Close navigation"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          type="button"
          onClick={onClose}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;

          if (item.type === "action") {
            return (
              <button
                key={item.path}
                className="mt-auto flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                type="button"
                onClick={handleLogout}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={item.path}
              className={navLinkClassName}
              to={item.path}
              onClick={onClose}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <>
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        {sidebar}
      </div>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-slate-950/40"
            type="button"
            onClick={onClose}
          />
          <div className="relative h-full">{sidebar}</div>
        </div>
      ) : null}
    </>
  );
}
