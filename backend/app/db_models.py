"""
SQLAlchemy ORM models for Kynora's MySQL Database.

Normalized entities:
1. users             - User accounts
2. gmail_accounts    - Google OAuth connected accounts & credentials
3. emails            - Synced emails with headers and content
4. email_predictions - Machine learning predictions, priorities, categories, clusters
5. user_feedback     - Corrections and tuning signals from users
"""

from __future__ import annotations

from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    gmail_accounts = relationship("GmailAccount", back_populates="user", cascade="all, delete-orphan")
    emails = relationship("EmailRecord", back_populates="user", cascade="all, delete-orphan")
    feedbacks = relationship("UserFeedbackRecord", back_populates="user")


class GmailAccount(Base):
    __tablename__ = "gmail_accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    google_email = Column(String(255), nullable=False)
    google_sub_id = Column(String(255), unique=True, nullable=False, index=True)
    refresh_token = Column(Text, nullable=True)  # Store encrypted in production
    access_token = Column(Text, nullable=True)
    token_expiry = Column(DateTime, nullable=True)
    sync_status = Column(String(50), default="idle")  # 'idle', 'syncing', 'error'
    last_synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="gmail_accounts")


class EmailRecord(Base):
    __tablename__ = "emails"

    id = Column(String(64), primary_key=True)  # UUID or internal ID
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    gmail_message_id = Column(String(128), unique=True, nullable=True, index=True)
    sender_name = Column(String(255), nullable=False)
    sender_email = Column(String(255), nullable=False, index=True)
    recipient_email = Column(String(255), nullable=True)
    subject = Column(String(500), nullable=False)
    preview = Column(String(1000), nullable=False)
    body = Column(Text, nullable=False)
    received_at = Column(DateTime, nullable=False, index=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="emails")
    prediction = relationship("EmailPredictionRecord", back_populates="email", uselist=False, cascade="all, delete-orphan")
    feedbacks = relationship("UserFeedbackRecord", back_populates="email")

    __table_args__ = (
        Index("idx_emails_user_received", "user_id", "received_at"),
    )


class EmailPredictionRecord(Base):
    __tablename__ = "email_predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email_id = Column(String(64), ForeignKey("emails.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    predicted_priority = Column(String(32), nullable=False, index=True)  # Urgent, High, Medium, Low
    predicted_category = Column(String(64), nullable=False, index=True)  # College, Internship, Placement, etc.
    summary = Column(Text, nullable=True)
    action_required = Column(Boolean, default=False, nullable=False)
    recommended_action = Column(String(500), nullable=True)
    detected_deadline = Column(String(64), nullable=True)  # ISO Date YYYY-MM-DD
    cluster_id = Column(Integer, nullable=True)
    confidence_score = Column(Float, nullable=False, default=0.85)
    model_version = Column(String(64), nullable=False, default="scikit-learn-v1.0")
    prediction_timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    email = relationship("EmailRecord", back_populates="prediction")


class UserFeedbackRecord(Base):
    __tablename__ = "user_feedback"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email_id = Column(String(64), ForeignKey("emails.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    corrected_priority = Column(String(32), nullable=True)
    corrected_category = Column(String(64), nullable=True)
    user_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    email = relationship("EmailRecord", back_populates="feedbacks")
    user = relationship("User", back_populates="feedbacks")
