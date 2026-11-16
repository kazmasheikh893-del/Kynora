import { useEffect, useState } from "react";
import type { DBStatusData, GmailStatusData, KynoraUser, MLStatusData } from "../types";
import {
  disconnectGmailAccount,
  fetchGoogleAuthUrl,
  predictCustomEmail,
  resetInbox,
  triggerGmailSync,
} from "../api";

interface Props {
  dbStatus: DBStatusData | null;
  gmailStatus: GmailStatusData | null;
  mlStatus: MLStatusData | null;
  onRefreshAll: () => void;
  currentUser?: KynoraUser | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export default function SettingsView({
  dbStatus,
  gmailStatus,
  mlStatus,
  onRefreshAll,
  currentUser,
  onOpenAuth,
  onLogout,
}: Props) {
  // Test ML classifier state
  const [testSubject, setTestSubject] = useState("URGENT: Submit Capstone Final Report Tomorrow");
  const [testBody, setTestBody] = useState("Please upload your final project code and documentation to the portal before 5 PM tomorrow.");
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingML, setIsTestingML] = useState(false);

  // Reset inbox state
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Gmail OAuth action states
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [oauthBanner, setOauthBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check URL query parameters on load for OAuth callback results
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const email = params.get("email");
    const error = params.get("error");
    const synced = params.get("synced");

    if (status === "connected" && email) {
      setOauthBanner({
        type: "success",
        text: `Successfully authenticated with Google! Connected account: ${email}${synced ? ` (${synced} emails imported).` : "."}`,
      });
      // Clean query params from URL without reload
      window.history.replaceState({}, document.title, window.location.pathname);
      onRefreshAll();
    } else if (error) {
      setOauthBanner({
        type: "error",
        text: `OAuth Error: ${error}`,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [onRefreshAll]);

  const handleConnectGmail = async () => {
    setIsConnecting(true);
    try {
      const data = await fetchGoogleAuthUrl();
      if (data && data.url) {
        // Redirect browser to Google OAuth consent page
        window.location.href = data.url;
      } else {
        throw new Error("No authorization URL returned by backend");
      }
    } catch (err: any) {
      setOauthBanner({
        type: "error",
        text: `Failed to initiate Google OAuth: ${err.message}`,
      });
      setIsConnecting(false);
    }
  };

  const handleSyncEmails = async () => {
    setIsSyncing(true);
    try {
      const res = await triggerGmailSync(20);
      setOauthBanner({
        type: "success",
        text: res.message || `Successfully synced ${res.synced_count} emails from Gmail!`,
      });
      onRefreshAll();
    } catch (err: any) {
      setOauthBanner({
        type: "error",
        text: `Sync failed: ${err.message}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectGmail = async () => {
    if (!window.confirm("Are you sure you want to disconnect this Gmail account and revoke access?")) {
      return;
    }
    setIsDisconnecting(true);
    try {
      await disconnectGmailAccount();
      setOauthBanner({
        type: "success",
        text: "Gmail account successfully disconnected and tokens revoked.",
      });
      onRefreshAll();
    } catch (err: any) {
      setOauthBanner({
        type: "error",
        text: `Disconnect failed: ${err.message}`,
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleTestML = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingML(true);
    try {
      const res = await predictCustomEmail({
        sender_name: "Academic Coordinator",
        sender_email: "coord@university.edu",
        subject: testSubject,
        body: testBody,
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setIsTestingML(false);
    }
  };

  const handleResetInbox = async () => {
    setIsResetting(true);
    try {
      await resetInbox();
      setResetMessage("Inbox successfully reset to original 13 sample emails.");
      onRefreshAll();
      setTimeout(() => setResetMessage(null), 3000);
    } catch {
      setResetMessage("Failed to reset inbox.");
    } finally {
      setIsResetting(false);
    }
  };

  const isConnected = gmailStatus?.status === "connected";
  const isReadyToConnect = gmailStatus?.is_configured;

  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-5xl">
      {/* OAuth Banner Notice */}
      {oauthBanner && (
        <div
          className={`flex items-start justify-between rounded-xl border p-4 text-xs ${
            oauthBanner.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold">{oauthBanner.type === "success" ? "✓" : "⚠"}</span>
            <span>{oauthBanner.text}</span>
          </div>
          <button
            onClick={() => setOauthBanner(null)}
            className="font-bold text-slate-400 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* 1. Kynora User Account Section (Phase 2 Multi-User) */}
      <section className="rounded-xl border border-navy-700/80 bg-navy-800/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-700/60 pb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Kynora User Account</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-user independent credentials with encrypted tenant isolation
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              currentUser
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
            }`}
          >
            {currentUser ? "Authenticated User" : "Demo / Guest Mode"}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-accent-blue to-cyan-400 text-lg font-bold text-white shadow-md">
              {currentUser
                ? (currentUser.full_name?.charAt(0) || currentUser.email.charAt(0)).toUpperCase()
                : "DM"}
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                {currentUser?.full_name || (currentUser ? currentUser.email.split("@")[0] : "Demo Guest User")}
              </h4>
              <p className="text-xs text-slate-300">
                {currentUser ? currentUser.email : "demo@kynora.ai (Sample mode active)"}
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="rounded bg-navy-950 px-2 py-0.5 text-[10px] font-semibold text-accent-blue border border-navy-700">
                  {currentUser ? `User ID: #${currentUser.id}` : "Unregistered Guest"}
                </span>
                <span className="rounded bg-navy-950 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-navy-700">
                  Password: PBKDF2-HMAC-SHA256
                </span>
              </div>
            </div>
          </div>

          <div>
            {currentUser ? (
              <button
                onClick={onLogout}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-all"
              >
                Sign Out of Account
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="rounded-lg border border-accent-blue/40 bg-accent-blue/20 px-4 py-2 text-xs font-semibold text-accent-blue hover:bg-accent-blue/30 hover:text-white transition-all shadow-sm"
              >
                Sign In / Create Account
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Gmail Integration & OAuth 2.0 */}
      <section className="rounded-xl border border-navy-700/80 bg-navy-800/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-700/60 pb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Gmail Integration (Google OAuth 2.0)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure read-only inbox synchronization powered by Gmail REST API
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isConnected
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : isReadyToConnect
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "bg-emerald-400" : isReadyToConnect ? "bg-blue-400" : "bg-amber-400"
                }`}
              />
              {isConnected
                ? "Gmail Connected"
                : isReadyToConnect
                ? "OAuth Credentials Loaded"
                : "Demonstration Mode"}
            </span>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {/* Permission Guarantee Box */}
          <div className="rounded-lg border border-navy-700/60 bg-navy-950/60 p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-accent-blue shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs leading-relaxed text-slate-300">
                <strong className="text-white">Strict Read-Only Permission: </strong>
                Kynora only requests the read-only scope{" "}
                <code className="rounded bg-navy-900 px-1.5 py-0.5 text-cyan-300 border border-navy-700">
                  https://www.googleapis.com/auth/gmail.readonly
                </code>
                . It will never ask for your email password or send/modify emails. Refresh tokens are AES-encrypted before storing in MySQL.
              </div>
            </div>
          </div>

          {/* Connection Status Details */}
          {isConnected ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                    Connected Account
                  </div>
                  <div className="mt-0.5 text-sm font-bold text-white">
                    {gmailStatus?.connected_email}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Project ID: {gmailStatus?.project_id || "kynora-514711"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSyncEmails}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Syncing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Sync Emails Now</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDisconnectGmail}
                    disabled={isDisconnecting}
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {isDisconnecting ? "Disconnecting..." : "Disconnect Account"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Google Client ID (Loaded from google_oauth_client.json)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={
                      gmailStatus?.client_id_prefix
                        ? `${gmailStatus.client_id_prefix}apps.googleusercontent.com`
                        : "Credentials loaded from backend/secrets/google_oauth_client.json"
                    }
                    className="w-full rounded-lg border border-navy-700 bg-navy-950 px-3 py-2 text-xs text-slate-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Authorized Redirect URI
                  </label>
                  <input
                    type="text"
                    disabled
                    value={gmailStatus?.redirect_uri || "http://localhost:8000/api/auth/google/callback"}
                    className="w-full rounded-lg border border-navy-700 bg-navy-950 px-3 py-2 text-xs text-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* Notice regarding Google Cloud Console Authorized Redirect URIs */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-amber-200">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                  <span>ℹ</span>
                  <span>Google Cloud Console Configuration Notice</span>
                </div>
                <div>
                  The downloaded OAuth client JSON contains registered JavaScript origin (<code>http://localhost:5173</code>), but has no registered redirect URIs.
                  Ensure your Google Cloud Console OAuth 2.0 Web Client has the following exact callback URL added to <strong>Authorized redirect URIs</strong>:
                  <div className="mt-1.5 font-mono text-[11px] text-white bg-navy-950 p-2 rounded border border-navy-700 select-all">
                    http://localhost:8000/api/auth/google/callback
                  </div>
                </div>
              </div>

              {/* Connect Button */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={handleConnectGmail}
                  disabled={isConnecting}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Redirecting to Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.9 5 12 5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.1L1.6 16.1C3.5 19.9 7.4 23 12 23z"
                        />
                      </svg>
                      <span>Connect Gmail Account</span>
                    </>
                  )}
                </button>
                <span className="text-[11px] text-slate-400">
                  {isReadyToConnect
                    ? "Credentials ready. Click to grant read-only consent."
                    : "Running in Demonstration Mode using curated sample inbox."}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Database Architecture & MySQL Connection */}
      <section className="rounded-xl border border-navy-700/80 bg-navy-800/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-700/60 pb-4">
          <div>
            <h3 className="text-base font-semibold text-white">MySQL Database Connectivity</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Normalized relational schema (users, gmail_accounts, emails, email_predictions, user_feedback)
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              dbStatus?.status === "connected"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-700/30 text-slate-300 border border-slate-600"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                dbStatus?.status === "connected" ? "bg-emerald-400" : "bg-slate-400"
              }`}
            />
            {dbStatus?.status === "connected" ? "MySQL Connected" : "Local In-Memory Mode"}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-navy-700/50 bg-navy-950/60 p-3">
            <div className="text-[11px] text-slate-400">Database Engine</div>
            <div className="mt-1 text-sm font-semibold text-white">MySQL 8.0+ / InnoDB</div>
          </div>
          <div className="rounded-lg border border-navy-700/50 bg-navy-950/60 p-3">
            <div className="text-[11px] text-slate-400">Target Host & Port</div>
            <div className="mt-1 text-sm font-semibold text-white">{dbStatus?.host || "localhost"}:{dbStatus?.port || "3306"}</div>
          </div>
          <div className="rounded-lg border border-navy-700/50 bg-navy-950/60 p-3">
            <div className="text-[11px] text-slate-400">Database Name</div>
            <div className="mt-1 text-sm font-semibold text-cyan-300">{dbStatus?.database || "kynora_db"}</div>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          The database schema is defined in <code className="text-slate-300">backend/app/db_models.py</code> and can be initialized in MySQL Workbench using the provided DDL script <code className="text-slate-300">backend/kynora_schema.sql</code>.
        </p>
      </section>

      {/* 4. Machine Learning Model Configuration & Live Tester */}
      <section className="rounded-xl border border-navy-700/80 bg-navy-800/80 p-6 shadow-sm">
        <div className="border-b border-navy-700/60 pb-4">
          <h3 className="text-base font-semibold text-white">Scikit-Learn ML Priority Classifier</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real Scikit-learn TF-IDF vectorization and trained classifier
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-navy-700/50 bg-navy-950/60 p-3">
              <div className="text-[11px] text-slate-400">Selected Model</div>
              <div className="mt-1 text-sm font-semibold text-accent-blue">{mlStatus?.active_model || "Logistic Regression"}</div>
            </div>
            <div className="rounded-lg border border-navy-700/50 bg-navy-950/60 p-3">
              <div className="text-[11px] text-slate-400">Vocabulary Size</div>
              <div className="mt-1 text-sm font-semibold text-white">{mlStatus?.vectorizer?.vocabulary_size || 600} TF-IDF n-grams</div>
            </div>
            <div className="rounded-lg border border-navy-700/50 bg-navy-950/60 p-3">
              <div className="text-[11px] text-slate-400">Unsupervised Clusters</div>
              <div className="mt-1 text-sm font-semibold text-white">{Object.keys(mlStatus?.clusters || {}).length || 4} K-Means Themes</div>
            </div>
          </div>

          {/* Interactive ML Test Tool */}
          <div className="rounded-xl border border-navy-700/60 bg-navy-950/60 p-5 mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live Model Inference Tester
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Input custom email text below to test real-time Scikit-learn priority classification and cluster assignment:
            </p>

            <form onSubmit={handleTestML} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Subject</label>
                <input
                  type="text"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  className="w-full rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Body</label>
                <textarea
                  rows={3}
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  className="w-full rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isTestingML}
                className="rounded-lg bg-accent-blue px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isTestingML ? "Classifying..." : "Run ML Priority Classifier"}
              </button>
            </form>

            {testResult && (
              <div className="mt-4 rounded-lg border border-navy-700 bg-navy-900 p-4 text-xs space-y-2">
                <div className="font-semibold text-slate-200">Prediction Results:</div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">Predicted Priority:</span>
                  <span className="font-bold text-white px-2 py-0.5 rounded bg-navy-800 border border-navy-700">
                    {testResult.priority}
                  </span>
                  <span className="text-slate-400">Confidence:</span>
                  <span className="text-emerald-400 font-bold">{Math.round((testResult.confidence || 0) * 100)}%</span>
                </div>
                <div className="text-slate-400">
                  Assigned Cluster Theme: <strong className="text-slate-200">{testResult.cluster_topic}</strong>
                </div>
                <div className="text-[11px] text-slate-500">
                  Classifier: {testResult.model_name}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Data Management */}
      <section className="rounded-xl border border-navy-700/80 bg-navy-800/80 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-white">Data Management</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Reset session modifications and refresh the sample dataset
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-navy-700/60 pt-5">
          <div>
            <div className="text-xs font-semibold text-slate-200">Reset Demo Inbox State</div>
            <div className="text-xs text-slate-400">
              Restores read/unread flags and analysis cache back to clean sample defaults.
            </div>
          </div>
          <button
            onClick={handleResetInbox}
            disabled={isResetting}
            className="rounded-lg border border-navy-700 bg-navy-900 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-navy-800 hover:text-white transition-colors"
          >
            {isResetting ? "Resetting..." : "Reset Inbox"}
          </button>
        </div>

        {resetMessage && (
          <div className="mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-400">
            {resetMessage}
          </div>
        )}
      </section>

      {/* 6. Privacy & Security */}
      <section className="rounded-xl border border-navy-700/80 bg-navy-800/80 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-white">Privacy & Security Guarantees</h3>
        <ul className="mt-3 space-y-2 text-xs text-slate-400 leading-relaxed list-disc list-inside">
          <li>OAuth client credentials and access tokens are never transmitted to external third parties.</li>
          <li>Inference runs locally using Scikit-Learn without cloud telemetry or data sharing.</li>
          <li>All database records, credentials, and predictions remain encrypted and isolated to your local environment.</li>
        </ul>
      </section>
    </div>
  );
}
