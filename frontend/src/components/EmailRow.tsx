import type { EmailWithAnalysis } from "../types";
import { formatRelativeDay } from "../utils";
import PriorityBadge from "./PriorityBadge";

interface Props {
  email: EmailWithAnalysis;
  isSelected: boolean;
  onSelect: () => void;
}

export default function EmailRow({ email, isSelected, onSelect }: Props) {
  const unread = !email.is_read;

  return (
    <button
      onClick={onSelect}
      className={`group relative flex w-full flex-col border-b border-navy-700/60 p-4 text-left transition-all ${
        isSelected
          ? "bg-navy-800/95 border-l-4 border-l-accent-blue"
          : "hover:bg-navy-850/80 bg-transparent"
      }`}
    >
      {/* Header: Sender & Priority Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {unread && (
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-accent-blue shadow-sm shadow-accent-blue"
              title="Unread"
            />
          )}
          <span
            className={`truncate text-xs ${
              unread ? "font-bold text-white" : "font-medium text-slate-300"
            }`}
          >
            {email.sender_name}
          </span>
          <span className="hidden truncate text-[11px] text-slate-400 sm:inline">
            &lt;{email.sender_email}&gt;
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PriorityBadge priority={email.analysis.priority} size="xs" />
          <span className="text-[11px] text-slate-400">
            {formatRelativeDay(email.received_at)}
          </span>
        </div>
      </div>

      {/* Subject line */}
      <div
        className={`mt-1.5 truncate text-xs ${
          unread ? "font-semibold text-slate-100" : "font-normal text-slate-300"
        }`}
      >
        {email.subject}
      </div>

      {/* Preview text */}
      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">
        {email.preview}
      </p>

      {/* Footer: Category label & Action Required Badge */}
      <div className="mt-2.5 flex items-center justify-between text-[11px]">
        <span className="rounded bg-navy-900 px-2 py-0.5 font-medium text-slate-400 border border-navy-700/60">
          {email.analysis.category}
        </span>

        {email.analysis.action_required && (
          <span className="flex items-center gap-1 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-400 border border-red-500/20">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Action Req.
          </span>
        )}
      </div>
    </button>
  );
}
