# Kynora – System Architecture Specification

> **AI Email Analyser & Productivity Platform**

---

## 1. Architectural Overview

Kynora is designed as a decoupled, multi-tiered web application that separates concerns across presentation, API routing, business services, machine learning inference, and relational persistence. 

The architecture follows a strict **Frontend → REST API → Service Layer → Machine Learning Engine → Database** flow, augmented by an asynchronous external integration with the **Google Gmail REST API (v1)**.

```mermaid
graph TD
    subgraph Client["Presentation Layer (Client Browser)"]
        UI["React 18 + TypeScript SPA\nTailwind CSS Dark Navy Theme"]
        ApiClient["Type-Safe Fetch API Client\n(Bearer Token Auth)"]
        UI --> ApiClient
    end

    subgraph Backend["FastAPI Application Layer (Python 3.11+)"]
        Main["FastAPI Entrypoint (app/main.py)\nCORS, Error Handlers, Routers"]
        AuthRouter["Auth Router (/api/auth)\nRegister, Login, Me, OAuth Callback"]
        EmailRouter["Emails Router (/api/emails)\nInbox, Details, Reply, Stats, Analytics"]
        
        ApiClient -->|HTTP / REST (JSON)| Main
        Main --> AuthRouter
        Main --> EmailRouter

        subgraph Services["Core Business Services"]
            AuthService["AuthService\nPBKDF2 Password Hashing\nSigned Session Tokens"]
            EmailService["EmailService\nTenant Isolation & In-Memory Cache\nFiltering, Sorting, Stats, Brief"]
            GmailService["GmailOAuthManager\nOAuth2 Exchange, CSRF Protection\nToken Encrypt/Decrypt, MIME Parser"]
            ReplyService["ReplyService\nContextual Multi-Tone Generation\nPrompt Injection Guard"]
            CryptoService["Crypto Service\nPBKDF2-HMAC-SHA256\nSymmetric AES/HMAC"]
        end

        AuthRouter --> AuthService
        AuthRouter --> GmailService
        EmailRouter --> EmailService
        EmailRouter --> ReplyService
        GmailService --> CryptoService
    end

    subgraph ML["Machine Learning Pipeline (Scikit-Learn)"]
        Preprocessor["Preprocessor (app/ml/preprocessor.py)\nText Normalization & TF-IDF Vectorizer"]
        Classifier["Priority Classifier (best_priority_model.joblib)\nSupervised Logistic Regression / RF"]
        Clusterer["Semantic Clusters (kmeans_model.joblib)\nK-Means (k=4) Unsupervised Topic Modeling"]
        
        EmailService --> Preprocessor
        GmailService --> Preprocessor
        Preprocessor --> Classifier
        Preprocessor --> Clusterer
    end

    subgraph External["External Integrations"]
        GoogleOAuth["Google Identity Services\nOAuth 2.0 Web Client"]
        GmailAPI["Google Gmail REST API (v1)\nScope: gmail.readonly"]
        
        GmailService <-->|OAuth Consent & Code Exchange| GoogleOAuth
        GmailService <-->|MIME Message Retrieval| GmailAPI
    end

    subgraph Persistence["Data Persistence Layer"]
        MySQL[("MySQL 8.0+ Database (kynora_db)\nusers, gmail_accounts, emails,\nemail_predictions, user_feedback")]
        SQLAlchemy["SQLAlchemy 2.0 ORM\nSessionLocal, Connection Pool, Declarative Base"]
        MemoryFallback[("In-Memory Demo / Fallback Store\nActive when MySQL is offline")]
        
        EmailService --> SQLAlchemy
        GmailService --> SQLAlchemy
        AuthService --> SQLAlchemy
        SQLAlchemy --> MySQL
        EmailService -.->|Fallback| MemoryFallback
    end
```

---

## 2. Layer-by-Layer Architectural Breakdown

### 2.1. Presentation Layer (Frontend)
- **Technology:** React 18, TypeScript, Tailwind CSS, Vite.
- **Role:** Single Page Application (SPA) offering seven distinct functional views:
  1. **Dashboard:** High-level executive overview cards, priority breakdown, recent emails, upcoming deadlines, and topic clusters.
  2. **Intelligent Inbox:** Full email list with read/unread state, priority badges, category labels, search, and sorting.
  3. **Priority Inbox:** Segmented inbox dividing messages into Urgent, High, Medium, and Low tiers.
  4. **Categories:** Topical breakdown across College, Internship, Placement, Security, GitHub, Certification, Newsletter, Promotion, and General.
  5. **Action Required:** Dedicated queue of messages requiring responses, submissions, or verifications.
  6. **Analytics:** Quantitative charts depicting communication volume, read rates, and ML benchmark performance.
  7. **Settings:** Account authentication, Google OAuth connection controls, MySQL status, and real-time ML inference playground.
- **Security & State:** Session tokens are stored in browser `localStorage`. All outgoing requests via `frontend/src/api.ts` append the `Authorization: Bearer <token>` header when authenticated.

### 2.2. API Routing Layer (FastAPI)
- **Technology:** FastAPI, Uvicorn, Pydantic v2.
- **Role:** Exposes RESTful endpoints grouped into two modular routers:
  - `auth_router` (`/api/auth`): Handles user registration, authentication, current user lookup (`/me`), and Google OAuth 2.0 authorization, callback, status, sync, and disconnection.
  - `emails_router` (`/api`): Handles email retrieval, filtering, single-message lookup, read/unread state toggling, AI reply generation, inbox statistics, executive brief generation, upcoming deadlines, action-required emails, and analytics.
- **Dependency Injection:** FastAPI dependencies (`get_optional_user` and `get_current_user`) extract and decode signed session tokens, injecting the authenticated user context into downstream service calls.

### 2.3. Service Layer (Business Logic)
- **`AuthService` (`backend/app/services/auth_service.py`):**
  - Hashes passwords using PBKDF2-HMAC-SHA256 with 100,000 iterations and a 16-byte cryptographic salt.
  - Performs constant-time password verification via `hmac.compare_digest` to eliminate timing attacks.
  - Generates and validates signed HMAC-SHA256 session tokens with 7-day expiration.
- **`EmailService` (`backend/app/services/email_service.py`):**
  - Implements multi-tenant isolation. Queries and caches emails strictly by `user_id`.
  - Performs multi-criteria filtering, full-text searching, and sorting (by priority rank or timestamp).
  - Enforces tenant ownership checks on individual email queries (`GET /api/emails/{id}`), raising `PermissionError` (HTTP 403 Forbidden) if a user attempts to access another user's email.
- **`GmailOAuthManager` (`backend/app/services/gmail_service.py`):**
  - Loads client credentials from `backend/secrets/google_oauth_client.json` or environment variables.
  - Generates Google OAuth consent URLs with state tokens that cryptographically bind the initiating `user_id` to prevent CSRF attacks.
  - Exchanges authorization codes for access and refresh tokens.
  - Uses the Gmail REST API (`users().messages().list` and `get`) to retrieve MIME messages.
  - Parses headers, plain text, and multipart MIME bodies safely.
  - Automatically handles token expiration by executing token refresh requests.
  - Revokes Google tokens upon user disconnection.
- **`ReplyService` (`backend/app/services/reply_service.py`):**
  - Generates context-aware email replies in four distinct tones: **Professional**, **Friendly**, **Formal**, and **Concise**.
  - Treats email bodies as untrusted input, stripping prompt injection delimiters.
  - Integrates optional user guidance instructions without hallucinating unsupported commitments or dates.
  - Strictly internal: Replies are returned for manual copying; Kynora never drafts or sends emails to Gmail.
- **`CryptoService` (`backend/app/services/crypto.py`):**
  - Provides authenticated symmetric encryption for storing OAuth refresh and access tokens at rest using a 256-bit PBKDF2-derived key and HMAC-SHA256 verification.

### 2.4. Machine Learning Pipeline (Scikit-Learn)
- **Technology:** Scikit-learn, Pandas, NumPy, Joblib.
- **Text Processing (`preprocessor.py`):**
  - Normalizes email subject, sender, and body text.
  - Extracts uni-gram and bi-gram features using `TfidfVectorizer(max_features=1500)`.
- **Supervised Priority Classifier (`service.py`):**
  - Evaluated across Logistic Regression, K-Nearest Neighbors, Random Forest, and Decision Tree classifiers.
  - Selected model persisted via Joblib (`best_priority_model.joblib`) for high-throughput runtime inference.
  - Predicts priority (**Urgent**, **High**, **Medium**, **Low**) along with model confidence scores.
- **Unsupervised Topic Clustering (`kmeans_model.joblib`):**
  - Groups incoming messages into 4 semantic clusters using K-Means, assigning topical theme descriptions.

### 2.5. Data Persistence Layer (MySQL & In-Memory Fallback)
- **Technology:** MySQL 8.0+, SQLAlchemy 2.0 ORM, `mysql-connector-python`.
- **Relational Entities (`db_models.py`):**
  1. `users`: Stores user ID, email address, full name, and PBKDF2-hashed password.
  2. `gmail_accounts`: Stores Google OAuth credentials, encrypted tokens, expiry timestamps, and sync metadata linked to a user.
  3. `emails`: Stores message IDs, headers, body, received timestamp, read status, and foreign key to `users`.
  4. `email_predictions`: Stores Scikit-learn predicted priority, category, summary, action required, detected deadline, and confidence score linked to an email.
  5. `user_feedback`: Stores user corrections (corrected priority, corrected category, notes) for future model retraining.
- **Resilient Fallback:** If the MySQL database server is offline or unreachable, Kynora's connection manager (`database.py`) detects this condition within 200ms and switches seamlessly to its in-memory repository without crashing.

---

## 3. Data Flows & Execution Lifecycles

### 3.1. User Registration & Authentication Flow
```
User (Browser)               Auth Router (/api/auth)          AuthService              MySQL / Memory
     │                                │                            │                         │
     ├─ POST /register (email, pass) ─>│                            │                         │
     │                                ├─ register_user() ─────────>│                         │
     │                                │                            ├─ Hash password (PBKDF2) ┤
     │                                │                            ├─ Save User record ─────>│
     │                                │                            ├─ Create signed token    │
     │                                │<─ return (user, token) ────┤                         │
     │<─ HTTP 200 {token, user} ──────┤                            │                         │
```

### 3.2. Google OAuth & Gmail Synchronization Flow
```
User (Browser)            Gmail Router (/api/auth/google)      GmailService             Google Cloud
     │                                │                            │                         │
     ├─ Click "Connect Gmail" ────────>│                            │                         │
     │                                ├─ generate_auth_url(user_id)>│                         │
     │                                │                            ├─ Generate state + bind  │
     │<─ Return Google Auth URL ──────┤<─ Return (url, state) ─────┤                         │
     │                                                                                       │
     ├─ Redirect to Google Consent Page ────────────────────────────────────────────────────>│
     │<─ User grants read-only permission & redirects to /callback?code=...&state=... ───────┤
     │                                │                                                      │
     ├─ GET /google/callback ─────────>│                                                      │
     │                                ├─ validate_state(state) ───>│                         │
     │                                │   (Extracts bound user_id) │                         │
     │                                ├─ exchange_code_for_tokens()├─ POST /token ──────────>│
     │                                │                            │<─ Access & Refresh Token┤
     │                                ├─ Encrypt tokens at rest ───┤                         │
     │                                ├─ Store GmailAccount in DB ─┤                         │
     │                                ├─ Fetch initial messages ───├─ GET users.messages ───>│
     │                                │   (Pass through ML engine) │<─ Message MIME payloads ┤
     │<─ Redirect to /settings?status=connected ───────────────────┤                         │
```

### 3.3. AI Reply Generation Flow
```
User (Browser)               Email Router                    ReplyService              Scikit-Learn ML
     │                             │                              │                           │
     ├─ POST /api/emails/{id}/reply┤                              │                           │
     │  {tone, instruction}        ├─ email_service.get_email()   │                           │
     │                             │   (Verify tenant ownership)  │                           │
     │                             ├─ generate_reply() ──────────>│                           │
     │                             │                              ├─ Sanitize input           │
     │                             │                              ├─ Contextual tone synthesis│
     │                             │<─ {success, reply, tone} ────┤                           │
     │<─ Return generated reply ───┤                              │                           │
     │                             │                              │                           │
     ├─ User reviews, edits text   │                              │                           │
     └─ User clicks "Copy Reply" ──┘                              │                           │
```

---

## 4. Security Architecture

1. **Strictly Read-Only Email Scope:** Kynora requests exclusively `https://www.googleapis.com/auth/gmail.readonly`. The application technically cannot compose, modify, delete, or send emails from the user's Gmail account.
2. **Encrypted Credentials at Rest:** Tokens stored in the database are encrypted symmetrically using authenticated encryption (PBKDF2-HMAC-SHA256 key derivation + constant-time HMAC-SHA256 verification).
3. **Multi-Tenant Authorization:** Every email query and action requires user authentication. Direct object references are protected by checking `email.user_id == current_user.id`; unauthorized access attempts immediately return HTTP 403 Forbidden.
4. **Untrusted Input Defense:** Email bodies are treated as untrusted data. Regular expressions sanitize prompt injection markers before text reaches the reply generation engine.
5. **Session Integrity:** User session tokens are cryptographically signed with HMAC-SHA256, carrying expiration timestamps and unique token IDs.
