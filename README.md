# Kynora – Intelligent Email Management and Prioritization System

> **AI-Powered Inbox Intelligence, ML Prioritization, and Productivity Platform**

Kynora helps users conquer crowded email inboxes by automatically predicting email priority, extracting actionable requests and deadlines, categorizing correspondence, and clustering semantically related topics.

---

## Technology Stack

- **Frontend:** React (v18+), TypeScript, Tailwind CSS, Vite
- **Backend:** Python (v3.11+), FastAPI, Uvicorn, Pydantic (v2)
- **Database:** MySQL 8.0+, SQLAlchemy ORM, `mysql-connector-python`
- **Machine Learning:** Scikit-learn, Pandas, NumPy, Joblib
- **Text Processing:** Python text preprocessing, Scikit-learn `TfidfVectorizer` (no NLTK/spaCy dependencies)
- **Email Integration:** Gmail REST API & Google OAuth 2.0 (`https://www.googleapis.com/auth/gmail.readonly`)

---

## Project Structure

```
Kynora/
├── backend/
│   ├── app/
│   │   ├── main.py              FastAPI application entrypoint & CORS
│   │   ├── models.py            Pydantic contracts (Email, EmailAnalysis, InboxStats, Brief)
│   │   ├── database.py          SQLAlchemy session management & MySQL connection verification
│   │   ├── db_models.py         Normalized SQLAlchemy models (users, gmail_accounts, emails, predictions, feedback)
│   │   ├── init_db.py           MySQL database schema creation script
│   │   ├── data/
│   │   │   └── sample_emails.py 13 curated sample emails with annotations
│   │   ├── ml/
│   │   │   ├── preprocessor.py  Text cleaner & TF-IDF vectorizer setup
│   │   │   ├── training_data.py Curated multi-domain labeled training dataset
│   │   │   ├── trainer.py       Model trainer & evaluator (LR, KNN, RF, Decision Tree, K-Means)
│   │   │   ├── service.py       Production Scikit-learn inference service
│   │   │   └── artifacts/       Joblib persisted models, vectorizer, & evaluation report
│   │   ├── services/
│   │   │   ├── ai_analyzer.py   AIAnalyzer interface (MLPriorityAnalyzer, Mock, LLM)
│   │   │   └── email_service.py Inbox management, sorting, filtering, stats, & brief
│   │   └── routers/
│   │       └── emails.py        REST API endpoints
│   ├── kynora_schema.sql        MySQL DDL script for MySQL Workbench
│   ├── test_backend_api.py      Comprehensive backend test suite (21 assertions)
│   ├── requirements.txt         Python dependencies
│   └── .env.example             Environment configuration template
├── frontend/
│   ├── src/
│   │   ├── App.tsx              Root component, state management, & view router
│   │   ├── api.ts               Type-safe fetch client for backend endpoints
│   │   ├── types.ts             TypeScript interfaces mirroring backend schema
│   │   ├── utils.ts             Date formatting, relative day, and deadline helpers
│   │   └── components/
│   │       ├── Sidebar.tsx      Responsive navigation sidebar with status pills
│   │       ├── TopNav.tsx       Top header with global search and notification badges
│   │       ├── DashboardView.tsx Modern dashboard with overview cards & widgets
│   │       ├── PriorityInboxView.tsx Priority tier segmented inbox (High, Medium, Low)
│   │       ├── CategoriesView.tsx Topical category browser & message reader
│   │       ├── ActionRequiredView.tsx Dedicated actionable tasks & deadline resolution
│   │       ├── AnalyticsView.tsx Inbox volume, read rates, & ML benchmark metrics
│   │       ├── SettingsView.tsx Profile, Gmail OAuth, MySQL, & live ML tester
│   │       ├── EmailList.tsx    Scrollable email row list with loading skeleton
│   │       ├── EmailRow.tsx     Single email row item with priority badge
│   │       ├── EmailDetail.tsx  Email reader & intelligent analysis panel
│   │       ├── KynoraBrief.tsx  Executive summary briefing panel
│   │       ├── PriorityBadge.tsx Priority indicator badge component
│   │       ├── StatsBar.tsx     Overview statistics card row
│   │       └── Toolbar.tsx      Search, priority chips, category select, & sorting
│   ├── package.json
│   ├── tailwind.config.js       Custom modern dark navy design system
│   └── vite.config.ts
├── docs/
│   ├── ARCHITECTURE.md          System architecture specification
│   ├── FEATURES.md              Product feature inventory
│   ├── PROJECT_BLUEPRINT.md     Core project vision and domain blueprint
│   ├── ROADMAP.md               Detailed phased roadmap
│   └── TECH_STACK.md            Finalized technology stack documentation
└── README.md                    You are here
```

---

## Quick Start & Running Kynora

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Backend Setup & Run

In your terminal:
```bash
cd backend
python -m venv .venv
# Activate venv:
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# Linux/macOS:        source .venv/bin/activate

pip install -r requirements.txt

# Run the FastAPI server:
uvicorn app.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Root Healthcheck: `http://localhost:8000/`

To run the automated backend test suite:
```bash
cd backend
python test_backend_api.py
```

### 2. Frontend Setup & Run

In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL in your browser (typically `http://localhost:5173`).

---

## Machine Learning Architecture

Kynora's priority classification pipeline is built with **Scikit-learn**:
1. **Preprocessing:** Text normalization, stopword filtering, punctuation removal, and uni/bi-gram TF-IDF vectorization (`TfidfVectorizer`).
2. **Supervised Priority Classification:** Compares Logistic Regression, K-Nearest Neighbors (KNN), Random Forest, and Decision Tree classifiers using K-Fold cross-validation, measuring Test Accuracy, Precision, Recall, and F1-score (with high-priority recall highlighted).
3. **Unsupervised Clustering:** Groups similar emails into semantic clusters using **K-Means**, identifying top cluster keywords for topic interpretation.
4. **Model Deployment:** Selected model and vectorizer are serialized with **Joblib** to `backend/app/ml/artifacts/` and loaded dynamically by FastAPI for production inference.

---

## Database Architecture (MySQL)

Kynora includes a normalized MySQL relational schema:
- `users`: User account information.
- `gmail_accounts`: Google OAuth credentials and synchronization tokens.
- `emails`: Stored email messages, metadata, headers, and bodies.
- `email_predictions`: Scikit-learn priority, category, cluster, and confidence scores.
- `user_feedback`: User corrections used for continuous learning and retraining.

For MySQL Workbench administration, run `backend/kynora_schema.sql` to initialize `kynora_db`. If MySQL is not running locally, Kynora gracefully defaults to its built-in in-memory demo dataset without crashing.
