# Kynora – AI Email Analyser and Productivity Platform

> **Intelligent Inbox Management, Machine Learning Prioritization, and Productivity Platform**

[![Python Version](https://img.shields.io/badge/Python-3.11%20%7C%203.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC.svg)](https://tailwindcss.com/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.5+-F7931E.svg)](https://scikit-learn.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1.svg)](https://www.mysql.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

- [What is Kynora?](#what-is-kynora)
- [Problem Statement](#problem-statement)
- [Main Objectives](#main-objectives)
- [Key Features](#key-features)
- [How Kynora Works](#how-kynora-works)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
  - [3. Database Setup (MySQL)](#3-database-setup-mysql)
- [Environment Variables Configuration](#environment-variables-configuration)
- [Gmail OAuth Configuration](#gmail-oauth-configuration)
- [How to Use Kynora](#how-to-use-kynora)
- [API Overview](#api-overview)
- [Machine Learning Engine](#machine-learning-engine)
- [Security and Privacy](#security-and-privacy)
- [Current Implementation Status](#current-implementation-status)
- [Project Roadmap](#project-roadmap)
- [Troubleshooting](#troubleshooting)
- [Contribution Guidelines](#contribution-guidelines)
- [License](#license)

---

## What is Kynora?

**Kynora** is an AI-powered email management and prioritization platform designed to transform crowded inboxes into organized, actionable workspaces. Rather than functioning as a standard email client, Kynora acts as an intelligent productivity layer connected to existing email providers (currently Gmail).

By combining supervised and unsupervised **Machine Learning (Scikit-Learn)** with modern web architecture (**FastAPI**, **React**, **TypeScript**, and **MySQL**), Kynora automatically:
1. Predicts incoming email priority (**Urgent**, **High**, **Medium**, **Low**).
2. Extracts action-required requests and concrete deadlines.
3. Groups semantically similar emails into topical clusters.
4. Generates contextual email replies across multiple tones (**Professional**, **Friendly**, **Formal**, **Concise**).
5. Provides high-level executive briefing and aggregate inbox analytics.

---

## Problem Statement

Email remains the primary communication channel for academics, professionals, and enterprises. However, traditional email clients present serious productivity bottlenecks:
- **Chronological overload:** Emails appear by arrival time rather than importance, forcing users to manually scan hundreds of messages.
- **Buried deadlines and action items:** Crucial follow-ups, interview slots, exam dates, and payment deadlines get lost inside lengthy threads.
- **Fragmented communication:** Repetitive questions consume valuable hours drafting manual responses.
- **Lack of productivity visibility:** Users cannot track communication volume, response patterns, or email categories.

Traditional email platforms focus on transport (sending/receiving) rather than cognitive triage. Kynora bridges this gap by acting as an intelligent productivity companion.

---

## Main Objectives

- **Automated Priority Prediction:** Accurately flag high-stakes and urgent communication using a trained Scikit-learn model.
- **Deadline and Task Extraction:** Automatically surface upcoming deadlines and actionable requests.
- **Multi-Tenant User Isolation:** Enable independent user accounts with encrypted token storage and isolated inboxes.
- **Strict Read-Only Integration:** Integrate with Gmail using the minimum required permissions (`gmail.readonly`), guaranteeing that no messages are sent, altered, or deleted without user consent.
- **Internal AI Reply Generation:** Help users draft replies across four distinct tones while ensuring generated text remains strictly inside Kynora.
- **Enterprise-Grade Security:** Encrypt all OAuth refresh tokens at rest, hash passwords with PBKDF2-HMAC-SHA256, and protect all endpoints against CSRF and cross-tenant leakage.

---

## Key Features

### 1. Multi-User Authentication & Tenant Isolation
- User registration and login with PBKDF2-HMAC-SHA256 password hashing.
- Signed, tamper-proof session tokens (`Authorization: Bearer <token>`).
- Strict backend-enforced tenant isolation: one user cannot read, access, or generate replies for another user's emails.

### 2. Intelligent Inbox & Multi-Tier Prioritization
- **Priority Inbox:** Segregates emails into Urgent, High, Medium, and Low tiers.
- **Action Required Queue:** Gathers all pending responses, task requests, and submissions into a dedicated triage list.
- **Topical Categories:** Automatic classification across College, Internship, Placement, Security, GitHub, Certification, Newsletter, Promotion, and General topics.
- **Global Search & Multi-Criteria Filtering:** Filter by read status, priority, category, or search across subjects, senders, and message bodies.

### 3. Executive Dashboard & Briefing
- **Kynora Brief:** High-level executive headline and actionable takeaways.
- **Upcoming Deadlines Widget:** Chronological deadline tracker with urgency badges (`DUE TODAY`, `DUE TOMORROW`, `IN X DAYS`).
- **Distribution Charts:** Visual breakdown of inbox volume across priority tiers and topical categories.

### 4. AI Reply Assistant (Internal Only)
- Context-aware reply generator grounded in the email's subject, sender, and body.
- **Four Tone Options:** Professional, Friendly, Formal, and Concise.
- **Custom Instructions:** Accepts optional user directives (e.g., *"Ask for a 2-day extension"*).
- **In-App Editing & Clipboard Copy:** Editable draft with single-click copying.
- **Strict Safety Constraint:** Generated replies are never sent to Gmail, and no Gmail compose/draft scopes are requested.

### 5. Gmail OAuth 2.0 Read-Only Synchronization
- Connect personal or institutional Gmail accounts via Google OAuth 2.0.
- Synchronizes message headers, MIME parts (plain text & HTML), and timestamps.
- Symmetric AES/HMAC encryption of access and refresh tokens stored in MySQL.
- Re-synchronization protection preventing duplicate email records.
- Single-click account disconnection with immediate Google token revocation.

### 6. Analytics & ML Model Inspector
- Overview of total volume, read rates, and priority/category distributions.
- Real-time ML inspection showing active classifier accuracy, precision, recall, high-priority recall, confusion matrix, and K-Means clusters.
- Live interactive inference playground to test custom email texts.

---

## How Kynora Works

```
1. Ingest           2. Preprocess & Feature Extraction    3. Machine Learning Triage
[ Gmail API ]  ---> [ Text Normalization & Cleaning ] ---> [ Scikit-Learn Classifier ]
[ Sample DB ]       [ TF-IDF Uni/Bi-gram Vectorizer ]      - Predicts Priority
                                                           - Assigns Topic Cluster
                                                           - Extracts Deadlines & Actions
                                                                      │
4. Executive Interface <----------------------------------------------┘
- Priority Inbox & Action Queue
- Executive Briefing & Dashboard
- AI Reply Assistant (4 Tones, In-App Copy)
```

1. **Email Ingestion:** Emails are fetched via the Gmail REST API (v1) using user-authorized OAuth credentials, or loaded from the built-in 13-email sample dataset in demo mode.
2. **Text Preprocessing:** Subjects, snippets, and bodies are normalized (lowercased, stripped of punctuation, and tokenized) and transformed into a high-dimensional feature matrix using Scikit-learn's `TfidfVectorizer`.
3. **Machine Learning Inference:** The serialized classification pipeline evaluates the TF-IDF features to predict priority, calculate confidence scores, identify topical clusters (K-Means), and detect deadlines and action requests.
4. **Presentation & Action:** The React frontend displays prioritized emails, executive summaries, and allows the user to review the analysis and generate contextual replies.

---

## Technology Stack

| Layer | Technologies | Rationale / Purpose |
| :--- | :--- | :--- |
| **Frontend** | **React 18**, **TypeScript**, **Tailwind CSS**, **Vite** | Fast, responsive single-page application with custom deep navy dark theme. |
| **Backend** | **Python 3.11+**, **FastAPI**, **Uvicorn**, **Pydantic v2** | High-performance asynchronous REST API with strict request/response data contracts. |
| **Database** | **MySQL 8.0+**, **SQLAlchemy ORM**, `mysql-connector-python` | Relational persistence for users, encrypted tokens, emails, and ML predictions with automatic offline fallback. |
| **Machine Learning** | **Scikit-learn**, **Pandas**, **NumPy**, **Joblib** | Supervised classification (Logistic Regression, KNN, Random Forest, Decision Tree) and unsupervised K-Means clustering. |
| **Text Processing** | Python standard library + Scikit-learn `TfidfVectorizer` | Clean, fast text vectorization without heavy external dependencies like NLTK or spaCy. |
| **Email Integration** | **Gmail REST API v1**, **Google OAuth 2.0** | Read-only inbox retrieval (`https://www.googleapis.com/auth/gmail.readonly`). |
| **Security** | `hashlib` (PBKDF2), `hmac`, `secrets`, `cryptography` | Authenticated symmetric encryption for tokens at rest and PBKDF2 password hashing. |

---

## Project Architecture

```
                    ┌───────────────────────────────────────────────┐
                    │               React 18 Frontend               │
                    │   (TypeScript, Tailwind CSS, Vite Bundler)    │
                    └───────────────────────┬───────────────────────┘
                                            │ HTTP / JSON (REST)
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │                FastAPI Backend                │
                    │      (Routers: /api/auth, /api/emails)        │
                    └───────┬───────────────┬───────────────┬───────┘
                            │               │               │
            ┌───────────────┴────┐   ┌──────┴────────┐   ┌──┴────────────────┐
            ▼                    ▼   ▼               ▼   ▼                   ▼
┌──────────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────────┐
│   AuthService        │ │  EmailService  │ │  GmailService  │ │  ReplyService      │
│ - PBKDF2 Password    │ │ - Tenant Query │ │ - Google OAuth │ │ - 4 Tones          │
│ - Signed Token Auth  │ │ - Brief/Stats  │ │ - Gmail v1 API │ │ - Injection Guard  │
│ - User Management    │ │ - Deadlines    │ │ - Token Encrypt│ │ - Internal Only    │
└──────────────────────┘ └───────┬────────┘ └───────┬────────┘ └────────────────────┘
                                 │                  │
                                 ▼                  ▼
                    ┌───────────────────────────────────────────────┐
                    │          Scikit-Learn ML Engine               │
                    │ - TF-IDF Vectorizer (Uni/Bi-grams)            │
                    │ - Priority Classifier (Joblib artifact)       │
                    │ - K-Means Semantic Clusters                   │
                    └───────────────────────┬───────────────────────┘
                                            │
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │             MySQL 8.0+ Database               │
                    │ (users, gmail_accounts, emails, predictions)  │
                    │        *Graceful In-Memory Fallback*          │
                    └───────────────────────────────────────────────┘
```

---

## Repository Structure

```
Kynora/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entrypoint & CORS middleware
│   │   ├── models.py                # Pydantic data contracts (Email, InboxStats, KynoraBrief, etc.)
│   │   ├── database.py              # SQLAlchemy engine, session maker, & MySQL status verification
│   │   ├── db_models.py             # Normalized SQLAlchemy ORM models (users, gmail_accounts, emails...)
│   │   ├── init_db.py               # Database initialization and DDL execution script
│   │   ├── data/
│   │   │   └── sample_emails.py     # 13 curated demo emails with full analysis annotations
│   │   ├── ml/
│   │   │   ├── preprocessor.py      # Text normalization and Scikit-learn TF-IDF vectorizer
│   │   │   ├── training_data.py     # Domain-specific training dataset (Academic, Tech, Work, Security)
│   │   │   ├── trainer.py           # Training & benchmark script (LR, KNN, RF, Decision Tree, K-Means)
│   │   │   ├── service.py           # Runtime ML prediction engine loading persisted artifacts
│   │   │   └── artifacts/           # Serialized Joblib models, vectorizer, and evaluation JSON report
│   │   ├── services/
│   │   │   ├── auth_service.py      # PBKDF2 password hashing, session tokens, & user management
│   │   │   ├── crypto.py            # Authenticated symmetric token encryption (PBKDF2 + AES/HMAC)
│   │   │   ├── email_service.py     # Tenant-isolated email repository, filtering, stats, & brief
│   │   │   ├── gmail_service.py     # Google OAuth 2.0 manager, MIME parser, & Gmail API fetcher
│   │   │   ├── reply_service.py     # AI Reply Assistant (Professional, Friendly, Formal, Concise)
│   │   │   └── ai_analyzer.py       # Pluggable analyzer interface (ML, Mock, LLM)
│   │   └── routers/
│   │       ├── auth.py              # Routes: /api/auth (register, login, me, google/url, callback...)
│   │       └── emails.py            # Routes: /api/emails (list, detail, read, reply, stats, analytics...)
│   ├── secrets/
│   │   └── google_oauth_client.json # Downloaded Google OAuth Web Client credentials (git-ignored)
│   ├── kynora_schema.sql            # MySQL DDL script for MySQL Workbench
│   ├── test_backend_api.py          # Comprehensive test suite (52 assertions across 20 test areas)
│   ├── requirements.txt             # Python backend dependencies
│   ├── .env                         # Local environment variables (git-ignored)
│   ├── .env.example                 # Environment configuration template
│   └── README.md                    # Backend subsystem documentation
├── frontend/
│   ├── src/
│   │   ├── main.tsx                 # React DOM entrypoint
│   │   ├── App.tsx                  # Main layout, view switching, and state coordinator
│   │   ├── api.ts                   # Type-safe API client with Bearer auth headers
│   │   ├── types.ts                 # TypeScript type definitions matching backend models
│   │   ├── utils.ts                 # Date formatting, relative days, and deadline helpers
│   │   ├── index.css                # Tailwind CSS directives and custom scrollbars
│   │   └── components/
│   │       ├── Sidebar.tsx          # Collapsible navigation sidebar & user account card
│   │       ├── TopNav.tsx           # Header bar with global search, refresh, & notification bell
│   │       ├── DashboardView.tsx    # High-level overview, statistics, and recent email cards
│   │       ├── PriorityInboxView.tsx# Tier-separated priority inbox (Urgent, High, Medium, Low)
│   │       ├── CategoriesView.tsx   # Category browser with message preview
│   │       ├── ActionRequiredView.tsx# Action-required tasks and response queue
│   │       ├── AnalyticsView.tsx    # Volume, read rate, and Scikit-learn model evaluation metrics
│   │       ├── SettingsView.tsx     # Kynora user account, Gmail OAuth, MySQL, & live ML playground
│   │       ├── EmailList.tsx        # Scrollable list of email items with skeleton loading
│   │       ├── EmailRow.tsx         # Single email list item with badges and status indicators
│   │       ├── EmailDetail.tsx      # Email reader, AI Reply Assistant, and ML Analysis panel
│   │       ├── AuthModal.tsx        # Sign In and Account Registration modal
│   │       ├── KynoraBrief.tsx      # Executive briefing card component
│   │       ├── PriorityBadge.tsx    # Standardized color-coded priority badge
│   │       ├── StatsBar.tsx         # Top overview metrics row
│   │       └── Toolbar.tsx          # Filter chips, category dropdown, search, and sort controls
│   ├── package.json                 # Frontend dependencies and scripts
│   ├── tailwind.config.js           # Custom dark navy theme configuration
│   ├── tsconfig.json                # TypeScript configuration
│   ├── vite.config.ts               # Vite bundler configuration
│   └── README.md                    # Frontend subsystem documentation
├── docs/
│   ├── ARCHITECTURE.md              # In-depth system architecture specification
│   ├── FEATURES.md                  # Comprehensive feature inventory (MVP, Current, Roadmap)
│   ├── PROJECT_BLUEPRINT.md         # Product vision, problem statement, and user personas
│   ├── ROADMAP.md                   # Detailed phased implementation roadmap
│   └── TECH_STACK.md                # Finalized technology stack documentation
├── data/
│   └── README.md                    # Data directory notes
├── .gitignore                       # Git exclusion rules (protecting secrets and environments)
└── README.md                        # Project root documentation (this file)
```

---

## Prerequisites

Ensure you have the following installed on your machine:
- **Python:** Version 3.11 or higher (Python 3.11, 3.12, or 3.13).
- **Node.js:** Version 18.0 or higher (with `npm`).
- **MySQL Server (Optional):** MySQL 8.0+ running locally on port 3306 (if MySQL is not running, Kynora operates seamlessly in demo/in-memory mode).
- **Web Browser:** Google Chrome, Edge, Firefox, or Safari.

---

## Installation and Setup

### 1. Backend Setup

Open a terminal and navigate to the project directory:

```bash
cd backend

# Create a virtual environment
python -m venv .venv

# Activate the virtual environment:
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Windows (CMD):
.\.venv\Scripts\activate.bat
# Linux / macOS:
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Create your local environment file
cp .env.example .env
```

Start the FastAPI development server:
```bash
uvicorn app.main:app --reload --port 8000
```
- Interactive API Documentation (Swagger UI): `http://localhost:8000/docs`
- Alternative API Documentation (ReDoc): `http://localhost:8000/redoc`
- Healthcheck endpoint: `http://localhost:8000/`

To run the automated backend test suite (52 tests across 20 test areas):
```bash
python test_backend_api.py
```

### 2. Frontend Setup

Open a second terminal window:

```bash
cd frontend

# Install npm dependencies
npm install

# Start the Vite development server
npm run dev
```
Open your browser at `http://localhost:5173`.

To verify the production build:
```bash
npm run build
```

### 3. Database Setup (MySQL)

Kynora supports MySQL 8.0+ for persistent storage of users, credentials, emails, predictions, and feedback.

1. Ensure your local MySQL server is running on `localhost:3306`.
2. Configure credentials in `backend/.env`:
   ```env
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=your_mysql_password
   MYSQL_DATABASE=kynora_db
   ```
3. Initialize the schema using either method:
   - **Method A (CLI):**
     ```bash
     cd backend
     python -m app.init_db
     ```
   - **Method B (MySQL Workbench):**
     Open `backend/kynora_schema.sql` inside MySQL Workbench and execute the script.

*Note: If MySQL is not running, Kynora reports disconnected status gracefully on the dashboard and automatically maintains data in-memory without crashing.*

---

## Environment Variables Configuration

Copy `backend/.env.example` to `backend/.env` and update values as needed:

```env
# Server Configuration
PORT=8000
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=kynora_db

# Google OAuth 2.0 Credentials
# Point to your downloaded Google Client JSON or set environment variables:
GOOGLE_CLIENT_SECRETS_FILE=secrets/google_oauth_client.json
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

# Token Encryption & Session Secret (256-bit symmetric key)
TOKEN_ENCRYPTION_KEY=kynora-dev-encryption-key-change-in-production-32b
AUTH_SECRET_KEY=kynora-dev-session-secret-change-in-production-32b

# Optional LLM API Key (Fallback to local Scikit-Learn if not set)
ANTHROPIC_API_KEY=
USE_LLM=false
```

---

## Gmail OAuth Configuration

Kynora connects to Gmail using a Google Cloud Console OAuth 2.0 Web Client.

### 1. Credentials File Location
Place your downloaded client credentials JSON file at:
```
backend/secrets/google_oauth_client.json
```
*(This file is excluded from Git via `.gitignore` to prevent credential exposure).*

### 2. Google Cloud Console Configuration
In the [Google Cloud Console](https://console.cloud.google.com/):
1. Select project **kynora-514711** (or your own project).
2. Go to **APIs & Services** > **Credentials**.
3. Under **OAuth 2.0 Client IDs**, select your Web Client.
4. Add the following under **Authorized redirect URIs**:
   ```text
   http://localhost:8000/api/auth/google/callback
   ```
5. Add the following under **Authorized JavaScript origins**:
   ```text
   http://localhost:5173
   ```
6. Click **Save**.

### 3. Testing Mode & Test Users
While the Google Cloud project is in **Testing** publishing status:
1. Navigate to **APIs & Services** > **OAuth consent screen**.
2. Under **Test users**, click **+ ADD USERS**.
3. Add the Gmail address you plan to use for testing.
4. *Important: Google strictly blocks any Gmail account not listed under Test Users while the app is unverified.*

---

## How to Use Kynora

1. **Guest Exploration:** On initial launch, Kynora loads in demo mode with 13 realistic academic, internship, and technical emails.
2. **User Registration:** Click **Sign In / Register** in the top navigation or sidebar to create a personal Kynora account.
3. **Connecting Gmail:**
   - Navigate to **Settings & Configuration** (`/settings`).
   - In the **Gmail Integration** card, click **Connect Gmail**.
   - Authorize your Google account with the requested read-only scope.
   - Upon completion, you are redirected back to Kynora with a confirmation banner.
4. **Synchronizing Emails:** Click **Sync Emails Now**. Kynora fetches live messages, executes Scikit-learn priority prediction, extracts deadlines, and populates your inbox.
5. **Reviewing Intelligent Analysis:** Open any email to inspect:
   - Priority badge (Urgent, High, Medium, Low).
   - Content summary.
   - Action-required status and recommended next steps.
   - Detected deadline countdown.
   - Unsupervised topic cluster.
6. **Generating AI Replies:**
   - Click **Generate Reply** inside any email.
   - Select your preferred tone: **Professional**, **Friendly**, **Formal**, or **Concise**.
   - (Optional) Enter custom guidance (e.g., *"Mention I am available on Thursday"*).
   - Click **Draft Reply** / **Regenerate**.
   - Edit the text directly in the textarea and click **Copy Reply**.
7. **Disconnecting Gmail:** Click **Disconnect Account** in Settings to revoke tokens and purge credentials.

---

## API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Root API health status |
| `POST` | `/api/auth/register` | Register a new Kynora user account |
| `POST` | `/api/auth/login` | Authenticate user and receive signed session token |
| `GET` | `/api/auth/me` | Retrieve profile of currently authenticated user |
| `POST` | `/api/auth/logout` | Client session logout |
| `GET` | `/api/auth/google/url` | Generate Google OAuth authorization URL bound to user |
| `GET` | `/api/auth/google/callback`| Handle Google OAuth redirect callback and store tokens |
| `GET` | `/api/auth/google/status` | Get Gmail OAuth connection status for active user |
| `POST` | `/api/auth/google/sync` | Trigger live Gmail sync through Scikit-learn pipeline |
| `POST` | `/api/auth/google/disconnect` | Disconnect Gmail account and revoke credentials |
| `GET` | `/api/emails` | List, filter, search, and sort emails for active user |
| `GET` | `/api/emails/{id}` | Retrieve single email with ML analysis (tenant-isolated) |
| `PATCH`| `/api/emails/{id}/read` | Mark email as read |
| `PATCH`| `/api/emails/{id}/unread` | Mark email as unread |
| `POST` | `/api/emails/{id}/generate-reply` | Generate contextual AI reply (4 tones) |
| `POST` | `/api/emails/reset` | Reset inbox to default state |
| `GET` | `/api/stats` | Summary inbox count metrics |
| `GET` | `/api/brief` | Headline executive brief |
| `GET` | `/api/deadlines` | List detected upcoming deadlines |
| `GET` | `/api/actions` | List action-required emails |
| `GET` | `/api/analytics` | Aggregate analytics (volume, read rate, distributions) |
| `GET` | `/api/ml/status` | Machine learning engine status & evaluation metrics |
| `POST` | `/api/ml/predict` | Direct ML inference endpoint for custom email input |
| `GET` | `/api/db/status` | MySQL database connection status |
| `GET` | `/api/gmail/status` | Gmail OAuth integration status |

---

## Machine Learning Engine

Kynora's ML pipeline is implemented strictly using **Scikit-learn**, **Pandas**, and **NumPy** without heavy linguistic libraries (no NLTK or spaCy):

1. **Preprocessing (`preprocessor.py`):**
   - Text normalization: Lowercasing, URL removal, alphanumeric tokenization, and domain-specific stopword removal.
   - Vectorization: `TfidfVectorizer(ngram_range=(1, 2), max_features=1500)`.
2. **Model Training & Benchmarking (`trainer.py`):**
   - Compares 4 supervised classifiers using K-Fold cross-validation:
     - **Logistic Regression** (Balanced class weighting)
     - **Random Forest** (100 estimators)
     - **K-Nearest Neighbors (KNN)**
     - **Decision Tree Classifier**
   - Selects the best performing model based on F1-score and High-Priority Recall.
3. **Unsupervised Semantic Clustering:**
   - **K-Means clustering** ($k=4$) groups emails into conceptual themes (e.g., *Academic Deadlines*, *Career & Placements*, *Technical Updates*, *System Security*).
4. **Artifact Persistence:**
   - Models and vectorizers are persisted to `backend/app/ml/artifacts/` using **Joblib** and loaded into memory on FastAPI startup.

To retrain the models:
```bash
cd backend
python -m app.ml.trainer
```

---

## Security and Privacy

- **Read-Only Scope:** Kynora requests only `https://www.googleapis.com/auth/gmail.readonly`. The application cannot send emails, create drafts, delete messages, or modify mailbox settings.
- **Token Encryption at Rest:** OAuth refresh tokens and access tokens are encrypted symmetrically using PBKDF2-derived keys and AES/HMAC verification before storage in MySQL.
- **Tenant Isolation:** Every email, token, and prediction is bound to a specific Kynora `user_id`. Attempting to access another user's email triggers an HTTP 403 Forbidden response.
- **Password Security:** User passwords are stored using salted PBKDF2-HMAC-SHA256 (100,000 iterations), verified in constant time to prevent timing attacks.
- **CSRF Protection:** OAuth authorization URLs generate unique cryptographic state tokens valid for 15 minutes that are bound to the initiating user.
- **Untrusted Input Handling:** Email contents are treated as untrusted data; prompt injection delimiters are filtered before AI reply processing.
- **Credential Hygiene:** Credentials and environment files (`.env`, `google_oauth_client.json`) are strictly excluded via `.gitignore`.

---

## Current Implementation Status

| Capability | Status | Details |
| :--- | :---: | :--- |
| **Dark Navy UI Design System** | Completed | Clean SaaS dashboard with Tailwind CSS. |
| **Scikit-learn ML Engine** | Completed | Trained priority classifier, TF-IDF vectorizer, and K-Means clustering. |
| **MySQL Relational Schema** | Completed | 5 normalized tables with SQLAlchemy ORM and Workbench script. |
| **Multi-User Kynora Auth** | Completed | Registration, login, PBKDF2 password hashing, and session tokens. |
| **Tenant Isolation** | Completed | Backend-enforced authorization across all email and analytics endpoints. |
| **Google OAuth 2.0 Setup** | Completed | CSRF validation, token exchange, symmetric token encryption at rest. |
| **Gmail API Synchronization** | Completed | Real email retrieval, MIME parsing, pagination, and ML pipeline integration. |
| **AI Reply Generator** | Completed | 4 tones (Professional, Friendly, Formal, Concise), custom prompt input, copy to clipboard. |
| **Automated Test Suite** | Completed | 52 automated assertions across 20 test areas passing with zero failures. |

---

## Project Roadmap

- [x] **Phase 1:** Core prototype foundation, dark-navy design system, and mock analyzer.
- [x] **Phase 2:** Scikit-learn ML priority classification, TF-IDF vectorizer, and K-Means clustering.
- [x] **Phase 3:** MySQL relational schema, SQLAlchemy integration, and DDL schema script.
- [x] **Phase 4:** Multi-user authentication, PBKDF2 password security, and tenant isolation.
- [x] **Phase 5:** Google OAuth 2.0 Gmail read-only integration, token encryption, and MIME parser.
- [x] **Phase 6:** AI Reply Assistant with 4 tones and in-app clipboard management.
- [ ] **Phase 7 (Planned):** User feedback active learning loop to continuously retrain the ML model from user corrections.
- [ ] **Phase 8 (Planned):** Advanced natural language date parsing for implicit deadline detection.
- [ ] **Phase 9 (Planned):** Production deployment (Docker, reverse proxy, and Google CASA security assessment for public release).

---

## Troubleshooting

### 1. MySQL Connection Warning
- **Symptom:** Terminal displays `MySQL service not running on port 3306. System operating in local demo mode.`
- **Resolution:** This is intentional. Kynora gracefully falls back to its in-memory repository when MySQL is offline. To use MySQL, start your MySQL service and verify credentials in `backend/.env`.

### 2. Google OAuth Redirect URI Mismatch
- **Symptom:** Google displays `Error 400: redirect_uri_mismatch`.
- **Resolution:** Ensure `http://localhost:8000/api/auth/google/callback` is added under **Authorized redirect URIs** in your Google Cloud Console Web Client settings.

### 3. Google OAuth "Access Blocked" (Testing Mode)
- **Symptom:** Google displays `Access blocked: Kynora has not completed the Google verification process`.
- **Resolution:** In Google Cloud Console under **OAuth consent screen** > **Test users**, add the email address you are attempting to sign in with.

### 4. Port 8000 or 5173 Already in Use
- **Resolution:** Check running processes or specify custom ports:
  ```bash
  # Backend
  uvicorn app.main:app --port 8001
  # Frontend
  npm run dev -- --port 5174
  ```

---

## Contribution Guidelines

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/inbox-enhancement`).
3. Commit your changes (`git commit -m 'Add inbox enhancement'`).
4. Ensure all backend tests pass:
   ```bash
   cd backend && python test_backend_api.py
   ```
5. Ensure the frontend builds cleanly:
   ```bash
   cd frontend && npm run build
   ```
6. Push to your branch (`git push origin feature/inbox-enhancement`).
7. Open a Pull Request.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
