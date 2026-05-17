"""
Deterministic pandas tools exposed to the LLM via Groq function/tool calling.

Each tool:
- Has a JSON-schema definition (consumed by ChatGroq.bind_tools)
- Has a safe executor that validates inputs and returns a JSON-serializable result
- Shapes its output to be both LLM-readable (summary) and chart-ready (data)
"""

from __future__ import annotations

import logging
from typing import Any, Callable, Dict, List, Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_MAX_ROWS_RETURNED = 50          # cap rows sent back to the LLM / frontend
_DEFAULT_TOP_N = 10
_ALLOWED_AGGS = {"sum", "mean", "median", "count", "min", "max", "std", "nunique"}
_ALLOWED_FREQS = {"D", "W", "M", "Q", "Y"}
# Map public-facing freqs to pandas internal codes (pandas 2.2 renamed some)
_FREQ_MAP = {"D": "D", "W": "W", "M": "ME", "Q": "QE", "Y": "YE"}
_ALLOWED_OPS = {"==", "!=", ">", ">=", "<", "<=", "in", "not in", "contains"}


def _json_safe(val: Any) -> Any:
    """Convert numpy/pandas scalars to plain Python types."""
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating,)):
        return None if np.isnan(val) else float(val)
    if isinstance(val, (np.bool_,)):
        return bool(val)
    if isinstance(val, (pd.Timestamp,)):
        return val.isoformat()
    if isinstance(val, (pd.Period,)):
        return str(val)
    if pd.isna(val):
        return None
    return val


def _records_from_df(df: pd.DataFrame, limit: int = _MAX_ROWS_RETURNED) -> List[Dict[str, Any]]:
    """Convert DataFrame to JSON-safe list of row dicts, capped at `limit`."""
    out: List[Dict[str, Any]] = []
    for _, row in df.head(limit).iterrows():
        out.append({str(k): _json_safe(v) for k, v in row.items()})
    return out


def _resolve_column(df: pd.DataFrame, name: str) -> Optional[str]:
    """Case-insensitive column lookup; returns canonical column name or None."""
    if name in df.columns:
        return name
    lower_map = {c.lower(): c for c in df.columns}
    return lower_map.get(name.lower())


def _try_parse_datetime(series: pd.Series) -> Optional[pd.Series]:
    if pd.api.types.is_datetime64_any_dtype(series):
        return series
    try:
        return pd.to_datetime(series, errors="raise")
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Tool executors
# Each returns a dict: {"ok": bool, "data": ..., "summary": str, "error"?: str}
# ---------------------------------------------------------------------------

def describe_dataset(df: pd.DataFrame, domain: str) -> Dict[str, Any]:
    rows, cols = df.shape
    column_info = []
    for c in df.columns:
        s = df[c]
        info: Dict[str, Any] = {
            "name": c,
            "dtype": str(s.dtype),
            "non_null": int(s.notna().sum()),
            "missing": int(s.isna().sum()),
            "unique": int(s.nunique(dropna=True)),
        }
        if pd.api.types.is_numeric_dtype(s) and info["non_null"]:
            info["min"] = _json_safe(s.min())
            info["max"] = _json_safe(s.max())
            info["mean"] = _json_safe(s.mean())
        elif pd.api.types.is_datetime64_any_dtype(s) and info["non_null"]:
            info["min"] = _json_safe(s.min())
            info["max"] = _json_safe(s.max())
        column_info.append(info)

    return {
        "ok": True,
        "domain": domain,
        "row_count": int(rows),
        "column_count": int(cols),
        "columns": column_info,
        "sample_rows": _records_from_df(df, limit=3),
        "summary": f"{domain} dataset with {rows} rows and {cols} columns.",
    }


def column_stats(df: pd.DataFrame, column: str) -> Dict[str, Any]:
    col = _resolve_column(df, column)
    if not col:
        return {"ok": False, "error": f"Column '{column}' not found"}

    s = df[col]
    result: Dict[str, Any] = {"ok": True, "column": col, "dtype": str(s.dtype)}

    if pd.api.types.is_numeric_dtype(s):
        desc = s.describe()
        result.update({
            "count": _json_safe(desc.get("count")),
            "mean": _json_safe(desc.get("mean")),
            "std": _json_safe(desc.get("std")),
            "min": _json_safe(desc.get("min")),
            "p25": _json_safe(desc.get("25%")),
            "median": _json_safe(desc.get("50%")),
            "p75": _json_safe(desc.get("75%")),
            "max": _json_safe(desc.get("max")),
            "sum": _json_safe(s.sum()),
        })
        result["summary"] = (
            f"{col}: mean={result['mean']:.2f}, median={result['median']:.2f}, "
            f"min={result['min']:.2f}, max={result['max']:.2f}"
            if result["mean"] is not None else f"{col}: no numeric data"
        )
    elif pd.api.types.is_datetime64_any_dtype(s):
        result.update({
            "min": _json_safe(s.min()),
            "max": _json_safe(s.max()),
            "count": int(s.notna().sum()),
        })
        result["summary"] = f"{col}: {result['count']} values from {result['min']} to {result['max']}"
    else:
        vc = s.value_counts(dropna=False).head(_DEFAULT_TOP_N)
        total = int(s.notna().sum())
        top_values = [
            {"value": _json_safe(k), "count": int(v), "pct": round(float(v) / len(s) * 100, 2)}
            for k, v in vc.items()
        ]
        result.update({
            "unique": int(s.nunique(dropna=True)),
            "total_non_null": total,
            "top_values": top_values,
        })
        top_str = ", ".join(f"{tv['value']} ({tv['count']})" for tv in top_values[:5])
        result["summary"] = f"{col}: {result['unique']} unique values; top: {top_str}"
    return result


def value_counts(df: pd.DataFrame, column: str, top_k: int = _DEFAULT_TOP_N) -> Dict[str, Any]:
    col = _resolve_column(df, column)
    if not col:
        return {"ok": False, "error": f"Column '{column}' not found"}

    top_k = max(1, min(int(top_k), _MAX_ROWS_RETURNED))
    vc = df[col].value_counts(dropna=False).head(top_k)
    total = len(df)
    data = [
        {"value": _json_safe(k), "count": int(v), "pct": round(float(v) / total * 100, 2)}
        for k, v in vc.items()
    ]
    summary = f"Top {len(data)} values of {col}: " + ", ".join(
        f"{d['value']}={d['count']} ({d['pct']}%)" for d in data[:5]
    )
    return {"ok": True, "column": col, "data": data, "summary": summary}


def group_aggregate(
    df: pd.DataFrame,
    group_by: str,
    metric: str,
    agg: str = "sum",
    top_n: int = _DEFAULT_TOP_N,
    ascending: bool = False,
) -> Dict[str, Any]:
    agg = agg.lower()
    if agg not in _ALLOWED_AGGS:
        return {"ok": False, "error": f"agg must be one of {sorted(_ALLOWED_AGGS)}"}

    gcol = _resolve_column(df, group_by)
    mcol = _resolve_column(df, metric)
    if not gcol:
        return {"ok": False, "error": f"Column '{group_by}' not found"}
    if not mcol:
        return {"ok": False, "error": f"Column '{metric}' not found"}
    if agg != "count" and not pd.api.types.is_numeric_dtype(df[mcol]):
        return {"ok": False, "error": f"Column '{mcol}' is not numeric (required for agg={agg})"}

    top_n = max(1, min(int(top_n), _MAX_ROWS_RETURNED))
    try:
        grouped = df.groupby(gcol)[mcol].agg(agg).sort_values(ascending=ascending).head(top_n)
    except Exception as e:
        return {"ok": False, "error": f"group_aggregate failed: {e}"}

    data = [{"group": _json_safe(k), "value": _json_safe(v)} for k, v in grouped.items()]
    top_str = ", ".join(f"{d['group']}={d['value']}" for d in data[:5])
    summary = f"{agg}({mcol}) by {gcol} (top {len(data)}): {top_str}"
    return {
        "ok": True,
        "group_by": gcol,
        "metric": mcol,
        "agg": agg,
        "data": data,
        "chart_hint": "bar",
        "summary": summary,
    }


def time_series(
    df: pd.DataFrame,
    date_column: str,
    metric: str,
    freq: str = "M",
    agg: str = "sum",
) -> Dict[str, Any]:
    freq = freq.upper()
    agg = agg.lower()
    if freq not in _ALLOWED_FREQS:
        return {"ok": False, "error": f"freq must be one of {sorted(_ALLOWED_FREQS)}"}
    if agg not in _ALLOWED_AGGS:
        return {"ok": False, "error": f"agg must be one of {sorted(_ALLOWED_AGGS)}"}

    dcol = _resolve_column(df, date_column)
    mcol = _resolve_column(df, metric)
    if not dcol:
        return {"ok": False, "error": f"Column '{date_column}' not found"}
    if not mcol:
        return {"ok": False, "error": f"Column '{metric}' not found"}

    parsed = _try_parse_datetime(df[dcol])
    if parsed is None:
        return {"ok": False, "error": f"Column '{dcol}' could not be parsed as datetime"}
    if agg != "count" and not pd.api.types.is_numeric_dtype(df[mcol]):
        return {"ok": False, "error": f"Column '{mcol}' is not numeric (required for agg={agg})"}

    try:
        work = df.assign(_dt=parsed).dropna(subset=["_dt"]).set_index("_dt")
        series = work[mcol].resample(_FREQ_MAP[freq]).agg(agg).dropna()
    except Exception as e:
        return {"ok": False, "error": f"time_series failed: {e}"}

    data = [
        {"period": k.strftime("%Y-%m-%d"), "value": _json_safe(v)}
        for k, v in series.items()
    ]
    if not data:
        return {"ok": False, "error": "no data after resampling"}

    first, last = data[0], data[-1]
    direction = "increasing" if last["value"] > first["value"] else (
        "decreasing" if last["value"] < first["value"] else "flat"
    )
    summary = (
        f"{agg}({mcol}) per {freq} from {first['period']} to {last['period']} "
        f"({direction}; {len(data)} periods)"
    )
    return {
        "ok": True,
        "date_column": dcol,
        "metric": mcol,
        "freq": freq,
        "agg": agg,
        "data": data,
        "chart_hint": "line",
        "summary": summary,
    }


def top_n(
    df: pd.DataFrame,
    column: str,
    n: int = _DEFAULT_TOP_N,
    ascending: bool = False,
    columns_to_return: Optional[List[str]] = None,
) -> Dict[str, Any]:
    col = _resolve_column(df, column)
    if not col:
        return {"ok": False, "error": f"Column '{column}' not found"}
    if not pd.api.types.is_numeric_dtype(df[col]):
        return {"ok": False, "error": f"Column '{col}' is not numeric"}

    n = max(1, min(int(n), _MAX_ROWS_RETURNED))
    ordered = df.sort_values(col, ascending=ascending).head(n)

    if columns_to_return:
        resolved = [_resolve_column(df, c) for c in columns_to_return]
        resolved = [c for c in resolved if c]
        if resolved:
            ordered = ordered[resolved]

    rows = _records_from_df(ordered, limit=n)
    direction = "smallest" if ascending else "largest"
    return {
        "ok": True,
        "column": col,
        "direction": direction,
        "data": rows,
        "summary": f"Top {len(rows)} rows by {col} ({direction}).",
    }


def correlations(
    df: pd.DataFrame,
    columns: Optional[List[str]] = None,
    top_k: int = _DEFAULT_TOP_N,
) -> Dict[str, Any]:
    numeric = df.select_dtypes(include=[np.number])
    if columns:
        resolved = [_resolve_column(df, c) for c in columns]
        resolved = [c for c in resolved if c and c in numeric.columns]
        numeric = numeric[resolved] if resolved else numeric

    if numeric.shape[1] < 2:
        return {"ok": False, "error": "Need at least 2 numeric columns for correlation"}

    corr = numeric.corr()
    pairs: List[Dict[str, Any]] = []
    cols = corr.columns.tolist()
    for i, a in enumerate(cols):
        for b in cols[i + 1:]:
            v = corr.loc[a, b]
            if pd.notna(v):
                pairs.append({"a": a, "b": b, "corr": round(float(v), 4)})

    pairs.sort(key=lambda p: abs(p["corr"]), reverse=True)
    pairs = pairs[: max(1, min(int(top_k), 50))]
    summary = "; ".join(f"{p['a']}~{p['b']}={p['corr']}" for p in pairs[:5]) or "no correlations"
    return {"ok": True, "pairs": pairs, "summary": summary}


def filter_aggregate(
    df: pd.DataFrame,
    conditions: List[Dict[str, Any]],
    metric: Optional[str] = None,
    agg: str = "count",
) -> Dict[str, Any]:
    """
    Apply a list of simple filters (AND-joined), then aggregate.
    Each condition: {"column": str, "op": <op>, "value": Any}
    Ops: ==, !=, >, >=, <, <=, in, not in, contains
    """
    agg = agg.lower()
    if agg not in _ALLOWED_AGGS:
        return {"ok": False, "error": f"agg must be one of {sorted(_ALLOWED_AGGS)}"}

    mask = pd.Series(True, index=df.index)
    applied = []
    for cond in conditions or []:
        col_in = cond.get("column")
        op = cond.get("op")
        val = cond.get("value")
        if op not in _ALLOWED_OPS:
            return {"ok": False, "error": f"op must be one of {sorted(_ALLOWED_OPS)}"}
        col = _resolve_column(df, col_in) if col_in else None
        if not col:
            return {"ok": False, "error": f"Column '{col_in}' not found"}
        s = df[col]
        try:
            if op == "==":
                mask &= (s == val)
            elif op == "!=":
                mask &= (s != val)
            elif op == ">":
                mask &= (s > val)
            elif op == ">=":
                mask &= (s >= val)
            elif op == "<":
                mask &= (s < val)
            elif op == "<=":
                mask &= (s <= val)
            elif op == "in":
                mask &= s.isin(val if isinstance(val, list) else [val])
            elif op == "not in":
                mask &= ~s.isin(val if isinstance(val, list) else [val])
            elif op == "contains":
                mask &= s.astype(str).str.contains(str(val), case=False, na=False)
        except Exception as e:
            return {"ok": False, "error": f"filter on {col} failed: {e}"}
        applied.append({"column": col, "op": op, "value": val})

    sub = df[mask]
    matched = int(len(sub))
    result: Dict[str, Any] = {
        "ok": True,
        "filters": applied,
        "matched_rows": matched,
        "summary": f"{matched} rows match the filter.",
    }
    if metric:
        mcol = _resolve_column(df, metric)
        if not mcol:
            return {"ok": False, "error": f"Metric column '{metric}' not found"}
        if matched == 0:
            result["aggregate"] = None
            result["summary"] += " No aggregate (empty set)."
            return result
        if agg != "count" and not pd.api.types.is_numeric_dtype(sub[mcol]):
            return {"ok": False, "error": f"Column '{mcol}' is not numeric for agg={agg}"}
        try:
            agg_val = _json_safe(sub[mcol].agg(agg))
        except Exception as e:
            return {"ok": False, "error": f"aggregate failed: {e}"}
        result["metric"] = mcol
        result["agg"] = agg
        result["aggregate"] = agg_val
        result["summary"] += f" {agg}({mcol}) = {agg_val}"
    return result


# ---------------------------------------------------------------------------
# Registry + JSON-schema definitions for LLM tool binding
# ---------------------------------------------------------------------------

TOOL_EXECUTORS: Dict[str, Callable[..., Dict[str, Any]]] = {
    "describe_dataset": describe_dataset,
    "column_stats": column_stats,
    "value_counts": value_counts,
    "group_aggregate": group_aggregate,
    "time_series": time_series,
    "top_n": top_n,
    "correlations": correlations,
    "filter_aggregate": filter_aggregate,
}


TOOL_SCHEMAS: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "describe_dataset",
            "description": "Return a high-level overview: shape, columns with dtypes, non-null counts, and 3 sample rows. Call this first if you don't know the dataset.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "column_stats",
            "description": "Get detailed statistics for one column. Numeric: mean/median/quartiles/min/max/sum. Categorical: top values with counts & percentages. Datetime: min/max range.",
            "parameters": {
                "type": "object",
                "properties": {
                    "column": {"type": "string", "description": "Column name (case-insensitive)"},
                },
                "required": ["column"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "value_counts",
            "description": "Frequency distribution of a categorical column — top K values with counts and percentages.",
            "parameters": {
                "type": "object",
                "properties": {
                    "column": {"type": "string"},
                    "top_k": {"type": "integer", "minimum": 1, "maximum": 50, "default": 10},
                },
                "required": ["column"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "group_aggregate",
            "description": "Group by a (usually categorical) column and aggregate a metric column. Returns top_n groups sorted by the aggregated value. Good for 'sales by category', 'avg salary by department', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "group_by": {"type": "string"},
                    "metric": {"type": "string"},
                    "agg": {
                        "type": "string",
                        "enum": ["sum", "mean", "median", "count", "min", "max", "std", "nunique"],
                        "default": "sum",
                    },
                    "top_n": {"type": "integer", "minimum": 1, "maximum": 50, "default": 10},
                    "ascending": {"type": "boolean", "default": False},
                },
                "required": ["group_by", "metric"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "time_series",
            "description": "Resample a metric over time at a given frequency (D=day, W=week, M=month, Q=quarter, Y=year). Returns a list of {period, value} points. Use for trends over time.",
            "parameters": {
                "type": "object",
                "properties": {
                    "date_column": {"type": "string"},
                    "metric": {"type": "string"},
                    "freq": {"type": "string", "enum": ["D", "W", "M", "Q", "Y"], "default": "M"},
                    "agg": {
                        "type": "string",
                        "enum": ["sum", "mean", "median", "count", "min", "max"],
                        "default": "sum",
                    },
                },
                "required": ["date_column", "metric"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "top_n",
            "description": "Return the top/bottom N rows sorted by a numeric column. Use when the user asks for 'biggest', 'smallest', 'top 5', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "column": {"type": "string"},
                    "n": {"type": "integer", "minimum": 1, "maximum": 50, "default": 10},
                    "ascending": {"type": "boolean", "default": False},
                    "columns_to_return": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Optional subset of columns to include in each returned row.",
                    },
                },
                "required": ["column"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "correlations",
            "description": "Pearson correlation between numeric columns. Returns top_k strongest (by |corr|) column pairs.",
            "parameters": {
                "type": "object",
                "properties": {
                    "columns": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Optional: subset of numeric columns to consider.",
                    },
                    "top_k": {"type": "integer", "minimum": 1, "maximum": 50, "default": 10},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "filter_aggregate",
            "description": "Filter rows by conditions (AND-joined) and optionally aggregate a metric. Use for 'how many X where Y', 'total Z for category A', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "conditions": {
                        "type": "array",
                        "description": "List of filter conditions, AND-joined.",
                        "items": {
                            "type": "object",
                            "properties": {
                                "column": {"type": "string"},
                                "op": {
                                    "type": "string",
                                    "enum": ["==", "!=", ">", ">=", "<", "<=", "in", "not in", "contains"],
                                },
                                "value": {"description": "Value or list of values (for 'in'/'not in')"},
                            },
                            "required": ["column", "op", "value"],
                        },
                    },
                    "metric": {"type": "string", "description": "Optional column to aggregate after filtering."},
                    "agg": {
                        "type": "string",
                        "enum": ["sum", "mean", "median", "count", "min", "max", "std", "nunique"],
                        "default": "count",
                    },
                },
                "required": ["conditions"],
            },
        },
    },
]


def execute_tool(name: str, df: pd.DataFrame, domain: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Dispatch a tool call safely and always return a dict."""
    fn = TOOL_EXECUTORS.get(name)
    if fn is None:
        return {"ok": False, "error": f"Unknown tool '{name}'"}
    try:
        if name == "describe_dataset":
            return fn(df, domain)
        return fn(df, **(arguments or {}))
    except TypeError as e:
        return {"ok": False, "error": f"Invalid arguments for {name}: {e}"}
    except Exception as e:
        logger.exception("Tool '%s' failed", name)
        return {"ok": False, "error": f"{name} raised {type(e).__name__}: {e}"}


# ---------------------------------------------------------------------------
# Visualization helper — derive chart config from a tool result
# ---------------------------------------------------------------------------

def visualization_from_tool_result(tool_name: str, result: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Build a frontend-consumable visualization config from a tool result, when
    the result contains chart-ready data. Returns None if no viz applies.
    """
    if not result.get("ok"):
        return None

    if tool_name == "time_series" and result.get("data"):
        return {
            "type": "line",
            "data": [{"month": d["period"], "sum": d["value"]} for d in result["data"]],
            "xAxis": "month",
            "yAxis": result.get("metric", "value"),
            "title": f"{result.get('metric', 'value')} over time ({result.get('freq', 'M')})",
        }

    if tool_name == "group_aggregate" and result.get("data"):
        return {
            "type": "bar",
            "data": [{result.get("group_by", "group"): d["group"], result.get("metric", "value"): d["value"]}
                     for d in result["data"]],
            "xAxis": result.get("group_by", "group"),
            "yAxis": result.get("metric", "value"),
            "title": f"{result.get('agg', 'sum')}({result.get('metric')}) by {result.get('group_by')}",
        }

    if tool_name == "value_counts" and result.get("data"):
        return {
            "type": "bar",
            "data": [{result.get("column", "value"): d["value"], "count": d["count"]} for d in result["data"]],
            "xAxis": result.get("column", "value"),
            "yAxis": "count",
            "title": f"Distribution of {result.get('column')}",
        }

    return None


# ---------------------------------------------------------------------------
# Short, cheap "schema digest" the LLM sees in the system prompt.
# Keeps prompt token count low — details come from tool calls.
# ---------------------------------------------------------------------------

def schema_digest(df: pd.DataFrame, domain: str) -> str:
    lines = [f"Domain: {domain}", f"Rows: {len(df)}  Columns: {len(df.columns)}", "Columns:"]
    for c in df.columns:
        s = df[c]
        if pd.api.types.is_numeric_dtype(s):
            kind = "numeric"
        elif pd.api.types.is_datetime64_any_dtype(s):
            kind = "datetime"
        elif pd.api.types.is_bool_dtype(s):
            kind = "bool"
        else:
            kind = "categorical"
        unique = s.nunique(dropna=True)
        lines.append(f"  - {c} ({kind}, {unique} unique, {s.isna().sum()} missing)")
    return "\n".join(lines)
