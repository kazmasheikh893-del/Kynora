import { useState } from "react";
import type { Category, EmailWithAnalysis } from "../types";
import EmailDetail from "./EmailDetail";
import EmailList from "./EmailList";

interface Props {
  emails: EmailWithAnalysis[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleRead: (id: string, currentRead: boolean) => void;
}

const CATEGORY_META: Record<
  Category,
  { label: string; icon: string; description: string; color: string }
> = {
  Internship: {
    label: "Internships & Careers",
    icon: "💼",
    description: "Recruitment notices, assessments, interview invitations, and status updates",
    color: "from-blue-500/20 to-indigo-500/20 border-blue-500/30",
  },
  College: {
    label: "Academics & College",
    icon: "🎓",
    description: "Coursework, examination schedules, professor announcements, and campus notices",
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
  },
  Placement: {
    label: "Campus Placements",
    icon: "🏢",
    description: "Corporate recruitment drives, aptitude tests, and pre-placement sessions",
    color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30",
  },
  Security: {
    label: "Security & Alerts",
    icon: "🔒",
    description: "Token alerts, password resets, unusual login detections, and 2FA notifications",
    color: "from-red-500/20 to-rose-500/20 border-red-500/30",
  },
  GitHub: {
    label: "GitHub & Engineering",
    icon: "🐙",
    description: "Pull requests, review requests, automated builds, and issue trackers",
    color: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
  },
  Certification: {
    label: "Certifications & Learning",
    icon: "📜",
    description: "Course completions, exam confirmations, and skill verification credentials",
    color: "from-amber-500/20 to-yellow-500/20 border-amber-500/30",
  },
  Newsletter: {
    label: "Newsletters & Digests",
    icon: "📰",
    description: "Weekly technical summaries, AI research news, and industry developments",
    color: "from-slate-500/20 to-gray-500/20 border-slate-500/30",
  },
  Promotion: {
    label: "Offers & Promotions",
    icon: "🏷️",
    description: "Subscription discounts, special seasonal sales, and commercial offers",
    color: "from-orange-500/20 to-amber-500/20 border-orange-500/30",
  },
  General: {
    label: "General Communication",
    icon: "💬",
    description: "Peer messages, informal coordination, and unclassified correspondence",
    color: "from-slate-600/20 to-navy-700/20 border-slate-600/30",
  },
};

export default function CategoriesView({
  emails,
  loading,
  selectedId,
  onSelect,
  onToggleRead,
}: Props) {
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");

  const categoryCounts: Record<string, number> = {};
  for (const e of emails) {
    categoryCounts[e.analysis.category] = (categoryCounts[e.analysis.category] || 0) + 1;
  }

  const filteredEmails =
    activeCategory === "all"
      ? emails
      : emails.filter((e) => e.analysis.category === activeCategory);

  const selectedEmail = emails.find((e) => e.id === selectedId) ?? null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Category Selection Carousel / Grid Header */}
      <div className="border-b border-navy-700/60 bg-navy-950/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Topical Clusters & Categories
          </div>
          <button
            onClick={() => setActiveCategory("all")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              activeCategory === "all"
                ? "bg-accent-blue text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Show All ({emails.length})
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {(Object.keys(CATEGORY_META) as Category[]).map((cat) => {
            const meta = CATEGORY_META[cat];
            const count = categoryCounts[cat] || 0;
            const isSelected = activeCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex flex-col text-left rounded-lg border p-2.5 transition-all ${
                  isSelected
                    ? "border-accent-blue bg-accent-blue/15 shadow-sm ring-1 ring-accent-blue/30"
                    : "border-navy-700/60 bg-navy-900/60 hover:border-navy-600 hover:bg-navy-850"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">{meta.icon}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isSelected
                        ? "bg-accent-blue text-white"
                        : "bg-navy-800 text-slate-400 border border-navy-700/60"
                    }`}
                  >
                    {count}
                  </span>
                </div>
                <div className="mt-1.5 truncate text-xs font-semibold text-slate-200">
                  {cat}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Split Pane */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[380px] shrink-0 border-r border-navy-700/60 overflow-hidden bg-navy-950/20">
          <EmailList
            emails={filteredEmails}
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
