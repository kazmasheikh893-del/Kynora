# Kynora – Development Roadmap

> **AI-Powered Intelligent Email Management and Prioritization System**

---

## Phase 1: Prototype Foundation & Design System (Completed)
- [x] Initial React + TypeScript + Tailwind CSS application structure
- [x] FastAPI backend with structured Pydantic models
- [x] Curated 13-email sample inbox with realistic priority & category annotations
- [x] Premium dark navy design system implementation
- [x] Dashboard, Inbox, Priority Inbox, Categories, Action Required, Analytics, and Settings

## Phase 2: Machine Learning Pipeline & Model Evaluation (Current)
- [x] Python-based text preprocessing (cleaning, tokenization, lowercase normalization)
- [x] Scikit-learn `TfidfVectorizer` feature extraction
- [x] Supervised model training and comparison:
  - Logistic Regression
  - K-Nearest Neighbors (KNN)
  - Random Forest Classifier
  - Decision Tree Classifier
- [x] K-Fold Cross-Validation, Accuracy, Precision, Recall (especially for High Priority), F1-Score, and Confusion Matrix
- [x] Unsupervised learning with K-Means clustering for grouping semantically similar emails
- [x] Model persistence with `joblib` for production inference
- [x] ML status and prediction API endpoints in FastAPI

## Phase 3: Persistent Database Integration (MySQL + SQLAlchemy)
- [x] Normalized MySQL relational database schema:
  - `users`
  - `gmail_accounts`
  - `emails`
  - `email_predictions`
  - `user_feedback`
- [x] SQLAlchemy models and declarative base
- [x] Database connection manager with automatic schema creation and offline fallback
- [x] DDL script (`kynora_schema.sql`) for MySQL Workbench administration

## Phase 4: Gmail API & Google OAuth 2.0 Integration (Next Phase)
- [ ] Google Cloud Console project setup and OAuth 2.0 Client credentials
- [ ] Read-only scope: `https://www.googleapis.com/auth/gmail.readonly`
- [ ] Backend OAuth authorization flow and secure token management
- [ ] Ingest initial batch of real user emails (~20 emails)
- [ ] Extract sender, subject, body, timestamp, and run through the ML pipeline
- [ ] Disconnect account and user data deletion support

## Phase 5: Production Deployment & Continuous Improvement
- [ ] Active learning loop using `user_feedback` to retrain priority models
- [ ] Enhanced deadline extraction with contextual date parsing
- [ ] User customizable priority rules and custom category definitions
