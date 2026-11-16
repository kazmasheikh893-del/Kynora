"""
Database session management and connection setup for MySQL using SQLAlchemy.

Supports MySQL connectivity via mysql-connector-python or pymysql.
Provides graceful status verification so that if a local MySQL instance
is not currently running or configured, the app reports disconnected status
cleanly without crashing.
"""

from __future__ import annotations

import os
import socket
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "kynora_db")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"mysql+mysqlconnector://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}",
)

engine = None
SessionLocal = None
_db_connected = False
_db_error = None

try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        connect_args={"connect_timeout": 1},
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as exc:
    _db_error = str(exc)


def check_db_connection() -> dict:
    """Checks whether the MySQL database is reachable with fast non-blocking probe."""
    global _db_connected, _db_error

    # Fast IPv4 socket probe to avoid Windows localhost IPv6 resolution delays
    try:
        host = "127.0.0.1" if MYSQL_HOST in ("localhost", "127.0.0.1") else MYSQL_HOST
        port_num = int(MYSQL_PORT)
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.2)
        code = sock.connect_ex((host, port_num))
        sock.close()
        if code != 0:
            raise ConnectionRefusedError(f"Port {port_num} closed")
    except Exception as sock_err:
        _db_connected = False
        _db_error = f"MySQL service not running: {sock_err}"
        return {
            "status": "disconnected",
            "host": MYSQL_HOST,
            "port": MYSQL_PORT,
            "database": MYSQL_DATABASE,
            "dialect": "MySQL",
            "driver": "mysql-connector-python",
            "error": "MySQL service not running on port 3306. System operating in local demo mode.",
        }

    if engine is None:
        return {
            "status": "disconnected",
            "host": MYSQL_HOST,
            "port": MYSQL_PORT,
            "database": MYSQL_DATABASE,
            "dialect": "MySQL",
            "error": _db_error or "Engine not initialized",
        }
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        _db_connected = True
        _db_error = None
        return {
            "status": "connected",
            "host": MYSQL_HOST,
            "port": MYSQL_PORT,
            "database": MYSQL_DATABASE,
            "dialect": "MySQL",
            "driver": "mysql-connector-python",
            "error": None,
        }
    except Exception as exc:
        _db_connected = False
        _db_error = str(exc)
        return {
            "status": "disconnected",
            "host": MYSQL_HOST,
            "port": MYSQL_PORT,
            "database": MYSQL_DATABASE,
            "dialect": "MySQL",
            "driver": "mysql-connector-python",
            "error": f"MySQL server reachable but database error: {exc}",
        }


def get_db() -> Generator:
    """FastAPI dependency for obtaining a database session."""
    if SessionLocal is None:
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
