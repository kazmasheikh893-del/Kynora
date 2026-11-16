# Kynora Data Directory (`data/`)

This directory serves as the root storage location for offline datasets, mailbox exports, and evaluation benchmarks used across the Kynora platform.

---

## Data Architecture & Storage Locations

In the current Kynora implementation, data is managed across three distinct layers:

### 1. Production User & Email Storage (MySQL Database)
- Real emails ingested via Google Gmail OAuth synchronization are **not** stored as flat files in this folder.
- Instead, synced messages, user accounts, and OAuth tokens are persisted directly in **MySQL** across four primary tables:
  - `users`: User profiles, PBKDF2 password hashes, and salts.
  - `oauth_accounts`: Linked Google credentials with encrypted refresh/access tokens.
  - `emails`: Ingested Gmail messages with full headers, bodies, thread IDs, read status, and user associations.
  - `email_feedback`: User corrections on predicted priorities and categories for continuous learning.

### 2. Sample In-Memory Inbox (`backend/app/data/sample_emails.py`)
- For unauthenticated users or offline demonstrations, Kynora bundles a curated set of 8 structured emails in `backend/app/data/sample_emails.py`.
- This ensures guest visitors can explore the dashboard, filter by priority, test the AI Reply Assistant, and inspect ML analytics without connecting a live Gmail account.

### 3. Machine Learning Training Corpus (`backend/app/ml/training_data.py`)
- The labeled dataset used to train the Scikit-learn classifiers (Urgent, High, Medium, Low) resides in `backend/app/ml/training_data.py`.
- Serialized ML model artifacts (TfidfVectorizer, best classifier, K-Means clustering) are saved in `backend/app/ml/artifacts/`.

---

## Usage of this Directory

This folder is designated for:
- Exported mailbox dumps (e.g., `.mbox`, `.json`, `.csv`) for offline batch processing.
- Benchmarking datasets for evaluating natural language processing or classifier accuracy.
- Backup snapshots of database tables during migration or offline research.
