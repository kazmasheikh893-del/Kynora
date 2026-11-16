import type { Priority } from "../types";

export const PRIORITY_STYLES: Record<
  Priority,
  { text: string; bg: string; dot: string; border: string }
> = {
  Urgent: {
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    dot: "bg-red-500",
  },
  High: {
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
  },
  Medium: {
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    dot: "bg-blue-400",
  },
  Low: {
    text: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    dot: "bg-slate-400",
  },
};

export default function PriorityBadge({
  priority,
  size = "sm",
}: {
  priority: Priority;
  size?: "xs" | "sm" | "md";
}) {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.Low;
  const sizeClasses =
    size === "xs"
      ? "text-[10px] px-2 py-0.5"
      : size === "md"
      ? "text-xs px-3 py-1 font-semibold"
      : "text-xs px-2.5 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${style.text} ${style.bg} ${style.border} ${sizeClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot} shrink-0`} />
      {priority}
    </span>
  );
}
