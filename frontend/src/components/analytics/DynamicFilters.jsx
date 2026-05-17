import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { FiFilter, FiRefreshCw, FiCalendar, FiList, FiSliders } from 'react-icons/fi'
import { getTheme } from '../../utils/domainTheme'

// Fully-controlled filter panel.
// Parent owns `filters` state; children derive their display entirely from
// `value` props so "Reset All" actually resets the UI, and nothing is set
// until the user interacts (so the active-filter count stays honest).
const DynamicFilters = ({ data, analyzer, filters = {}, onFilterChange, onResetAll }) => {
  const { domain } = useSelector((state) => state.data)
  const theme = getTheme(domain)

  const filterableColumns = useMemo(() => {
    if (!analyzer) return []
    const columns = []
    analyzer.dateColumns.slice(0, 1).forEach((c) => {
      if (!columns.includes(c)) columns.push(c)
    })
    analyzer.categoricalColumns.slice(0, 2).forEach((c) => {
      if (!columns.includes(c) && !analyzer.idColumns.includes(c)) columns.push(c)
    })
    analyzer.numericColumns.slice(0, 2).forEach((c) => {
      if (!columns.includes(c) && !analyzer.idColumns.includes(c)) columns.push(c)
    })
    return columns
  }, [analyzer])

  if (!analyzer || filterableColumns.length === 0) return null

  const iconForType = (type) => {
    if (type === 'date') return FiCalendar
    if (type === 'categorical') return FiList
    if (type === 'numeric') return FiSliders
    return FiFilter
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div
            className={`h-9 w-9 rounded-xl flex items-center justify-center ring-4 ${theme.pillTint} ${theme.pillText} ${theme.ringTint}`}
          >
            <FiFilter className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 tracking-tight">Data Filters</h2>
            <p className="text-xs text-gray-500">
              Refine the {theme.label.toLowerCase()} dataset in real time
            </p>
          </div>
        </div>
        <button
          onClick={onResetAll}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition hover:opacity-90"
          style={{ color: theme.accentTo, backgroundColor: `${theme.accentFrom}15` }}
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          Reset All
        </button>
      </div>

      {/* Filter grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
        {filterableColumns.map((column) => {
          const type = analyzer.columnTypes[column]
          const TypeIcon = iconForType(type)
          const value = filters[column] ?? null
          return (
            <div
              key={column}
              className="bg-gray-50/60 border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition"
            >
              <div className="flex items-center gap-2 mb-3">
                <TypeIcon className="w-3.5 h-3.5" style={{ color: theme.accentTo }} />
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider truncate">
                  {analyzer.formatColumnName(column)}
                </h3>
              </div>

              {type === 'date' && (
                <DateFilter
                  column={column}
                  data={data}
                  value={value}
                  theme={theme}
                  onChange={(v) => onFilterChange(column, v)}
                />
              )}
              {type === 'categorical' && (
                <CategoryFilter
                  column={column}
                  data={data}
                  value={value}
                  theme={theme}
                  onChange={(v) => onFilterChange(column, v)}
                />
              )}
              {type === 'numeric' && (
                <NumericFilter
                  column={column}
                  data={data}
                  value={value}
                  theme={theme}
                  onChange={(v) => onFilterChange(column, v)}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Date filter — range of two date inputs, bounded by the column's min/max
// ---------------------------------------------------------------------------
const DateFilter = ({ column, data, value, theme, onChange }) => {
  const { min, max } = useMemo(() => {
    if (!data || !column) return { min: null, max: null }
    const dates = data
      .map((row) => new Date(row[column]))
      .filter((d) => !isNaN(d.getTime()))
    if (dates.length === 0) return { min: null, max: null }
    return {
      min: new Date(Math.min(...dates.map((d) => d.getTime()))),
      max: new Date(Math.max(...dates.map((d) => d.getTime()))),
    }
  }, [data, column])

  if (!min || !max) return null

  const startDate = value?.startDate ? new Date(value.startDate) : min
  const endDate = value?.endDate ? new Date(value.endDate) : max

  const toISO = (d) => d.toISOString().split('T')[0]

  const handleDateChange = (type, e) => {
    if (!e.target.value) return
    const date = new Date(e.target.value)
    if (isNaN(date.getTime())) return
    if (type === 'start') {
      // Clamp so start never exceeds end
      const clamped = date > endDate ? endDate : date
      onChange({ startDate: clamped, endDate })
    } else {
      const clamped = date < startDate ? startDate : date
      onChange({ startDate, endDate: clamped })
    }
  }

  const ringStyle = { '--tw-ring-color': theme.accentFrom }

  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">
          Start
        </label>
        <input
          type="date"
          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2"
          style={ringStyle}
          value={toISO(startDate)}
          min={toISO(min)}
          max={toISO(max)}
          onChange={(e) => handleDateChange('start', e)}
        />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">
          End
        </label>
        <input
          type="date"
          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2"
          style={ringStyle}
          value={toISO(endDate)}
          min={toISO(min)}
          max={toISO(max)}
          onChange={(e) => handleDateChange('end', e)}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Category filter (chips) — fully controlled via `value` array
// ---------------------------------------------------------------------------
const CategoryFilter = ({ column, data, value, theme, onChange }) => {
  const available = useMemo(() => {
    if (!data || !column) return []
    return [...new Set(data.map((item) => item[column]))].filter(
      (v) => v !== null && v !== undefined && v !== ''
    )
  }, [data, column])

  const selected = Array.isArray(value) ? value : []

  const toggle = (category) => {
    const next = selected.includes(category)
      ? selected.filter((c) => c !== category)
      : [...selected, category]
    onChange(next.length > 0 ? next : null)
  }

  if (available.length === 0) return null

  return (
    <div className="max-h-40 overflow-y-auto pr-1">
      <div className="flex flex-wrap gap-1.5">
        {available.map((category) => {
          const active = selected.includes(category)
          const raw = String(category)
          const label = raw.length > 18 ? `${raw.substring(0, 18)}…` : raw
          return (
            <button
              key={raw}
              type="button"
              onClick={() => toggle(category)}
              className="text-[11px] px-2.5 py-1 rounded-full border transition font-medium"
              style={
                active
                  ? {
                      backgroundColor: theme.accentFrom,
                      borderColor: theme.accentFrom,
                      color: 'white',
                    }
                  : {
                      backgroundColor: 'white',
                      borderColor: '#e5e7eb',
                      color: '#4b5563',
                    }
              }
              title={raw}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Numeric range filter — two bounded sliders, clamped so they can't cross
// ---------------------------------------------------------------------------
const NumericFilter = ({ column, data, value, theme, onChange }) => {
  const { min, max } = useMemo(() => {
    if (!data || !column) return { min: null, max: null }
    const values = data.map((row) => parseFloat(row[column])).filter((v) => !isNaN(v) && isFinite(v))
    if (values.length === 0) return { min: null, max: null }
    return { min: Math.min(...values), max: Math.max(...values) }
  }, [data, column])

  if (min === null || max === null) return null

  const lower = value?.min ?? min
  const upper = value?.max ?? max

  const range = max - min
  const step = range === 0 ? 1 : range < 10 ? 0.1 : 1
  const fmt = (v) => (v == null ? '' : Number(v).toFixed(step < 1 ? 1 : 0))

  const handleChange = (type, e) => {
    const v = parseFloat(e.target.value)
    if (isNaN(v)) return
    if (type === 'lower') {
      const clamped = Math.min(v, upper)
      onChange({ min: clamped, max: upper })
    } else {
      const clamped = Math.max(v, lower)
      onChange({ min: lower, max: clamped })
    }
  }

  const rangeStyle = { accentColor: theme.accentFrom }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] font-semibold text-gray-700">
        <span>{fmt(lower)}</span>
        <span className="text-gray-400">—</span>
        <span>{fmt(upper)}</span>
      </div>
      <div className="space-y-1.5">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lower}
          onChange={(e) => handleChange('lower', e)}
          className="w-full"
          style={rangeStyle}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={upper}
          onChange={(e) => handleChange('upper', e)}
          className="w-full"
          style={rangeStyle}
        />
      </div>
    </div>
  )
}

export default DynamicFilters
