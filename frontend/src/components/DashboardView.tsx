import type {
  DeadlineItem,
  EmailWithAnalysis,
  InboxStats,
  KynoraBrief as KynoraBriefType,
} from "../types";
import { daysUntil, formatDeadline, formatRelativeDay } from "../utils";
import KynoraBrief from "./KynoraBrief";
import PriorityBadge from "./PriorityBadge";
import StatsBar from "./StatsBar";

interface Props {
  stats: InboxStats | null;
  statsLoading: boolean;
  brief: KynoraBriefType | null;
  briefLoading: boolean;
  recentEmails: EmailWithAnalysis[];
  deadlines: DeadlineItem[];
  actionEmails: EmailWithAnalysis[];
  onSelectEmail: (id: string) => void;
  onNavigateToTab: (tab: any) => void;
  priorityCounts: { Urgent: number; High: number; Medium: number; Low: number };
  categoryCounts: Record<string, number>;
}

export default function DashboardView({
  stats,
  statsLoading,
  brief,
  briefLoading,
  recentEmails,
  deadlines,
  actionEmails,
  onSelectEmail,
  onNavigateToTab,
  priorityCounts,
  categoryCounts,
}: Props) {
  const total = stats?.total || 1;
  const urgentHigh = priorityCounts.Urgent + priorityCounts.High;
  const med = priorityCounts.Medium;
  const low = priorityCounts.Low;

  const urgentHighPct = Math.round((urgentHigh / total) * 100);
  const medPct = Math.round((med / total) * 100);
  const lowPct = Math.max(0, 100 - urgentHighPct - medPct);

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
      {/* 1. Kynora Brief Top Headline */}
      <KynoraBrief
        brief={brief}
        loading={briefLoading}
        onViewImportant={() => onNavigateToTab("priority")}
      />

      {/* 2. Overview Metric Cards */}
      <StatsBar stats={stats} loading={statsLoading} priorityCounts={priorityCounts} />

      {/* 3. Main Grid Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 spans): Priority Distribution & Recent Emails */}
        <div className="space-y-6 lg:col-span-2">
          {/* Priority Distribution Card */}
          <div className="rounded-xl border border-navy-700/80 bg-navy-800/80 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Priority Distribution</h3>
                <p className="text-xs text-slate-400">
                  ML-classified email density by urgency tier
                </p>
              </div>
              <button
                onClick={() => onNavigateToTab("priority")}
                className="text-xs font-medium text-accent-blue hover:text-blue-400"
              >
                View Priority Inbox &rarr;
              </button>
            </div>

            {/* Visual Priority Segmented Bar */}
            <div className="mt-4">
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-navy-950">
                <div
                  style={{ width: `${urgentHighPct}%` }}
                  className="bg-amber-500 transition-all"
                  title={`High / Urgent: ${urgentHighPct}%`}
                />
                <div
                  style={{ width: `${medPct}%` }}
                  className="bg-blue-500 transition-all"
                  title={`Medium: ${medPct}%`}
                />
                <div
                  style={{ width: `${lowPct}%` }}
                  className="bg-slate-600 transition-all"
                  title={`Low: ${lowPct}%`}
                />
              </div>

              {/* Legend & Breakdown */}
              <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-navy-900/60 p-2.5 border border-navy-700/40">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    High & Urgent
                  </div>
                  <div className="mt-1 text-lg font-bold text-white">{urgentHigh}</div>
                  <div className="text-[11px] text-slate-400">{urgentHighPct}% of inbox</div>
                </div>

                <div className="rounded-lg bg-navy-900/60 p-2.5 border border-navy-700/40">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-blue-400 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-blue-400" />
                    Medium Priority
                  </div>
                  <div className="mt-1 text-lg font-bold text-white">{med}</div>
                  <div className="text-[11px] text-slate-400">{medPct}% of inbox</div>
                </div>

                <div className="rounded-lg bg-navy-900/60 p-2.5 border border-navy-700/40">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-slate-500" />
                    Low / Newsletters
                  </div>
                  <div className="mt-1 text-lg font-bold text-white">{low}</div>
                  <div className="text-[11px] text-slate-400">{lowPct}% of inbox</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Emails Section */}
          <div className="rounded-xl border border-navy-700/80 bg-navy-800/80 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-navy-700/60">
              <div>
                <h3 className="text-sm font-semibold text-white">Recent Emails</h3>
                <p className="text-xs text-slate-400">Latest communications received in your inbox</p>
              </div>
              <button
                onClick={() => onNavigateToTab("inbox")}
                className="text-xs font-medium text-accent-blue hover:text-blue-400"
              >
                Go to Inbox &rarr;
              </button>
            </div>

            <div className="mt-3 divide-y divide-navy-700/40">
              {recentEmails.slice(0, 5).map((email) => (
                <div
                  key={email.id}
                  onClick={() => {
                    onSelectEmail(email.id);
                    onNavigateToTab("inbox");
                  }}
                  className="group flex cursor-pointer items-center justify-between py-3 px-2 rounded-lg hover:bg-navy-750/70 transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      {!email.is_read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
                      )}
                      <span className="text-xs font-semibold text-slate-200">
                        {email.sender_name}
                      </span>
                      <span className="text-[11px] text-slate-400">&middot;</span>
                      <span className="text-[11px] text-slate-400">
                        {formatRelativeDay(email.received_at)}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-300 font-medium">
                      {email.subject}
                    </div>
                    <div className="truncate text-[11px] text-slate-400">{email.preview}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline rounded bg-navy-900 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-navy-700/60">
                      {email.analysis.category}
                    </span>
                    <PriorityBadge priority={email.analysis.priority} size="xs" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Distribution Section */}
          <div className="rounded-xl border border-navy-700/80 bg-navy-800/80 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-navy-700/60">
              <div>
                <h3 className="text-sm font-semibold text-white">Category Distribution</h3>
                <p className="text-xs text-slate-400">Automated classification across topical sectors</p>
              </div>
              <button
                onClick={() => onNavigateToTab("categories")}
                className="text-xs font-medium text-accent-blue hover:text-blue-400"
              >
                Explore Categories &rarr;
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
              {Object.entries(categoryCounts).map(([cat, count]) => (
                <div
                  key={cat}
                  onClick={() => onNavigateToTab("categories")}
                  className="cursor-pointer rounded-lg border border-navy-700/50 bg-navy-900/60 p-3 hover:border-navy-600 hover:bg-navy-850 transition-colors"
                >
                  <div className="text-xs font-semibold text-slate-300">{cat}</div>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-base font-bold text-white">{count}</span>
                    <span className="text-[10px] text-slate-400">
                      {Math.round((count / total) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Upcoming Deadlines & Action Required */}
        <div className="space-y-6">
          {/* Upcoming Deadlines Card */}
          <div className="rounded-xl border border-navy-700/80 bg-navy-800/80 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-navy-700/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <h3 className="text-sm font-semibold text-white">Upcoming Deadlines</h3>
              </div>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                {deadlines.length} Detected
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {deadlines.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  No upcoming deadlines detected in your inbox.
                </p>
              ) : (
                deadlines.map((item) => {
                  const days = daysUntil(item.deadline);
                  const isUrgent = days <= 1;
                  return (
                    <div
                      key={item.email_id}
                      onClick={() => {
                        onSelectEmail(item.email_id);
                        onNavigateToTab("inbox");
                      }}
                      className="cursor-pointer rounded-lg border border-navy-700/60 bg-navy-900/70 p-3 hover:border-navy-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isUrgent
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDeadline(item.deadline)}
                        </span>
                      </div>
                      <div className="mt-2 text-xs font-semibold text-slate-200 line-clamp-1">
                        {item.subject}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400 line-clamp-1">
                        {item.action}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Action Required Widget */}
          <div className="rounded-xl border border-navy-700/80 bg-navy-800/80 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-navy-700/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <h3 className="text-sm font-semibold text-white">Action Required</h3>
              </div>
              <button
                onClick={() => onNavigateToTab("actions")}
                className="text-xs font-medium text-accent-blue hover:text-blue-400"
              >
                View All &rarr;
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {actionEmails.slice(0, 4).map((email) => (
                <div
                  key={email.id}
                  onClick={() => {
                    onSelectEmail(email.id);
                    onNavigateToTab("inbox");
                  }}
                  className="cursor-pointer rounded-lg border border-navy-700/50 bg-navy-900/60 p-3 hover:border-red-500/30 hover:bg-navy-850 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-semibold text-slate-200">
                      {email.sender_name}
                    </span>
                    <PriorityBadge priority={email.analysis.priority} size="xs" />
                  </div>
                  <div className="mt-1 truncate text-xs text-slate-300">
                    {email.subject}
                  </div>
                  <div className="mt-1 text-[11px] text-red-400 font-medium line-clamp-1">
                    &rarr; {email.analysis.action || "Response required"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
