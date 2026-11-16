// Data types for Kynora frontend, mirroring backend/app/models.py

export type Priority = "Urgent" | "High" | "Medium" | "Low";

export type Category =
  | "College"
  | "Internship"
  | "Placement"
  | "Security"
  | "GitHub"
  | "Certification"
  | "Newsletter"
  | "Promotion"
  | "General";

export type SenderImportance =
  | "Institutional"
  | "Recruiter/Company"
  | "Automated System"
  | "Peer"
  | "Marketing";

export interface EmailAnalysis {
  email_id: string;
  category: Category;
  priority: Priority;
  summary: string;
  action_required: boolean;
  action: string | null;
  deadline: string | null; // ISO date (YYYY-MM-DD) or null
  sender_importance: SenderImportance;
  confidence: number;
  model_version?: string;
  cluster_id?: number | null;
  cluster_topic?: string | null;
}

export interface Email {
  id: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  preview: string;
  body: string;
  received_at: string; // ISO datetime
  is_read: boolean;
}

export interface EmailWithAnalysis extends Email {
  analysis: EmailAnalysis;
}

export interface InboxStats {
  total: number;
  important: number;
  action_required: number;
  deadlines: number;
}

export interface KynoraBrief {
  greeting: string;
  urgent_count: number;
  important_today_count: number;
  deadline_count: number;
  low_value_count: number;
  lines: string[];
}

export interface DeadlineItem {
  email_id: string;
  subject: string;
  sender_name: string;
  priority: Priority;
  deadline: string;
  action: string;
}

export interface AnalyticsData {
  total_emails: number;
  read_count: number;
  unread_count: number;
  read_rate: number;
  priority_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
  action_required_count: number;
  deadline_count: number;
  urgent_or_high_count: number;
}

export interface MLStatusData {
  is_loaded: boolean;
  active_model: string;
  dataset_size: number;
  models_evaluated: string[];
  metrics: Record<
    string,
    {
      test_accuracy: number;
      test_precision: number;
      test_recall: number;
      test_f1: number;
      high_priority_recall: number;
      cv_accuracy_mean: number;
      cv_accuracy_std: number;
      cv_f1_mean: number;
      confusion_matrix: number[][];
      classes: string[];
    }
  >;
  clusters: Record<
    string,
    {
      interpretation: string;
      top_keywords: string[];
    }
  >;
  vectorizer: {
    max_features: number;
    ngram_range: number[];
    vocabulary_size: number;
  };
}

export interface DBStatusData {
  status: "connected" | "disconnected";
  host: string;
  port: string;
  database: string;
  dialect: string;
  driver?: string;
  error?: string | null;
}

export interface GmailStatusData {
  is_configured: boolean;
  status: "connected" | "ready_to_connect" | "demonstration";
  connected_email?: string | null;
  client_id_prefix?: string | null;
  redirect_uri: string;
  registered_redirect_uris: string[];
  redirect_uri_matches: boolean;
  scope: string;
  error?: string | null;
  project_id?: string;
}

export type FilterKey =
  | "all"
  | "Urgent"
  | "High"
  | "Medium"
  | "Low"
  | "College"
  | "Internship"
  | "Placement"
  | "Security"
  | "GitHub"
  | "Certification"
  | "Newsletter"
  | "Promotion";

export const CATEGORY_LIST: Category[] = [
  "College",
  "Internship",
  "Placement",
  "Security",
  "GitHub",
  "Certification",
  "Newsletter",
  "Promotion",
  "General",
];

export type NavKey =
  | "dashboard"
  | "inbox"
  | "priority"
  | "categories"
  | "actions"
  | "analytics"
  | "settings";

export interface KynoraUser {
  id: number;
  email: string;
  full_name?: string | null;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: KynoraUser;
}

export type ReplyTone = "professional" | "friendly" | "formal" | "concise";

export interface GenerateReplyResponse {
  success: boolean;
  reply: string;
  tone: ReplyTone;
  engine?: string;
}
