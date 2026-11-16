import { useState } from "react";
import type { EmailWithAnalysis } from "../types";
import EmailDetail from "./EmailDetail";
import EmailList from "./EmailList";

interface Props {
  emails: EmailWithAnalysis[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleRead: (id: string, currentRead: boolean) => void;
}

type PriorityTier = "all" | "high" | "medium" | "low";

export default function PriorityInboxView({
  emails,
  loading,
  selectedId,
  onSelect,
  onToggleRead,
}: Props) {
  const [tier, setTier] = useState<PriorityTier>("high");
  const [search, setSearch] = useState("");

  const highEmails = emails.filter(
    (e) => e.analysis.priority === "Urgent" || e.analysis.priority === "High"
  );
  const mediumEmails = emails.filter((e) => e.analysis.priority === "Medium");
  const lowEmails = emails.filter((e) => e.analysis.priority === "Low");

  let tierEmails: EmailWithAnalysis[] = [];
  if (tier === "high") tierEmails = highEmails;
  else if (tier === "medium") tierEmails = mediumEmails;
  else if (tier === "low") tierEmails = lowEmails;
  else tierEmails = emails;

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    tierEmails = tierEmails.filter(
      (e) =>
        e.subject.toLowerCase().includes(q) ||
        e.sender_name.toLowerCase().includes(q) ||
        e.preview.toLowerCase().includes(q)
    );
  }

  const selectedEmail = emails.find((e) => e.id === selectedId) ?? null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Tier Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-700/60 bg-navy-950/40 px-6 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTier("high")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              tier === "high"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>High Priority ({highEmails.length})</span>
          </button>

          <button
            onClick={() => setTier("medium")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              tier === "medium"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span>Medium Priority ({mediumEmails.length})</span>
          </button>

          <button
            onClick={() => setTier("low")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              tier === "low"
                ? "bg-slate-700/40 text-slate-200 border border-slate-600 shadow-sm"
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            <span>Low Priority ({lowEmails.length})</span>
          </button>

          <button
            onClick={() => setTier("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              tier === "all"
                ? "bg-navy-800 text-white border border-navy-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Tiers ({emails.length})
          </button>
        </div>

        {/* Tier Search */}
        <div className="relative w-52 sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search within this priority..."
            className="w-full rounded-md border border-navy-700 bg-navy-900 py-1 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-accent-blue focus:outline-none"
          />
          <svg
            className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Split Pane: List & Detail */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[380px] shrink-0 border-r border-navy-700/60 overflow-hidden bg-navy-950/20">
          <EmailList
            emails={tierEmails}
            loading={loading}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <EmailDetail email={selectedEmail} onToggleRead={onToggleRead} />
        </div>
      </div>
    </div>
  );
}
