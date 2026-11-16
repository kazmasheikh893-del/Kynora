"""
Email Service for Kynora.

Features:
- Multi-user email repository with strict tenant isolation
- Database-backed persistence (MySQL) with resilient in-memory fallback
- Sample / demonstration dataset for unauthenticated guest previews
- Intelligent filtering, search, sorting, and aggregate analytics per user
- Ownership enforcement to prevent cross-tenant data leaks
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from ..data.sample_emails import SAMPLE_EMAILS
from ..database import SessionLocal
from ..db_models import EmailPredictionRecord, EmailRecord
from ..models import (
    PRIORITY_RANK,
    Category,
    Email,
    EmailAnalysis,
    EmailWithAnalysis,
    InboxStats,
    KynoraBrief,
    Priority,
    SenderImportance,
)
from .ai_analyzer import get_analyzer


class EmailService:
    def __init__(self) -> None:
        known_hints = {item["id"]: item["mock_analysis"] for item in SAMPLE_EMAILS}
        self._analyzer = get_analyzer(known_hints)

        # Demo / Sample emails
        self._sample_emails: dict[str, Email] = {}
        self._sample_analysis_cache: dict[str, EmailAnalysis] = {}

        # Multi-user storage: user_id -> { email_id: Email }
        self._user_emails: dict[int, dict[str, Email]] = {}
        self._user_analysis_cache: dict[int, dict[str, EmailAnalysis]] = {}

        self._load_sample_data()

    # -- Sample Setup ---------------------------------------------------

    def _load_sample_data(self) -> None:
        now = datetime.now()
        for item in SAMPLE_EMAILS:
            email = Email(
                id=item["id"],
                sender_name=item["sender_name"],
                sender_email=item["sender_email"],
                subject=item["subject"],
                preview=item["preview"],
                body=item["body"],
                received_at=now - timedelta(hours=item["hours_ago"]),
                is_read=item.get("is_read", False),
            )
            self._sample_emails[email.id] = email
            self._sample_analysis_cache[email.id] = self._analyzer.analyze(email)

    # -- User Email Ingestion -------------------------------------------

    def add_user_email(self, user_id: int, email: Email, analysis: EmailAnalysis) -> None:
        """Stores a single analyzed email for a specific user."""
        if user_id not in self._user_emails:
            self._user_emails[user_id] = {}
            self._user_analysis_cache[user_id] = {}

        self._user_emails[user_id][email.id] = email
        self._user_analysis_cache[user_id][email.id] = analysis

    def add_synced_emails(self, user_id: int, emails_with_analysis: List[EmailWithAnalysis]) -> None:
        """Stores a batch of synced emails for a user."""
        if user_id not in self._user_emails:
            self._user_emails[user_id] = {}
            self._user_analysis_cache[user_id] = {}

        for item in emails_with_analysis:
            email = Email(
                id=item.id,
                sender_name=item.sender_name,
                sender_email=item.sender_email,
                subject=item.subject,
                preview=item.preview,
                body=item.body,
                received_at=item.received_at,
                is_read=item.is_read,
            )
            self._user_emails[user_id][item.id] = email
            self._user_analysis_cache[user_id][item.id] = item.analysis

    def clear_user_emails(self, user_id: int) -> None:
        """Purges all emails for a specific user upon disconnection or reset."""
        self._user_emails.pop(user_id, None)
        self._user_analysis_cache.pop(user_id, None)

        if SessionLocal is not None:
            try:
                db = SessionLocal()
                db.query(EmailRecord).filter(EmailRecord.user_id == user_id).delete()
                db.commit()
                db.close()
            except Exception as exc:
                print(f"[Kynora EmailService] DB purge notice: {exc}")

    # -- Query Builder & Authorization ----------------------------------

    def _get_user_emails_raw(self, user_id: Optional[int]) -> tuple[dict[str, Email], dict[str, EmailAnalysis]]:
        """Returns the isolated email map and analysis cache for a given user context."""
        if user_id is None:
            # Unauthenticated / guest demo context
            return self._sample_emails, self._sample_analysis_cache

        # Authenticated user context
        emails_map: dict[str, Email] = {}
        analysis_map: dict[str, EmailAnalysis] = {}

        # 1. Fetch from DB if available
        if SessionLocal is not None:
            try:
                db = SessionLocal()
                records = (
                    db.query(EmailRecord)
                    .filter(EmailRecord.user_id == user_id)
                    .order_by(EmailRecord.received_at.desc())
                    .all()
                )
                for rec in records:
                    email_obj = Email(
                        id=rec.id,
                        sender_name=rec.sender_name,
                        sender_email=rec.sender_email,
                        subject=rec.subject,
                        preview=rec.preview,
                        body=rec.body,
                        received_at=rec.received_at,
                        is_read=rec.is_read,
                    )
                    emails_map[rec.id] = email_obj

                    # Fetch prediction
                    pred = rec.prediction
                    if pred:
                        try:
                            cat = Category(pred.predicted_category)
                        except ValueError:
                            cat = Category.GENERAL
                        try:
                            prio = Priority(pred.predicted_priority)
                        except ValueError:
                            prio = Priority.MEDIUM

                        analysis_map[rec.id] = EmailAnalysis(
                            email_id=rec.id,
                            category=cat,
                            priority=prio,
                            summary=pred.summary or "Email summary",
                            action_required=pred.action_required,
                            action=pred.recommended_action,
                            deadline=pred.detected_deadline,
                            sender_importance=SenderImportance.PEER,
                            confidence=pred.confidence_score,
                            model_version=pred.model_version,
                            cluster_id=pred.cluster_id,
                        )
                    else:
                        analysis_map[rec.id] = self._analyzer.analyze(email_obj)
                db.close()
            except Exception as exc:
                print(f"[Kynora EmailService] DB query notice: {exc}")

        # 2. Merge in-memory user cache (e.g. freshly synced)
        mem_emails = self._user_emails.get(user_id, {})
        mem_analysis = self._user_analysis_cache.get(user_id, {})
        for eid, email in mem_emails.items():
            emails_map[eid] = email
            if eid in mem_analysis:
                analysis_map[eid] = mem_analysis[eid]

        return emails_map, analysis_map

    def _with_analysis(
        self,
        email: Email,
        analysis_cache: dict[str, EmailAnalysis],
    ) -> EmailWithAnalysis:
        if isinstance(email, EmailWithAnalysis):
            return email
        analysis = analysis_cache.get(email.id)
        if not analysis:
            analysis = self._analyzer.analyze(email)
            analysis_cache[email.id] = analysis
        data = email.model_dump()
        data.pop("analysis", None)
        return EmailWithAnalysis(**data, analysis=analysis)

    # -- Public Reads ---------------------------------------------------

    def list_emails(
        self,
        user_id: Optional[int] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        important_only: bool = False,
        unread_only: bool = False,
        action_required_only: bool = False,
        search: Optional[str] = None,
        sort_by: str = "priority",
    ) -> list[EmailWithAnalysis]:
        """Lists and filters emails strictly belonging to user_id."""
        emails_map, analysis_cache = self._get_user_emails_raw(user_id)
        results = [self._with_analysis(e, analysis_cache) for e in emails_map.values()]

        if category:
            results = [e for e in results if e.analysis.category.value.lower() == category.lower()]
        if priority:
            results = [e for e in results if e.analysis.priority.value.lower() == priority.lower()]
        if important_only:
            results = [e for e in results if e.analysis.priority in (Priority.URGENT, Priority.HIGH)]
        if unread_only:
            results = [e for e in results if not e.is_read]
        if action_required_only:
            results = [e for e in results if e.analysis.action_required]
        if search:
            needle = search.lower().strip()
            results = [
                e
                for e in results
                if needle in e.subject.lower()
                or needle in e.sender_name.lower()
                or needle in e.preview.lower()
                or needle in e.sender_email.lower()
            ]

        if sort_by == "newest":
            results.sort(key=lambda e: -e.received_at.timestamp())
        elif sort_by == "oldest":
            results.sort(key=lambda e: e.received_at.timestamp())
        else:  # default: priority rank then newest first
            results.sort(key=lambda e: (PRIORITY_RANK[e.analysis.priority], -e.received_at.timestamp()))
        return results

    def get_email(self, email_id: str, user_id: Optional[int] = None) -> Optional[EmailWithAnalysis]:
        """
        Retrieves a single email by ID with strict tenant ownership verification.
        Raises PermissionError if the email belongs to another user.
        """
        # First check DB ownership across all users
        if SessionLocal is not None and user_id is not None:
            try:
                db = SessionLocal()
                rec = db.query(EmailRecord).filter(EmailRecord.id == email_id).first()
                if rec:
                    if rec.user_id is not None and rec.user_id != user_id:
                        db.close()
                        raise PermissionError(f"User {user_id} is not authorized to access email {email_id}")
                db.close()
            except PermissionError:
                raise
            except Exception:
                pass

        # Check in other in-memory users
        if user_id is not None:
            for other_uid, other_map in self._user_emails.items():
                if other_uid != user_id and email_id in other_map:
                    raise PermissionError(f"User {user_id} is not authorized to access email {email_id}")

        emails_map, analysis_cache = self._get_user_emails_raw(user_id)
        email = emails_map.get(email_id)
        if email:
            return self._with_analysis(email, analysis_cache)

        # Allow fallback to sample emails only if guest context
        if user_id is None and email_id in self._sample_emails:
            return self._with_analysis(self._sample_emails[email_id], self._sample_analysis_cache)

        return None

    def mark_read(self, email_id: str, user_id: Optional[int] = None) -> Optional[EmailWithAnalysis]:
        """Marks email as read after verifying ownership."""
        email_with_analysis = self.get_email(email_id, user_id)
        if not email_with_analysis:
            return None

        # Update in-memory
        emails_map, analysis_cache = self._get_user_emails_raw(user_id)
        email = emails_map.get(email_id)
        if email:
            email.is_read = True

        # Update MySQL
        if SessionLocal is not None:
            try:
                db = SessionLocal()
                rec = db.query(EmailRecord).filter(EmailRecord.id == email_id).first()
                if rec:
                    rec.is_read = True
                    db.commit()
                db.close()
            except Exception:
                pass

        return self.get_email(email_id, user_id)

    def mark_unread(self, email_id: str, user_id: Optional[int] = None) -> Optional[EmailWithAnalysis]:
        """Marks email as unread after verifying ownership."""
        email_with_analysis = self.get_email(email_id, user_id)
        if not email_with_analysis:
            return None

        emails_map, analysis_cache = self._get_user_emails_raw(user_id)
        email = emails_map.get(email_id)
        if email:
            email.is_read = False

        if SessionLocal is not None:
            try:
                db = SessionLocal()
                rec = db.query(EmailRecord).filter(EmailRecord.id == email_id).first()
                if rec:
                    rec.is_read = False
                    db.commit()
                db.close()
            except Exception:
                pass

        return self.get_email(email_id, user_id)

    def reset_inbox(self, user_id: Optional[int] = None) -> None:
        """Resets inbox state."""
        if user_id is not None:
            self.clear_user_emails(user_id)
        else:
            self._sample_emails.clear()
            self._sample_analysis_cache.clear()
            self._load_sample_data()

    def get_action_required_emails(self, user_id: Optional[int] = None) -> list[EmailWithAnalysis]:
        emails_map, analysis_cache = self._get_user_emails_raw(user_id)
        return [
            self._with_analysis(e, analysis_cache)
            for e in emails_map.values()
            if analysis_cache.get(e.id, self._analyzer.analyze(e)).action_required
        ]

    def get_upcoming_deadlines(self, user_id: Optional[int] = None) -> list[dict[str, Any]]:
        emails_map, analysis_cache = self._get_user_emails_raw(user_id)
        items = []
        for e in emails_map.values():
            analysis = analysis_cache.get(e.id, self._analyzer.analyze(e))
            if analysis.deadline:
                items.append({
                    "email_id": e.id,
                    "subject": e.subject,
                    "sender_name": e.sender_name,
                    "priority": analysis.priority.value,
                    "deadline": analysis.deadline,
                    "action": analysis.action or "Action Required",
                })
        items.sort(key=lambda x: x["deadline"])
        return items

    def compute_analytics(self, user_id: Optional[int] = None) -> dict[str, Any]:
        emails_map, analysis_cache = self._get_user_emails_raw(user_id)
        all_emails = [self._with_analysis(e, analysis_cache) for e in emails_map.values()]
        total = len(all_emails)
        if total == 0:
            return {
                "total_emails": 0,
                "read_count": 0,
                "unread_count": 0,
                "read_rate": 0.0,
                "priority_distribution": {p.value: 0 for p in Priority},
                "category_distribution": {c.value: 0 for c in Category},
                "action_required_count": 0,
                "deadline_count": 0,
                "urgent_or_high_count": 0,
            }

        read_count = sum(1 for e in all_emails if e.is_read)
        unread_count = total - read_count

        priority_counts: dict[str, int] = {p.value: 0 for p in Priority}
        for e in all_emails:
            priority_counts[e.analysis.priority.value] = priority_counts.get(e.analysis.priority.value, 0) + 1

        category_counts: dict[str, int] = {c.value: 0 for c in Category}
        for e in all_emails:
            category_counts[e.analysis.category.value] = category_counts.get(e.analysis.category.value, 0) + 1

        action_count = sum(1 for e in all_emails if e.analysis.action_required)
        deadlines_count = sum(1 for e in all_emails if e.analysis.deadline is not None)
        urgent_high = priority_counts.get("Urgent", 0) + priority_counts.get("High", 0)

        return {
            "total_emails": total,
            "read_count": read_count,
            "unread_count": unread_count,
            "read_rate": round(read_count / total, 3),
            "priority_distribution": priority_counts,
            "category_distribution": category_counts,
            "action_required_count": action_count,
            "deadline_count": deadlines_count,
            "urgent_or_high_count": urgent_high,
        }

    def compute_stats(self, user_id: Optional[int] = None) -> InboxStats:
        emails_map, analysis_cache = self._get_user_emails_raw(user_id)
        all_emails = [self._with_analysis(e, analysis_cache) for e in emails_map.values()]

        urgent_count = sum(1 for e in all_emails if e.analysis.priority == Priority.URGENT)
        high_count = sum(1 for e in all_emails if e.analysis.priority == Priority.HIGH)
        action_count = sum(1 for e in all_emails if e.analysis.action_required)
        deadlines_count = sum(1 for e in all_emails if e.analysis.deadline is not None)

        return InboxStats(
            total=len(all_emails),
            important=urgent_count + high_count,
            action_required=action_count,
            deadlines=deadlines_count,
        )

    def compute_brief(self, user_id: Optional[int] = None) -> KynoraBrief:
        emails_map, analysis_cache = self._get_user_emails_raw(user_id)
        all_emails = [self._with_analysis(e, analysis_cache) for e in emails_map.values()]

        urgent_count = sum(1 for e in all_emails if e.analysis.priority == Priority.URGENT)
        high_count = sum(1 for e in all_emails if e.analysis.priority == Priority.HIGH)
        action_count = sum(1 for e in all_emails if e.analysis.action_required)
        deadlines_count = sum(1 for e in all_emails if e.analysis.deadline is not None)
        low_value_count = sum(1 for e in all_emails if e.analysis.priority == Priority.LOW)

        lines: list[str] = []
        if urgent_count > 0:
            lines.append(f"{urgent_count} urgent message{'s' if urgent_count != 1 else ''} require immediate response.")
        if deadlines_count > 0:
            lines.append(f"{deadlines_count} upcoming deadline{'s' if deadlines_count != 1 else ''} detected.")
        if action_count > 0:
            lines.append(f"{action_count} actionable task{'s' if action_count != 1 else ''} pending.")
        if not lines:
            lines.append("Inbox prioritized. No urgent items pending.")

        return KynoraBrief(
            greeting="Here is your executive inbox brief for today.",
            urgent_count=urgent_count,
            important_today_count=urgent_count + high_count,
            deadline_count=deadlines_count,
            low_value_count=low_value_count,
            lines=lines,
        )


email_service = EmailService()
