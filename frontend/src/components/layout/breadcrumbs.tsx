import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { getNavItemByPath } from "@/components/layout/nav-items";

const toTitleCase = (value: string) =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getCrumbs = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);

  return segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join("/")}`;
    const navItem = getNavItemByPath(path);

    return {
      label: navItem?.label ?? toTitleCase(segment),
      path,
    };
  });
};

export function Breadcrumbs() {
  const location = useLocation();
  const crumbs = getCrumbs(location.pathname);

  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6"
    >
      <ol className="flex min-w-0 items-center gap-2 text-sm">
        <li className="flex items-center">
          <Link
            className="inline-flex items-center gap-1 font-medium text-slate-600 transition hover:text-slate-950"
            to="/dashboard"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Home</span>
          </Link>
        </li>

        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          if (crumb.path === "/dashboard") {
            return null;
          }

          return (
            <li key={crumb.path} className="flex min-w-0 items-center gap-2">
              <ChevronRight
                className="h-4 w-4 shrink-0 text-slate-400"
                aria-hidden="true"
              />
              {isLast ? (
                <span className="truncate font-medium text-slate-950">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  className="truncate font-medium text-slate-600 transition hover:text-slate-950"
                  to={crumb.path}
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
