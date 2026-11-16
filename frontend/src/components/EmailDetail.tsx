import { useState } from "react";
import type { EmailWithAnalysis, ReplyTone } from "../types";
import { daysUntil, formatDeadline, formatFullDate } from "../utils";
import PriorityBadge from "./PriorityBadge";
import { generateEmailReply } from "../api";

interface Props {
  email: EmailWithAnalysis | null;
  onToggleRead: (id: string, currentRead: boolean) => void;
}

export default function EmailDetail({ email, onToggleRead }: Props) {
  const [copiedEmail, setCopiedEmail] = useState(false);

  // AI Reply Assistant states
  const [showReplyPane, setShowReplyPane] = useState(false);
  const [replyTone, setReplyTone] = useState<ReplyTone>("professional");
  const [customInstruction, setCustomInstruction] = useState("");
  const [generatedReply, setGeneratedReply] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [copiedReply, setCopiedReply] = useState(false);

  if (!email) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-navy-900/40">
        <div className="rounded-full bg-navy-800 p-4 text-slate-400">
          <svg className="h-8 w-8 text-accent-blue/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="mt-3 text-base font-semibold text-slate-200">Select an email to inspect</p>
        <p className="mt-1 max-w-sm text-xs text-slate-400">
          Select any conversation from the list to view its complete headers, message contents, and Kynora's intelligent analysis.
        </p>
      </div>
    );
  }

  const { analysis } = email;
  const deadlineDays = analysis.deadline ? daysUntil(analysis.deadline) : null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(`From: ${email.sender_name} <${email.sender_email}>\nSubject: ${email.subject}\n\n${email.body}`);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleGenerateReply = async (toneToUse?: ReplyTone) => {
    const tone = toneToUse || replyTone;
    setIsGenerating(true);
    setReplyError(null);
    setShowReplyPane(true);

    try {
      const res = await generateEmailReply(email.id, tone, customInstruction);
      if (res.success && res.reply) {
        setGeneratedReply(res.reply);
      } else {
        setReplyError("Could not generate reply. Please try again.");
      }
    } catch (err: any) {
      setReplyError(err.message || "Failed to generate reply");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyReply = () => {
    if (!generatedReply) return;
    navigator.clipboard.writeText(generatedReply);
    setCopiedReply(true);
    setTimeout(() => setCopiedReply(false), 2000);
  };

  return (
    <div className="scrollbar-thin flex h-full flex-col overflow-y-auto bg-navy-900/60 divide-y divide-navy-700/60">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between px-8 py-3.5 bg-navy-950/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={analysis.priority} />
          <span className="rounded-md border border-navy-700 bg-navy-800 px-2.5 py-0.5 text-xs font-medium text-slate-300">
            {analysis.category}
          </span>
          <span className="hidden text-xs text-slate-400 sm:inline">
            Importance: {analysis.sender_importance}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Generate Reply Button */}
          <button
            onClick={() => {
              setShowReplyPane(true);
              if (!generatedReply) handleGenerateReply(replyTone);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-accent-blue/40 bg-accent-blue/15 px-3 py-1.5 text-xs font-semibold text-accent-blue hover:bg-accent-blue/25 hover:text-white transition-all shadow-sm"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate Reply
          </button>

          {/* Read / Unread toggle */}
          <button
            onClick={() => onToggleRead(email.id, email.is_read)}
            className="flex items-center gap-1.5 rounded-lg border border-navy-700 bg-navy-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-navy-750 hover:text-white transition-colors"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                email.is_read ? "bg-slate-500" : "bg-accent-blue"
              }`}
            />
            {email.is_read ? "Mark as Unread" : "Mark as Read"}
          </button>

          {/* Copy email contents */}
          <button
            onClick={handleCopyEmail}
            className="flex items-center gap-1.5 rounded-lg border border-navy-700 bg-navy-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-navy-750 hover:text-white transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copiedEmail ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Main Email Reading Pane */}
      <div className="px-8 py-6">
        <h2 className="text-xl font-bold tracking-tight text-white leading-snug">
          {email.subject}
        </h2>

        {/* Sender details and timestamp */}
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-y-2 border-b border-navy-700/60 pb-4">
          <div className="flex items-center gap-2 text-xs">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-800 border border-navy-700 font-semibold text-accent-blue">
              {email.sender_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="font-semibold text-slate-200">{email.sender_name}</span>
              <span className="ml-1 text-slate-400">&lt;{email.sender_email}&gt;</span>
            </div>
          </div>
          <span className="text-xs text-slate-400">{formatFullDate(email.received_at)}</span>
        </div>

        {/* Full Message Body */}
        <div className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-slate-300 font-normal">
          {email.body}
        </div>
      </div>

      {/* AI Reply Assistant Card (Phase 7) */}
      <div className="bg-navy-950/90 p-8 border-t border-navy-700/60">
        <div className="flex items-center justify-between border-b border-navy-700/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-blue/20 text-accent-blue">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              AI Reply Assistant
            </h3>
          </div>
          <span className="rounded-full bg-navy-800 border border-navy-700 px-2 py-0.5 text-[10px] text-accent-blue font-medium">
            Internal Assistant
          </span>
        </div>

        {/* Tone Selection Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 mr-1">Tone:</span>
          {(["professional", "friendly", "formal", "concise"] as ReplyTone[]).map((tone) => (
            <button
              key={tone}
              onClick={() => {
                setReplyTone(tone);
                if (generatedReply || showReplyPane) handleGenerateReply(tone);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition-all ${
                replyTone === tone
                  ? "bg-accent-blue text-white shadow-sm font-semibold"
                  : "bg-navy-800 border border-navy-700 text-slate-300 hover:bg-navy-750"
              }`}
            >
              {tone}
            </button>
          ))}
        </div>

        {/* Optional Custom Instructions Input */}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            placeholder="Optional instruction (e.g. 'Ask for an extension until Friday')"
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            className="flex-1 rounded-lg border border-navy-700 bg-navy-900/80 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-accent-blue focus:outline-none"
          />
          <button
            onClick={() => handleGenerateReply(replyTone)}
            disabled={isGenerating}
            className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-accent-blue/80 disabled:opacity-50 transition-all shrink-0"
          >
            {isGenerating ? (
              <>
                <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating...
              </>
            ) : generatedReply ? (
              "Regenerate"
            ) : (
              "Draft Reply"
            )}
          </button>
        </div>

        {replyError && (
          <p className="mt-2 text-xs text-red-400">{replyError}</p>
        )}

        {/* Generated Reply Textarea */}
        {generatedReply && (
          <div className="mt-4 rounded-xl border border-navy-700/80 bg-navy-900/90 p-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-navy-800">
              <span className="text-[11px] font-semibold text-slate-400">
                Generated {replyTone} reply (editable):
              </span>
              <button
                onClick={handleCopyReply}
                className="flex items-center gap-1 rounded-md bg-navy-800 hover:bg-navy-750 border border-navy-700 px-2.5 py-1 text-xs font-medium text-accent-blue transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copiedReply ? "Copied to Clipboard!" : "Copy Reply"}
              </button>
            </div>
            <textarea
              rows={6}
              value={generatedReply}
              onChange={(e) => setGeneratedReply(e.target.value)}
              className="mt-3 w-full rounded-lg border border-navy-750 bg-navy-950 p-3 text-xs leading-relaxed text-slate-200 focus:border-accent-blue focus:outline-none"
            />
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>🔒 Internal security: Kynora never drafts or sends emails to Gmail automatically.</span>
              <span>{generatedReply.length} chars</span>
            </div>
          </div>
        )}
      </div>

      {/* Intelligent Email Analysis Panel (Clearly visually separated) */}
      <div className="bg-navy-950/70 p-8">
        <div className="flex items-center justify-between border-b border-navy-700/60 pb-3">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-xs font-bold uppercase tracking-wider text-accent-blue">
              Intelligent Email Analysis
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Model: {analysis.model_version || "Scikit-Learn Classifier"}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Executive Summary */}
          <div className="rounded-xl border border-navy-700/60 bg-navy-850/80 p-4 shadow-sm md:col-span-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Content Summary
            </div>
            <p className="mt-1.5 text-sm font-medium text-slate-200 leading-relaxed">
              {analysis.summary}
            </p>
          </div>

          {/* Action Required Card */}
          <div
            className={`rounded-xl border p-4 shadow-sm ${
              analysis.action_required
                ? "border-red-500/30 bg-red-500/5"
                : "border-navy-700/60 bg-navy-850/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Action Required
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  analysis.action_required
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                {analysis.action_required ? "YES - PENDING" : "NONE"}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-300">
              {analysis.action || "No immediate action required for this message."}
            </p>
          </div>

          {/* Detected Deadline Card */}
          <div
            className={`rounded-xl border p-4 shadow-sm ${
              analysis.deadline
                ? "border-amber-500/30 bg-amber-500/5"
                : "border-navy-700/60 bg-navy-850/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Detected Deadline
              </span>
              {deadlineDays !== null && (
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                  {deadlineDays <= 0
                    ? "DUE TODAY"
                    : deadlineDays === 1
                    ? "DUE TOMORROW"
                    : `IN ${deadlineDays} DAYS`}
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-300">
              {analysis.deadline ? (
                <span>
                  <strong className="text-white">{formatDeadline(analysis.deadline)}</strong>
                </span>
              ) : (
                "No explicit deadline extracted from message text."
              )}
            </p>
          </div>

          {/* Classification & Confidence */}
          <div className="rounded-xl border border-navy-700/60 bg-navy-850/80 p-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              ML Priority Confidence
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">
                {Math.round(analysis.confidence * 100)}% Confidence
              </span>
              <PriorityBadge priority={analysis.priority} size="xs" />
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-navy-950">
              <div
                className="h-full bg-gradient-to-r from-accent-blue to-cyan-400"
                style={{ width: `${Math.round(analysis.confidence * 100)}%` }}
              />
            </div>
          </div>

          {/* Semantic Cluster Theme */}
          <div className="rounded-xl border border-navy-700/60 bg-navy-850/80 p-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Unsupervised Topic Cluster
            </div>
            <p className="mt-2 text-xs font-medium text-slate-200">
              {analysis.cluster_topic || "General Communication Cluster"}
            </p>
            <span className="mt-1 inline-block text-[11px] text-slate-400">
              Sender Type: {analysis.sender_importance}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
