# data/

This folder is reserved for real inbox data once Gmail sync exists (Phase 2).

For this prototype, the sample inbox lives in code instead, at
`backend/app/data/sample_emails.py`. It needed to be inside the backend's
Python package so the email service could import it directly without path
hacks -- there's no functional difference from a JSON file here, it's just
easier for FastAPI to load.

When Gmail integration lands, this folder becomes the place for whatever a
real sync layer needs (a local cache, exported threads, etc.), and
`sample_emails.py` stops being the data source -- but the shape it produces
(`Email` objects going into `EmailService`) stays the same, since the API
and AI layers were built against that shape, not against the sample file
itself.
