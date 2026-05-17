import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  FiDollarSign,
  FiCreditCard,
  FiTrendingUp,
  FiUsers,
  FiShoppingCart,
  FiFileText,
  FiBarChart2,
  FiTarget,
  FiUser,
  FiStar,
  FiClock,
  FiBookOpen,
  FiActivity,
  FiHome,
  FiHeart,
  FiPackage,
} from 'react-icons/fi'
import { getTheme, gradientCss } from '../../utils/domainTheme'
import { DataAnalyzer } from '../../utils/DataAnalyzer'

// Map metric name keywords → react-icon component
const iconFor = (name = '') => {
  const n = name.toLowerCase()
  if (n.includes('revenue') || n.includes('amount') || n.includes('sales') || n.includes('price'))
    return FiDollarSign
  if (n.includes('balance')) return FiDollarSign
  if (n.includes('debit') || n.includes('spend') || n.includes('expense')) return FiCreditCard
  if (n.includes('credit') || n.includes('income') || n.includes('profit')) return FiTrendingUp
  if (n.includes('customer') || n.includes('user')) return FiUsers
  if (n.includes('order') || n.includes('transaction')) return FiShoppingCart
  if (n.includes('record') || n.includes('count') || n.includes('total')) return FiFileText
  if (n.includes('rate') || n.includes('ratio') || n.includes('percent') || n.includes('conversion'))
    return FiTarget
  if (n.includes('patient')) return FiHeart
  if (n.includes('employee') || n.includes('staff') || n.includes('worker') || n.includes('personnel'))
    return FiUser
  if (n.includes('department') || n.includes('division') || n.includes('team')) return FiHome
  if (n.includes('performance') || n.includes('rating') || n.includes('score')) return FiStar
  if (n.includes('stay') || n.includes('duration') || n.includes('time')) return FiClock
  if (n.includes('student') || n.includes('course') || n.includes('grade')) return FiBookOpen
  if (n.includes('unit') || n.includes('product') || n.includes('item')) return FiPackage
  return FiActivity
}

// Resolve which dataset column best matches a KPI's title, so the sparkline
// shows the real distribution of THAT metric rather than a decorative shape.
const resolveColumn = (title, analyzer) => {
  if (!analyzer || !title) return null
  const n = String(title).toLowerCase()
  const keywords = [
    'revenue', 'sales', 'amount', 'price', 'cost', 'charge', 'bill',
    'salary', 'compensation', 'budget',
    'balance', 'credit', 'debit', 'income', 'expense',
    'quantity', 'units', 'items', 'count',
    'rate', 'ratio', 'percent',
    'stay', 'duration', 'days',
    'performance', 'rating', 'score', 'grade',
  ]
  for (const kw of keywords) {
    if (n.includes(kw)) {
      const col = analyzer.findColumnByPatterns([kw])
      if (col && analyzer.columnTypes[col] === 'numeric') return col
    }
  }
  return analyzer.metrics?.[0] || analyzer.numericColumns?.[0] || null
}

// Build real sparkline points from the dataset — returns null if we can't
const buildSparkPoints = (data, analyzer, metricColumn) => {
  if (!data || data.length === 0 || !metricColumn) return null
  const dateCol = analyzer?.dateColumns?.[0]

  // Prefer a time-ordered series if we have a date column
  if (dateCol && typeof analyzer.aggregateByDate === 'function') {
    const series = analyzer.aggregateByDate(dateCol, metricColumn)
    if (series && series.length > 1) {
      return series.slice(-12).map((d) => Number(d.value) || 0)
    }
  }

  // Fallback: sample raw numeric values in row order
  const raw = data
    .map((row) => parseFloat(row[metricColumn]))
    .filter((v) => !isNaN(v) && isFinite(v))
  if (raw.length < 2) return null
  if (raw.length <= 12) return raw
  // Evenly sample 12 points across the dataset
  const step = raw.length / 12
  return Array.from({ length: 12 }, (_, i) => raw[Math.floor(i * step)])
}

// Sparkline — only renders when we have genuine data points
const Sparkline = ({ points, color }) => {
  if (!points || points.length < 2) return null
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const w = 80
  const h = 28
  const step = w / (points.length - 1)
  const path = points
    .map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'} ${i * step} ${h - ((p - min) / range) * h}`
    )
    .join(' ')
  const safeId = color.replace('#', '')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-80">
      <defs>
        <linearGradient id={`spark-${safeId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill={`url(#spark-${safeId})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const MetricsOverview = () => {
  const { metrics, data, domain } = useSelector((state) => state.data)
  const theme = getTheme(domain)

  // Build a DataAnalyzer so we can derive KPIs + real sparkline series
  const analyzer = useMemo(() => {
    if (!data || data.length === 0) return null
    return new DataAnalyzer(data)
  }, [data])

  // Prefer backend-computed metrics; fall back to analyzer-computed KPIs
  const displayMetrics = useMemo(() => {
    if (metrics && metrics.length > 0) return metrics
    if (analyzer && typeof analyzer.generateKPIs === 'function') {
      return analyzer.generateKPIs().map((k) => ({
        id: k.id,
        name: k.title,
        value: k.value,
        description: k.description || '',
      }))
    }
    return []
  }, [metrics, analyzer])

  // Empty-state card — no dataset yet, so no hardcoded fake KPIs
  if (displayMetrics.length === 0) {
    return (
      <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div
          className={`mx-auto h-12 w-12 rounded-xl flex items-center justify-center mb-3 ${theme.pillTint} ${theme.pillText}`}
        >
          <FiBarChart2 className="w-6 h-6" />
        </div>
        <p className="text-gray-600 font-medium">No metrics computed yet</p>
        <p className="text-sm text-gray-400 mt-1">Upload a dataset to see live KPIs</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      {displayMetrics.map((metric, idx) => {
        const MetricIcon = iconFor(metric.name)
        const sparkColor = theme.chartPalette[idx % theme.chartPalette.length]
        const change = metric.change || ''
        const isPositive = metric.isPositive ?? !String(change).startsWith('-')

        // Derive real sparkline data from the dataset (falls back to null → hidden)
        const sparkColumn = resolveColumn(metric.name, analyzer)
        const sparkPoints = buildSparkPoints(data, analyzer, sparkColumn)

        return (
          <div
            key={metric.id || idx}
            className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
          >
            <div className="h-1 w-full" style={{ background: gradientCss(theme) }} />

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center ring-4 ${theme.pillTint} ${theme.pillText} ${theme.ringTint}`}
                >
                  <MetricIcon className="w-5 h-5" />
                </div>

                {change && (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${
                      isPositive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}
                  >
                    <FiTrendingUp className={`w-3 h-3 ${isPositive ? '' : 'rotate-180'}`} />
                    {change}
                  </span>
                )}
              </div>

              <p className="text-xs font-medium text-gray-500 mt-4 uppercase tracking-wider truncate">
                {metric.name}
              </p>
              <h3
                className={`text-3xl font-bold text-gray-900 mt-1 truncate ${theme.fontTracking}`}
              >
                {metric.value}
              </h3>

              <div className="mt-3 flex items-end justify-between gap-2">
                <p className="text-xs text-gray-500 line-clamp-2 flex-1">
                  {metric.description || ''}
                </p>
                <Sparkline points={sparkPoints} color={sparkColor} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default MetricsOverview
