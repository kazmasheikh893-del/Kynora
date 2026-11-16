"""
Text preprocessing and TF-IDF vectorization module for Kynora.

Uses pure Python string processing and Scikit-learn's TfidfVectorizer.
No external heavy NLP dependencies (no NLTK, no spaCy), strictly adhering
to project specifications.
"""

from __future__ import annotations

import re
import string
from typing import List, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer


def clean_text(text: str) -> str:
    """
    Cleans raw email text:
    - Lowercase conversion
    - Strips URLs and email addresses
    - Removes punctuation and special characters
    - Normalizes multiple spaces and newlines
    """
    if not text:
        return ""

    # Convert to lowercase
    cleaned = text.lower()

    # Remove URLs (http:// or https:// or www.)
    cleaned = re.sub(r"https?://\S+|www\.\S+", " ", cleaned)

    # Remove email addresses inside text
    cleaned = re.sub(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", " ", cleaned)

    # Remove digits/numbers or replace with placeholder if needed, keep words
    # Replace punctuation with whitespace
    translator = str.maketrans(string.punctuation, " " * len(string.punctuation))
    cleaned = cleaned.translate(translator)

    # Remove non-ascii characters
    cleaned = re.sub(r"[^\x00-\x7f]", " ", cleaned)

    # Collapse multiple whitespaces
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    return cleaned


def extract_email_features_text(sender_name: str, sender_email: str, subject: str, body: str) -> str:
    """
    Combines sender, subject, and body into a rich single text representation for NLP vectorization.
    Subject and sender domain carry high informational weight, so they are prioritized.
    """
    domain = sender_email.split("@")[-1] if "@" in sender_email else ""
    # Domain hints (e.g. edu, github, careers) give strong priority and category signals
    combined = f"{sender_name} {domain} {subject} {subject} {body}"
    return clean_text(combined)


def create_vectorizer(max_features: int = 1000, ngram_range: Tuple[int, int] = (1, 2)) -> TfidfVectorizer:
    """
    Builds a Scikit-learn TfidfVectorizer with English stop words removal
    and uni/bi-gram token support.
    """
    return TfidfVectorizer(
        stop_words="english",
        max_features=max_features,
        ngram_range=ngram_range,
        sublinear_tf=True,
    )
