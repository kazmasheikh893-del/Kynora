# Kynora – Feature Inventory & Specification

> **AI Email Analyser & Productivity Platform**

This document provides a comprehensive inventory of all features in Kynora, clearly categorized by their implementation status: **Implemented & Operational**, **Partially Implemented**, and **Planned Future Enhancements**.

---

## 1. Feature Status Summary Matrix

| Domain | Implemented & Working | Partially Implemented | Planned Future Work |
| :--- | :--- | :--- | :--- |
| **Authentication & Users** | • Account Registration<br>• PBKDF2 Password Hashing<br>• Secure Login & Logout<br>• Signed Session Tokens<br>• Multi-Tenant Isolation | — | • Two-Factor Authentication (2FA)<br>• Password Reset via Email |
| **Email Integration** | • Google OAuth 2.0 Integration<br>• Read-Only Gmail Sync (v1 API)<br>• MIME Body & Part Parsing<br>• Token Encryption at Rest<br>• Duplicate Prevention<br>• Account Disconnection & Token Revoke | • Google Cloud Verification (Code is ready; requires Google app review) | • Multi-account aggregation per user<br>• Webhook-based push notifications |
| **Machine Learning & AI** | • Scikit-Learn Priority Classifier<br>• TF-IDF Feature Extraction<br>• K-Means Topic Clustering<br>• Deadline Extraction<br>• Action-Required Extraction<br>• Executive Briefing Generator | • User Feedback Loop (Schema ready; automated retraining pipeline planned) | • Continuous model retraining pipeline<br>• Advanced NLP date extraction |
| **AI Reply Generator** | • Multi-Tone Reply Generation<br>• 4 Tones (Prof, Friendly, Formal, Concise)<br>• Custom Instructions Support<br>• In-App Textarea Editing<br>• Single-Click Clipboard Copy<br>• Strict Read-Only Security Guardrails | — | • Saved reply templates<br>• Multi-language reply translation |
| **User Interface** | • Dark Navy SaaS Design System<br>• Dashboard View<br>• Intelligent Inbox View<br>• Priority Inbox View<br>• Categories Browser<br>• Action Required Queue<br>• Analytics View<br>• Settings View<br>• Auth Modal & Status Badges | — | • Custom theme customization<br>• Keyboard shortcuts navigation |
| **Data & Persistence** | • Normalized MySQL 8.0+ Schema<br>• SQLAlchemy 2.0 ORM<br>• MySQL Workbench DDL Script<br>• Automatic In-Memory Fallback | — | • Automated database migrations (Alembic) |

---

## 2. Fully Implemented Features

### 2.1. Authentication & Multi-Tenant User Management
- **User Account Registration:** Users can register with an email address, password, and full name.
- **PBKDF2 Password Security:** Passwords are never stored in plaintext. They are hashed using PBKDF2-HMAC-SHA256 with 100,000 iterations and a 16-byte cryptographically secure salt. Verification uses constant-time comparison (`hmac.compare_digest`) to protect against timing attacks.
- **Signed Session Tokens:** Authentication produces signed HMAC-SHA256 Bearer tokens carrying user identity and an expiration timestamp (default 7 days).
- **Strict Backend Tenant Isolation:** Every email record, sync record, and prediction is linked to a Kynora `user_id`. When an authenticated user requests emails or analytical data, the query is scoped strictly to their ID. Attempting to access or generate replies for another user's email returns `HTTP 403 Forbidden`.
- **Guest / Demo Mode:** Unauthenticated users can explore Kynora using a built-in 13-email sample inbox without requiring registration.

### 2.2. Google OAuth 2.0 & Gmail API Synchronization
- **Google Web Client OAuth 2.0:** Secure authorization flow loading credentials from `backend/secrets/google_oauth_client.json` or environment variables.
- **Strictly Read-Only Scope:** Exclusively requests `https://www.googleapis.com/auth/gmail.readonly` (plus basic identity scopes `openid`, `userinfo.email`, and `userinfo.profile`). Kynora cannot send emails, create drafts, delete messages, or modify mailbox settings.
- **CSRF State Protection:** Authorization URLs generate cryptographic state tokens valid for 15 minutes that bind the requesting Kynora `user_id`, preventing cross-site request forgery.
- **Authenticated Symmetric Token Encryption:** OAuth refresh and access tokens are encrypted before saving to the database using PBKDF2-derived keys and constant-time HMAC verification.
- **Automatic Token Refresh:** Expired access tokens are automatically detected and renewed using the stored refresh token.
- **Live Gmail REST API Retrieval:** Fetches messages directly using the official `google-api-python-client` (`users().messages().list` and `get`).
- **MIME Parsing:** Safely parses plain text (`text/plain`), HTML (`text/html`), and nested `multipart/alternative` MIME parts, extracting senders, subjects, dates, and bodies.
- **Duplicate Prevention:** Re-synchronizing an inbox skips already-imported message IDs to avoid duplicating records.
- **Account Disconnection:** Clicking Disconnect revokes tokens with Google's revocation endpoint (`oauth2.googleapis.com/revoke`), deletes database credentials, and purges synced emails.

### 2.3. Scikit-Learn Machine Learning Engine
- **Text Preprocessing (`preprocessor.py`):** Normalizes subject, sender, and body text (lowercase conversion, punctuation removal, alphanumeric tokenization, domain-specific stopword removal).
- **Feature Extraction:** Extracts uni-gram and bi-gram features using Scikit-learn's `TfidfVectorizer(max_features=1500)`.
- **Supervised Priority Classification (`trainer.py` / `service.py`):**
  - Compares Logistic Regression, K-Nearest Neighbors (KNN), Random Forest, and Decision Tree classifiers via K-Fold cross-validation.
  - Persists the highest-performing model (`best_priority_model.joblib`) for production inference.
  - Classifies emails into four priority tiers: **Urgent**, **High**, **Medium**, and **Low**, along with confidence scores.
- **Unsupervised Semantic Clustering:** K-Means clustering ($k=4$) groups emails into conceptual themes (e.g., *Academic Deadlines*, *Career & Placements*, *Technical Updates*, *System Security*).
- **No Heavy Linguistic Dependencies:** Operates strictly with standard Scikit-learn, Pandas, and NumPy without requiring NLTK or spaCy.

### 2.4. Intelligent Email Analysis & Extraction
- **Content Summarization:** Generates concise one-sentence summaries capturing the core intent of each message.
- **Deadline Extraction:** Detects concrete deadlines and calculates relative urgency countdowns (`DUE TODAY`, `DUE TOMORROW`, `IN X DAYS`).
- **Action-Required Identification:** Flags messages requiring responses, submissions, or verifications, and generates recommended next steps.
- **Topical Categorization:** Categorizes correspondence into College, Internship, Placement, Security, GitHub, Certification, Newsletter, Promotion, and General.
- **Executive Briefing (`KynoraBrief`):** Generates an executive headline, count of urgent items, deadlines, and actionable task lines.

### 2.5. AI Reply Assistant (Phase 7)
- **Context-Aware Reply Generation:** Generates grounded email replies utilizing the email's subject, sender name, body preview, detected action, and deadline.
- **Four Distinct Tones:**
  1. **Professional:** Courteous, articulate, and action-oriented.
  2. **Friendly:** Warm, supportive, and conversational.
  3. **Formal:** Traditional, dignified, and precise.
  4. **Concise:** Direct, crisp, and compact.
- **Custom Instructions Support:** Incorporates user directives into the generated reply (e.g., *"Ask for an extension until Friday"*).
- **Prompt Injection Defense:** Treats incoming email bodies as untrusted input and filters prompt injection directives.
- **In-App Editing & Clipboard Copy:** The generated response is placed inside an editable textarea with a single-click "Copy Reply" button.
- **Strict Safety Constraint:** Replies remain strictly internal to Kynora. No draft is created in Gmail, and no message is ever sent automatically.

### 2.6. User Interface & Productivity Views
- **Deep Navy Design System:** Clean dark theme built with Tailwind CSS, subtle borders, responsive spacing, and accessible contrast.
- **Dashboard View:** Top overview stats (Total, Urgent, High, Medium, Low, Action Required), executive brief, distribution charts, recent emails, and upcoming deadlines.
- **Intelligent Inbox:** Full inbox management with read/unread toggle, multi-criteria filtering, sorting (by priority rank or timestamp), and global search.
- **Priority Inbox:** Segregated priority view organizing emails into High/Urgent, Medium, and Low sections.
- **Categories Browser:** Filter by category pills with split-pane message viewing.
- **Action Required Queue:** Dedicated triage list for pending tasks and deadlines.
- **Analytics View:** Quantitative charts showing communication volume, read rates, and Scikit-learn ML evaluation metrics (accuracy, precision, recall, F1, confusion matrix).
- **Settings View:** Profile account management, Gmail OAuth connection controls, Google Cloud setup instructions, MySQL status indicator, and interactive ML testing playground.

### 2.7. Database & Persistence
- **MySQL Relational Schema (`kynora_schema.sql`):** 5 normalized tables (`users`, `gmail_accounts`, `emails`, `email_predictions`, `user_feedback`).
- **SQLAlchemy 2.0 ORM:** Declarative models with cascading relationships and connection pooling.
- **Non-Blocking Offline Fallback:** If MySQL is not running locally, Kynora's connection manager detects this condition within 200ms and switches seamlessly to its in-memory repository without crashing.

---

## 3. Partially Implemented Features

### 3.1. User Feedback Collection Loop
- **Current State:** The database schema (`user_feedback` table) and model definitions are fully implemented.
- **What Remains:** A UI feedback control allowing users to manually correct priority or category labels directly in the email detail view, and an automated background script to retrain the Scikit-learn model on accumulated feedback records.

### 3.2. Google OAuth Production Verification
- **Current State:** The application code is production-ready. The OAuth flow, token encryption, CSRF protection, and Gmail API integration are fully functional.
- **What Remains:** Because the Google Cloud project is currently in "Testing" mode, only email addresses explicitly added under "Test Users" can sign in. Public general release requires Google domain verification, hosted privacy policy/terms, and an annual CASA Tier 2 Cloud Security Assessment for restricted scopes.

---

## 4. Planned Future Features

1. **Active Learning Retraining Pipeline:** Automatic nightly or periodic retraining of Scikit-learn models using corrected labels from `user_feedback`.
2. **Advanced NLP Date Parsing:** Extraction of implicit relative deadlines (e.g., *"by next Tuesday afternoon"*, *"end of the week"*).
3. **Multi-Account Aggregation:** Connecting multiple Gmail accounts (e.g., personal and academic) to a single Kynora user profile.
4. **Custom User Rules:** User-defined heuristic rules (e.g., *"Always mark emails from my advisor as Urgent"*).
5. **Production Dockerization:** Complete `Dockerfile` and `docker-compose.yml` defining FastAPI, React/Nginx, and MySQL services for single-command production deployment.
