# Kynora – Technology Stack Documentation

> **AI Email Analyser & Productivity Platform**

This document specifies the finalized technology stack used throughout Kynora, explaining the role, responsibilities, and selection rationale for every framework, library, database, and tool.

---

## 1. Technology Stack Summary

```
┌────────────────────────────────────────────────────────────────────────┐
│                          KYNORA TECH STACK                             │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ Frontend Layer    │ Backend Layer     │ Database & Persistence Layer   │
│ - React 18        │ - Python 3.11+    │ - MySQL 8.0+                   │
│ - TypeScript 5.5+ │ - FastAPI 0.115+  │ - SQLAlchemy 2.0 ORM           │
│ - Tailwind CSS 3.4│ - Uvicorn 0.30+   │ - mysql-connector-python       │
│ - Vite 5.4+       │ - Pydantic v2     │ - MySQL Workbench (Admin)      │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ Machine Learning  │ Email Integration │ Security & Authentication      │
│ - Scikit-Learn    │ - Gmail API (v1)  │ - PBKDF2-HMAC-SHA256 (Passwd)  │
│ - TfidfVectorizer │ - Google OAuth 2.0│ - HMAC-SHA256 (Session Tokens) │
│ - Pandas & NumPy  │ - Read-Only Scope │ - Symmetric AES/HMAC (Tokens)  │
│ - Joblib (Models) │ - google-api-py   │ - Tenant Isolation Enforcement │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

---

## 2. Frontend Technologies

### 2.1. React 18
- **Role:** Single Page Application (SPA) component framework.
- **Why Selected:**
  - Component-based architecture enables clean encapsulation of UI elements (EmailList, EmailDetail, PriorityBadge, DashboardView).
  - Virtual DOM provides high rendering performance during active filtering and search.
  - Unidirectional data flow simplifies state coordination between the top navigation, filter toolbar, and email reader.
- **Key Responsibilities:**
  - Managing application state (`currentUser`, `emails`, `stats`, `brief`, `filter`, `search`).
  - Rendering 7 distinct functional views (Dashboard, Inbox, Priority, Categories, Actions, Analytics, Settings).
  - Providing interactive feedback during async operations (loading skeletons, spinning buttons, toast notifications).

### 2.2. TypeScript (v5.5+)
- **Role:** Static type system for all frontend code.
- **Why Selected:**
  - Strict compile-time validation eliminates runtime `undefined` and type errors.
  - Interfaces in `frontend/src/types.ts` mirror backend Pydantic models exactly (`EmailWithAnalysis`, `InboxStats`, `KynoraBrief`, `KynoraUser`).
  - Superior developer experience with intelligent autocompletion across complex email and prediction objects.

### 2.3. Tailwind CSS (v3.4+)
- **Role:** Utility-first styling framework implementing Kynora's custom dark navy design system.
- **Why Selected:**
  - Zero CSS bloat: unused styles are purged during the production build.
  - Cohesive design tokens defined in `tailwind.config.js`:
    - Deep primary background: `navy-900` (`#0b1329`)
    - Surface background: `navy-950` (`#070d1e`)
    - Card surfaces: `navy-800` (`#111c38`)
    - Accent blue: `#3b82f6`
    - Cyan highlights: `#06b6d4`
    - Priority colors: Red (Urgent), Amber (High), Blue (Medium), Slate (Low).
- **Key Responsibilities:**
  - Responsive layouts (mobile drawer, desktop split-pane reader).
  - Modern subtle borders, smooth transitions, and custom thin scrollbars.

### 2.4. Vite (v5.4+)
- **Role:** Frontend development server and production bundler.
- **Why Selected:**
  - Native ES module development server providing sub-second Hot Module Replacement (HMR).
  - Rollup-based production build bundling 49 modules into optimized, minified JavaScript and CSS in under 4 seconds.

---

## 3. Backend Technologies

### 3.1. Python (v3.11+ / v3.13)
- **Role:** Core server-side programming language.
- **Why Selected:**
  - Native ecosystem for Machine Learning (Scikit-Learn, Pandas, NumPy) and asynchronous web development (FastAPI).
  - Modern language features: structural pattern matching, strict type hints, and built-in cryptography modules (`hashlib`, `hmac`, `secrets`).

### 3.2. FastAPI (v0.115+)
- **Role:** High-performance asynchronous REST API framework.
- **Why Selected:**
  - Asynchronous request handling via Starlette for high throughput.
  - Automatic OpenAPI / Swagger UI generation (`/docs` and `/redoc`).
  - Native dependency injection (`Depends`) for clean authentication and user extraction.
  - First-class Pydantic v2 integration for strict request validation and response serialization.

### 3.3. Uvicorn (v0.30+)
- **Role:** Lightning-fast ASGI (Asynchronous Server Gateway Interface) web server.
- **Why Selected:**
  - Production-ready performance built on `uvloop` and `httptools`.
  - Supports hot-reloading during development (`--reload`) and multi-worker execution in production.

### 3.4. Pydantic (v2)
- **Role:** Data validation, serialization, and contract enforcement.
- **Why Selected:**
  - Rust-based core (`pydantic-core`) delivers ultra-fast JSON validation.
  - Defines contracts in `backend/app/models.py` (`Email`, `EmailAnalysis`, `InboxStats`, `KynoraBrief`, `Priority`, `Category`).

---

## 4. Database & Persistence Layer

### 4.1. MySQL (v8.0+)
- **Role:** Primary relational database management system.
- **Why Selected:**
  - Robust ACID compliance, transactional integrity, and battle-tested reliability.
  - Native JSON and UTF-8 (`utf8mb4_unicode_ci`) support for email body text and headers.
  - Administrative simplicity via MySQL Workbench.
- **Normalized Schema (`kynora_schema.sql`):**
  - `users`: User identity, email, full name, and PBKDF2 password hashes.
  - `gmail_accounts`: Google OAuth credentials, encrypted tokens, expiry, and sync status.
  - `emails`: Normalized headers, sender, preview, body, received timestamp, and read status.
  - `email_predictions`: Scikit-learn outputs, predicted priority, category, summary, action required, deadline, and cluster ID.
  - `user_feedback`: User corrections for future model retraining.

### 4.2. SQLAlchemy (v2.0+)
- **Role:** Object-Relational Mapping (ORM) and connection pool manager.
- **Why Selected:**
  - Pythonic declarative models in `backend/app/db_models.py`.
  - Connection pooling with automatic reconnection (`pool_pre_ping=True`, `pool_recycle=3600`).
  - Separation of database models from API presentation models.

### 4.3. MySQL Connector / Python (`mysql-connector-python`)
- **Role:** Official MySQL database driver for Python.
- **Why Selected:**
  - Developed and maintained directly by Oracle / MySQL.
  - Native integration with SQLAlchemy dialect (`mysql+mysqlconnector://`).

### 4.4. Resilient Offline Fallback
- **Role:** In-memory repository active when MySQL is offline.
- **Why Implemented:**
  - Fast socket probe (`database.py`) tests port 3306 with a 0.2-second timeout.
  - If MySQL is not running, the application logs a graceful notice and operates in local memory mode without crashing.

---

## 5. Machine Learning & Text Processing

### 5.1. Scikit-Learn
- **Role:** Supervised priority classification and unsupervised semantic clustering.
- **Why Selected:**
  - Industry-standard ML framework optimized for tabular and text feature spaces.
  - Lightweight and self-contained; avoids heavy external NLP packages.
- **Supervised Classifiers Evaluated (`trainer.py`):**
  - **Logistic Regression:** Linear decision boundaries with balanced class weighting.
  - **Random Forest:** Ensemble of decision trees mitigating overfitting.
  - **K-Nearest Neighbors (KNN):** Distance-based instance learning.
  - **Decision Tree Classifier:** Interpretable rule-based splitting.
- **Unsupervised Semantic Clustering:**
  - **K-Means ($k=4$):** Clusters high-dimensional TF-IDF vectors into topical groupings (*Academic*, *Career*, *Tech*, *Security*).

### 5.2. Scikit-Learn TfidfVectorizer
- **Role:** Text preprocessing and numerical feature extraction.
- **Configuration:**
  - `ngram_range=(1, 2)`: Captures single words and meaningful word pairs (e.g., *"action required"*, *"deadline today"*).
  - `max_features=1500`: Limits vocabulary to the 1,500 most informative terms.
  - Domain-specific stopword removal: Filters noise words while preserving urgency markers.

### 5.3. Pandas & NumPy
- **Role:** Training dataset manipulation and matrix computations.
- **Why Selected:** Fast vectorized operations for feature matrices and evaluation metrics.

### 5.4. Joblib
- **Role:** Model serialization and disk persistence.
- **Why Selected:** Optimized for persisting NumPy arrays and Scikit-learn estimators to `backend/app/ml/artifacts/`.

---

## 6. Email Integration (Gmail REST API)

### 6.1. Google OAuth 2.0 (Web Application Client)
- **Role:** User authorization and secure delegated inbox access.
- **Scope:** Restricted strictly to `https://www.googleapis.com/auth/gmail.readonly`.
- **Security Features:**
  - CSRF state tokens valid for 15 minutes binding the Kynora `user_id`.
  - Offline access mode to obtain refresh tokens.
  - Automatic token refresh on expiration.
  - Google token revocation on account disconnection.

### 6.2. Google API Client (`google-api-python-client`)
- **Role:** Official client library for the Google Gmail v1 REST API.
- **Why Selected:** Robust HTTP transport with automatic retries and structured payload handling.

---

## 7. Security & Cryptography

### 7.1. PBKDF2-HMAC-SHA256 (Password Hashing)
- **Implementation:** Standard library `hashlib.pbkdf2_hmac`.
- **Parameters:** 100,000 iterations, 16-byte random salt, 32-byte derived key.
- **Format:** `pbkdf2:sha256:100000$<salt_hex>$<hash_hex>`.
- **Verification:** Constant-time comparison (`hmac.compare_digest`).

### 7.2. Authenticated Symmetric Token Encryption
- **Implementation:** `backend/app/services/crypto.py`.
- **Mechanism:** Key derived via PBKDF2 from `TOKEN_ENCRYPTION_KEY`. Tokens encrypted with AES/HMAC integrity tags before saving to MySQL.

### 7.3. Signed Session Tokens
- **Implementation:** Stateless signed Bearer tokens containing payload (`user_id`, `email`, `exp`) and an HMAC-SHA256 signature.

---

## 8. Technology Restrictions (Explicitly Avoided)

To maintain architectural focus, performance, and simplicity, Kynora strictly avoids the following technologies:

| Technology | Avoided Rationale |
| :--- | :--- |
| **PostgreSQL / MongoDB** | MySQL 8.0+ is the required database. All legacy references have been removed. |
| **Prisma ORM** | Node.js ORM; incompatible with Kynora's Python FastAPI backend. |
| **Next.js / Nuxt / Vue** | React 18 SPA + Vite was chosen for clean separation between frontend and backend. |
| **Django** | Heavy monolithic framework; FastAPI provides higher async performance and modularity. |
| **NLTK / spaCy** | Heavy linguistic runtime dependencies; Scikit-learn's `TfidfVectorizer` delivers faster, simpler text processing. |
| **Node.js Backend** | All backend services and ML pipelines are written in Python. |
