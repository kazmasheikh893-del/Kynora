# Kynora – Implementation Roadmap

> **AI-Powered Intelligent Email Management and Prioritization System**

This roadmap documents the implementation history, current status, and future trajectory of Kynora.

---

## Completed Phases

### Phase 1: Prototype Foundation & Design System
- [x] Initial React + TypeScript + Tailwind CSS application structure.
- [x] Premium dark navy design system (`bg-navy-900`, `bg-navy-950`, `accent-blue`, `text-slate-100`).
- [x] FastAPI asynchronous backend with structured Pydantic v2 data models.
- [x] Curated 13-email sample inbox with realistic priority, category, and deadline annotations.
- [x] Seven core application views: Dashboard, Intelligent Inbox, Priority Inbox, Categories, Action Required, Analytics, and Settings.

### Phase 2: Machine Learning Pipeline & Evaluation
- [x] Python-based text preprocessing (cleaning, tokenization, lowercase normalization, punctuation removal).
- [x] Scikit-learn `TfidfVectorizer(max_features=1500, ngram_range=(1, 2))` feature extraction.
- [x] Supervised model training and comparison across four algorithms:
  - Logistic Regression (Balanced class weights)
  - Random Forest Classifier (100 estimators)
  - K-Nearest Neighbors (KNN)
  - Decision Tree Classifier
- [x] Comprehensive evaluation: K-Fold cross-validation, Test Accuracy, Precision, Recall, F1-score, High-Priority Recall, and Confusion Matrix.
- [x] Unsupervised semantic clustering with **K-Means** ($k=4$), automatically extracting top keywords for topic interpretation.
- [x] Model persistence with **Joblib** (`best_priority_model.joblib`, `tfidf_vectorizer.joblib`, `kmeans_model.joblib`).
- [x] FastAPI prediction service (`/api/ml/predict`) and model status endpoint (`/api/ml/status`).

### Phase 3: Persistent Database Integration (MySQL + SQLAlchemy)
- [x] Normalized MySQL relational schema with 5 core entities:
  - `users`: User account credentials and metadata.
  - `gmail_accounts`: Google OAuth credentials, encrypted tokens, and sync status.
  - `emails`: Stored email messages, metadata, headers, and bodies.
  - `email_predictions`: Scikit-learn predictions, confidence scores, and cluster IDs.
  - `user_feedback`: User corrections for future retraining.
- [x] SQLAlchemy 2.0 ORM models and connection pooling.
- [x] Fast non-blocking socket probe (0.2s) providing graceful in-memory fallback when MySQL is disconnected.
- [x] DDL initialization script (`backend/kynora_schema.sql`) for MySQL Workbench administration.

### Phase 4: Multi-User Authentication & Tenant Isolation
- [x] Independent user management separating Kynora credentials from Google OAuth credentials.
- [x] Passwords hashed with salted PBKDF2-HMAC-SHA256 (100,000 iterations, 16-byte random salt).
- [x] Constant-time password verification via `hmac.compare_digest` to prevent timing attacks.
- [x] Signed session Bearer tokens carrying user identity and 7-day expiration.
- [x] Strict multi-tenant backend isolation: email endpoints enforce user ownership checks, returning `HTTP 403 Forbidden` on unauthorized cross-tenant queries.
- [x] Auth UI modal supporting seamless Sign In and Account Registration.

### Phase 5: Google OAuth 2.0 & Gmail Read-Only Synchronization
- [x] Google Web Client OAuth 2.0 flow loading credentials from `backend/secrets/google_oauth_client.json` or environment variables.
- [x] Minimum required read-only scope: `https://www.googleapis.com/auth/gmail.readonly`.
- [x] Cryptographic CSRF state validation binding the requesting user's ID.
- [x] Authenticated symmetric token encryption at rest using PBKDF2-derived keys and HMAC verification.
- [x] Automatic token refresh upon expiration.
- [x] Real email retrieval via the official `google-api-python-client` (Gmail REST API v1).
- [x] MIME parser extracting plain text, HTML, and multipart/alternative content.
- [x] Duplicate prevention logic skipping already-synchronized message IDs.
- [x] Single-click account disconnection and Google token revocation (`oauth2.googleapis.com/revoke`).

### Phase 6: AI Reply Assistant
- [x] Context-aware email reply generation grounded in email sender, subject, body, and deadline.
- [x] Four distinct professional tones: **Professional**, **Friendly**, **Formal**, and **Concise**.
- [x] Custom prompt instruction integration (e.g., *"Ask for an extension until Friday"*).
- [x] Prompt injection defense filtering directive markers from untrusted email bodies.
- [x] In-app editable textarea with single-click clipboard copying.
- [x] Strict safety constraint: Replies remain strictly internal to Kynora (never sent or drafted in Gmail).

### Phase 7: Technical Audit & Automated Verification
- [x] Full automated test suite in `backend/test_backend_api.py`.
- [x] 52 automated assertions across 20 distinct verification areas passing with zero failures.
- [x] Production frontend build (`tsc && vite build`) transforming 49 modules with zero errors.

---

## Current Active Phase

### Phase 8: Google Cloud Console Production Readiness
- [x] Local OAuth callback configuration (`http://localhost:8000/api/auth/google/callback`).
- [x] Local JavaScript origin configuration (`http://localhost:5173`).
- [ ] Add active developer/tester Gmail accounts to **Test users** in the Google Cloud Console while in Testing mode.
- [ ] Prepare domain verification, hosted privacy policy, and terms of service for Google Cloud production app publishing.
- [ ] Review Google CASA Tier 2 Cloud Security Assessment requirements for restricted Gmail scopes.

---

## Upcoming Phases

### Phase 9: Active Learning Retraining Loop
- [ ] Frontend UI control on `EmailDetail.tsx` allowing users to submit priority corrections.
- [ ] Persistence of corrections into the `user_feedback` database table.
- [ ] Automated offline retraining script merging feedback into the training set and updating model artifacts.

### Phase 10: Advanced Natural Language Processing
- [ ] Contextual date parser for implicit relative deadlines (*"by next Tuesday afternoon"*, *"end of week"*).
- [ ] Sender importance scoring based on historical reply frequency and domain reputation.
- [ ] Thread-level summarization aggregating multiple back-and-forth messages.

### Phase 11: Production Deployment & Containerization
- [ ] Production `Dockerfile` and `docker-compose.yml` defining FastAPI, React/Nginx, and MySQL services.
- [ ] Alembic database migration management.
- [ ] Multi-account Gmail aggregation allowing a single Kynora user to sync multiple Gmail addresses.
