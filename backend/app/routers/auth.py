"""
Authentication and Google OAuth 2.0 API routes for Kynora.

Features:
- User registration with secure password hashing (PBKDF2-HMAC-SHA256)
- User login with signed session tokens (HMAC-SHA256)
- Current user profile endpoint (/api/auth/me) and logout
- Google OAuth 2.0 authorization URL generation bound to user_id
- CSRF-protected OAuth callback storing credentials per-user
- Multi-user Gmail status, sync, and disconnection
"""

from __future__ import annotations

import os
from typing import Any, Dict, Optional
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr

from ..services.auth_service import auth_service
from ..services.gmail_service import gmail_oauth

router = APIRouter(prefix="/api/auth", tags=["auth"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")


def _extract_user_id(user: Any) -> Optional[int]:
    return user["id"] if isinstance(user, dict) else None


# -- Request Models ---------------------------------------------------

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


# -- FastAPI Dependencies ---------------------------------------------

def get_optional_user(
    authorization: Optional[str] = Header(None),
) -> Optional[Dict[str, Any]]:
    """Retrieves authenticated user from Bearer token if provided, otherwise None."""
    if not authorization:
        return None
    token = authorization.removeprefix("Bearer ").strip()
    payload = auth_service.decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return auth_service.get_user_by_id(user_id)


def get_current_user(
    authorization: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Requires valid Bearer token; raises 401 if missing or invalid."""
    user = get_optional_user(authorization)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please log in or register.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


# -- Kynora Account Authentication Routes ------------------------------

@router.post("/register")
def register_user(req: RegisterRequest):
    """Registers a new Kynora user account with secure password hashing."""
    try:
        user_dict, token = auth_service.register_user(
            email=req.email,
            password=req.password,
            full_name=req.full_name,
        )
        return {
            "success": True,
            "message": "User registered successfully",
            "token": token,
            "user": user_dict,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(exc)}")


@router.post("/login")
def login_user(req: LoginRequest):
    """Authenticates Kynora user and returns a signed access token."""
    try:
        user_dict, token = auth_service.authenticate_user(
            email=req.email,
            password=req.password,
        )
        return {
            "success": True,
            "message": "Login successful",
            "token": token,
            "user": user_dict,
        }
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(exc)}")


@router.get("/me")
def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    """Returns the authenticated user's profile information."""
    return {"success": True, "user": user}


@router.post("/logout")
def logout_user():
    """Client-side token invalidation confirmation."""
    return {"success": True, "message": "Logged out successfully"}


# -- Google OAuth 2.0 Routes ------------------------------------------

@router.get("/google/url")
def get_auth_url(user: Optional[Dict[str, Any]] = Depends(get_optional_user)):
    """Generates a secure Google OAuth authorization URL bound to current user."""
    try:
        user_id = _extract_user_id(user)
        url, state = gmail_oauth.generate_auth_url(user_id=user_id)
        return {
            "url": url,
            "state": state,
            "redirect_uri": gmail_oauth.get_redirect_uri(),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/google/callback")
def oauth_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
):
    """
    Handles the Google OAuth 2.0 redirect callback.
    Validates CSRF state, exchanges code for tokens, encrypts credentials,
    stores connection under the originating user, and initiates initial sync.
    """
    if error:
        params = urlencode({"error": f"Google OAuth Error: {error}"})
        return RedirectResponse(url=f"{FRONTEND_URL}/settings?{params}")

    if not code or not state:
        params = urlencode({"error": "Missing authorization code or state parameter"})
        return RedirectResponse(url=f"{FRONTEND_URL}/settings?{params}")

    # Validate CSRF state and extract bound user_id
    state_info = gmail_oauth.validate_state(state)
    if not state_info:
        params = urlencode({"error": "Invalid or expired OAuth state token (CSRF check failed)"})
        return RedirectResponse(url=f"{FRONTEND_URL}/settings?{params}")

    target_user_id = state_info.get("user_id")

    try:
        # 1. Exchange code for tokens
        token_data = gmail_oauth.exchange_code_for_tokens(code)
        access_token = token_data.get("access_token", "")
        refresh_token = token_data.get("refresh_token")
        expires_in = token_data.get("expires_in", 3600)

        # 2. Retrieve Google user profile
        profile = gmail_oauth.get_user_profile(access_token)
        google_email = profile.get("email", "")
        google_sub = profile.get("id", "")

        # 3. Store encrypted credentials linked to target_user_id
        gmail_oauth.store_account(
            google_email=google_email,
            google_sub_id=google_sub,
            refresh_token=refresh_token,
            access_token=access_token,
            expires_in=expires_in,
            user_id=target_user_id,
        )

        # 4. Ingest and analyze initial batch of emails for this user
        synced_count = 0
        try:
            synced_emails = gmail_oauth.fetch_user_emails(user_id=target_user_id, max_results=20)
            synced_count = len(synced_emails)
        except Exception as sync_exc:
            print(f"[Kynora OAuth] Initial sync notice: {sync_exc}")

        params = urlencode({
            "status": "connected",
            "email": google_email,
            "synced": synced_count,
        })
        return RedirectResponse(url=f"{FRONTEND_URL}/settings?{params}")

    except Exception as exc:
        params = urlencode({"error": f"Authentication failed: {str(exc)}"})
        return RedirectResponse(url=f"{FRONTEND_URL}/settings?{params}")


@router.get("/google/status")
def get_oauth_status(user: Optional[Dict[str, Any]] = Depends(get_optional_user)):
    """Returns current Gmail OAuth connection status for the authenticated user."""
    user_id = _extract_user_id(user)
    return gmail_oauth.get_status(user_id=user_id)


@router.post("/google/sync")
def sync_emails(
    max_results: int = Query(20, ge=1, le=50),
    user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    """Triggers live synchronization of Gmail messages through ML pipeline for current user."""
    try:
        user_id = _extract_user_id(user)
        synced = gmail_oauth.fetch_user_emails(user_id=user_id, max_results=max_results)
        return {
            "status": "ok",
            "synced_count": len(synced),
            "message": f"Successfully synced and classified {len(synced)} emails from Gmail.",
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/google/disconnect")
def disconnect_gmail(user: Optional[Dict[str, Any]] = Depends(get_optional_user)):
    """Disconnects connected Gmail account and purges credentials for current user."""
    user_id = _extract_user_id(user)
    gmail_oauth.disconnect_account(user_id=user_id)
    return {"status": "ok", "message": "Gmail account disconnected successfully."}
