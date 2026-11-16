"""
Kynora backend entrypoint.

Run with:  uvicorn app.main:app --reload --port 8000   (from the backend/ folder)
"""

from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()  # picks up backend/.env if present; harmless if it isn't

from .routers.auth import router as auth_router  # noqa: E402
from .routers.emails import router as emails_router  # noqa: E402

app = FastAPI(
    title="Kynora API",
    description="AI email analysis API for the Kynora prototype.",
    version="0.1.0",
)

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(emails_router)
app.include_router(auth_router)


@app.get("/")
def root():
    return {"service": "Kynora API", "status": "ok", "docs": "/docs"}
