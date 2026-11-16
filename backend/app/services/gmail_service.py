"""
Google OAuth 2.0 and Gmail API Integration Service for Kynora.

Features:
- Loads Google OAuth credentials from backend/secrets/google_oauth_client.json or .env
- Generates authorization URL with CSRF protection, tenant state binding, and minimum read-only scope:
    https://www.googleapis.com/auth/gmail.readonly
- Handles authorization code exchange
- Multi-user tenant isolation: Binds Gmail accounts and emails to specific Kynora users
- Encrypts stored refresh tokens and access tokens before persisting to database
- Fetches real emails using google-api-python-client (Gmail v1)
- Integrates fetched emails into MySQL and the Scikit-learn ML analysis pipeline
- Disconnection revokes Google tokens and removes credentials
"""

from __future__ import annotations

import base64
import json
import os
import secrets
import time
from datetime import datetime, timedelta
from email.utils import parseaddr, parsedate_to_datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from ..database import SessionLocal
from ..db_models import EmailPredictionRecord, EmailRecord, GmailAccount, User
from ..ml.service import ml_engine
from ..models import Category, Email, EmailAnalysis, EmailWithAnalysis, Priority, SenderImportance
from .crypto import decrypt_token, encrypt_token

DEFAULT_SECRETS_FILE = Path(__file__).resolve().parent.parent.parent / "secrets" / "google_oauth_client.json"
GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly"
USERINFO_SCOPES = [
    GMAIL_READONLY_SCOPE,
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]


class GmailOAuthManager:
    def __init__(self) -> None:
        self.client_id: str = ""
        self.client_secret: str = ""
        self.project_id: str = ""
        self.auth_uri: str = "https://accounts.google.com/o/oauth2/auth"
        self.token_uri: str = "https://oauth2.googleapis.com/token"
        self.registered_redirect_uris: List[str] = []
        self.is_valid: bool = False
        self.load_error: Optional[str] = None

        # CSRF state cache: state_token -> { "user_id": Optional[int], "timestamp": float }
        self._state_cache: Dict[str, Dict[str, Any]] = {}

        # In-memory account store keyed by user_id (and fallback key by email)
        # user_id -> Dict of account metadata
        self._user_accounts: Dict[int, Dict[str, Any]] = {}
        self._email_to_user_id: Dict[str, int] = {}

        self._load_client_credentials()

    def _load_client_credentials(self) -> None:
        """Loads credentials from JSON file or environment variables."""
        if DEFAULT_SECRETS_FILE.exists():
            try:
                with open(DEFAULT_SECRETS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)

                conf = data.get("web") or data.get("installed")
                if not conf:
                    self.load_error = "JSON file does not contain 'web' or 'installed' client configuration"
                    self.is_valid = False
                    return

                self.client_id = conf.get("client_id", "").strip()
                self.client_secret = conf.get("client_secret", "").strip()
                self.project_id = conf.get("project_id", "").strip()
                self.auth_uri = conf.get("auth_uri", "https://accounts.google.com/o/oauth2/auth")
                self.token_uri = conf.get("token_uri", "https://oauth2.googleapis.com/token")
                self.registered_redirect_uris = conf.get("redirect_uris") or []

                if self.client_id and self.client_secret:
                    self.is_valid = True
                    self.load_error = None
                    return
                else:
                    self.load_error = "client_id or client_secret missing in JSON file"
            except Exception as exc:
                self.load_error = f"Error reading google_oauth_client.json: {exc}"

        env_client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
        env_client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
        if env_client_id and env_client_secret:
            self.client_id = env_client_id
            self.client_secret = env_client_secret
            self.is_valid = True
            self.load_error = None
        elif not self.is_valid and not self.load_error:
            self.load_error = "No Google OAuth credentials found in secrets file or environment"

    def get_redirect_uri(self) -> str:
        """Returns the configured OAuth redirect URI."""
        return os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback").strip()

    def generate_auth_url(self, user_id: Optional[int] = None) -> Tuple[str, str]:
        """
        Generates Google OAuth 2.0 authorization URL with CSRF state token bound to user_id.
        Returns: (auth_url, state_token)
        """
        if not self.is_valid:
            raise ValueError(f"Cannot generate OAuth URL: {self.load_error or 'Credentials not configured'}")

        # Clean expired states older than 15 minutes
        now = time.time()
        self._state_cache = {s: d for s, d in self._state_cache.items() if now - d.get("timestamp", 0) < 900}

        state = secrets.token_urlsafe(32)
        self._state_cache[state] = {
            "user_id": user_id,
            "timestamp": now,
        }

        redirect_uri = self.get_redirect_uri()
        scope_str = " ".join(USERINFO_SCOPES)

        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": scope_str,
            "access_type": "offline",  # Required to receive refresh_token
            "prompt": "consent",       # Force consent so refresh_token is always returned
            "state": state,
        }

        req = requests.Request("GET", self.auth_uri, params=params).prepare()
        return req.url, state

    def validate_state(self, state: str) -> Optional[Dict[str, Any]]:
        """
        Validates and consumes CSRF state token.
        Returns dict containing user_id and timestamp if valid, None if invalid or expired.
        """
        if not state:
            return None
        data = self._state_cache.pop(state, None)
        if data is None:
            return None
        if (time.time() - data.get("timestamp", 0)) >= 900:
            return None
        return data

    def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """
        Exchanges authorization code for access and refresh tokens.
        Never prints client_secret or tokens in logs.
        """
        if not self.is_valid:
            raise ValueError("Google OAuth credentials are not properly configured")

        redirect_uri = self.get_redirect_uri()
        token_data = {
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }

        resp = requests.post(self.token_uri, data=token_data, timeout=10)
        if not resp.ok:
            error_detail = "Failed to exchange authorization code for tokens"
            try:
                err_json = resp.json()
                error_detail = err_json.get("error_description") or err_json.get("error") or error_detail
            except Exception:
                pass
            raise ValueError(f"Google Token Exchange Error: {error_detail}")

        return resp.json()

    def get_user_profile(self, access_token: str) -> Dict[str, Any]:
        """Retrieves user profile info from Google."""
        headers = {"Authorization": f"Bearer {access_token}"}
        resp = requests.get("https://www.googleapis.com/oauth2/v2/userinfo", headers=headers, timeout=10)
        if not resp.ok:
            raise ValueError("Failed to retrieve user profile from Google")
        return resp.json()

    def store_account(
        self,
        google_email: str,
        google_sub_id: str,
        refresh_token: Optional[str],
        access_token: str,
        expires_in: int,
        user_id: Optional[int] = None,
    ) -> None:
        """
        Encrypts tokens and stores connected account associated with user_id.
        """
        enc_refresh = encrypt_token(refresh_token) if refresh_token else None
        enc_access = encrypt_token(access_token) if access_token else None
        expiry = datetime.utcnow() + timedelta(seconds=expires_in)

        # Default fallback user_id if unauthenticated
        resolved_uid = user_id or 1

        # Store in-memory
        account_entry = {
            "user_id": resolved_uid,
            "google_email": google_email,
            "google_sub_id": google_sub_id,
            "refresh_token_enc": enc_refresh,
            "access_token_enc": enc_access,
            "token_expiry": expiry,
            "sync_status": "connected",
            "last_synced_at": datetime.utcnow(),
        }
        self._user_accounts[resolved_uid] = account_entry
        self._email_to_user_id[google_email] = resolved_uid

        # Persist to MySQL if available
        if SessionLocal is not None:
            try:
                db = SessionLocal()
                # Ensure user exists
                user = db.query(User).filter(User.id == resolved_uid).first()
                if not user:
                    user = User(id=resolved_uid, email=google_email, full_name=google_email.split("@")[0].title())
                    db.add(user)
                    db.flush()

                # Upsert GmailAccount for this user
                account = db.query(GmailAccount).filter(GmailAccount.user_id == resolved_uid).first()
                if not account:
                    account = GmailAccount(
                        user_id=resolved_uid,
                        google_email=google_email,
                        google_sub_id=google_sub_id,
                        refresh_token=enc_refresh,
                        access_token=enc_access,
                        token_expiry=expiry,
                        sync_status="connected",
                        last_synced_at=datetime.utcnow(),
                    )
                    db.add(account)
                else:
                    account.google_email = google_email
                    account.google_sub_id = google_sub_id
                    if enc_refresh:
                        account.refresh_token = enc_refresh
                    account.access_token = enc_access
                    account.token_expiry = expiry
                    account.sync_status = "connected"
                    account.last_synced_at = datetime.utcnow()

                db.commit()
                db.close()
            except Exception as exc:
                print(f"[Kynora Gmail] MySQL storage notice: {exc} (Account active in-memory)")

    def get_active_credentials(
        self,
        user_id: Optional[int] = None,
        google_email: Optional[str] = None,
    ) -> Optional[Credentials]:
        """
        Reconstructs Google Credentials from decrypted stored tokens for user_id.
        Refreshes access token if expired.
        """
        account_data = None
        target_uid = user_id or (self._email_to_user_id.get(google_email) if google_email else None)

        if target_uid and target_uid in self._user_accounts:
            account_data = self._user_accounts[target_uid]
        elif not target_uid and self._user_accounts:
            account_data = next(iter(self._user_accounts.values()))

        # Check DB if not in memory
        if not account_data and SessionLocal is not None:
            try:
                db = SessionLocal()
                query = db.query(GmailAccount)
                if target_uid:
                    query = query.filter(GmailAccount.user_id == target_uid)
                elif google_email:
                    query = query.filter(GmailAccount.google_email == google_email)
                db_acc = query.first()
                if db_acc:
                    account_data = {
                        "user_id": db_acc.user_id,
                        "google_email": db_acc.google_email,
                        "google_sub_id": db_acc.google_sub_id,
                        "refresh_token_enc": db_acc.refresh_token,
                        "access_token_enc": db_acc.access_token,
                        "token_expiry": db_acc.token_expiry,
                    }
                db.close()
            except Exception:
                pass

        if not account_data:
            return None

        # Decrypt tokens
        plain_refresh = decrypt_token(account_data.get("refresh_token_enc", ""))
        plain_access = decrypt_token(account_data.get("access_token_enc", ""))

        creds = Credentials(
            token=plain_access or None,
            refresh_token=plain_refresh or None,
            token_uri=self.token_uri,
            client_id=self.client_id,
            client_secret=self.client_secret,
            scopes=[GMAIL_READONLY_SCOPE],
        )

        # Refresh if expired
        if creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                self.store_account(
                    user_id=account_data.get("user_id"),
                    google_email=account_data["google_email"],
                    google_sub_id=account_data["google_sub_id"],
                    refresh_token=None,  # Keep existing refresh token
                    access_token=creds.token,
                    expires_in=3600,
                )
            except Exception as exc:
                print(f"[Kynora Gmail] Token refresh error: {exc}")
                return None

        return creds

    def fetch_user_emails(
        self,
        user_id: Optional[int] = None,
        max_results: int = 20,
    ) -> List[EmailWithAnalysis]:
        """
        Fetches live emails from connected Gmail account for user_id,
        analyzes them with the ML pipeline, saves them under user_id, and returns them.
        """
        creds = self.get_active_credentials(user_id=user_id)
        if not creds:
            raise ValueError("No active connected Gmail account found for this user.")

        service = build("gmail", "v1", credentials=creds, cache_discovery=False)

        # 1. List messages
        list_resp = service.users().messages().list(userId="me", maxResults=max_results).execute()
        messages_meta = list_resp.get("messages", [])
        if not messages_meta:
            return []

        synced_emails: List[EmailWithAnalysis] = []
        target_uid = user_id or 1

        # 2. Fetch full message details
        for item in messages_meta:
            msg_id = item["id"]
            try:
                msg = service.users().messages().get(userId="me", id=msg_id, format="full").execute()
                parsed_email, analysis = self._parse_and_analyze_message(msg)
                email_with_analysis = EmailWithAnalysis(**parsed_email.model_dump(), analysis=analysis)
                synced_emails.append(email_with_analysis)

                # Persist to database under target_uid
                self._persist_email_to_db(parsed_email, analysis, user_id=target_uid)
            except Exception as e:
                print(f"[Kynora Gmail] Error parsing message {msg_id}: {e}")

        # Update in-memory email service for target_uid
        from .email_service import email_service
        email_service.add_synced_emails(user_id=target_uid, emails_with_analysis=synced_emails)

        return synced_emails

    def _parse_and_analyze_message(self, msg_data: Dict[str, Any]) -> Tuple[Email, EmailAnalysis]:
        """Extracts email fields from Gmail API response and runs ML classification."""
        msg_id = f"gmail_{msg_data['id']}"
        payload = msg_data.get("payload", {})
        headers = payload.get("headers", [])

        header_map = {h["name"].lower(): h["value"] for h in headers}
        raw_from = header_map.get("from", "Unknown Sender")
        sender_name, sender_email = parseaddr(raw_from)
        if not sender_name:
            sender_name = sender_email.split("@")[0].title() if "@" in sender_email else raw_from

        subject = header_map.get("subject", "(No Subject)")
        snippet = msg_data.get("snippet", "")

        # Parse date
        date_str = header_map.get("date")
        received_at = datetime.utcnow()
        if date_str:
            try:
                received_at = parsedate_to_datetime(date_str)
                received_at = received_at.replace(tzinfo=None)
            except Exception:
                pass

        labels = msg_data.get("labelIds", [])
        is_read = "UNREAD" not in labels

        body = self._extract_body(payload) or snippet

        raw_email = Email(
            id=msg_id,
            sender_name=sender_name,
            sender_email=sender_email,
            subject=subject,
            preview=snippet[:200] if snippet else body[:200],
            body=body,
            received_at=received_at,
            is_read=is_read,
        )

        ml_res = ml_engine.predict_email(
            sender_name=sender_name,
            sender_email=sender_email,
            subject=subject,
            body=body,
        )

        text_lower = f"{subject} {snippet} {body}".lower()
        category = Category.GENERAL
        if "intern" in text_lower:
            category = Category.INTERNSHIP
        elif "placement" in text_lower:
            category = Category.PLACEMENT
        elif "security" in text_lower or "password" in text_lower or "verification" in text_lower:
            category = Category.SECURITY
        elif "github.com" in sender_email or "pull request" in text_lower:
            category = Category.GITHUB
        elif "exam" in text_lower or "syllabus" in text_lower or sender_email.endswith(".edu"):
            category = Category.COLLEGE
        elif any(k in text_lower for k in ("newsletter", "weekly digest")):
            category = Category.NEWSLETTER
        elif any(k in text_lower for k in ("discount", "special offer", "sale")):
            category = Category.PROMOTION

        action_required = category not in (Category.NEWSLETTER, Category.PROMOTION) and any(
            k in text_lower for k in ("please reply", "deadline", "submit", "register", "confirm", "action needed")
        )

        action_text = None
        if action_required:
            action_text = "Review message instructions and respond before deadline."

        try:
            priority_val = Priority(ml_res["priority"])
        except Exception:
            priority_val = Priority.MEDIUM

        analysis = EmailAnalysis(
            email_id=msg_id,
            category=category,
            priority=priority_val,
            summary=f"Email from {sender_name} regarding {subject}.",
            action_required=action_required,
            action=action_text,
            deadline=None,
            sender_importance=SenderImportance.RECRUITER if "careers" in sender_email else SenderImportance.PEER,
            confidence=float(ml_res.get("confidence", 0.8)),
            model_version=f"scikit-learn ({ml_res.get('model_name', 'Trained Classifier')})",
            cluster_id=ml_res.get("cluster_id"),
            cluster_topic=ml_res.get("cluster_topic"),
        )

        return raw_email, analysis

    def _extract_body(self, payload: Dict[str, Any]) -> str:
        """Extracts plain text body from nested MIME parts."""
        mime_type = payload.get("mimeType", "")
        body_data = payload.get("body", {}).get("data")

        if mime_type == "text/plain" and body_data:
            try:
                return base64.urlsafe_b64decode(body_data).decode("utf-8", errors="replace")
            except Exception:
                pass

        parts = payload.get("parts", [])
        for part in parts:
            part_mime = part.get("mimeType", "")
            part_body = part.get("body", {}).get("data")
            if part_mime == "text/plain" and part_body:
                try:
                    return base64.urlsafe_b64decode(part_body).decode("utf-8", errors="replace")
                except Exception:
                    pass
            elif "parts" in part:
                nested = self._extract_body(part)
                if nested:
                    return nested

        return ""

    def _persist_email_to_db(self, email: Email, analysis: EmailAnalysis, user_id: int) -> None:
        """Saves synced email and its ML prediction into MySQL under user_id."""
        if SessionLocal is None:
            return

        try:
            db = SessionLocal()
            existing = db.query(EmailRecord).filter(EmailRecord.id == email.id).first()
            if not existing:
                record = EmailRecord(
                    id=email.id,
                    user_id=user_id,
                    gmail_message_id=email.id.removeprefix("gmail_"),
                    sender_name=email.sender_name,
                    sender_email=email.sender_email,
                    subject=email.subject,
                    preview=email.preview,
                    body=email.body,
                    received_at=email.received_at,
                    is_read=email.is_read,
                )
                db.add(record)
                db.flush()

                pred = EmailPredictionRecord(
                    email_id=email.id,
                    predicted_priority=analysis.priority.value,
                    predicted_category=analysis.category.value,
                    summary=analysis.summary,
                    action_required=analysis.action_required,
                    recommended_action=analysis.action,
                    detected_deadline=analysis.deadline,
                    cluster_id=analysis.cluster_id,
                    confidence_score=analysis.confidence,
                    model_version=analysis.model_version or "scikit-learn",
                )
                db.add(pred)
                db.commit()
            db.close()
        except Exception as exc:
            print(f"[Kynora Gmail] DB persist error: {exc}")

    def disconnect_account(
        self,
        user_id: Optional[int] = None,
        google_email: Optional[str] = None,
    ) -> bool:
        """Disconnects account, revokes token, and clears stored credentials."""
        target_uid = user_id or (self._email_to_user_id.get(google_email) if google_email else None)
        creds = self.get_active_credentials(user_id=target_uid, google_email=google_email)
        if creds and creds.token:
            try:
                requests.post("https://oauth2.googleapis.com/revoke", params={"token": creds.token}, timeout=5)
            except Exception:
                pass

        if target_uid and target_uid in self._user_accounts:
            acc = self._user_accounts.pop(target_uid)
            self._email_to_user_id.pop(acc.get("google_email", ""), None)
        elif not target_uid:
            self._user_accounts.clear()
            self._email_to_user_id.clear()

        if SessionLocal is not None:
            try:
                db = SessionLocal()
                query = db.query(GmailAccount)
                if target_uid:
                    query = query.filter(GmailAccount.user_id == target_uid)
                elif google_email:
                    query = query.filter(GmailAccount.google_email == google_email)
                query.delete()
                db.commit()
                db.close()
            except Exception:
                pass

        # Clear synced emails for this user from email service
        if target_uid:
            from .email_service import email_service
            email_service.clear_user_emails(target_uid)

        return True

    def get_status(self, user_id: Optional[int] = None) -> Dict[str, Any]:
        """Returns connection status for user_id without exposing secrets."""
        active_email = None
        target_uid = user_id

        if target_uid and target_uid in self._user_accounts:
            active_email = self._user_accounts[target_uid].get("google_email")
        elif not target_uid and self._user_accounts:
            active_email = next(iter(self._user_accounts.values())).get("google_email")
        elif SessionLocal is not None:
            try:
                db = SessionLocal()
                query = db.query(GmailAccount)
                if target_uid:
                    query = query.filter(GmailAccount.user_id == target_uid)
                acc = query.first()
                if acc:
                    active_email = acc.google_email
                db.close()
            except Exception:
                pass

        redirect_uri = self.get_redirect_uri()
        redirect_configured = redirect_uri in self.registered_redirect_uris

        return {
            "is_configured": self.is_valid,
            "status": "connected" if active_email else "ready_to_connect" if self.is_valid else "demonstration",
            "connected_email": active_email,
            "client_id_prefix": self.client_id[:16] + "..." if self.client_id else None,
            "redirect_uri": redirect_uri,
            "registered_redirect_uris": self.registered_redirect_uris,
            "redirect_uri_matches": redirect_configured,
            "scope": GMAIL_READONLY_SCOPE,
            "error": self.load_error,
            "project_id": self.project_id,
        }


gmail_oauth = GmailOAuthManager()
