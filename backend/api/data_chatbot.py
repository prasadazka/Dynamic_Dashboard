"""
DataChatbot — LLM-driven chat over an uploaded DataFrame.

Design
------
- The LLM (Groq) is given a short schema digest of the dataset plus a set of
  deterministic pandas tools (see ``chat_tools.py``) it can call.
- The model reasons and calls tools; we execute them on the real DataFrame
  and feed results back. The final answer is what the model emits when it
  stops calling tools.
- Per-session (per-file) conversation history is kept so follow-up questions
  ("and by category?") work naturally.
- If anything in the LLM path fails, we fall back to a deterministic
  summary so the UI never sees a hard error.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_groq import ChatGroq

from backend.api.chat_tools import (
    TOOL_SCHEMAS,
    execute_tool,
    schema_digest,
    visualization_from_tool_result,
)
from backend.config import GROQ_API_KEY, GROQ_MODEL

logger = logging.getLogger(__name__)

_MAX_TOOL_ROUNDS = 5         # cap on LLM <-> tool loops per user query
_MAX_HISTORY_MESSAGES = 20   # last N messages kept in conversation memory


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

_SYSTEM_TEMPLATE = """You are a precise data analysis assistant working on a {domain} dataset.

Your job is to answer the user's questions about the data **using the tools provided**.
Do NOT guess or fabricate numbers. Any numeric claim must come from a tool result.

Available tools:
- describe_dataset: overview of shape, columns, dtypes, sample rows
- column_stats: stats for a single column
- value_counts: frequency distribution of a categorical column
- group_aggregate: "X by Y" questions (sum/mean/median/count/etc.)
- time_series: trends over time (resampled by day/week/month/quarter/year)
- top_n: biggest/smallest rows by a numeric column
- correlations: strongest correlations between numeric columns
- filter_aggregate: "how many / total X where Y" questions

How to respond:
1. If the question needs data, call one or more tools first.
2. After tools return, write a concise answer (2-5 sentences) grounded in the numbers.
3. Include exact figures with appropriate formatting (currency for money, % for rates).
4. If a tool errors (ok=false), try a different column or tool — don't invent data.
5. Prefer one or two well-chosen tool calls over many.

Dataset schema:
{schema}
"""


# ---------------------------------------------------------------------------
# DataChatbot
# ---------------------------------------------------------------------------

class DataChatbot:
    """
    Stateful chatbot tied to a single uploaded DataFrame. Holds:
    - conversation history (list[BaseMessage])
    - the LLM client (with tools bound)
    - the DataFrame + detected domain
    """

    def __init__(self, df: pd.DataFrame, domain: str):
        self.df = df
        self.domain = domain
        self.history: List[BaseMessage] = []

        self.llm_available = False
        self.llm = None
        try:
            if GROQ_API_KEY and GROQ_API_KEY != "your_api_key_here":
                base_llm = ChatGroq(
                    groq_api_key=GROQ_API_KEY,
                    model_name=GROQ_MODEL,
                    temperature=0.1,
                )
                # Bind tools so the model can call them via function calling
                self.llm = base_llm.bind_tools(TOOL_SCHEMAS)
                self.llm_available = True
                logger.info("Groq LLM initialized with %d tools (model=%s)",
                            len(TOOL_SCHEMAS), GROQ_MODEL)
            else:
                logger.warning("No Groq API key; chat will use fallback mode")
        except Exception as e:
            logger.error("Failed to initialize Groq client: %s", e)
            self.llm_available = False

    # ------------------------------------------------------------------
    # Public entrypoint
    # ------------------------------------------------------------------

    def process_query(self, query: str) -> Dict[str, Any]:
        """
        Answer a user question. Always returns:
            {"answer": str, "statistics": Dict[str, str], "visualization": Optional[dict]}
        """
        if not self.llm_available or self.llm is None:
            return self._fallback_process_query(query)

        try:
            return self._llm_process_query(query)
        except Exception as e:
            logger.exception("LLM chat pipeline failed: %s", e)
            result = self._fallback_process_query(query)
            # Surface the error softly so the user knows the LLM was skipped
            result["answer"] = (
                f"(fell back to basic stats — LLM error: {type(e).__name__})\n\n"
                + result.get("answer", "")
            )
            return result

    def reset_history(self) -> None:
        """Clear conversation memory (e.g. when a new file is uploaded)."""
        self.history = []

    # ------------------------------------------------------------------
    # LLM pipeline
    # ------------------------------------------------------------------

    def _llm_process_query(self, query: str) -> Dict[str, Any]:
        system = SystemMessage(
            content=_SYSTEM_TEMPLATE.format(
                domain=self.domain,
                schema=schema_digest(self.df, self.domain),
            )
        )

        # Build the message list: system + prior history + new user query
        messages: List[BaseMessage] = [system] + self.history + [HumanMessage(content=query)]

        collected_tool_results: List[Dict[str, Any]] = []
        final_ai_message: Optional[AIMessage] = None

        for round_idx in range(_MAX_TOOL_ROUNDS):
            ai_msg: AIMessage = self.llm.invoke(messages)
            messages.append(ai_msg)

            tool_calls = getattr(ai_msg, "tool_calls", None) or []
            if not tool_calls:
                final_ai_message = ai_msg
                break

            logger.info("Round %d: LLM requested %d tool call(s)",
                        round_idx + 1, len(tool_calls))

            for call in tool_calls:
                name = call.get("name")
                args = call.get("args") or {}
                call_id = call.get("id") or name

                result = execute_tool(name, self.df, self.domain, args)
                collected_tool_results.append({"name": name, "args": args, "result": result})

                messages.append(ToolMessage(
                    content=json.dumps(result, default=str),
                    tool_call_id=call_id,
                    name=name,
                ))
        else:
            # Loop exhausted without a tool-free answer; ask model to summarize
            logger.warning("Tool-call loop hit max rounds (%d); asking for summary",
                           _MAX_TOOL_ROUNDS)
            messages.append(HumanMessage(
                content="Please stop calling tools and give a final concise answer "
                        "based on the results you already have."
            ))
            final_ai_message = self.llm.invoke(messages)
            messages.append(final_ai_message)

        answer_text = (final_ai_message.content if final_ai_message else "").strip() \
            or "I couldn't produce an answer for that question."

        # Update persistent history (don't store the system message — it's rebuilt each turn)
        self.history.append(HumanMessage(content=query))
        self.history.append(AIMessage(content=answer_text))
        self._prune_history()

        return {
            "answer": answer_text,
            "statistics": self._statistics_from_tool_results(collected_tool_results),
            "visualization": self._visualization_from_tool_results(collected_tool_results),
        }

    def _prune_history(self) -> None:
        if len(self.history) > _MAX_HISTORY_MESSAGES:
            self.history = self.history[-_MAX_HISTORY_MESSAGES:]

    # ------------------------------------------------------------------
    # Shape tool results into UI-friendly {statistics, visualization}
    # ------------------------------------------------------------------

    def _statistics_from_tool_results(
        self, tool_results: List[Dict[str, Any]]
    ) -> Dict[str, str]:
        """Distill tool outputs into a compact Key=Value map for the sidebar."""
        stats: Dict[str, str] = {}

        def fmt(v: Any) -> str:
            if v is None:
                return "—"
            if isinstance(v, float):
                return f"{v:,.2f}" if abs(v) >= 1 or v == 0 else f"{v:.4f}"
            if isinstance(v, int):
                return f"{v:,}"
            return str(v)

        for tr in tool_results:
            name = tr["name"]
            res = tr["result"]
            if not res.get("ok"):
                continue

            if name == "describe_dataset":
                stats.setdefault("Rows", fmt(res.get("row_count")))
                stats.setdefault("Columns", fmt(res.get("column_count")))

            elif name == "column_stats":
                col = res.get("column", "value")
                if "mean" in res and res["mean"] is not None:
                    stats[f"{col} mean"] = fmt(res["mean"])
                    stats[f"{col} median"] = fmt(res.get("median"))
                    stats[f"{col} min"] = fmt(res.get("min"))
                    stats[f"{col} max"] = fmt(res.get("max"))
                elif res.get("top_values"):
                    for tv in res["top_values"][:3]:
                        stats[f"{col}={tv['value']}"] = f"{fmt(tv['count'])} ({tv['pct']}%)"

            elif name == "value_counts":
                col = res.get("column", "value")
                for d in (res.get("data") or [])[:5]:
                    stats[f"{col}={d['value']}"] = f"{fmt(d['count'])} ({d['pct']}%)"

            elif name == "group_aggregate":
                agg = res.get("agg", "sum")
                metric = res.get("metric", "value")
                for d in (res.get("data") or [])[:5]:
                    stats[f"{agg}({metric}) · {d['group']}"] = fmt(d["value"])

            elif name == "time_series":
                pts = res.get("data") or []
                if pts:
                    stats[f"Periods ({res.get('freq', 'M')})"] = fmt(len(pts))
                    stats[f"First {res.get('metric')}"] = f"{pts[0]['period']}: {fmt(pts[0]['value'])}"
                    stats[f"Last {res.get('metric')}"] = f"{pts[-1]['period']}: {fmt(pts[-1]['value'])}"

            elif name == "top_n":
                col = res.get("column", "value")
                rows = res.get("data") or []
                stats[f"{res.get('direction', 'top')} by {col}"] = f"{fmt(len(rows))} rows"

            elif name == "correlations":
                for p in (res.get("pairs") or [])[:3]:
                    stats[f"corr({p['a']}, {p['b']})"] = fmt(p["corr"])

            elif name == "filter_aggregate":
                stats["Matched rows"] = fmt(res.get("matched_rows"))
                if res.get("aggregate") is not None:
                    stats[f"{res.get('agg')}({res.get('metric')})"] = fmt(res["aggregate"])

        # Cap so the sidebar stays readable
        if len(stats) > 12:
            stats = dict(list(stats.items())[:12])
        return stats

    def _visualization_from_tool_results(
        self, tool_results: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        # Prefer time_series > group_aggregate > value_counts (by informativeness)
        priority = ("time_series", "group_aggregate", "value_counts")
        by_name: Dict[str, Dict[str, Any]] = {}
        for tr in tool_results:
            by_name.setdefault(tr["name"], tr["result"])

        for name in priority:
            if name in by_name:
                viz = visualization_from_tool_result(name, by_name[name])
                if viz:
                    return viz
        return None

    # ------------------------------------------------------------------
    # Deterministic fallback — used when LLM is unavailable / errors out.
    # Domain-agnostic: works on any CSV.
    # ------------------------------------------------------------------

    def _fallback_process_query(self, query: str) -> Dict[str, Any]:
        q = query.lower()
        df = self.df

        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
        date_cols = [c for c in df.columns if pd.api.types.is_datetime64_any_dtype(df[c])]
        if not date_cols:
            for c in df.columns:
                if any(t in c.lower() for t in ("date", "time", "day", "month", "year")):
                    date_cols.append(c)

        stats: Dict[str, str] = {
            "Rows": f"{len(df):,}",
            "Columns": f"{len(df.columns):,}",
            "Numeric columns": str(len(numeric_cols)),
            "Categorical columns": str(len(cat_cols)),
        }

        # Trend over time
        if ("trend" in q or "over time" in q) and date_cols and numeric_cols:
            dcol, mcol = date_cols[0], numeric_cols[0]
            try:
                work = df.assign(_dt=pd.to_datetime(df[dcol], errors="coerce")).dropna(subset=["_dt"])
                series = work.set_index("_dt")[mcol].resample("M").sum().dropna()
                if len(series) >= 2:
                    direction = "increasing" if series.iloc[-1] > series.iloc[0] else "decreasing"
                    stats[f"{mcol} first period"] = f"{series.index[0].strftime('%Y-%m')}: {series.iloc[0]:,.2f}"
                    stats[f"{mcol} last period"] = f"{series.index[-1].strftime('%Y-%m')}: {series.iloc[-1]:,.2f}"
                    viz = {
                        "type": "line",
                        "data": [{"month": idx.strftime("%Y-%m"), "sum": float(v)} for idx, v in series.items()],
                        "xAxis": "month",
                        "yAxis": mcol,
                        "title": f"{mcol} over time",
                    }
                    return {
                        "answer": f"{mcol} shows a {direction} trend — "
                                  f"{series.iloc[0]:,.2f} at {series.index[0].strftime('%Y-%m')} "
                                  f"vs {series.iloc[-1]:,.2f} at {series.index[-1].strftime('%Y-%m')}.",
                        "statistics": stats,
                        "visualization": viz,
                    }
            except Exception as e:
                logger.debug("fallback trend failed: %s", e)

        # Top categories
        if cat_cols and numeric_cols:
            cat_col, num_col = cat_cols[0], numeric_cols[0]
            try:
                top = df.groupby(cat_col)[num_col].sum().sort_values(ascending=False).head(5)
                for k, v in top.items():
                    stats[f"sum({num_col}) · {k}"] = f"{v:,.2f}"
                viz = {
                    "type": "bar",
                    "data": [{cat_col: str(k), num_col: float(v)} for k, v in top.items()],
                    "xAxis": cat_col,
                    "yAxis": num_col,
                    "title": f"{num_col} by {cat_col}",
                }
                return {
                    "answer": (
                        f"Here's a basic snapshot of your {self.domain} data. "
                        f"The highest {num_col} by {cat_col} is "
                        f"{top.index[0]} at {top.iloc[0]:,.2f}."
                    ),
                    "statistics": stats,
                    "visualization": viz,
                }
            except Exception as e:
                logger.debug("fallback group failed: %s", e)

        # Pure numeric summary
        if numeric_cols:
            for col in numeric_cols[:3]:
                stats[f"{col} mean"] = f"{df[col].mean():,.2f}"
            return {
                "answer": (
                    f"Basic summary of your {self.domain} dataset "
                    f"({len(df):,} rows, {len(df.columns):,} columns). "
                    f"Ask something specific like 'top 5 by <column>' or "
                    f"'average <column> by <group>' for deeper insights."
                ),
                "statistics": stats,
                "visualization": None,
            }

        return {
            "answer": f"Dataset has {len(df):,} rows and {len(df.columns):,} columns. "
                      f"Configure GROQ_API_KEY in backend/.env for richer answers.",
            "statistics": stats,
            "visualization": None,
        }
