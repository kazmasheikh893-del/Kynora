import type { Category, FilterKey } from "../types";

interface Props {
  filter: FilterKey;
  onFilterChange: (key: FilterKey) => void;
  search: string;
  onSearchChange: (value: string) => void;
  unreadOnly: boolean;
  onToggleUnreadOnly: () => void;
  sortBy: "priority" | "newest" | "oldest";
  onSortByChange: (val: "priority" | "newest" | "oldest") => void;
}

const PRIORITY_FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All Emails" },
  { key: "Urgent", label: "Urgent" },
  { key: "High", label: "High" },
  { key: "Medium", label: "Medium" },
  { key: "Low", label: "Low" },
];

const CATEGORIES: Category[] = [
  "College",
  "Internship",
  "Placement",
  "Security",
  "GitHub",
  "Certification",
  "Newsletter",
  "Promotion",
  "General",
];

export default function Toolbar({
  filter,
  onFilterChange,
  search,
  onSearchChange,
  unreadOnly,
  onToggleUnreadOnly,
  sortBy,
  onSortByChange,
}: Props) {
  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          type="text"
          placeholder="Filter by sender, subject, or keywords..."
          className="w-full rounded-lg border border-navy-700 bg-navy-900/90 py-2 pl-9 pr-8 text-xs text-slate-100 placeholder:text-slate-400 focus:border-accent-blue focus:outline-none"
        />
        <svg
          className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Primary Priority Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {PRIORITY_FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => onFilterChange(f.key)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                isActive
                  ? "bg-accent-blue text-white shadow-sm"
                  : "bg-navy-800 text-slate-400 hover:bg-navy-750 hover:text-slate-200 border border-navy-700/60"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Category Dropdown & Secondary Controls */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-navy-700/50">
        {/* Category Select */}
        <select
          value={CATEGORIES.includes(filter as any) ? filter : ""}
          onChange={(e) => onFilterChange((e.target.value || "all") as FilterKey)}
          className="rounded-md border border-navy-700 bg-navy-900 px-2 py-1 text-xs text-slate-300 focus:border-accent-blue focus:outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Unread toggle & Sort selector */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleUnreadOnly}
            title="Filter by unread only"
            className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
              unreadOnly
                ? "border-accent-blue bg-accent-blue/20 text-accent-blue font-semibold"
                : "border-navy-700 bg-navy-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            Unread
          </button>

          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as any)}
            className="rounded-md border border-navy-700 bg-navy-900 px-2 py-1 text-xs text-slate-300 focus:border-accent-blue focus:outline-none"
          >
            <option value="priority">Sort: Priority</option>
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
          </select>
        </div>
      </div>
    </div>
  );
}
