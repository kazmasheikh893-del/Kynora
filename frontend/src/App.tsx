import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import TopNav from "./components/TopNav";
import Toolbar from "./components/Toolbar";
import EmailList from "./components/EmailList";
import EmailDetail from "./components/EmailDetail";
import DashboardView from "./components/DashboardView";
import PriorityInboxView from "./components/PriorityInboxView";
import CategoriesView from "./components/CategoriesView";
import ActionRequiredView from "./components/ActionRequiredView";
import AnalyticsView from "./components/AnalyticsView";
import SettingsView from "./components/SettingsView";
import AuthModal from "./components/AuthModal";

import {
  fetchEmails,
  fetchStats,
  fetchBrief,
  fetchDeadlines,
  fetchActions,
  fetchAnalytics,
  fetchMLStatus,
  fetchDBStatus,
  fetchGmailStatus,
  fetchMe,
  logoutUser,
  markEmailRead,
  markEmailUnread,
} from "./api";

import type {
  AnalyticsData,
  DBStatusData,
  DeadlineItem,
  EmailWithAnalysis,
  FilterKey,
  GmailStatusData,
  InboxStats,
  KynoraBrief,
  KynoraUser,
  MLStatusData,
  NavKey,
} from "./types";

export default function App() {
  const [activeNav, setActiveNav] = useState<NavKey>("dashboard");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"priority" | "newest" | "oldest">("priority");
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // User Authentication state
  const [currentUser, setCurrentUser] = useState<KynoraUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Email data states
  const [emails, setEmails] = useState<EmailWithAnalysis[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(true);
  const [emailsError, setEmailsError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Aggregated intelligence states
  const [stats, setStats] = useState<InboxStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [brief, setBrief] = useState<KynoraBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(true);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [actionEmails, setActionEmails] = useState<EmailWithAnalysis[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // System status
  const [mlStatus, setMlStatus] = useState<MLStatusData | null>(null);
  const [dbStatus, setDbStatus] = useState<DBStatusData | null>(null);
  const [gmailStatus, setGmailStatus] = useState<GmailStatusData | null>(null);

  // Compute live priority & category distribution from currently loaded emails
  const priorityCounts: { Urgent: number; High: number; Medium: number; Low: number } = {
    Urgent: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };
  const categoryCounts: Record<string, number> = {};

  for (const e of emails) {
    const p = e.analysis.priority;
    if (p in priorityCounts) priorityCounts[p]++;
    const cat = e.analysis.category;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  // Check user session on mount
  useEffect(() => {
    fetchMe()
      .then((res) => setCurrentUser(res.user))
      .catch(() => setCurrentUser(null));
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    loadEmails();
    loadAggregates();
  };

  // Load static aggregate intelligence
  const loadAggregates = () => {
    setStatsLoading(true);
    setBriefLoading(true);
    setAnalyticsLoading(true);

    fetchStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));

    fetchBrief()
      .then(setBrief)
      .catch(() => setBrief(null))
      .finally(() => setBriefLoading(false));

    fetchDeadlines()
      .then(setDeadlines)
      .catch(() => setDeadlines([]));

    fetchActions()
      .then(setActionEmails)
      .catch(() => setActionEmails([]));

    fetchAnalytics()
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false));

    fetchMLStatus()
      .then(setMlStatus)
      .catch(() => setMlStatus(null));

    fetchDBStatus()
      .then(setDbStatus)
      .catch(() => setDbStatus(null));

    fetchGmailStatus()
      .then(setGmailStatus)
      .catch(() => setGmailStatus(null));
  };

  useEffect(() => {
    loadAggregates();
  }, []);

  // Fetch email list whenever filter, search, unreadOnly, or sortBy changes
  const loadEmails = () => {
    setEmailsLoading(true);
    const params: Parameters<typeof fetchEmails>[0] = {};

    if (filter === "Urgent" || filter === "High" || filter === "Medium" || filter === "Low") {
      params.priority = filter;
    } else if (filter !== "all") {
      params.category = filter;
    }

    if (unreadOnly) params.unreadOnly = true;
    if (search.trim()) params.search = search.trim();
    params.sortBy = sortBy;

    fetchEmails(params)
      .then((data) => {
        setEmails(data);
        setEmailsError(null);
      })
      .catch(() => {
        setEmails([]);
        setEmailsError(
          "Can't reach the Kynora API. Please ensure the backend is running on http://localhost:8000."
        );
      })
      .finally(() => {
        setEmailsLoading(false);
      });
  };

  useEffect(() => {
    loadEmails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search, unreadOnly, sortBy]);

  // Keep selection synchronized with current email list
  useEffect(() => {
    if (emailsLoading) return;
    const stillVisible = emails.some((e) => e.id === selectedId);
    if (!stillVisible) {
      setSelectedId(emails.length > 0 ? emails[0].id : null);
    }
  }, [emails, emailsLoading, selectedId]);

  // Mark read when user selects an email
  async function handleSelect(id: string) {
    setSelectedId(id);
    const target = emails.find((e) => e.id === id);
    if (target && !target.is_read) {
      try {
        const updated = await markEmailRead(id);
        setEmails((prev) => prev.map((e) => (e.id === id ? updated : e)));
        fetchStats().then(setStats);
        fetchAnalytics().then(setAnalytics);
      } catch {
        // Non-fatal
      }
    }
  }

  // Toggle read / unread status explicitly
  async function handleToggleRead(id: string, currentRead: boolean) {
    try {
      const updated = currentRead ? await markEmailUnread(id) : await markEmailRead(id);
      setEmails((prev) => prev.map((e) => (e.id === id ? updated : e)));
      fetchStats().then(setStats);
      fetchAnalytics().then(setAnalytics);
    } catch {
      // Non-fatal
    }
  }

  function handleNavigate(key: NavKey) {
    setActiveNav(key);
    if (key === "inbox") {
      setFilter("all");
      setUnreadOnly(false);
    }
  }

  const selectedEmail = emails.find((e) => e.id === selectedId) ?? null;

  return (
    <div className="flex h-screen overflow-hidden bg-navy-900 text-slate-100 antialiased font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        active={activeNav}
        onNavigate={handleNavigate}
        importantCount={stats?.important ?? priorityCounts.Urgent + priorityCounts.High}
        actionRequiredCount={stats?.action_required ?? actionEmails.length}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        connectedEmail={gmailStatus?.connected_email}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Header Bar */}
        <TopNav
          activeNav={activeNav}
          search={search}
          onSearchChange={setSearch}
          onOpenMobileMenu={() => setIsOpenMobile(true)}
          onRefresh={() => {
            loadEmails();
            loadAggregates();
          }}
          pendingActionsCount={stats?.action_required ?? actionEmails.length}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        {/* API Error Notification Banner */}
        {emailsError && (
          <div className="flex items-center justify-between border-b border-red-500/30 bg-red-950/40 px-6 py-2.5 text-xs text-red-300">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{emailsError}</span>
            </div>
            <button
              onClick={() => {
                setEmailsError(null);
                loadEmails();
              }}
              className="font-semibold underline hover:text-white"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Dynamic Page Views */}
        <main className="flex flex-1 overflow-hidden">
          {activeNav === "dashboard" && (
            <DashboardView
              stats={stats}
              statsLoading={statsLoading}
              brief={brief}
              briefLoading={briefLoading}
              recentEmails={emails}
              deadlines={deadlines}
              actionEmails={actionEmails}
              onSelectEmail={(id) => {
                setSelectedId(id);
                setActiveNav("inbox");
              }}
              onNavigateToTab={setActiveNav}
              priorityCounts={priorityCounts}
              categoryCounts={categoryCounts}
            />
          )}

          {activeNav === "inbox" && (
            <div className="flex flex-1 overflow-hidden">
              {/* Left Email List & Filter Toolbar */}
              <div className="flex w-[380px] shrink-0 flex-col border-r border-navy-700/60 bg-navy-950/30">
                <div className="border-b border-navy-700/60 p-3.5">
                  <Toolbar
                    filter={filter}
                    onFilterChange={setFilter}
                    search={search}
                    onSearchChange={setSearch}
                    unreadOnly={unreadOnly}
                    onToggleUnreadOnly={() => setUnreadOnly((prev) => !prev)}
                    sortBy={sortBy}
                    onSortByChange={setSortBy}
                  />
                </div>
                <div className="flex-1 overflow-hidden">
                  <EmailList
                    emails={emails}
                    loading={emailsLoading}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                  />
                </div>
              </div>

              {/* Right Email Reading & Analysis Pane */}
              <div className="flex-1 overflow-hidden">
                <EmailDetail email={selectedEmail} onToggleRead={handleToggleRead} />
              </div>
            </div>
          )}

          {activeNav === "priority" && (
            <PriorityInboxView
              emails={emails}
              loading={emailsLoading}
              selectedId={selectedId}
              onSelect={handleSelect}
              onToggleRead={handleToggleRead}
            />
          )}

          {activeNav === "categories" && (
            <CategoriesView
              emails={emails}
              loading={emailsLoading}
              selectedId={selectedId}
              onSelect={handleSelect}
              onToggleRead={handleToggleRead}
            />
          )}

          {activeNav === "actions" && (
            <ActionRequiredView
              actionEmails={actionEmails}
              loading={emailsLoading}
              onSelectEmail={(id) => {
                setSelectedId(id);
                setActiveNav("inbox");
              }}
              onNavigateToInbox={() => setActiveNav("inbox")}
            />
          )}

          {activeNav === "analytics" && (
            <AnalyticsView
              analytics={analytics}
              mlStatus={mlStatus}
              loading={analyticsLoading}
            />
          )}

          {activeNav === "settings" && (
            <SettingsView
              dbStatus={dbStatus}
              gmailStatus={gmailStatus}
              mlStatus={mlStatus}
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onLogout={handleLogout}
              onRefreshAll={() => {
                loadEmails();
                loadAggregates();
              }}
            />
          )}
        </main>
      </div>

      {/* User Registration & Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          loadEmails();
          loadAggregates();
        }}
      />
    </div>
  );
}
