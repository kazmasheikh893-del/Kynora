"""
AI analysis layer.

This is the one part of Kynora meant to be replaced later. Everything else
(routes, email service, frontend) only ever talks to the `AIAnalyzer`
interface below and gets back an `EmailAnalysis` -- it never knows or cares
whether that came from a hand-written mock or a real model call.

Two implementations exist today:

  MockAIAnalyzer
    - Default. No API key, no network calls, no cost.
    - For the 13 sample emails it returns curated, realistic analysis
      (see app/data/sample_emails.py). For anything else, it falls back to
      simple keyword rules so the app never crashes on unfamiliar input --
      it just gives a lower-confidence guess.

  LLMAnalyzer
    - Used automatically if ANTHROPIC_API_KEY is set in the environment.
    - Sends the email to Claude and asks for the same structured JSON shape
      MockAIAnalyzer produces.

`get_analyzer()` at the bottom is the factory the rest of the app calls --
that's the only place that decides which implementation is active.
"""

from __future__ import annotations

import json
import os
from abc import ABC, abstractmethod
from datetime import date, timedelta
from typing import Any, Optional

from ..models import Category, Email, EmailAnalysis, Priority, SenderImportance


class AIAnalyzer(ABC):
    """Anything that can turn an Email into a structured EmailAnalysis."""

    @abstractmethod
    def analyze(self, email: Email) -> EmailAnalysis:
        raise NotImplementedError


def _deadline_from_offset(days_from_now: Optional[int]) -> Optional[str]:
    if days_from_now is None:
        return None
    return (date.today() + timedelta(days=days_from_now)).isoformat()


class MockAIAnalyzer(AIAnalyzer):
    """
    Rule-based stand-in for a real model.

    `known_hints` maps email id -> the curated `mock_analysis` block from
    sample_emails.py. This is what makes the demo data feel meaningfully
    analyzed rather than randomly labeled. Any email id not in that map
    goes through `_heuristic_analyze`, a much simpler keyword classifier,
    so the app keeps working even for emails the hints don't cover.
    """

    def __init__(self, known_hints: dict[str, dict[str, Any]] | None = None):
        self._known_hints = known_hints or {}

    def analyze(self, email: Email) -> EmailAnalysis:
        hint = self._known_hints.get(email.id)
        if hint is not None:
            return EmailAnalysis(
                email_id=email.id,
                category=Category(hint["category"]),
                priority=Priority(hint["priority"]),
                summary=hint["summary"],
                action_required=hint["action_required"],
                action=hint.get("action"),
                deadline=_deadline_from_offset(hint.get("deadline_in_days")),
                sender_importance=SenderImportance(hint["sender_importance"]),
                confidence=hint.get("confidence", 0.85),
            )
        return self._heuristic_analyze(email)

    @staticmethod
    def _heuristic_analyze(email: Email) -> EmailAnalysis:
        """
        Very simple keyword-based fallback for emails with no curated hint.
        This is intentionally basic -- it exists so unfamiliar emails degrade
        gracefully instead of crashing, not to be a good classifier. Real
        classification quality is what Phase 3 (better AI classification)
        and the LLMAnalyzer below are for.
        """
        text = f"{email.subject} {email.preview} {email.body}".lower()
        domain = email.sender_email.split("@")[-1].lower()

        if "intern" in text:
            category = Category.INTERNSHIP
        elif "placement" in text or "pre-placement" in text:
            category = Category.PLACEMENT
        elif "github.com" in domain or "pull request" in text:
            category = Category.GITHUB
        elif "certificate" in text or "certification" in text:
            category = Category.CERTIFICATION
        elif "password" in text or "sign-in" in text or "suspicious" in text or "security" in text:
            category = Category.SECURITY
        elif any(k in text for k in ("% off", "sale", "discount", "limited time")):
            category = Category.PROMOTION
        elif any(k in text for k in ("newsletter", "digest", "weekly roundup")):
            category = Category.NEWSLETTER
        elif domain.endswith(".edu") or "exam" in text or "lecture" in text or "syllabus" in text:
            category = Category.COLLEGE
        else:
            category = Category.GENERAL

        if "urgent" in text or "action needed" in text or "today only" in text:
            priority = Priority.URGENT
        elif category in (Category.NEWSLETTER, Category.PROMOTION):
            priority = Priority.LOW
        elif any(k in text for k in ("deadline", "closing soon", "final", "immediately")):
            priority = Priority.HIGH
        else:
            priority = Priority.MEDIUM

        action_required = category not in (Category.NEWSLETTER, Category.PROMOTION) and any(
            k in text for k in ("register", "please", "required", "complete", "review", "reply", "respond", "submit")
        )

        if domain.endswith(".edu"):
            sender_importance = SenderImportance.INSTITUTIONAL
        elif "github.com" in domain or "noreply" in domain or "notifications" in domain:
            sender_importance = SenderImportance.AUTOMATED
        elif category in (Category.NEWSLETTER, Category.PROMOTION):
            sender_importance = SenderImportance.MARKETING
        elif category in (Category.INTERNSHIP, Category.PLACEMENT):
            sender_importance = SenderImportance.RECRUITER
        else:
            sender_importance = SenderImportance.PEER

        return EmailAnalysis(
            email_id=email.id,
            category=category,
            priority=priority,
            summary=f"This looks like a {category.value.lower()} email from {email.sender_name}.",
            action_required=action_required,
            action="Open the email to see what it's asking for." if action_required else None,
            deadline=None,  # naive fallback doesn't attempt date extraction
            sender_importance=sender_importance,
            confidence=0.5,
        )


class LLMAnalyzer(AIAnalyzer):
    """
    Real analysis via the Claude API. Only constructed when
    ANTHROPIC_API_KEY is set -- see get_analyzer() below.
    """

    ALLOWED_CATEGORIES = [c.value for c in Category]
    ALLOWED_PRIORITIES = [p.value for p in Priority]
    ALLOWED_IMPORTANCE = [s.value for s in SenderImportance]

    def __init__(self, api_key: str, model: str):
        from anthropic import Anthropic  # imported lazily so Mock-only setups don't need the package

        self._client = Anthropic(api_key=api_key)
        self._model = model

    def analyze(self, email: Email) -> EmailAnalysis:
        prompt = self._build_prompt(email)
        response = self._client.messages.create(
            model=self._model,
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        raw_text = "".join(block.text for block in response.content if block.type == "text")
        data = self._parse_json(raw_text)

        return EmailAnalysis(
            email_id=email.id,
            category=Category(data["category"]),
            priority=Priority(data["priority"]),
            summary=data["summary"],
            action_required=bool(data["action_required"]),
            action=data.get("action"),
            deadline=data.get("deadline"),
            sender_importance=SenderImportance(data["sender_importance"]),
            confidence=float(data.get("confidence", 0.75)),
        )

    def _build_prompt(self, email: Email) -> str:
        return f"""You are Kynora's email analysis engine. Analyze this email and respond with ONLY a JSON object -- no other text, no markdown fences.

Email:
From: {email.sender_name} <{email.sender_email}>
Subject: {email.subject}
Body: {email.body}

Today's date: {date.today().isoformat()}

Respond with a JSON object with exactly these fields:
- "category": one of {self.ALLOWED_CATEGORIES}
- "priority": one of {self.ALLOWED_PRIORITIES}
- "summary": one sentence summarizing what this email is about
- "action_required": true or false
- "action": a short recommended next step (string), or null if none
- "deadline": an ISO date "YYYY-MM-DD" if a concrete deadline is mentioned or implied, otherwise null
- "sender_importance": one of {self.ALLOWED_IMPORTANCE}
- "confidence": a number between 0 and 1 for how confident you are in this analysis
"""

    @staticmethod
    def _parse_json(raw_text: str) -> dict[str, Any]:
        cleaned = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(cleaned)


class MLPriorityAnalyzer(AIAnalyzer):
    """
    Production Scikit-learn Machine Learning Analyzer.
    Uses the trained Scikit-learn priority classifier, TF-IDF vectorizer,
    and K-Means clustering model.
    """

    def __init__(self, known_hints: dict[str, dict[str, Any]] | None = None):
        self._known_hints = known_hints or {}
        from ..ml.service import ml_engine
        self._ml_engine = ml_engine

    def analyze(self, email: Email) -> EmailAnalysis:
        ml_res = self._ml_engine.predict_email(
            sender_name=email.sender_name,
            sender_email=email.sender_email,
            subject=email.subject,
            body=email.body,
        )

        hint = self._known_hints.get(email.id)
        if hint is not None:
            try:
                cat = Category(hint["category"])
            except ValueError:
                cat = Category.GENERAL

            try:
                prio = Priority(str(ml_res["priority"]))
            except (ValueError, KeyError):
                prio = Priority(hint["priority"])

            return EmailAnalysis(
                email_id=email.id,
                category=cat,
                priority=prio,
                summary=hint["summary"],
                action_required=hint["action_required"],
                action=hint.get("action"),
                deadline=_deadline_from_offset(hint.get("deadline_in_days")),
                sender_importance=SenderImportance(hint["sender_importance"]),
                confidence=float(ml_res["confidence"]),
                model_version=f"scikit-learn ({ml_res['model_name']})",
                cluster_id=ml_res.get("cluster_id"),
                cluster_topic=ml_res.get("cluster_topic"),
            )

        base = MockAIAnalyzer._heuristic_analyze(email)
        try:
            prio = Priority(str(ml_res["priority"]))
        except Exception:
            prio = base.priority

        return EmailAnalysis(
            email_id=email.id,
            category=base.category,
            priority=prio,
            summary=base.summary,
            action_required=base.action_required,
            action=base.action,
            deadline=base.deadline,
            sender_importance=base.sender_importance,
            confidence=float(ml_res["confidence"]),
            model_version=f"scikit-learn ({ml_res['model_name']})",
            cluster_id=ml_res.get("cluster_id"),
            cluster_topic=ml_res.get("cluster_topic"),
        )


def get_analyzer(known_hints: dict[str, dict[str, Any]]) -> AIAnalyzer:
    """
    Analyzer factory:
    1. Returns LLMAnalyzer if ANTHROPIC_API_KEY is configured and requested.
    2. Returns MLPriorityAnalyzer (Scikit-Learn) when trained ML artifacts are present.
    3. Falls back to MockAIAnalyzer if artifacts are missing.
    """
    from ..ml.service import ml_engine

    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if api_key and os.getenv("USE_LLM", "false").lower() == "true":
        try:
            model = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
            return LLMAnalyzer(api_key=api_key, model=model)
        except Exception as exc:
            print(f"[Kynora] Could not start LLMAnalyzer ({exc}).")

    if ml_engine.is_loaded:
        return MLPriorityAnalyzer(known_hints=known_hints)

    return MockAIAnalyzer(known_hints=known_hints)
