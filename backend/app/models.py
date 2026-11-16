"""
Structured data models for Kynora.

Everything the AI analysis layer produces conforms to `EmailAnalysis`. This is
the contract the rest of the app (API routes, frontend) is built against --
whether that analysis came from `MockAIAnalyzer` or a real `LLMAnalyzer`
should never matter to anything that consumes it.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class Priority(str, Enum):
    URGENT = "Urgent"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


# Used for sorting: Urgent emails first, Low emails last.
PRIORITY_RANK: dict[Priority, int] = {
    Priority.URGENT: 0,
    Priority.HIGH: 1,
    Priority.MEDIUM: 2,
    Priority.LOW: 3,
}


class Category(str, Enum):
    COLLEGE = "College"
    INTERNSHIP = "Internship"
    PLACEMENT = "Placement"
    SECURITY = "Security"
    GITHUB = "GitHub"
    CERTIFICATION = "Certification"
    NEWSLETTER = "Newsletter"
    PROMOTION = "Promotion"
    GENERAL = "General"


class SenderImportance(str, Enum):
    INSTITUTIONAL = "Institutional"      # college, university, official bodies
    RECRUITER = "Recruiter/Company"      # internships, placements, interviews
    AUTOMATED = "Automated System"       # GitHub, security alerts, platforms
    PEER = "Peer"                        # classmates, friends, colleagues
    MARKETING = "Marketing"              # newsletters, promotions


class Email(BaseModel):
    """The raw email, before any AI analysis is applied."""

    id: str
    sender_name: str
    sender_email: str
    subject: str
    preview: str
    body: str
    received_at: datetime
    is_read: bool = False


class EmailAnalysis(BaseModel):
    """
    The output of the AI analysis layer for a single email.

    This shape is intentionally provider-agnostic: MockAIAnalyzer,
    MLPriorityAnalyzer (Scikit-Learn), and LLMAnalyzer all return this,
    making them interchangeable from the rest of the app's point of view.
    """
    model_config = ConfigDict(protected_namespaces=())

    email_id: str
    category: Category
    priority: Priority
    summary: str
    action_required: bool
    action: Optional[str] = None
    deadline: Optional[str] = None  # ISO date string (YYYY-MM-DD), or None
    sender_importance: SenderImportance
    confidence: float = Field(ge=0.0, le=1.0, default=0.9)
    model_version: Optional[str] = "scikit-learn-v1.0"
    cluster_id: Optional[int] = None
    cluster_topic: Optional[str] = None


class EmailWithAnalysis(Email):
    """An email plus its analysis -- what the frontend inbox list works with."""

    analysis: EmailAnalysis


class InboxStats(BaseModel):
    total: int
    important: int          # Urgent + High
    action_required: int
    deadlines: int


class KynoraBrief(BaseModel):
    greeting: str
    urgent_count: int
    important_today_count: int
    deadline_count: int
    low_value_count: int
    lines: list[str]
