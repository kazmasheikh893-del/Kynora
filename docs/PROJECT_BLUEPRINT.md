# Kynora – Product Blueprint & System Specification

> **AI Email Analyser & Productivity Platform**

---

## 1. Product Vision

**Kynora** is an AI-powered email management and productivity platform designed to help users conquer overloaded inboxes. Rather than replacing existing email clients, Kynora acts as an intelligent productivity layer that integrates directly with existing email services (starting with Gmail).

Kynora combines **Machine Learning (Scikit-Learn)**, **FastAPI**, **React**, and **MySQL** into a unified workspace where email is triaged by cognitive importance rather than mere chronological arrival time. Users can:
- Instantly identify critical communication through automated priority scoring.
- Never miss deadlines or action items extracted from lengthy email text.
- Save time drafting context-aware responses with an internal multi-tone AI Reply Assistant.
- Gain empirical visibility into their inbox activity through interactive analytics.

---

## 2. Problem Statement

Email remains the standard communication protocol for academic institutions, enterprises, and independent professionals. However, several inherent design flaws of traditional email clients create severe productivity bottlenecks:

1. **Chronological Inundation:** Messages arrive in chronological order without regard to urgency. A high-priority interview invitation or exam schedule update is easily buried beneath marketing newsletters and automated system notifications.
2. **Hidden Deadlines & Action Items:** Crucial deadlines and follow-up requirements are typically embedded inside long paragraphs of body text, forcing users to manually read and parse every message.
3. **Repetitive Response Burden:** Users spend substantial hours each day drafting repetitive, standard email replies.
4. **Cognitive Fatigue & Inbox Anxiety:** A crowded inbox with hundreds of unread messages creates anxiety and leads to missed deadlines and delayed replies.
5. **Lack of Productivity Metrics:** Traditional email clients offer no empirical analytics regarding communication volume, response patterns, or category breakdowns.

Kynora solves these challenges by applying intelligent triage, feature extraction, and automated drafting directly to incoming email streams.

---

## 3. Product Objectives

- **Automate Prioritization:** Predict email priority (**Urgent**, **High**, **Medium**, **Low**) using a trained Scikit-learn classifier.
- **Surface Actionable Information:** Automatically extract deadlines, calculate relative urgency (`DUE TODAY`, `IN X DAYS`), and highlight pending action items.
- **Guarantee Privacy & Security:** Request only the minimum read-only scope (`gmail.readonly`), encrypt all stored tokens at rest, and keep all AI-generated replies strictly within Kynora.
- **Ensure Multi-Tenant Isolation:** Ensure that independent users have completely isolated inboxes, tokens, and analytical metrics.
- **Deliver a SaaS-Grade Dark Navy UI:** Provide a clean, modern, and accessible dark-navy interface built with React, TypeScript, and Tailwind CSS.
- **Maintain Reliability:** Provide robust offline fallbacks so the application functions in demo mode even if local MySQL servers are disconnected.

---

## 4. Target User Personas

### 4.1. Students & Academic Researchers
- **Pain Points:** High volumes of mixed emails: coursework deadlines, professor announcements, campus notices, internship applications, and newsletters.
- **How Kynora Helps:**
  - Categorizes college and university notices under dedicated tags.
  - Detects assignment and project submission deadlines.
  - Highlights critical internship recruitment and interview updates.

### 4.2. Professionals & Software Engineers
- **Pain Points:** Continuous context switching caused by GitHub notifications, team requests, calendar updates, and urgent stakeholder queries.
- **How Kynora Helps:**
  - Identifies urgent team communication and filters automated alerts.
  - Surfaces action-required tasks into a dedicated triage queue.
  - Generates multi-tone replies (Professional, Concise, Friendly, Formal) for rapid review and copying.

### 4.3. Freelancers & Small Business Owners
- **Pain Points:** Managing concurrent client threads, missing follow-ups, and tracking payment or proposal deadlines.
- **How Kynora Helps:**
  - Highlights urgent client inquiries and action items.
  - Automatically identifies pending follow-ups.
  - Provides volume and read-rate analytics to monitor communication workload.

---

## 5. System Design & Core Modules

```
┌────────────────────────────────────────────────────────────────────────┐
│                          KYNORA PLATFORM                               │
├─────────────────────┬────────────────────┬─────────────────────────────┤
│ 1. User Auth Module │ 2. Email Sync      │ 3. Machine Learning Engine  │
│ - Registration      │ - Google OAuth 2.0 │ - Preprocessing (TF-IDF)    │
│ - PBKDF2 Hashing    │ - Read-Only Sync   │ - Supervised Classification │
│ - Session Tokens    │ - Token Encryption │ - K-Means Semantic Clusters │
│ - Tenant Isolation  │ - MIME Parsing     │ - Confidence Scoring        │
├─────────────────────┼────────────────────┼─────────────────────────────┤
│ 4. AI Reply Engine  │ 5. Productivity UI │ 6. Relational Persistence   │
│ - 4 Tone Synthesizer│ - Dashboard & Brief│ - MySQL 8.0+ Schema         │
│ - Custom Directives │ - Priority Inbox   │ - SQLAlchemy 2.0 ORM        │
│ - Injection Defense │ - Action Queue     │ - Workbench Administration  │
│ - In-App Copy Only  │ - Analytics View   │ - In-Memory Demo Fallback   │
└─────────────────────┴────────────────────┴─────────────────────────────┘
```

### 5.1. User Authentication Module
- Independent user management system separating Kynora credentials from Google OAuth credentials.
- Passwords hashed with PBKDF2-HMAC-SHA256 (100,000 iterations, 16-byte random salt, constant-time verification).
- Signed session Bearer tokens carrying user identity and 7-day expiration.
- Multi-tenant query enforcement preventing cross-user data leakage.

### 5.2. Email Integration & Sync Module
- Web Client Google OAuth 2.0 implementation with CSRF protection.
- Minimal read-only scope (`https://www.googleapis.com/auth/gmail.readonly`).
- Symmetric token encryption at rest using PBKDF2-derived keys and HMAC verification.
- Official Google API Client integration with full MIME body and part parsing.
- Duplicate prevention mechanism skipping already-imported message IDs.
- Single-click account disconnection and Google token revocation.

### 5.3. Machine Learning & Analysis Module
- Pure Scikit-learn text preprocessing and `TfidfVectorizer(max_features=1500)`.
- Supervised classification comparing Logistic Regression, Random Forest, KNN, and Decision Trees.
- Persisted Joblib models loaded at backend startup for low-latency inference.
- Unsupervised K-Means clustering ($k=4$) assigning thematic topics.
- Concrete deadline extraction and relative urgency computation.

### 5.4. AI Reply Assistant Module
- Context-aware generation grounded in sender identity, subject, and body text.
- Four distinct tones: **Professional**, **Friendly**, **Formal**, and **Concise**.
- Custom user prompt instructions support.
- Prompt injection defense stripping directive markers.
- Internal-only architecture: generated replies are reviewed and manually copied; Kynora never drafts or sends emails to Gmail.

### 5.5. Productivity Interface
- **Dashboard:** Overview metrics, executive brief, priority distribution bar, recent emails, and upcoming deadlines.
- **Intelligent Inbox:** Full inbox management with search, multi-criteria filtering, sorting, and read/unread toggle.
- **Priority Inbox:** Segregated triage dividing messages into Urgent/High, Medium, and Low sections.
- **Categories Browser:** Category-specific filtered views.
- **Action Required Queue:** Action-required items sorted by deadline urgency.
- **Analytics View:** Empirical breakdown of volume, read rates, and Scikit-learn ML evaluation metrics.
- **Settings View:** User account details, Gmail OAuth status and controls, MySQL connection monitoring, and interactive ML testing playground.

### 5.6. Data Persistence Layer
- Normalized relational schema in MySQL 8.0+ (`users`, `gmail_accounts`, `emails`, `email_predictions`, `user_feedback`).
- Declarative SQLAlchemy models with foreign key cascading and indexed queries.
- Fast non-blocking socket probe (0.2s) providing immediate fallback to in-memory demo data when MySQL is disconnected.

---

## 6. End-to-End User Journey

```
[ 1. Visit Kynora ] ────> [ 2. Explore Demo Mode ] ────> [ 3. Create Account ]
                                                                   │
                                                                   ▼
[ 6. Prioritize & Read ] <─── [ 5. Sync Emails ] <─── [ 4. Connect Gmail ]
          │
          ▼
[ 7. Review AI Analysis & Deadlines ]
          │
          ▼
[ 8. Generate & Copy Reply (4 Tones) ]
```

1. **Visit & Explore:** User opens the application in their browser and explores the 13 curated demo emails in guest mode.
2. **Register Account:** User creates a private Kynora account with their email and a secure password.
3. **Connect Gmail:** In Settings, the user clicks **Connect Gmail**, authorises read-only access on Google's consent screen, and returns to Kynora.
4. **Sync & Triage:** User clicks **Sync Emails Now**. Kynora fetches live messages via the Gmail REST API, evaluates them with the Scikit-learn classifier, extracts deadlines, and populates the inbox.
5. **Inspect & Act:** User views priority scores, deadlines, and summaries.
6. **Generate Reply:** User generates an AI response in their preferred tone, makes edits in the textarea, and copies the reply to their clipboard.
7. **Disconnect:** When finished, user can disconnect their Gmail account at any time, instantly revoking tokens with Google and purging local records.
