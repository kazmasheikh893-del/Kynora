import type { InboxStats } from "../types";

interface Props {
  stats: InboxStats | null;
  loading: boolean;
  priorityCounts?: { Urgent: number; High: number; Medium: number; Low: number };
}

export default function StatsBar({ stats, loading, priorityCounts }: Props) {
  const cards = [
    {
      label: "Total Emails",
      value: stats ? stats.total : 0,
      icon: (
        <svg className="h-5 w-5 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      borderColor: "border-navy-700/80",
      textColor: "text-white",
    },
    {
      label: "High Priority",
      value: priorityCounts ? priorityCounts.Urgent + priorityCounts.High : (stats ? stats.important : 0),
      icon: (
        <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      borderColor: "border-amber-500/20",
      textColor: "text-amber-400",
    },
    {
      label: "Medium Priority",
      value: priorityCounts ? priorityCounts.Medium : (stats ? Math.max(0, stats.total - stats.important - 3) : 0),
      icon: (
        <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      borderColor: "border-blue-500/20",
      textColor: "text-blue-400",
    },
    {
      label: "Low Priority",
      value: priorityCounts ? priorityCounts.Low : 3,
      icon: (
        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      ),
      borderColor: "border-slate-700/50",
      textColor: "text-slate-300",
    },
    {
      label: "Action Required",
      value: stats ? stats.action_required : 0,
      icon: (
        <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      borderColor: "border-red-500/20",
      textColor: "text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`rounded-xl border bg-navy-800/80 p-4 shadow-sm backdrop-blur-sm transition-all hover:bg-navy-750 ${card.borderColor}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">{card.label}</span>
            <div className="rounded-lg bg-navy-900/80 p-1.5">{card.icon}</div>
          </div>
          <div className={`mt-2 text-2xl font-bold tracking-tight ${card.textColor}`}>
            {loading || !stats ? (
              <div className="h-7 w-12 animate-pulse rounded bg-navy-700/60" />
            ) : (
              card.value
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
