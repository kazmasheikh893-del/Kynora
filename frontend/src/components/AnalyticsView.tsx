import type { AnalyticsData, MLStatusData } from "../types";

interface Props {
  analytics: AnalyticsData | null;
  mlStatus: MLStatusData | null;
  loading: boolean;
}

export default function AnalyticsView({ analytics, mlStatus, loading }: Props) {
  if (loading || !analytics) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
          <span className="text-sm">Computing inbox analytics & ML metrics...</span>
        </div>
      </div>
    );
  }

  const {
    total_emails,
    read_count,
    unread_count,
    read_rate,
    priority_distribution,
    category_distribution,
    action_required_count,
    deadline_count,
    urgent_or_high_count,
  } = analytics;

  const urgentCount = priority_distribution["Urgent"] || 0;
  const highCount = priority_distribution["High"] || 0;
  const mediumCount = priority_distribution["Medium"] || 0;
  const lowCount = priority_distribution["Low"] || 0;

  const urgentPct = total_emails > 0 ? Math.round((urgentCount / total_emails) * 100) : 0;
  const highPct = total_emails > 0 ? Math.round((highCount / total_emails) * 100) : 0;
  const mediumPct = total_emails > 0 ? Math.round((mediumCount / total_emails) * 100) : 0;
  const lowPct = total_emails > 0 ? Math.round((lowCount / total_emails) * 100) : 0;

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
      {/* 4 High-level KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-navy-700/80 bg-navy-800/80 p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-400">Total Inbox Volume</div>
          <div className="mt-2 text-2xl font-bold text-white">{total_emails}</div>
          <div className="mt-1 text-xs text-slate-400">Processed by Kynora</div>
        </div>

        <div className="rounded-xl border border-navy-700/80 bg-navy-800/80 p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-400">Inbox Read Rate</div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{read_rate}%</div>
          <div className="mt-1 text-xs text-slate-400">
            {read_count} read &middot; {unread_count} unread
          </div>
        </div>

        <div className="rounded-xl border border-navy-700/80 bg-navy-800/80 p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-400">Urgent & High Load</div>
          <div className="mt-2 text-2xl font-bold text-amber-400">{urgent_or_high_count}</div>
          <div className="mt-1 text-xs text-slate-400">
            {Math.round((urgent_or_high_count / total_emails) * 100)}% critical density
          </div>
        </div>

        <div className="rounded-xl border border-navy-700/80 bg-navy-800/80 p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-400">Action & Deadlines</div>
          <div className="mt-2 text-2xl font-bold text-red-400">{action_required_count}</div>
          <div className="mt-1 text-xs text-slate-400">{deadline_count} detected deadlines</div>
        </div>
      </div>

      {/* Main Charts & Breakdowns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Priority Breakdown Card */}
        <div className="rounded-xl border border-navy-700/80 bg-navy-800/80 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-white">Priority Tiers Distribution</h3>
          <p className="text-xs text-slate-400">
            Automated prioritization distribution across total inbox messages
          </p>

          <div className="mt-6 space-y-4">
            {/* Urgent */}
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-red-400">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  Urgent Priority
                </span>
                <span className="font-semibold text-slate-200">
                  {urgentCount} ({urgentPct}%)
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-navy-950">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${urgentPct}%` }} />
              </div>
            </div>

            {/* High */}
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  High Priority
                </span>
                <span className="font-semibold text-slate-200">
                  {highCount} ({highPct}%)
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-navy-950">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${highPct}%` }} />
              </div>
            </div>

            {/* Medium */}
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-blue-400">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  Medium Priority
                </span>
                <span className="font-semibold text-slate-200">
                  {mediumCount} ({mediumPct}%)
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-navy-950">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${mediumPct}%` }} />
              </div>
            </div>

            {/* Low */}
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-slate-500" />
                  Low Priority (Newsletters)
                </span>
                <span className="font-semibold text-slate-200">
                  {lowCount} ({lowPct}%)
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-navy-950">
                <div className="h-full bg-slate-500 rounded-full" style={{ width: `${lowPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Read vs Unread & Category Proportions */}
        <div className="rounded-xl border border-navy-700/80 bg-navy-800/80 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-white">Category Breakdown</h3>
          <p className="text-xs text-slate-400">Volume distribution by topical classification</p>

          <div className="mt-5 space-y-3">
            {Object.entries(category_distribution).map(([cat, count]) => {
              const pct = Math.round((count / total_emails) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{cat}</span>
                    <span className="text-slate-400">
                      {count} emails ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-950">
                    <div
                      className="h-full bg-gradient-to-r from-accent-blue to-cyan-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Machine Learning Model Performance Section */}
      <div className="rounded-xl border border-navy-700/80 bg-navy-800/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-700/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-accent-blue" />
              <h3 className="text-sm font-semibold text-white">
                Machine Learning Evaluation & Model Benchmark
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparative benchmark of Scikit-learn supervised classifiers trained on TF-IDF features
            </p>
          </div>
          {mlStatus?.active_model && (
            <div className="flex items-center gap-2 rounded-lg bg-navy-950 px-3 py-1.5 border border-navy-700">
              <span className="text-xs text-slate-400">Active Model:</span>
              <span className="text-xs font-bold text-accent-blue">{mlStatus.active_model}</span>
            </div>
          )}
        </div>

        {/* Algorithm Comparison Table */}
        {mlStatus?.metrics ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-navy-700/70 text-slate-400">
                  <th className="pb-3 font-semibold">Algorithm</th>
                  <th className="pb-3 font-semibold">Test Accuracy</th>
                  <th className="pb-3 font-semibold">Precision</th>
                  <th className="pb-3 font-semibold">High-Priority Recall</th>
                  <th className="pb-3 font-semibold">Macro F1-Score</th>
                  <th className="pb-3 font-semibold">CV Mean Accuracy</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/40 text-slate-200">
                {Object.entries(mlStatus.metrics).map(([modelName, metric]) => {
                  const isBest = modelName === mlStatus.active_model;
                  return (
                    <tr
                      key={modelName}
                      className={isBest ? "bg-accent-blue/10 font-semibold" : "hover:bg-navy-750/50"}
                    >
                      <td className="py-3 pr-4 flex items-center gap-2">
                        {isBest && <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" />}
                        {modelName}
                      </td>
                      <td className="py-3 pr-4">{Math.round(metric.test_accuracy * 100)}%</td>
                      <td className="py-3 pr-4">{Math.round(metric.test_precision * 100)}%</td>
                      <td className="py-3 pr-4">
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-300 border border-amber-500/30">
                          {Math.round(metric.high_priority_recall * 100)}%
                        </span>
                      </td>
                      <td className="py-3 pr-4">{Math.round(metric.test_f1 * 100)}%</td>
                      <td className="py-3 pr-4">{Math.round(metric.cv_accuracy_mean * 100)}%</td>
                      <td className="py-3">
                        {isBest ? (
                          <span className="rounded-full bg-accent-blue/20 px-2 py-0.5 text-[10px] text-accent-blue border border-accent-blue/40">
                            Selected Best
                          </span>
                        ) : (
                          <span className="text-slate-500">Evaluated</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-4 text-xs text-slate-400">No ML benchmark metrics available.</p>
        )}

        {/* K-Means Clusters Section */}
        {mlStatus?.clusters && (
          <div className="mt-6 border-t border-navy-700/60 pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Unsupervised K-Means Clusters & Extracted Topic Keywords
            </h4>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(mlStatus.clusters).map(([cid, cluster]) => (
                <div key={cid} className="rounded-lg border border-navy-700/50 bg-navy-950/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-accent-blue">CLUSTER {cid}</span>
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-200">
                    {cluster.interpretation}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {cluster.top_keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="rounded bg-navy-800 px-1.5 py-0.5 text-[10px] text-slate-400 border border-navy-700/60"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
