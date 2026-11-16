import { useState } from "react";
import type { EmailWithAnalysis } from "../types";
import { daysUntil, formatDeadline } from "../utils";
import PriorityBadge from "./PriorityBadge";

interface Props {
  actionEmails: EmailWithAnalysis[];
  loading?: boolean;
  onSelectEmail: (id: string) => void;
  onNavigateToInbox: () => void;
}

export default function ActionRequiredView({
  actionEmails,
  onSelectEmail,
  onNavigateToInbox,
}: Props) {
  // Local state for tracking marked resolved action items in session
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const toggleResolved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setResolvedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pendingCount = actionEmails.length - resolvedIds.size;

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
      {/* Header Metric Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-gradient-to-r from-red-950/20 via-navy-900 to-navy-850 p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-400 animate-pulse" />
            <h2 className="text-lg font-bold text-white">Action Required Queue</h2>
          </div>
          <p className="mt-1 text-xs text-slate-300">
            Messages containing project submissions, recruiter assessments, schedule clash verifications, and urgent replies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-navy-950/70 border border-navy-700/60 px-4 py-2 text-center">
            <div className="text-xs text-slate-400">Pending Actions</div>
            <div className="text-xl font-bold text-red-400">{pendingCount}</div>
          </div>
          <div className="rounded-lg bg-navy-950/70 border border-navy-700/60 px-4 py-2 text-center">
            <div className="text-xs text-slate-400">Resolved Today</div>
            <div className="text-xl font-bold text-emerald-400">{resolvedIds.size}</div>
          </div>
        </div>
      </div>

      {/* Action Cards List */}
      <div className="space-y-4">
        {actionEmails.length === 0 ? (
          <div className="rounded-xl border border-navy-700/60 bg-navy-850/60 p-12 text-center">
            <p className="text-sm font-semibold text-slate-300">Zero Pending Action Items</p>
            <p className="mt-1 text-xs text-slate-400">
              Kynora has not identified any pending requests, deadlines, or submissions requiring your attention.
            </p>
          </div>
        ) : (
          actionEmails.map((email) => {
            const isResolved = resolvedIds.has(email.id);
            const { analysis } = email;
            const deadlineDays = analysis.deadline ? daysUntil(analysis.deadline) : null;

            return (
              <div
                key={email.id}
                onClick={() => {
                  onSelectEmail(email.id);
                  onNavigateToInbox();
                }}
                className={`group cursor-pointer rounded-xl border p-5 transition-all shadow-sm ${
                  isResolved
                    ? "border-navy-700/40 bg-navy-900/40 opacity-70"
                    : "border-navy-700/80 bg-navy-800/90 hover:border-navy-600 hover:bg-navy-750"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <PriorityBadge priority={analysis.priority} size="xs" />
                      <span className="rounded bg-navy-900 px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-navy-700/60">
                        {analysis.category}
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {email.sender_name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        &lt;{email.sender_email}&gt;
                      </span>
                    </div>

                    <h3
                      className={`mt-2 text-sm font-semibold text-slate-100 ${
                        isResolved ? "line-through text-slate-500" : ""
                      }`}
                    >
                      {email.subject}
                    </h3>

                    {/* Detected Action Highlight */}
                    <div className="mt-3 rounded-lg border border-navy-700/60 bg-navy-950/60 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-400">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Required Action
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-200">
                        {analysis.action || "Please review message for response instructions."}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Deadline indicator & Resolve Button */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    {analysis.deadline && (
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400">
                          Due Date
                        </div>
                        <div className="text-xs font-bold text-amber-400">
                          {formatDeadline(analysis.deadline)}
                        </div>
                        {deadlineDays !== null && (
                          <div className="text-[10px] text-slate-400">
                            {deadlineDays <= 0 ? "Due Today" : deadlineDays === 1 ? "Tomorrow" : `In ${deadlineDays} days`}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => toggleResolved(email.id, e)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                          isResolved
                            ? "border border-navy-700 bg-navy-900 text-slate-400 hover:text-white"
                            : "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        }`}
                      >
                        {isResolved ? "Mark Incomplete" : "Mark Resolved"}
                      </button>

                      <button
                        onClick={() => {
                          onSelectEmail(email.id);
                          onNavigateToInbox();
                        }}
                        className="rounded-lg border border-navy-700 bg-navy-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-navy-800 hover:text-white transition-colors"
                      >
                        Read Email &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
