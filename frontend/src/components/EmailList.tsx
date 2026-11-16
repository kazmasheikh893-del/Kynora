import type { EmailWithAnalysis } from "../types";
import EmailRow from "./EmailRow";

interface Props {
  emails: EmailWithAnalysis[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function EmailList({ emails, loading, selectedId, onSelect }: Props) {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-navy-700/50 bg-navy-800/40"
          />
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="rounded-full bg-navy-800 p-3 text-slate-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-200">No emails found</p>
        <p className="mt-1 max-w-xs text-xs text-slate-400">
          No messages match the current filter or search query. Try clearing filters or searching for something else.
        </p>
      </div>
    );
  }

  return (
    <div className="scrollbar-thin h-full overflow-y-auto divide-y divide-navy-700/40">
      {emails.map((email) => (
        <EmailRow
          key={email.id}
          email={email}
          isSelected={email.id === selectedId}
          onSelect={() => onSelect(email.id)}
        />
      ))}
    </div>
  );
}
