import { useState, type ChangeEvent } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { DocumentStatus } from "@/types/document";

export interface DocumentFiltersValue {
  search: string;
  categoryId: string;
  mimeType: string;
  status: DocumentStatus | "";
  from: string;
  to: string;
  uploadedBy: string;
}

interface DocumentFiltersProps {
  categories: { id: string; name: string }[];
  users?: { id: string; name: string }[];
  filters: DocumentFiltersValue;
  onChange: (filters: DocumentFiltersValue) => void;
}

export function DocumentFilters({
  categories,
  users = [],
  filters,
  onChange,
}: DocumentFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter =
    (key: keyof DocumentFiltersValue) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChange({ ...filters, [key]: event.target.value });
    };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className="sr-only" htmlFor="document-search">
            Search documents
          </label>
          <input
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            id="document-search"
            placeholder="Search by title, file name, or owner"
            type="search"
            value={filters.search}
            onChange={updateFilter("search")}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Advanced Filters
        </button>
      </div>

      {showAdvanced && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 border-t border-slate-100 pt-4">
          <select
            aria-label="Filter by category"
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            value={filters.categoryId}
            onChange={updateFilter("categoryId")}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by file type"
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            value={filters.mimeType}
            onChange={updateFilter("mimeType")}
          >
            <option value="">All types</option>
            <option value="pdf">PDF</option>
            <option value="image">Images</option>
            <option value="word">Word</option>
            <option value="excel">Excel</option>
          </select>

          <select
            aria-label="Filter by uploader"
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            value={filters.uploadedBy}
            onChange={updateFilter("uploadedBy")}
          >
            <option value="">Any uploader</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>

          <input
            aria-label="From date"
            type="date"
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            value={filters.from}
            onChange={updateFilter("from")}
          />

          <input
            aria-label="To date"
            type="date"
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            value={filters.to}
            onChange={updateFilter("to")}
          />
        </div>
      )}
    </section>
  );
}
