import type { KynoraBrief as KynoraBriefType } from "../types";

interface Props {
  brief: KynoraBriefType | null;
  loading: boolean;
  onViewImportant: () => void;
}

export default function KynoraBrief({ brief, loading, onViewImportant }: Props) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-navy-700/80 bg-gradient-to-r from-navy-850 via-navy-800 to-navy-850 p-6 shadow-md shadow-black/20">
      <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-accent-blue via-cyan-400 to-accent-blue" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-accent-blue animate-ping" />
          <span className="text-xs font-semibold uppercase tracking-wider text-accent-blue">
            Kynora Briefing
          </span>
        </div>
        <span className="text-[11px] text-slate-400">Automated Daily Intelligence</span>
      </div>

      {loading || !brief ? (
        <div className="mt-4 space-y-3">
          <div className="h-6 w-72 animate-pulse rounded bg-navy-700/60" />
          <div className="h-4 w-full max-w-lg animate-pulse rounded bg-navy-700/40" />
          <div className="h-4 w-2/3 max-w-md animate-pulse rounded bg-navy-700/40" />
        </div>
      ) : (
        <div className="mt-3">
          <h2 className="text-xl font-bold tracking-tight text-white">{brief.greeting}</h2>
          <ul className="mt-3.5 space-y-2 text-sm text-slate-300">
            {brief.lines.map((line, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <span className="text-base">{line.slice(0, 2)}</span>
                <span>{line.slice(2)}</span>
              </li>
            ))}
          </ul>
          {(brief.urgent_count > 0 || brief.important_today_count > 0) && (
            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={onViewImportant}
                className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-xs font-semibold text-white shadow transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <span>Review High-Priority Queue</span>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
