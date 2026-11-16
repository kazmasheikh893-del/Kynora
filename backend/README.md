# Kynora Backend Service

The **Kynora Backend** is a high-performance RESTful API built on **FastAPI** (Python 3.11+) designed for multi-user email ingestion, secure Google OAuth synchronization, offline machine learning classification, and contextual email reply drafting.

---

## 1. Architecture & Design Principles

The backend is organized around a clean, modular service-oriented architecture:

```
backend/
├── app/
│   ├── data/
│   │   ├── __init__.py
│   │   └── sample_emails.py          # 8 seeded emails for unauthenticated exploration
│   ├── ml/
│   │   ├── artifacts/                # Serialized models and training evaluation
│   │   │   ├── best_priority_model.joblib
│   │   │   ├── kmeans_model.joblib
│   │   │   ├── tfidf_vectorizer.joblib
│   │   │   └── ml_evaluation_report.json
│   │   ├── preprocessor.py           # Text cleaner & custom feature extractor
│   │   ├── trainer.py                # Scikit-learn model benchmark & training harness
│   │   ├── training_data.py          # Labeled email corpus (Urgent, High, Medium, Low)
│   │   └── service.py                # Runtime inference singleton
│   ├── routers/
│   │   ├── auth.py                   # User registration, login, profile, Gmail OAuth
│   │   └── emails.py                 # Email CRUD, search, filter, stats, reply generator
│   ├── services/
│   │   ├── ai_analyzer.py            # Hybrid ML + rule-based email inference pipeline
│   │   ├── auth_service.py           # Password hashing & HMAC session token management
│   │   ├── crypto.py                 # Authenticated symmetric token encryption at rest
│   │   ├── email_service.py          # Multi-tenant email repository (MySQL + memory)
│   │   ├── gmail_service.py          # Google OAuth 2.0 & Gmail API synchronization
│   │   └── reply_service.py          # Prompt-safe multi-tone AI reply generation
│   ├── database.py                   # SQLAlchemy engine with non-blocking MySQL probe
│   ├── db_models.py                  # SQLAlchemy declarative ORM models
│   ├── init_db.py                    # Schema bootstrapper & table creation script
│   ├── main.py                       # FastAPI application entrypoint & middleware
│   └── models.py                     # Pydantic v2 schemas and validation contracts
├── secrets/                          # Local directory for Google OAuth client JSON (gitignored)
├── .env.example                      # Documented environment configuration template
├── kynora_schema.sql                 # Production DDL schema for MySQL Workbench / CLI
├── requirements.txt                  # Locked Python dependencies
└── test_backend_api.py               # 52-suite comprehensive integration test harness
```

### Key Design Pillars:
1. **Multi-Tenant Isolation**: Every database query is strictly scoped by `user_id`. One user's emails, stats, or OAuth credentials are never accessible to another user.
2. **Graceful Degradation**: If a local MySQL server is unavailable, `database.py` performs a non-blocking 0.2-second probe and falls back to thread-safe in-memory storage so frontend evaluation and testing continue smoothly.
3. **Defense in Depth**: OAuth refresh tokens are encrypted at rest using authenticated symmetric encryption (`CryptoService`). Password hashes use 100,000-iteration PBKDF2-HMAC-SHA256 with unique 16-byte random salts.
4. **No External Cloud AI Dependencies**: All priority scoring, clustering, action detection, and smart reply generation run locally using deterministic rules and Scikit-learn models (zero API costs, zero data egress to 3rd-party LLM providers).

---

## 2. Technology Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) `0.111.0+`
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/) `0.30.0+`
- **Data Validation & Schemas**: [Pydantic v2](https://docs.pydantic.dev/)
- **Database Engine**: [MySQL 8.0+](https://www.mysql.com/) with [SQLAlchemy 2.0+](https://www.sqlalchemy.org/) and `mysql-connector-python`
- **Machine Learning**: [Scikit-learn](https://scikit-learn.org/) `1.4.0+`, [Pandas](https://pandas.pydata.org/), [NumPy](https://numpy.org/), [Joblib](https://joblib.readthedocs.io/)
- **Google Integration**: `google-api-python-client`, `google-auth-oauthlib`, `google-auth-httplib2`

---

## 3. Database Architecture

The backend supports MySQL 8.0+ with utf8mb4 encoding. The schema contains 4 core tables:

1. `users`: Stores registered Kynora accounts with unique emails, PBKDF2 password hashes, and salts.
2. `oauth_accounts`: Tracks linked Google accounts with encrypted refresh/access tokens, granted scopes, and token expiry.
3. `emails`: Stores fetched Gmail messages and seeded emails, indexed by `(user_id, received_at)`, `(user_id, is_read)`, and `gmail_message_id`.
4. `email_feedback`: Records user corrections to predicted priority and category for future model fine-tuning.

To apply the schema manually:
```bash
mysql -u root -p < kynora_schema.sql
```
Or use the Python bootstrapper:
```bash
python -m app.init_db
```

---

## 4. Machine Learning Pipeline

The backend includes a self-contained ML pipeline:

1. **Training Data (`training_data.py`)**: Labeled corpus spanning diverse work scenarios across 4 priority levels (`urgent`, `high`, `medium`, `low`).
2. **Feature Extraction (`preprocessor.py`)**:
   - Cleaned text vectorized via Scikit-learn `TfidfVectorizer` (sublinear TF scaling, max 1,000 features, English stop words removed).
   - Domain metadata features: urgency keywords count, action verb count, deadline indicators, sender seniority signal, exclamation mark count.
3. **Model Selection (`trainer.py`)**:
   - Benchmarks 4 supervised classifiers: **Logistic Regression**, **Random Forest**, **K-Nearest Neighbors (KNN)**, and **Decision Tree**.
   - Evaluates precision, recall, and F1-score across 5-fold cross-validation.
   - Automatically serializes the best performing model to `artifacts/best_priority_model.joblib`.
   - Trains an unsupervised **K-Means ($k=4$)** model (`kmeans_model.joblib`) for topic discovery.
4. **Runtime Inference (`service.py` & `ai_analyzer.py`)**:
   - Loads models into memory at server boot.
   - Computes priority score (0–100), maps priority label, extracts deadlines, predicts category, detects action requirements, and generates concise one-sentence summaries.

To retrain the models:
```bash
cd backend
python -m app.ml.trainer
```

---

## 5. API Endpoints

### Authentication & Account (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new Kynora account | No |
| `POST` | `/api/auth/login` | Authenticate and obtain HMAC session token | No |
| `POST` | `/api/auth/logout` | Invalidate current session token | Yes (Bearer) |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & Gmail status | Yes (Bearer) |
| `GET` | `/api/auth/google/url` | Generate Google OAuth authorization URL | Yes (Bearer) |
| `GET` | `/api/auth/google/callback` | OAuth redirect callback (code & state verification) | No (State validated) |
| `DELETE` | `/api/auth/google/disconnect` | Disconnect linked Gmail account & revoke tokens | Yes (Bearer) |

### Email Ingestion & Analysis (`/api/emails`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/emails` | List emails with optional search, priority, & category | Optional (User scoped) |
| `GET` | `/api/emails/stats` | Aggregate inbox metrics (total, important, deadlines) | Optional (User scoped) |
| `GET` | `/api/emails/{email_id}` | Fetch detailed email with full ML analysis | Optional (User scoped) |
| `PATCH` | `/api/emails/{email_id}/read` | Toggle read/unread status | Optional (User scoped) |
| `POST` | `/api/emails/{email_id}/feedback` | Submit user correction on predicted priority/category | Optional (User scoped) |
| `POST` | `/api/emails/{email_id}/generate-reply` | Generate local contextual reply (4 tones) | Optional (User scoped) |
| `POST` | `/api/emails/sync` | Trigger incremental sync from connected Gmail | Yes (Bearer) |

---

## 6. Setup & Installation

### Prerequisites
- Python 3.11 or higher
- MySQL 8.0+ (optional, fallback memory mode available)
- Virtual environment (`venv`)

### 1. Create Virtual Environment
```bash
cd backend
python -m venv .venv

# Windows PowerShell:
.venv\Scripts\Activate.ps1

# Linux / macOS:
source .venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure key security variables are defined:
```ini
KYNORA_SECRET_KEY=your_secure_random_hex_key_here
KYNORA_TOKEN_KEY=your_secure_random_hex_key_here

# MySQL Configuration
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=kynora

# Google OAuth (Place credentials in backend/secrets/)
GOOGLE_OAUTH_CLIENT_FILE=secrets/google_oauth_client.json
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
```

### 4. Start the Backend Server
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Base: `http://127.0.0.1:8000`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
- ReDoc Docs: `http://127.0.0.1:8000/redoc`

---

## 7. Automated Testing

The backend includes an exhaustive integration test suite (`test_backend_api.py`) verifying 52 distinct scenarios:
- Authentication, registration, login, logout, and token tampering rejection.
- Password hashing and salt uniqueness.
- Multi-tenant email isolation and user scoping.
- Symmetric token encryption and MAC verification.
- ML pipeline inference, feature extraction, and model loading.
- AI Reply Assistant tones and prompt injection defenses.
- Email filtering, pagination, search, and inbox statistics.

To execute the test suite:
```bash
cd backend
python test_backend_api.py
```
All 52 tests should pass with code `0`.
