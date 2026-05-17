"""
Heuristic domain detector.

Looks at column names (not values) and scores them against keyword signatures
for each supported sector. The domain set is intentionally aligned with the
frontend's DOMAIN_THEMES so a detection result always maps to a real theme.

Key design choices:
    - Tokenised matching (camelCase + non-alphanumerics) avoids false hits like
      'car' matching 'card' or 'patient' matching 'impatient_calls'.
    - Keywords are split into primary / secondary: primary are strong
      discriminators (weight x2), secondary are supporting evidence (weight x1).
    - One hit per column per tier — a single long column name can't stack
      multiple matches for the same domain.
    - If no domain clears a confidence threshold we return 'Generic' so the
      UI falls back to the neutral theme instead of picking a random sector.
"""

import re
from typing import Dict, List

import pandas as pd


# ---------------------------------------------------------------------------
# Keyword signatures. Tokens are compared case-insensitively AFTER column
# names are tokenised, so only put single word tokens in here (no spaces).
# ---------------------------------------------------------------------------
DOMAIN_SIGNATURES: Dict[str, Dict[str, List[str]]] = {
    'Retail': {
        'primary':   ['sku', 'product', 'store', 'cart', 'basket', 'checkout',
                      'pos', 'merchandise'],
        'secondary': ['price', 'discount', 'promo', 'sale', 'category', 'brand',
                      'order', 'customer', 'quantity', 'revenue', 'transaction'],
    },
    'Finance': {
        'primary':   ['ledger', 'credit', 'debit', 'balance', 'loan', 'portfolio',
                      'equity', 'asset', 'liability', 'invoice', 'fiscal',
                      'iban', 'swift'],
        'secondary': ['account', 'transaction', 'payment', 'interest', 'bank',
                      'currency', 'expense', 'amount', 'deposit', 'withdrawal'],
    },
    'Healthcare': {
        'primary':   ['patient', 'diagnosis', 'icd', 'symptom', 'prognosis',
                      'readmission', 'bmi'],
        'secondary': ['medication', 'prescription', 'doctor', 'physician',
                      'hospital', 'clinic', 'treatment', 'admission',
                      'discharge', 'bloodpressure', 'heartrate'],
    },
    'HR': {
        'primary':   ['employee', 'headcount', 'attrition', 'onboarding',
                      'payroll', 'tenure'],
        'secondary': ['department', 'manager', 'salary', 'compensation',
                      'performance', 'rating', 'recruitment', 'candidate',
                      'position', 'role', 'hire'],
    },
    'Education': {
        'primary':   ['student', 'enrollment', 'gpa', 'curriculum', 'syllabus',
                      'semester', 'graduation'],
        'secondary': ['course', 'grade', 'teacher', 'school', 'university',
                      'class', 'academic', 'tuition', 'scholarship'],
    },
    'Manufacturing': {
        'primary':   ['defect', 'yield', 'throughput', 'workcenter', 'plant',
                      'oee', 'scrap', 'rework'],
        'secondary': ['production', 'assembly', 'machine', 'quality', 'shift',
                      'downtime', 'uptime', 'batch', 'lot'],
    },
    'Logistics': {
        'primary':   ['shipment', 'consignment', 'lading', 'freight', 'waybill',
                      'etd', 'eta', 'carrier'],
        'secondary': ['warehouse', 'shipping', 'delivery', 'tracking', 'origin',
                      'destination', 'vehicle', 'driver', 'supplier', 'route'],
    },
    'Marketing': {
        'primary':   ['campaign', 'impression', 'ctr', 'cpc', 'cpm', 'roas',
                      'conversion', 'funnel', 'audience'],
        'secondary': ['lead', 'click', 'channel', 'engagement', 'subscriber',
                      'email', 'bounce', 'reach', 'segment'],
    },
}

# Minimum weighted score to commit to a non-generic domain.
# With primary=2 and secondary=1, this threshold means either
# (a) 2 primary hits, or (b) 1 primary + 1 secondary, or (c) 3 secondaries.
_COMMIT_THRESHOLD = 3

_CAMEL_RE = re.compile(r'(?<=[a-z])(?=[A-Z])')
_SPLIT_RE = re.compile(r'[^a-z0-9]+')


def _tokenize(name: str) -> List[str]:
    """Split a column name into lowercase word tokens.

    'PatientID' -> ['patient', 'id']
    'blood_pressure' -> ['blood', 'pressure']
    'Click-Through-Rate' -> ['click', 'through', 'rate']
    """
    camel = _CAMEL_RE.sub(' ', str(name))
    return [t for t in _SPLIT_RE.split(camel.lower()) if t]


def _count_hits(tokens_per_col: List[List[str]], keywords: List[str]) -> int:
    """One hit per column max — so long column names can't stack a score."""
    kw_set = set(keywords)
    hits = 0
    for tokens in tokens_per_col:
        if any(tok in kw_set for tok in tokens):
            hits += 1
    return hits


def detect_domain(df: pd.DataFrame) -> str:
    """Return the best-matching sector for ``df`` or ``'Generic'``.

    The function is deterministic: given the same set of column names it will
    always return the same domain. Detection is based on column names only —
    values are not inspected (fast, and works even on empty frames).
    """
    if df is None or len(df.columns) == 0:
        return 'Generic'

    tokens_per_col = [_tokenize(c) for c in df.columns]

    scores: Dict[str, int] = {}
    for domain, sig in DOMAIN_SIGNATURES.items():
        primary = _count_hits(tokens_per_col, sig['primary'])
        secondary = _count_hits(tokens_per_col, sig['secondary'])
        scores[domain] = primary * 2 + secondary

    best_domain, best_score = max(scores.items(), key=lambda x: x[1])
    if best_score < _COMMIT_THRESHOLD:
        return 'Generic'
    return best_domain
