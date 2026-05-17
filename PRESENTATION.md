# Misbah Dynamic Intelligence Platform
### Product Overview — May 2026

---

## What It Is

Misbah is a web-based data intelligence platform that takes any CSV file, automatically identifies the industry it belongs to, and instantly produces a fully tailored analytics dashboard — complete charts, KPI cards, and an AI assistant you can have a conversation with about the data.

There is no configuration step. You do not tell the system what your data is about. It figures that out from the column names alone, then generates the right metrics and visualizations for that domain. A sales export looks different from a patient records extract or a logistics shipment log, and Misbah treats each one accordingly.

The end result: anyone in the organization — not just analysts — can upload a file, understand what the data says, and get answers to specific questions without writing SQL, building pivot tables, or waiting for a report.

---

## The Problem It Solves

Most organizations have data but not insight. CSV exports pile up from ERP systems, point-of-sale terminals, CRM platforms, payroll tools, and logistics software. Turning that data into something readable requires skilled analysts, expensive BI tools, or hours of manual work in Excel.

Even when a dashboard exists, it is generic. It does not know whether "amount" means revenue, loan balance, or dosage. It does not know which KPIs your industry tracks or which chart type best represents a time-series trend in your sector. The analyst has to build all of that by hand, every time.

Misbah removes that bottleneck entirely. Upload a file and the platform does the domain identification, metric selection, visualization design, and natural language query layer automatically.

---

## Where It Is Useful (Supported Domains)

The platform currently supports nine industry domains. Detection is automatic — no labeling required.

**Retail & E-commerce**
Picks up on columns like SKU, product, store, checkout, discount, promo, category, and transaction. Generates revenue totals, average order value, units sold, category distribution, and daily sales trends. Useful for merchandising teams, store managers, and operations leads reviewing POS exports.

**Finance**
Recognizes ledger, credit, debit, balance, loan, portfolio, equity, invoice, IBAN, SWIFT, and payment terminology. Relevant for accounting teams reviewing transaction exports, finance controllers analyzing spend data, or analysts working with cost center breakdowns.

**Healthcare**
Detects patient, diagnosis, ICD, symptom, admission, discharge, medication, prescription, BMI, and readmission columns. Useful for clinical operations teams, hospital administrators, and healthcare data analysts reviewing patient-level exports.

**Human Resources**
Identifies employee, headcount, attrition, payroll, tenure, salary, compensation, performance, rating, recruitment, and hire columns. HR directors and people analytics teams can upload workforce exports to get immediate headcount summaries, attrition breakdowns, and salary distributions.

**Education**
Recognizes student, enrollment, GPA, course, grade, curriculum, semester, graduation, and teacher terminology. Useful for academic administrators tracking cohort performance, enrollment trends, or program outcomes.

**Manufacturing**
Picks up on defect, yield, throughput, OEE, scrap, rework, production, assembly, machine, downtime, and batch columns. Plant managers and quality teams can drop in production run exports to immediately see efficiency and quality metrics.

**Logistics & Supply Chain**
Detects shipment, consignment, freight, ETD, ETA, carrier, warehouse, delivery, tracking, and route columns. Operations managers reviewing delivery performance or warehouse throughput get instant visibility into lead times and fulfillment rates.

**Marketing**
Recognizes campaign, CTR, CPC, CPM, ROAS, conversion, funnel, lead, engagement, subscriber, bounce, and segment columns. Marketing analysts and performance teams can load channel or campaign exports and immediately see spend efficiency, conversion trends, and audience breakdowns.

**Generic (Fallback)**
If column names do not match a known domain, the platform applies a universal analysis mode — it identifies numeric and categorical columns, computes basic descriptive statistics, and still produces a functional dashboard and chat interface.

---

## How It Is Built

Misbah is a full-stack application with a Python backend and a React frontend. The two communicate over a REST API.

### Backend

The backend is built on **FastAPI** (Python) and handles three responsibilities: processing uploaded files, generating analytics, and powering the AI chat.

**Data ingestion and cleaning**
When a file is uploaded, it is read into a pandas DataFrame, assigned a UUID, and stored in memory. A preprocessing pass runs automatically: date columns are parsed, numeric missing values are filled with column medians, categorical missing values are filled with the column mode, and outliers are flagged using IQR and Z-score methods.

**Domain detection**
The domain classifier examines column names — not values. Each column name is tokenized (splitting on camelCase, underscores, and hyphens) and matched against a weighted keyword dictionary for each domain. Keywords are split into primary (weight 2) and secondary (weight 1) tiers. A domain is selected when it accumulates 3 or more points across all columns. This approach is fast, runs with no LLM calls, and works even on empty or partially filled datasets.

**Metrics generation**
Once the domain is known, the platform computes the KPIs relevant to that sector. For retail data this means total revenue, average order value, and total units sold. For other domains, it falls back to computing descriptive statistics (mean, sum, count) for the first three numeric columns found. Each metric is returned with a value, a percentage change indicator (positive or negative), and a short description.

**Visualization generation**
Charts are built as configuration objects compatible with the Recharts library on the frontend. For retail data, the system produces a daily sales trend (line chart), a sales-by-category breakdown (bar chart), and a category distribution (pie chart). For unrecognized domains, it produces a scatter plot of the two most numerically significant columns. All chart configs include axis definitions, series metadata, and the domain's color palette so the frontend can render them without further processing.

**AI chat engine**
The chat layer is powered by the **Groq API** running the `llama-3.3-70b-versatile` model, orchestrated through **LangChain**. Each uploaded file gets its own stateful chatbot instance that retains conversation history for up to 20 messages.

The LLM is given a system prompt that is domain-aware ("You are a precise data analysis assistant working on a Healthcare dataset") and a compact schema digest of the dataset — column names, data types, unique value counts, and missing value counts — injected at the start of each session to keep token usage low.

The LLM has access to eight deterministic pandas tools it can call to answer questions:

- **describe_dataset** — returns shape, column metadata, and sample rows
- **column_stats** — returns mean, median, std, min, max, percentiles for numeric columns; top values and frequencies for categorical columns
- **value_counts** — frequency distribution for any categorical column
- **group_aggregate** — groups data by a column and aggregates a metric (sum, mean, count, median, min, max, nunique)
- **time_series** — resamples data by a date column at daily, weekly, monthly, quarterly, or annual frequency
- **top_n** — returns the top N rows sorted by a numeric column
- **correlations** — computes Pearson correlation between numeric columns and returns the strongest pairs
- **filter_aggregate** — applies AND-joined filter conditions then computes an aggregate

The LLM reasons over the question, calls whichever tools it needs (up to 5 rounds), and emits a final answer. The tool results also feed a statistics object (key-value pairs shown alongside the answer) and an optional visualization config (for charts that appear inline in the chat).

When the Groq API is unavailable, the platform falls back to a heuristic engine that detects the intent of the question (trend, category breakdown, or summary), identifies the relevant date and numeric columns, and computes results directly with pandas.

### Frontend

The frontend is built with **React 18** and **Vite**, styled with **Tailwind CSS**, and uses **Recharts** and **D3.js** for interactive charts. Application state is managed with **Redux Toolkit**.

**Upload page**
The entry point renders a drag-and-drop upload zone alongside a three-step explainer. On successful upload, the page transitions to the dashboard.

**Domain Header**
The top section of the dashboard shows the detected domain's icon, name, and tagline, a live status badge, the dataset's row and column counts, and action buttons (export, more options). The header is fully themed to the detected domain using a color palette registered for each of the nine sectors.

**Metrics Overview**
A responsive grid of KPI cards. Each card shows the metric name, a large formatted value, a change badge (percentage increase or decrease), a short description, and a sparkline — a small SVG chart showing the actual distribution of the underlying data column. Cards use the backend-provided metrics when available and fall back to the frontend's own DataAnalyzer for computed KPIs.

**Visualization Grid**
A two-column chart grid showing an area chart (primary metric over time), a bar chart (metric by primary category), a pie/donut chart (secondary category distribution), and a second bar chart for an alternate metric-category combination. Each chart card includes an icon, title, subtitle, a contextual badge (e.g., "Top 6", "Last 12"), and a custom tooltip styled to the domain theme.

**Chat Panel**
A floating widget fixed to the bottom-right corner of the dashboard. It opens into a popup (~380 × 560px) with an expand option for longer conversations. The panel shows conversation history with user messages right-aligned and AI messages left-aligned. AI responses are rendered as Markdown — supporting bullet lists, tables, code blocks, and blockquotes. Tool-result statistics appear as a styled table beneath each AI message. Inline charts (line or bar) appear when the AI returns visualization data. The panel also shows four domain-aware suggested questions when the session starts to help users get oriented quickly.

### Domain Theming

Every visual element adapts to the detected domain through a central theme registry. Each of the nine domains has a defined icon (from Lucide React), a color gradient, a chart palette of eight colors, and grid stroke tints. These values propagate through the DomainHeader, MetricsOverview, VisualizationGrid, and ChatPanel automatically — so a retail dashboard looks warm and pink-toned while a logistics dashboard is cyan and teal, and a finance dashboard is amber and orange.

---

## Feature Summary

| Feature | Detail |
|---|---|
| **Auto domain detection** | Column-name heuristics across 9 industry sectors; no user input required |
| **Domain-specific KPIs** | Metric selection and formatting tailored per sector |
| **Interactive charts** | Area, bar, pie, and line charts; responsive grid layout |
| **Sparklines on KPI cards** | Small inline charts showing actual data distribution |
| **AI chat — natural language** | LLaMA 3.3 70B via Groq; answers grounded in tool results, not hallucinations |
| **8 analytics tools** | Time-series, groupby, top-N, correlations, filter+aggregate, value counts |
| **Conversation memory** | Up to 20-message history per dataset session |
| **Inline chat visualizations** | Charts rendered inside chat responses when relevant |
| **Suggested questions** | Domain-aware prompts surfaced at session start |
| **Fallback analytics** | Heuristic engine operates without LLM if API is unavailable |
| **Data preprocessing** | Auto date parsing, median/mode imputation, outlier detection |
| **Full domain theming** | Color palettes, icons, and typography per sector |
| **Responsive design** | Adapts from mobile to desktop layouts |
| **Markdown chat rendering** | Lists, tables, code, and blockquotes in AI responses |

---

## Data Flow

```
1. User uploads CSV
        ↓
2. Backend saves file, loads into pandas, preprocesses
        ↓
3. Domain detection runs on column names → identifies sector
        ↓
4. Metrics generated (domain-specific KPIs)
   Visualizations generated (Recharts-compatible configs)
        ↓
5. Dashboard renders:
   - Domain-themed header + status
   - KPI cards with sparklines
   - Chart grid (area / bar / pie)
   - Chat panel (floating, bottom-right)
        ↓
6. User asks a question in chat
        ↓
7. LLM (LLaMA 3.3 70B) receives domain-aware prompt + schema digest
   LLM calls tools (groupby, time-series, correlations, etc.)
   Tool results feed back to LLM for reasoning
        ↓
8. LLM emits:
   - Answer (Markdown text)
   - Statistics table (key=value pairs)
   - Optional inline chart
        ↓
9. Conversation history retained for follow-up questions
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts + D3.js |
| State management | Redux Toolkit |
| Backend framework | FastAPI (Python) |
| Data processing | Pandas, NumPy, scikit-learn |
| Forecasting | Prophet, statsmodels |
| LLM inference | Groq API (llama-3.3-70b-versatile) |
| LLM orchestration | LangChain |
| Caching | Redis |
| Storage | SQLite + in-memory (per session) |

---

## Current Status & Known Gaps

The platform is fully operational for retail data end-to-end. Domain detection, metrics, visualizations, and AI chat all work. For other sectors, domain detection and theming are complete, but domain-specific KPI generation is partially stubbed — Finance, Healthcare, Manufacturing, and others fall back to generic numeric summaries rather than industry-tuned metrics. The Analytics page (second navigation item) is scaffolded but not yet fully implemented. The export button is present in the UI but not yet wired to a backend export endpoint.

These are the next areas of active development: expanding domain-specific metrics for all nine sectors, completing the Analytics page with trend analysis and advanced filtering, adding Excel/JSON file support, and implementing the CSV export function.
