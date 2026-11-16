import type { KynoraUser, NavKey } from "../types";

interface Props {
  activeNav: NavKey;
  search: string;
  onSearchChange: (value: string) => void;
  onOpenMobileMenu: () => void;
  onRefresh: () => void;
  pendingActionsCount: number;
  currentUser?: KynoraUser | null;
  onOpenAuth?: () => void;
}

const PAGE_TITLES: Record<NavKey, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Overview of your inbox intelligence, priority queue, and upcoming deadlines",
  },
  inbox: {
    title: "Intelligent Inbox",
    subtitle: "All incoming communication categorized and scored by priority",
  },
  priority: {
    title: "Priority Inbox",
    subtitle: "High and urgent messages segregated for rapid decision making",
  },
  categories: {
    title: "Email Categories",
    subtitle: "Topical clustering across work, education, security, and developer updates",
  },
  actions: {
    title: "Action Required",
    subtitle: "Messages requiring your reply, submission, or verification",
  },
  analytics: {
    title: "Inbox Analytics",
    subtitle: "Empirical breakdown of communication volume, read rates, and ML performance",
  },
  settings: {
    title: "Settings & Configuration",
    subtitle: "Manage Gmail OAuth, MySQL database, and Scikit-Learn ML engine parameters",
  },
};

export default function TopNav({
  activeNav,
  search,
  onSearchChange,
  onOpenMobileMenu,
  onRefresh,
  pendingActionsCount,
  currentUser,
  onOpenAuth,
}: Props) {
  const current = PAGE_TITLES[activeNav];

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-navy-700/60 bg-navy-950/50 px-6 backdrop-blur-md">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="rounded p-1.5 text-slate-400 hover:bg-navy-800 hover:text-white lg:hidden"
          aria-label="Open mobile menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <h1 className="text-base font-semibold text-white tracking-tight">{current.title}</h1>
          <p className="hidden text-xs text-slate-400 md:block">{current.subtitle}</p>
        </div>
      </div>

      {/* Right: Search & Actions */}
      <div className="flex items-center gap-3">
        {/* Global Search Bar */}
        <div className="relative w-56 md:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search subject, sender, preview..."
            className="w-full rounded-lg border border-navy-700 bg-navy-900/90 py-1.5 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-400 focus:border-accent-blue focus:bg-navy-900 focus:outline-none"
          />
          <svg
            className="absolute left-2.5 top-2 h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          title="Refresh Inbox & Analytics"
          className="rounded-lg border border-navy-700 bg-navy-900/80 p-2 text-slate-400 hover:border-navy-600 hover:bg-navy-800 hover:text-slate-200 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            title="Action Items Notification"
            className="rounded-lg border border-navy-700 bg-navy-900/80 p-2 text-slate-400 hover:border-navy-600 hover:bg-navy-800 hover:text-slate-200 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>
          {pendingActionsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
              {pendingActionsCount}
            </span>
          )}
        </div>

        {/* User Account Button */}
        {currentUser ? (
          <div className="flex items-center gap-2 pl-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-blue/20 text-xs font-bold text-accent-blue border border-accent-blue/30">
              {currentUser.full_name
                ? currentUser.full_name.charAt(0).toUpperCase()
                : currentUser.email.charAt(0).toUpperCase()}
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="rounded-lg border border-accent-blue/40 bg-accent-blue/15 px-3 py-1.5 text-xs font-semibold text-accent-blue hover:bg-accent-blue/25 hover:text-white transition-all shadow-sm"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
