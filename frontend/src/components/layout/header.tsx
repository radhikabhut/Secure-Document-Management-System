import { Menu, UserCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getNavItemByPath } from "@/components/layout/nav-items";
import { useAuthStore } from "@/store/auth-store";

interface HeaderProps {
  onMenuClick: () => void;
}

const getInitials = (firstName?: string, lastName?: string, email?: string) => {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim();

  return initials || email?.[0]?.toUpperCase() || "U";
};

const toTitleCase = (value: string) =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getPageTitle = (pathname: string) => {
  const navItem = getNavItemByPath(pathname);

  if (navItem) {
    return navItem.label;
  }

  const [firstSegment] = pathname.split("/").filter(Boolean);

  return firstSegment ? toTitleCase(firstSegment) : "Dashboard";
};

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pageTitle = getPageTitle(location.pathname);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label="Open navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 lg:hidden"
            type="button"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Workspace
            </p>
            <h1 className="truncate text-xl font-semibold text-slate-950">
              {pageTitle}
            </h1>
          </div>
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
            className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-left transition hover:bg-slate-50"
            type="button"
            onClick={() => setIsUserMenuOpen((isOpen) => !isOpen)}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
              {getInitials(user?.firstName, user?.lastName, user?.email)}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-sm font-medium text-slate-900">
                {user ? `${user.firstName} ${user.lastName}` : "User"}
              </span>
              <span className="block truncate text-xs text-slate-500">
                {user?.email ?? "Signed in"}
              </span>
            </span>
          </button>

          {isUserMenuOpen ? (
            <div
              className="absolute right-0 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
              role="menu"
            >
              <div className="border-b border-slate-100 px-3 py-3">
                <div className="flex items-center gap-3">
                  <UserCircle
                    className="h-9 w-9 text-slate-400"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-950">
                      {user ? `${user.firstName} ${user.lastName}` : "User"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {user?.email ?? "No email available"}
                    </p>
                  </div>
                </div>
              </div>

              <Link
                className="block rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                role="menuitem"
                to="/profile"
                onClick={() => setIsUserMenuOpen(false)}
              >
                Profile
              </Link>
              <button
                className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                role="menuitem"
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
