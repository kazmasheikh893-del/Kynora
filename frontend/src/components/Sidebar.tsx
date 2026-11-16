import type { ReactNode } from "react";
import type { KynoraUser, NavKey } from "../types";

interface NavItem {
  key: NavKey;
  label: string;
  badge?: number;
  icon: (active: boolean) => ReactNode;
}

interface SidebarProps {
  active: NavKey;
  onNavigate: (key: NavKey) => void;
  importantCount: number;
  actionRequiredCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  connectedEmail?: string | null;
  currentUser?: KynoraUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  active,
  onNavigate,
  importantCount,
  actionRequiredCount,
  isOpenMobile,
  onCloseMobile,
  connectedEmail,
  currentUser,
  onOpenAuth,
  onLogout,
}: SidebarProps) {
  const NAV_ITEMS: NavItem[] = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: (isActive) => (
        <svg
          className={`h-4 w-4 ${isActive ? "text-accent-blue" : "text-slate-400"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      key: "inbox",
      label: "Inbox",
      icon: (isActive) => (
        <svg
          className={`h-4 w-4 ${isActive ? "text-accent-blue" : "text-slate-400"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      ),
    },
    {
      key: "priority",
      label: "Priority Inbox",
      badge: importantCount,
      icon: (isActive) => (
        <svg
          className={`h-4 w-4 ${isActive ? "text-amber-400" : "text-slate-400"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ),
    },
    {
      key: "categories",
      label: "Categories",
      icon: (isActive) => (
        <svg
          className={`h-4 w-4 ${isActive ? "text-accent-blue" : "text-slate-400"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      ),
    },
    {
      key: "actions",
      label: "Action Required",
      badge: actionRequiredCount,
      icon: (isActive) => (
        <svg
          className={`h-4 w-4 ${isActive ? "text-red-400" : "text-slate-400"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
    },
    {
      key: "analytics",
      label: "Analytics",
      icon: (isActive) => (
        <svg
          className={`h-4 w-4 ${isActive ? "text-accent-blue" : "text-slate-400"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      key: "settings",
      label: "Settings",
      icon: (isActive) => (
        <svg
          className={`h-4 w-4 ${isActive ? "text-accent-blue" : "text-slate-400"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-navy-700 bg-navy-950 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between border-b border-navy-700/60 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-accent-blue to-cyan-400 shadow-md shadow-accent-blue/20">
              <span className="font-bold text-white text-base">K</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg tracking-tight text-white">Kynora</span>
                <span className="rounded bg-accent-blue/20 px-1.5 py-0.5 text-[10px] font-medium text-accent-blue">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Intelligent Email System</p>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="rounded p-1 text-slate-400 hover:bg-navy-800 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onNavigate(item.key);
                  onCloseMobile();
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all ${
                  isActive
                    ? "bg-navy-800 text-white shadow-sm border border-navy-700/80"
                    : "text-slate-400 hover:bg-navy-850 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon(isActive)}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      item.key === "priority"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System & User Profile Card at bottom */}
        <div className="border-t border-navy-700/60 p-4 bg-navy-950/80">
          <div className="flex items-center justify-between mb-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span
                className={`h-2 w-2 rounded-full ${
                  connectedEmail ? "bg-emerald-400 animate-pulse" : "bg-blue-400"
                }`}
              />
              {connectedEmail ? "Gmail Connected" : "Demo Mode"}
            </span>
            <span className="text-slate-400">Scikit-Learn ML</span>
          </div>

          {currentUser ? (
            <div className="flex items-center justify-between rounded-lg border border-navy-700/50 bg-navy-900/60 p-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-blue/20 text-xs font-semibold text-accent-blue shrink-0">
                  {currentUser.full_name
                    ? currentUser.full_name.charAt(0).toUpperCase()
                    : currentUser.email.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-slate-200">
                    {currentUser.full_name || currentUser.email.split("@")[0]}
                  </div>
                  <div className="truncate text-[10px] text-slate-400">
                    {currentUser.email}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Log Out of Kynora"
                className="rounded p-1 text-slate-400 hover:text-red-400 hover:bg-navy-800 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-navy-700/50 bg-navy-900/60 p-2.5 text-center">
              <div className="text-xs font-medium text-slate-300">Guest / Demo Mode</div>
              <button
                onClick={onOpenAuth}
                className="mt-2 w-full rounded-md bg-accent-blue/20 hover:bg-accent-blue/30 border border-accent-blue/40 py-1 text-xs font-semibold text-accent-blue hover:text-white transition-all"
              >
                Sign In / Register
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
