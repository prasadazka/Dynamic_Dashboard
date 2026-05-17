// ---------------------------------------------------------------------------
// Central sector / industry theme registry.
//
// Every dashboard surface (header, KPI cards, charts, chat) pulls its
// colors, gradient palette, hero icon and chart palette from this map —
// so the whole page feels like ONE product per domain, not a mashup.
//
// Each theme defines:
//   id              – domain key (matches backend detection)
//   label           – display label
//   tagline         – sub-headline
//   Icon            – react-icons component used for the hero tile
//   accentFrom/To   – two hex colors driving all gradients for the sector
//   ringTint        – soft tailwind ring color (matches the accent family)
//   pillTint        – soft tailwind background tint for KPI icon tiles
//   pillText        – text color for KPI icon tiles
//   chartPalette    – ordered hex palette used by ALL charts in the sector
//   chartGridStroke – grid line color (subtle, picked per sector)
//   fontTracking    – letter-spacing style applied to big headings
// ---------------------------------------------------------------------------
import {
  FiShoppingBag,
  FiHeart,
  FiUsers,
  FiDollarSign,
  FiBookOpen,
  FiTool,
  FiTruck,
  FiTrendingUp,
  FiBarChart2,
} from 'react-icons/fi';

export const DOMAIN_THEMES = {
  Retail: {
    id: 'Retail',
    label: 'Retail',
    tagline: 'Sales, products & customer insights',
    Icon: FiShoppingBag,
    accentFrom: '#be185d',        // pink-700 — refined berry, not red
    accentTo:   '#9d174d',        // pink-800
    ringTint:   'ring-pink-100',
    pillTint:   'bg-pink-50',
    pillText:   'text-pink-700',
    chartPalette: ['#be185d', '#0f766e', '#f59e0b', '#0ea5e9', '#14b8a6', '#10b981', '#ec4899', '#84cc16'],
    chartGridStroke: '#fce7f3',
    fontTracking: 'tracking-tight',
  },
  Healthcare: {
    id: 'Healthcare',
    label: 'Healthcare',
    tagline: 'Patient, diagnosis & cost analytics',
    Icon: FiHeart,
    accentFrom: '#10b981',        // emerald-500
    accentTo:   '#0d9488',        // teal-600
    ringTint:   'ring-emerald-100',
    pillTint:   'bg-emerald-50',
    pillText:   'text-emerald-600',
    chartPalette: ['#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#84cc16', '#f59e0b', '#ef4444', '#ec4899'],
    chartGridStroke: '#d1fae5',
    fontTracking: 'tracking-normal',
  },
  HR: {
    id: 'HR',
    label: 'HR',
    tagline: 'Workforce, compensation & performance',
    Icon: FiUsers,
    accentFrom: '#0f766e',        // teal-700
    accentTo:   '#334155',        // slate-700
    ringTint:   'ring-teal-100',
    pillTint:   'bg-teal-50',
    pillText:   'text-teal-700',
    chartPalette: ['#0f766e', '#14b8a6', '#334155', '#64748b', '#f59e0b', '#10b981', '#06b6d4', '#ec4899'],
    chartGridStroke: '#ccfbf1',
    fontTracking: 'tracking-tight',
  },
  Finance: {
    id: 'Finance',
    label: 'Finance',
    tagline: 'Transactions, accounts & cash flow',
    Icon: FiDollarSign,
    accentFrom: '#f59e0b',        // amber-500
    accentTo:   '#ea580c',        // orange-600
    ringTint:   'ring-amber-100',
    pillTint:   'bg-amber-50',
    pillText:   'text-amber-600',
    chartPalette: ['#f59e0b', '#ea580c', '#d97706', '#10b981', '#0ea5e9', '#14b8a6', '#ef4444', '#84cc16'],
    chartGridStroke: '#fef3c7',
    fontTracking: 'tracking-tight',
  },
  Education: {
    id: 'Education',
    label: 'Education',
    tagline: 'Students, courses & academic performance',
    Icon: FiBookOpen,
    accentFrom: '#0ea5e9',        // sky-500
    accentTo:   '#0d9488',        // teal-600
    ringTint:   'ring-sky-100',
    pillTint:   'bg-sky-50',
    pillText:   'text-sky-600',
    chartPalette: ['#0ea5e9', '#14b8a6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'],
    chartGridStroke: '#e0f2fe',
    fontTracking: 'tracking-normal',
  },
  Manufacturing: {
    id: 'Manufacturing',
    label: 'Manufacturing',
    tagline: 'Production, quality & supply chain',
    Icon: FiTool,
    accentFrom: '#475569',        // slate-600
    accentTo:   '#1f2937',        // gray-800
    ringTint:   'ring-slate-200',
    pillTint:   'bg-slate-50',
    pillText:   'text-slate-700',
    chartPalette: ['#475569', '#64748b', '#ea580c', '#0ea5e9', '#10b981', '#f59e0b', '#14b8a6', '#ef4444'],
    chartGridStroke: '#e2e8f0',
    fontTracking: 'tracking-wide',
  },
  Logistics: {
    id: 'Logistics',
    label: 'Logistics',
    tagline: 'Shipments, routes & delivery tracking',
    Icon: FiTruck,
    accentFrom: '#06b6d4',        // cyan-500
    accentTo:   '#0f766e',        // teal-700
    ringTint:   'ring-cyan-100',
    pillTint:   'bg-cyan-50',
    pillText:   'text-cyan-600',
    chartPalette: ['#06b6d4', '#0ea5e9', '#14b8a6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'],
    chartGridStroke: '#cffafe',
    fontTracking: 'tracking-tight',
  },
  Marketing: {
    id: 'Marketing',
    label: 'Marketing',
    tagline: 'Campaigns, funnels & conversion analytics',
    Icon: FiTrendingUp,
    accentFrom: '#2563eb',        // blue-600
    accentTo:   '#1d4ed8',        // blue-700
    ringTint:   'ring-blue-100',
    pillTint:   'bg-blue-50',
    pillText:   'text-blue-700',
    chartPalette: ['#2563eb', '#3b82f6', '#60a5fa', '#14b8a6', '#10b981', '#f59e0b', '#06b6d4', '#0ea5e9'],
    chartGridStroke: '#dbeafe',
    fontTracking: 'tracking-tight',
  },
  Generic: {
    id: 'Generic',
    label: 'Data',
    tagline: 'Intelligent insights from your dataset',
    Icon: FiBarChart2,
    accentFrom: '#0ea5e9',        // sky-500
    accentTo:   '#0d9488',        // teal-600
    ringTint:   'ring-sky-100',
    pillTint:   'bg-sky-50',
    pillText:   'text-sky-600',
    chartPalette: ['#0ea5e9', '#14b8a6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'],
    chartGridStroke: '#e2e8f0',
    fontTracking: 'tracking-normal',
  },
};

export const getTheme = (domain) => DOMAIN_THEMES[domain] || DOMAIN_THEMES.Generic;

// Solid sector fill — returns a single accent color (no gradients / mixed hues).
// Kept under the old `gradientCss` name so every call site is automatically
// flattened without sweeping edits elsewhere.
export const gradientCss = (theme) => theme.accentFrom;

// Explicit helper for code that wants to be clear about using a solid color.
export const solidCss = (theme) => theme.accentFrom;
