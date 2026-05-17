import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  FiAlertCircle,
  FiLoader,
  FiDatabase,
  FiColumns,
  FiFilter,
  FiLayers,
} from 'react-icons/fi'
import { DataAnalyzer } from '../../utils/DataAnalyzer'
import { getTheme, gradientCss } from '../../utils/domainTheme'
import DynamicKpiCards from '../../components/analytics/DynamicKpiCards'
import DynamicFilters from '../../components/analytics/DynamicFilters'
import DynamicCharts from '../../components/analytics/DynamicCharts'
import DomainInsights from '../../components/analytics/DomainInsights'

const Analytics = () => {
  const { data, domain, loading, error } = useSelector((state) => state.data)
  const navigate = useNavigate()

  const [analyzer, setAnalyzer] = useState(null)
  const [filteredData, setFilteredData] = useState([])
  const [dynamicKpis, setDynamicKpis] = useState([])
  const [dynamicVisualizations, setDynamicVisualizations] = useState([])
  const [importantColumns, setImportantColumns] = useState([])
  const [filters, setFilters] = useState({})

  // Backend is the authority on the detected domain — trust the value stored
  // in Redux over the DataAnalyzer's local heuristic so every themed surface
  // on this page (hero, filters, KPIs, charts) agrees on the sector.
  const inferredDomain = domain || 'Generic'
  const theme = getTheme(inferredDomain)
  const HeroIcon = theme.Icon

  // Stable: columns and the "base" analyzer are derived from the full
  // dataset so results don't flip when the user narrows filters.
  useEffect(() => {
    if (!data && !loading) {
      navigate('/')
      return
    }
    if (data) {
      const dataAnalyzer = new DataAnalyzer(data)
      // Pin the analyzer to the backend-detected domain so its switch-case
      // logic (KPIs, visualizations, insights) runs the right branch.
      if (domain) dataAnalyzer.domain = domain
      setAnalyzer(dataAnalyzer)
      setImportantColumns(dataAnalyzer.importantFields)
      setFilteredData(data)
    }
  }, [data, domain, loading, navigate])

  // Reactive: KPIs and charts rebuild whenever the filtered slice changes.
  useEffect(() => {
    if (!filteredData || filteredData.length === 0) {
      setDynamicKpis([])
      setDynamicVisualizations([])
      return
    }
    const a = new DataAnalyzer(filteredData)
    if (domain) a.domain = domain
    setDynamicKpis(a.generateKPIs())
    setDynamicVisualizations(a.generateVisualizations())
  }, [filteredData, domain])

  useEffect(() => {
    if (!data) {
      setFilteredData([])
      return
    }
    if (!analyzer || Object.keys(filters).length === 0) {
      setFilteredData(data)
      return
    }
    let filtered = data
    Object.entries(filters).forEach(([column, filterValue]) => {
      if (filterValue == null) return
      const type = analyzer.columnTypes[column]
      if (type === 'date') {
        const { startDate, endDate } = filterValue
        if (startDate && endDate) {
          const start = new Date(startDate).getTime()
          const end = new Date(endDate).getTime()
          filtered = filtered.filter((item) => {
            const t = new Date(item[column]).getTime()
            return !isNaN(t) && t >= start && t <= end
          })
        }
      } else if (type === 'categorical') {
        if (Array.isArray(filterValue) && filterValue.length > 0) {
          filtered = filtered.filter((item) => filterValue.includes(item[column]))
        }
      } else if (type === 'numeric') {
        const { min, max } = filterValue
        if (min !== undefined && max !== undefined) {
          filtered = filtered.filter((item) => {
            const v = parseFloat(item[column])
            return !isNaN(v) && v >= min && v <= max
          })
        }
      }
    })
    setFilteredData(filtered)
  }, [data, filters, analyzer])

  const handleFilterChange = useCallback((column, value) => {
    setFilters((prev) => {
      // Drop the key entirely when cleared so the active-filter count stays honest
      if (value == null) {
        if (!(column in prev)) return prev
        const { [column]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [column]: value }
    })
  }, [])

  const handleResetAll = useCallback(() => {
    setFilters({})
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <FiLoader
            className="w-10 h-10 mx-auto animate-spin"
            style={{ color: theme.accentFrom }}
          />
          <p className="mt-4 text-base font-medium text-gray-700">Analyzing your data…</p>
          <p className="text-xs text-gray-500">Detecting sector, columns and key metrics</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 ring-4 ring-rose-100">
          <FiAlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Analysis Error</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold shadow-md hover:shadow-lg transition"
          style={{ background: gradientCss(theme) }}
          onClick={() => navigate('/')}
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!analyzer) {
    return (
      <div className="text-center py-12">
        <FiLoader
          className="w-8 h-8 mx-auto animate-spin"
          style={{ color: theme.accentFrom }}
        />
        <p className="mt-3 text-base text-gray-600">Initializing analyzer…</p>
      </div>
    )
  }

  const rowCount = filteredData.length
  const colCount = data && data.length > 0 ? Object.keys(data[0]).length : 0
  const filterCount = Object.entries(filters).filter(([, v]) => {
    if (v == null) return false
    if (Array.isArray(v)) return v.length > 0
    return true
  }).length

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* ---------------------------------------------------------------
            Sector hero — mirrors DomainHeader styling so the page feels
            like part of the same product suite, themed per domain.
           -------------------------------------------------------------- */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white border border-gray-100">
          <div
            className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-20 blur-3xl"
            style={{ background: gradientCss(theme) }}
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full opacity-10 blur-3xl"
            style={{ background: gradientCss(theme) }}
            aria-hidden="true"
          />

          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div
                  className="flex-shrink-0 h-14 w-14 rounded-2xl shadow-lg flex items-center justify-center text-white"
                  style={{ background: gradientCss(theme) }}
                >
                  <HeroIcon className="w-7 h-7" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 text-xs font-medium text-gray-500">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border"
                      style={{
                        color: theme.accentTo,
                        backgroundColor: `${theme.accentFrom}15`,
                        borderColor: `${theme.accentFrom}30`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: theme.accentFrom }}
                      />
                      Adaptive analytics
                    </span>
                    {theme.id !== 'Generic' && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span>Sector: {theme.label}</span>
                      </>
                    )}
                  </div>
                  <h1
                    className={`text-2xl md:text-3xl font-bold text-gray-900 truncate ${theme.fontTracking}`}
                  >
                    {theme.label} Analytics
                  </h1>
                  <p className="text-gray-600 mt-1 text-sm md:text-base">
                    {theme.tagline} — {rowCount.toLocaleString()} records in view
                  </p>
                </div>
              </div>
            </div>

            {/* Summary strip */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 pt-5 border-t border-gray-100">
              <SummaryPill
                Icon={FiDatabase}
                label="Records"
                value={rowCount.toLocaleString()}
                theme={theme}
              />
              <SummaryPill
                Icon={FiColumns}
                label="Columns"
                value={colCount.toLocaleString()}
                theme={theme}
              />
              <SummaryPill
                Icon={FiFilter}
                label="Active filters"
                value={filterCount.toString()}
                theme={theme}
              />
              <SummaryPill
                Icon={FiLayers}
                label="Charts"
                value={dynamicVisualizations.length.toString()}
                theme={theme}
              />
            </div>

            {/* Key columns chips */}
            {importantColumns.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                  Key columns
                </span>
                {importantColumns.slice(0, 6).map((col) => (
                  <span
                    key={col}
                    className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full border"
                    style={{
                      color: theme.accentTo,
                      backgroundColor: `${theme.accentFrom}10`,
                      borderColor: `${theme.accentFrom}25`,
                    }}
                  >
                    {analyzer.formatColumnName(col)}
                  </span>
                ))}
                {importantColumns.length > 6 && (
                  <span className="text-[11px] text-gray-400">
                    +{importantColumns.length - 6} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        {analyzer.dimensions.length > 0 && (
          <DynamicFilters
            data={data}
            analyzer={analyzer}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetAll={handleResetAll}
          />
        )}

        {/* KPIs */}
        <DynamicKpiCards kpis={dynamicKpis} />

        {/* Charts */}
        <DynamicCharts
          visualizations={dynamicVisualizations}
          data={filteredData}
          analyzer={analyzer}
        />

        {/* Insights */}
        <DomainInsights data={filteredData} domain={inferredDomain} analyzer={analyzer} />
      </div>
    </div>
  )
}

const SummaryPill = ({ Icon, label, value, theme }) => (
  <div className="flex items-center gap-3">
    <div
      className={`h-9 w-9 rounded-xl flex items-center justify-center ${theme.pillTint} ${theme.pillText}`}
    >
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex flex-col min-w-0">
      <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
        {label}
      </span>
      <span className="text-sm md:text-base font-semibold text-gray-800 truncate">
        {value}
      </span>
    </div>
  </div>
)

export default Analytics
