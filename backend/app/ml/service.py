"""
Production ML Service for Kynora.

Loads the joblib-persisted Scikit-learn model, TF-IDF vectorizer, and K-Means
clustering model to perform real-time priority classification and email clustering.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np

from .preprocessor import clean_text, extract_email_features_text

ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"


class MLInferenceEngine:
    def __init__(self) -> None:
        self.model = None
        self.vectorizer = None
        self.kmeans = None
        self.report: Dict[str, Any] = {}
        self.is_loaded = False
        self.load_artifacts()

    def load_artifacts(self) -> bool:
        """Loads model and vectorizer from disk if available."""
        model_path = ARTIFACTS_DIR / "best_priority_model.joblib"
        vectorizer_path = ARTIFACTS_DIR / "tfidf_vectorizer.joblib"
        kmeans_path = ARTIFACTS_DIR / "kmeans_model.joblib"
        report_path = ARTIFACTS_DIR / "ml_evaluation_report.json"

        if model_path.exists() and vectorizer_path.exists():
            try:
                self.model = joblib.load(model_path)
                self.vectorizer = joblib.load(vectorizer_path)
                if kmeans_path.exists():
                    self.kmeans = joblib.load(kmeans_path)
                if report_path.exists():
                    with open(report_path, "r", encoding="utf-8") as f:
                        self.report = json.load(f)
                self.is_loaded = True
                return True
            except Exception as e:
                print(f"[Kynora ML] Error loading artifacts: {e}")
                self.is_loaded = False
        return False

    def predict_email(
        self,
        sender_name: str,
        sender_email: str,
        subject: str,
        body: str,
    ) -> Dict[str, Any]:
        """
        Runs ML prediction:
        1. Preprocesses text
        2. Vectorizes with TF-IDF
        3. Predicts Priority using Scikit-Learn model
        4. Calculates confidence score from prediction probabilities
        5. Computes K-Means cluster assignment
        """
        if not self.is_loaded or self.model is None or self.vectorizer is None:
            # Fallback if artifacts not ready
            return {
                "priority": "Medium",
                "confidence": 0.5,
                "cluster_id": None,
                "cluster_topic": "Unassigned",
                "model_name": "Fallback Heuristic",
            }

        feat_text = extract_email_features_text(sender_name, sender_email, subject, body)
        X = self.vectorizer.transform([feat_text])

        # Priority prediction
        priority_pred = str(self.model.predict(X)[0])

        # Calculate prediction probability / confidence
        confidence = 0.85
        if hasattr(self.model, "predict_proba"):
            probs = self.model.predict_proba(X)[0]
            confidence = float(np.max(probs))

        # Check for urgent signals that escalate High -> Urgent
        raw_text_lower = f"{subject} {body}".lower()
        urgent_keywords = ["urgent", "action needed", "today only", "immediately", "deadline tomorrow", "compromised"]
        is_urgent = (priority_pred == "High") and any(k in raw_text_lower for k in urgent_keywords)

        final_priority = "Urgent" if is_urgent else str(priority_pred)

        # Cluster prediction
        cluster_id = None
        cluster_topic = "General Cluster"
        if self.kmeans is not None:
            cluster_id = int(self.kmeans.predict(X)[0])
            clusters_meta = self.report.get("clusters", {})
            if str(cluster_id) in clusters_meta:
                cluster_topic = clusters_meta[str(cluster_id)]["interpretation"]

        return {
            "priority": final_priority,
            "base_predicted_priority": priority_pred,
            "confidence": round(confidence, 2),
            "cluster_id": cluster_id,
            "cluster_topic": cluster_topic,
            "model_name": self.report.get("best_model", "Scikit-learn Model"),
        }

    def get_status(self) -> Dict[str, Any]:
        """Returns ML system metadata, evaluation metrics, and active model status."""
        return {
            "is_loaded": self.is_loaded,
            "active_model": self.report.get("best_model", "None" if not self.is_loaded else "Scikit-Learn Classifier"),
            "dataset_size": self.report.get("dataset_size", 0),
            "models_evaluated": self.report.get("models_evaluated", []),
            "metrics": self.report.get("metrics", {}),
            "clusters": self.report.get("clusters", {}),
            "vectorizer": self.report.get("vectorizer", {}),
        }


ml_engine = MLInferenceEngine()
