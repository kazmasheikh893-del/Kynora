# Kynora — Architecture (Prototype Phase)

## Layers

```
Frontend (React + TS)
    |  fetch() over HTTP
FastAPI routes            backend/app/routers/emails.py
    |  calls
EmailService               backend/app/services/email_service.py
    |  calls
AIAnalyzer (Mock or LLM)   backend/app/services/ai_analyzer.py
    |  produces
EmailAnalysis              backend/app/models.py
```

Each layer only knows about the one below it through a narrow interface:

- **Routes** validate query params and call `email_service`. No AI logic
  and no business logic lives in `routers/emails.py` -- if you're tempted
  to add an `if` statement about priority or category there, it belongs in
  `EmailService` instead.
- **EmailService** owns the in-memory inbox (loading sample data, filtering,
  sorting, stats, the Brief). It calls an `AIAnalyzer` but doesn't know or
  care which implementation it got.
- **AIAnalyzer** is an abstract interface with two implementations:
  - `MockAIAnalyzer` -- default, free, deterministic. Uses curated
    per-email hints for the 13 sample emails, and a simple keyword
    heuristic for anything else.
  - `LLMAnalyzer` -- real Claude API call, used automatically if
    `ANTHROPIC_API_KEY` is set. Same input, same output shape.

The factory function `get_analyzer()` in `ai_analyzer.py` is the *only*
place that decides which implementation runs. Nothing else in the app
imports `MockAIAnalyzer` or `LLMAnalyzer` directly.

## Why this split matters

The project's stated direction is Mock AI -> Real LLM without rewriting the
app. Concretely, that means:

- Swapping analyzers requires touching **one file** (`ai_analyzer.py`).
- Swapping mock data for real Gmail sync (Phase 2) requires changing
  **`EmailService._load_sample_data`** to pull from Gmail instead of
  `sample_emails.py` -- the `Email` / `EmailAnalysis` models, the routes,
  and the entire frontend stay the same, because they were built against
  the *shape* of the data, not its source.

## Data flow for "analyze an email"

1. Frontend calls `GET /api/emails` (or `/api/emails/{id}`).
2. The route calls `email_service.list_emails(...)` / `get_email(...)`.
3. `EmailService` already has analysis cached per email (computed once at
   startup, since the mock analysis is deterministic) and returns
   `EmailWithAnalysis` objects -- the raw email plus its `EmailAnalysis`.
4. The frontend renders the email and its analysis together. The ~550ms
   "analyzing" delay you see when opening an email in the UI
   (`EmailDetail.tsx`) is a deliberate, clearly-commented UI beat, not a
   real second network round trip -- it exists so opening an email visibly
   reads as "Kynora is analyzing this."

## What's intentionally NOT here yet

Per the prototype scope: no database (everything is in-memory and resets
on backend restart), no auth, no real Gmail connection, no background
jobs, no vector database/RAG. See the root README's "Roadmap" section for
where each of these is expected to land.
