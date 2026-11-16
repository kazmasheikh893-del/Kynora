import type {
  AnalyticsData,
  AuthResponse,
  DBStatusData,
  DeadlineItem,
  EmailWithAnalysis,
  GenerateReplyResponse,
  GmailStatusData,
  InboxStats,
  KynoraBrief,
  KynoraUser,
  MLStatusData,
  ReplyTone,
} from "./types";

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";

// -- Auth Token Management --------------------------------------------

export function getAuthToken(): string | null {
  return localStorage.getItem("kynora_auth_token");
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem("kynora_auth_token", token);
  } else {
    localStorage.removeItem("kynora_auth_token");
  }
}

// -- HTTP Request Helper ----------------------------------------------

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  const token = getAuthToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMsg = `Kynora API error ${res.status} on ${path}`;
    try {
      const errJson = await res.json();
      errMsg = errJson.detail || errJson.message || errMsg;
    } catch {
      // Use fallback
    }
    throw new Error(errMsg);
  }
  return res.json() as Promise<T>;
}

// -- Kynora User Authentication ---------------------------------------

export async function registerUser(email: string, password: string, fullName?: string): Promise<AuthResponse> {
  const res = await request<AuthResponse>("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  if (res.token) {
    setAuthToken(res.token);
  }
  return res;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await request<AuthResponse>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (res.token) {
    setAuthToken(res.token);
  }
  return res;
}

export function fetchMe(): Promise<{ success: boolean; user: KynoraUser }> {
  return request<{ success: boolean; user: KynoraUser }>("/api/auth/me");
}

export async function logoutUser(): Promise<{ success: boolean; message: string }> {
  setAuthToken(null);
  try {
    return await request<{ success: boolean; message: string }>("/api/auth/logout", { method: "POST" });
  } catch {
    return { success: true, message: "Logged out locally" };
  }
}

// -- Emails API -------------------------------------------------------

export interface ListEmailsParams {
  category?: string;
  priority?: string;
  importantOnly?: boolean;
  unreadOnly?: boolean;
  actionRequiredOnly?: boolean;
  search?: string;
  sortBy?: "priority" | "newest" | "oldest";
}

export function fetchEmails(params: ListEmailsParams = {}): Promise<EmailWithAnalysis[]> {
  const qs = new URLSearchParams();
  if (params.category) qs.set("category", params.category);
  if (params.priority) qs.set("priority", params.priority);
  if (params.importantOnly) qs.set("important_only", "true");
  if (params.unreadOnly) qs.set("unread_only", "true");
  if (params.actionRequiredOnly) qs.set("action_required_only", "true");
  if (params.search) qs.set("search", params.search);
  if (params.sortBy) qs.set("sort_by", params.sortBy);
  const query = qs.toString();
  return request<EmailWithAnalysis[]>(`/api/emails${query ? `?${query}` : ""}`);
}

export function fetchEmail(id: string): Promise<EmailWithAnalysis> {
  return request<EmailWithAnalysis>(`/api/emails/${id}`);
}

export function markEmailRead(id: string): Promise<EmailWithAnalysis> {
  return request<EmailWithAnalysis>(`/api/emails/${id}/read`, { method: "PATCH" });
}

export function markEmailUnread(id: string): Promise<EmailWithAnalysis> {
  return request<EmailWithAnalysis>(`/api/emails/${id}/unread`, { method: "PATCH" });
}

export function resetInbox(): Promise<{ status: string; message: string }> {
  return request<{ status: string; message: string }>("/api/emails/reset", { method: "POST" });
}

// -- AI Reply Generator (Phase 7) -------------------------------------

export function generateEmailReply(
  emailId: string,
  tone: ReplyTone = "professional",
  instruction?: string
): Promise<GenerateReplyResponse> {
  return request<GenerateReplyResponse>(`/api/emails/${emailId}/generate-reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tone, instruction }),
  });
}

// -- Aggregates & Intelligence ----------------------------------------

export function fetchStats(): Promise<InboxStats> {
  return request<InboxStats>("/api/stats");
}

export function fetchBrief(): Promise<KynoraBrief> {
  return request<KynoraBrief>("/api/brief");
}

export function fetchDeadlines(): Promise<DeadlineItem[]> {
  return request<DeadlineItem[]>("/api/deadlines");
}

export function fetchActions(): Promise<EmailWithAnalysis[]> {
  return request<EmailWithAnalysis[]>("/api/actions");
}

export function fetchAnalytics(): Promise<AnalyticsData> {
  return request<AnalyticsData>("/api/analytics");
}

export function fetchMLStatus(): Promise<MLStatusData> {
  return request<MLStatusData>("/api/ml/status");
}

export function predictCustomEmail(data: {
  sender_name: string;
  sender_email: string;
  subject: string;
  body: string;
}): Promise<any> {
  return request<any>("/api/ml/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function fetchDBStatus(): Promise<DBStatusData> {
  return request<DBStatusData>("/api/db/status");
}

export function fetchGmailStatus(): Promise<GmailStatusData> {
  return request<GmailStatusData>("/api/gmail/status");
}

export function fetchGoogleAuthUrl(): Promise<{ url: string; state: string; redirect_uri: string }> {
  return request<{ url: string; state: string; redirect_uri: string }>("/api/auth/google/url");
}

export function triggerGmailSync(maxResults: number = 20): Promise<{ status: string; synced_count: number; message: string }> {
  return request<{ status: string; synced_count: number; message: string }>(
    `/api/auth/google/sync?max_results=${maxResults}`,
    { method: "POST" }
  );
}

export function disconnectGmailAccount(): Promise<{ status: string; message: string }> {
  return request<{ status: string; message: string }>("/api/auth/google/disconnect", {
    method: "POST",
  });
}
