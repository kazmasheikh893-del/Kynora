"""
Database schema generation and seeding utility.

Connects to MySQL if available and creates all normalized tables defined in db_models.py.
Can also seed sample emails into MySQL if running in connected mode.
"""

from __future__ import annotations

import sys
from .database import Base, check_db_connection, engine
from .db_models import EmailPredictionRecord, EmailRecord, GmailAccount, User, UserFeedbackRecord


def init_database() -> bool:
    print("[Kynora DB] Checking MySQL connection status...")
    status = check_db_connection()
    print(f"[Kynora DB] Status: {status['status']}")

    if status["status"] != "connected" or engine is None:
        print("[Kynora DB] MySQL server is not connected.")
        print(f"[Kynora DB] Details: {status.get('error')}")
        print("[Kynora DB] To initialize MySQL:")
        print("  1. Ensure MySQL is running on localhost:3306")
        print("  2. Create database 'kynora_db' or run backend/kynora_schema.sql in MySQL Workbench")
        print("  3. Set MYSQL_USER and MYSQL_PASSWORD in backend/.env")
        return False

    try:
        print("[Kynora DB] Creating all tables defined in SQLAlchemy models...")
        Base.metadata.create_all(bind=engine)
        print("[Kynora DB] All tables created successfully!")
        return True
    except Exception as exc:
        print(f"[Kynora DB] Error creating tables: {exc}")
        return False


if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
