"""
Machine Learning Training and Evaluation Pipeline for Kynora.

Implements and evaluates:
1. Logistic Regression
2. K-Nearest Neighbors (KNN)
3. Random Forest Classifier
4. Decision Tree Classifier

Also trains an unsupervised K-Means clustering model to group emails by topic/theme.
Performs Train/Test split, K-Fold Cross-Validation, and evaluates Accuracy,
Precision, Recall, F1-score, and Confusion Matrices.

Saves the best-performing model and vectorizer with joblib.
"""

from __future__ import annotations

import os
os.environ["LOKY_MAX_CPU_COUNT"] = "4"

import json
from pathlib import Path
from typing import Any, Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier

from .preprocessor import clean_text, create_vectorizer, extract_email_features_text
from .training_data import DATASET

ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"


def load_dataset() -> pd.DataFrame:
    """Loads and preprocesses the training dataset into a clean Pandas DataFrame."""
    records = []
    for item in DATASET:
        feat_text = extract_email_features_text(
            sender_name=item["sender_name"],
            sender_email=item["sender_email"],
            subject=item["subject"],
            body=item["body"],
        )
        records.append({
            "sender_name": item["sender_name"],
            "sender_email": item["sender_email"],
            "subject": item["subject"],
            "body": item["body"],
            "processed_text": feat_text,
            "priority": item["priority"],
            "category": item["category"],
        })
    return pd.DataFrame(records)


def train_and_evaluate_all() -> Dict[str, Any]:
    """
    Executes full ML experiment:
    - Trains 4 supervised classifiers
    - Evaluates performance metrics and K-Fold CV
    - Trains K-Means clustering
    - Identifies top model
    - Persists artifacts via joblib
    """
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    df = load_dataset()

    X_texts = np.array(df["processed_text"].tolist())
    y = np.array(df["priority"].tolist())

    # 1. TF-IDF Vectorization
    vectorizer = create_vectorizer(max_features=600)
    X = vectorizer.fit_transform(X_texts)

    # 2. Train/Test Split (80% train, 20% test with stratification)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    models: Dict[str, Any] = {
        "Logistic Regression": LogisticRegression(C=3.0, max_iter=300, class_weight="balanced", random_state=42),
        "K-Nearest Neighbors": KNeighborsClassifier(n_neighbors=3, metric="cosine", weights="distance"),
        "Random Forest": RandomForestClassifier(n_estimators=150, max_depth=12, class_weight="balanced", random_state=42),
        "Decision Tree": DecisionTreeClassifier(max_depth=10, class_weight="balanced", random_state=42),
    }

    eval_results: Dict[str, Any] = {}
    best_model_name = ""
    best_f1 = -1.0
    best_model_obj = None

    classes = ["High", "Medium", "Low"]
    skf = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)

    for name, clf in models.items():
        # Train on train split
        clf.fit(X_train, y_train)
        y_pred = clf.predict(X_test)

        # Cross-validation over full dataset
        cv_scores = cross_validate(
            clf, X, y, cv=skf, scoring=["accuracy", "f1_macro", "recall_macro"]
        )

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, average="macro", zero_division=0))
        rec = float(recall_score(y_test, y_pred, average="macro", zero_division=0))
        f1 = float(f1_score(y_test, y_pred, average="macro", zero_division=0))

        # Specifically evaluate High-priority recall (critical for email prioritization)
        # Binary indicator for High vs rest
        y_test_high = [1 if p == "High" else 0 for p in y_test]
        y_pred_high = [1 if p == "High" else 0 for p in y_pred]
        high_recall = float(recall_score(y_test_high, y_pred_high, zero_division=0))

        cm = confusion_matrix(y_test, y_pred, labels=classes).tolist()

        eval_results[name] = {
            "test_accuracy": round(acc, 4),
            "test_precision": round(prec, 4),
            "test_recall": round(rec, 4),
            "test_f1": round(f1, 4),
            "high_priority_recall": round(high_recall, 4),
            "cv_accuracy_mean": round(float(np.mean(cv_scores["test_accuracy"])), 4),
            "cv_accuracy_std": round(float(np.std(cv_scores["test_accuracy"])), 4),
            "cv_f1_mean": round(float(np.mean(cv_scores["test_f1_macro"])), 4),
            "confusion_matrix": cm,
            "classes": classes,
        }

        # Track best model based on F1 and High Priority Recall
        composite_score = f1 * 0.6 + high_recall * 0.4
        if composite_score > best_f1:
            best_f1 = composite_score
            best_model_name = name
            best_model_obj = clf

    # Fit best model on entire dataset for maximum production inference accuracy
    best_model_obj.fit(X, y)

    # 3. Unsupervised Learning: K-Means Clustering
    num_clusters = 4
    kmeans = KMeans(n_clusters=num_clusters, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(X)

    # Identify top keywords per cluster
    terms = vectorizer.get_feature_names_out()
    order_centroids = kmeans.cluster_centers_.argsort()[:, ::-1]
    cluster_keywords: Dict[int, List[str]] = {}
    for i in range(num_clusters):
        top_words = [terms[ind] for ind in order_centroids[i, :6]]
        cluster_keywords[i] = top_words

    cluster_interpretations = {
        0: "Actionable Academic & Exam Notices",
        1: "Tech Recruitment & Internship Opportunities",
        2: "Newsletters & Industry Technical Digests",
        3: "Account Security & System Notifications",
    }

    # 4. Save Artifacts using Joblib
    model_path = ARTIFACTS_DIR / "best_priority_model.joblib"
    vectorizer_path = ARTIFACTS_DIR / "tfidf_vectorizer.joblib"
    kmeans_path = ARTIFACTS_DIR / "kmeans_model.joblib"
    report_path = ARTIFACTS_DIR / "ml_evaluation_report.json"

    joblib.dump(best_model_obj, model_path)
    joblib.dump(vectorizer, vectorizer_path)
    joblib.dump(kmeans, kmeans_path)

    summary_report = {
        "status": "trained",
        "dataset_size": len(df),
        "best_model": best_model_name,
        "models_evaluated": list(models.keys()),
        "metrics": eval_results,
        "clusters": {
            str(cid): {
                "interpretation": cluster_interpretations.get(cid, f"Cluster {cid}"),
                "top_keywords": cluster_keywords[cid],
            }
            for cid in range(num_clusters)
        },
        "vectorizer": {
            "max_features": 600,
            "ngram_range": [1, 2],
            "vocabulary_size": len(vectorizer.vocabulary_),
        },
    }

    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(summary_report, f, indent=2)

    return summary_report


if __name__ == "__main__":
    report = train_and_evaluate_all()
    print("ML Pipeline Execution Completed Successfully!")
    print(f"Best Model Selected: {report['best_model']}")
    print(json.dumps(report, indent=2))
