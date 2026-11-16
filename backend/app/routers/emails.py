"""
API routes for Kynora.

Endpoints:
- /api/emails                          List, filter, and search emails
- /api/emails/{id}                     Retrieve single email with AI analysis & tenant check
- /api/emails/{id}/read                Mark email as read
- /api/emails/{id}/unread              Mark email as unread
- /api/emails/{id}/generate-reply      AI Reply Generator (Phase 7)
- /api/emails/reset                    Reset demo/user inbox
- /api/stats                           Summary count metrics
- /api/brief                           Headline executive brief
- /api/deadlines                       Detected upcoming deadlines
- /api/actions                         Action required emails
- /api/analytics                       Aggregate analytics for dashboard
- /api/ml/status                       Machine learning engine status & metrics
- /api/ml/predict                      Direct ML inference endpoint
- /api/db/status                       MySQL database connection status
- /api/gmail/status                    Gmail OAuth integration status
"""

from __future__ import annotations

import os
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ..database import check_db_connection
from ..ml.service import ml_engine
from ..models import EmailWithAnalysis, InboxStats, KynoraBrief
from ..services.email_service import email_service
from ..services.gmail_service import gmail_oauth
from ..services.reply_service import reply_service
from .auth import get_optional_user

router = APIRouter(prefix="/api", tags=["emails"])


def _extract_user_id(user: Any) -> Optional[int]:
    return user["id"] if isinstance(user, dict) else None


class PredictRequest(BaseModel):
    sender_name: str
    sender_email: str
    subject: str
    body: str


class GenerateReplyRequest(BaseModel):
    tone: str = "professional"  # professional, friendly, formal, concise
    instruction: Optional[str] = None


@router.get("/emails", response_model=list[EmailWithAnalysis])
def list_emails(
    category: Optional[str] = None,
    priority: Optional[str] = None,
    important_only: bool = False,
    unread_only: bool = False,
    action_required_only: bool = False,
    search: Optional[str] = None,
    sort_by: str = "priority",
    user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    user_id = _extract_user_id(user)
    return email_service.list_emails(
        user_id=user_id,
        category=category if isinstance(category, str) else None,
        priority=priority if isinstance(priority, str) else None,
        important_only=bool(important_only),
        unread_only=bool(unread_only),
        action_required_only=bool(action_required_only),
        search=search if isinstance(search, str) else None,
        sort_by=sort_by if isinstance(sort_by, str) else "priority",
    )


@router.get("/emails/{email_id}", response_model=EmailWithAnalysis)
def get_email(
    email_id: str,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    user_id = _extract_user_id(user)
    try:
        email = email_service.get_email(email_id, user_id=user_id)
    except PermissionError as perm_err:
        raise HTTPException(status_code=403, detail=str(perm_err))

    if email is None:
        raise HTTPException(status_code=404, detail="Email not found")
    return email


@router.patch("/emails/{email_id}/read", response_model=EmailWithAnalysis)
def mark_email_read(
    email_id: str,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    user_id = _extract_user_id(user)
    try:
        email = email_service.mark_read(email_id, user_id=user_id)
    except PermissionError as perm_err:
        raise HTTPException(status_code=403, detail=str(perm_err))

    if email is None:
        raise HTTPException(status_code=404, detail="Email not found")
    return email


@router.patch("/emails/{email_id}/unread", response_model=EmailWithAnalysis)
def mark_email_unread(
    email_id: str,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    user_id = _extract_user_id(user)
    try:
        email = email_service.mark_unread(email_id, user_id=user_id)
    except PermissionError as perm_err:
        raise HTTPException(status_code=403, detail=str(perm_err))

    if email is None:
        raise HTTPException(status_code=404, detail="Email not found")
    return email


@router.post("/emails/{email_id}/generate-reply")
def generate_email_reply(
    email_id: str,
    req: GenerateReplyRequest,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    """
    Generates a context-aware email reply within Kynora.
    Strictly internal: Never saves drafts to Gmail or sends emails.
    """
    user_id = _extract_user_id(user)
    try:
        email = email_service.get_email(email_id, user_id=user_id)
    except PermissionError as perm_err:
        raise HTTPException(status_code=403, detail=str(perm_err))

    if email is None:
        raise HTTPException(status_code=404, detail="Email not found")

    user_name = user.get("full_name") if isinstance(user, dict) else None
    res = reply_service.generate_reply(
        email=email,
        tone=req.tone,
        instruction=req.instruction,
        user_name=user_name,
    )
    return res


@router.post("/emails/reset")
def reset_inbox(user: Optional[Dict[str, Any]] = Depends(get_optional_user)):
    user_id = _extract_user_id(user)
    email_service.reset_inbox(user_id=user_id)
    return {"status": "ok", "message": "Inbox reset successfully"}


@router.get("/stats", response_model=InboxStats)
def get_stats(user: Optional[Dict[str, Any]] = Depends(get_optional_user)):
    user_id = _extract_user_id(user)
    return email_service.compute_stats(user_id=user_id)


@router.get("/brief", response_model=KynoraBrief)
def get_brief(user: Optional[Dict[str, Any]] = Depends(get_optional_user)):
    user_id = _extract_user_id(user)
    return email_service.compute_brief(user_id=user_id)


@router.get("/deadlines")
def get_deadlines(user: Optional[Dict[str, Any]] = Depends(get_optional_user)):
    user_id = _extract_user_id(user)
    return email_service.get_upcoming_deadlines(user_id=user_id)


@router.get("/actions", response_model=list[EmailWithAnalysis])
def get_actions(user: Optional[Dict[str, Any]] = Depends(get_optional_user)):
    user_id = _extract_user_id(user)
    return email_service.get_action_required_emails(user_id=user_id)


@router.get("/analytics")
def get_analytics(user: Optional[Dict[str, Any]] = Depends(get_optional_user)):
    user_id = _extract_user_id(user)
    return email_service.compute_analytics(user_id=user_id)


@router.get("/ml/status")
def get_ml_status():
    return ml_engine.get_status()


@router.post("/ml/predict")
def predict_email(req: PredictRequest):
    return ml_engine.predict_email(
        sender_name=req.sender_name,
        sender_email=req.sender_email,
        subject=req.subject,
        body=req.body,
    )


@router.get("/db/status")
def get_db_status():
    return check_db_connection()


@router.get("/gmail/status")
def get_gmail_status(user: Optional[Dict[str, Any]] = Depends(get_optional_user)):
    user_id = _extract_user_id(user)
    return gmail_oauth.get_status(user_id=user_id)
