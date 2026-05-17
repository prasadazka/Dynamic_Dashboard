import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { FiBarChart2, FiPieChart, FiTrendingUp, FiLayers } from 'react-icons/fi'
import { getTheme } from '../../utils/domainTheme'
import { DataAnalyzer } from '../../utils/DataAnalyzer'

// Chart card shell — consistent container for every visualization
const ChartCard = ({ title, subtitle, Icon, theme, action, children, className = '' }) => (
  <div
    className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${className}`}
  >
    <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-gray-50 gap-3">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div
            className={`h-9 w-9 rounded-xl flex items-center justify-center ring-4 flex-shrink-0 ${theme.pillTint} ${theme.pillText} ${theme.ringTint}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-900 tracking-tight truncate">
            {title}
          </h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    <div className="p-4">{children}</div>
  </div>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      {label !== undefined && label !== '' && (
        <p className="font-semibold text-gray-800 mb-1">{label}</p>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color || entry.payload?.fill }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-semibold text-gray-900">
            {typeof entry.value === 'number'
              ? entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

const CardAction = ({ label, theme }) => (
  <span
    className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
    style={{ color: theme.accentTo, backgroundColor: `${theme.accentFrom}15` }}
  >
    {label}
  </span>
)

// Truncate long category names so axis labels stay readable
const truncate = (s, n = 14) => {
  const str = String(s ?? '')
  return str.length > n ? `${str.substring(0, n)}…` : str
}

const VisualizationGrid = () => {
  const { data, domain } = useSelector((state) => state.data)
  const theme = getTheme(domain)
  const palette = theme.chartPalette

  // -------------------------------------------------------------------------
  // Build real charts from the uploaded dataset — only show tiles we can fill
  // -------------------------------------------------------------------------
  const charts = useMemo(() => {
    if (!data || data.length === 0) return []
    const analyzer = new DataAnalyzer(data)
    const out = []

    // 1. Primary metric over time (area chart)
    const dateCol = analyzer.dateColumns[0]
    const primaryMetric = analyzer.metrics[0] || analyzer.numericColumns[0]
    if (dateCol && primaryMetric) {
      const series = analyzer.aggregateByDate(dateCol, primaryMetric)
      if (series && series.length > 0) {
        const display = series.slice(-12).map((d) => ({
          name: String(d.date || d.name || '').substring(0, 10),
          value: Number(d.value) || 0,
        }))
        out.push({
          kind: 'area',
          title: `${analyzer.formatColumnName(primaryMetric)} Over Time`,
          subtitle: `Movement across the most recent ${display.length} periods`,
          action: `Last ${display.length}`,
          Icon: FiTrendingUp,
          data: display,
        })
      }
    }

    // 2. Category comparison (bar chart)
    const primaryCategory = analyzer.categoricalColumns.find(
      (c) => !analyzer.idColumns.includes(c)
    )
    const metricForBar = primaryMetric
    if (primaryCategory && metricForBar) {
      const agg = analyzer.aggregateMetricByCategory(primaryCategory, metricForBar)
      if (agg && agg.length > 0) {
        const top = agg
          .slice()
          .sort((a, b) => (b[metricForBar] || 0) - (a[metricForBar] || 0))
          .slice(0, 6)
          .map((row) => ({
            name: truncate(row[primaryCategory]),
            value: Number(row[metricForBar]) || 0,
          }))
        out.push({
          kind: 'bar',
          title: `${analyzer.formatColumnName(metricForBar)} by ${analyzer.formatColumnName(
            primaryCategory
          )}`,
          subtitle: `Top ${top.length} categories ranked by total value`,
          action: `Top ${top.length}`,
          Icon: FiBarChart2,
          data: top,
        })
      }
    } else if (primaryCategory) {
      // Fallback: count by category when no numeric metric is available
      const counts = analyzer.aggregateByCategory(primaryCategory)
      if (counts && counts.length > 0) {
        const top = counts.slice(0, 6).map((row) => ({
          name: truncate(row[primaryCategory]),
          value: Number(row.count) || 0,
        }))
        out.push({
          kind: 'bar',
          title: `Record Count by ${analyzer.formatColumnName(primaryCategory)}`,
          subtitle: `Top ${top.length} categories by volume`,
          action: `Top ${top.length}`,
          Icon: FiBarChart2,
          data: top,
        })
      }
    }

    // 3. Distribution (donut) — second categorical or the same one
    const distCategory =
      analyzer.categoricalColumns.find(
        (c) => c !== primaryCategory && !analyzer.idColumns.includes(c)
      ) || primaryCategory
    if (distCategory) {
      const counts = analyzer.aggregateByCategory(distCategory)
      if (counts && counts.length > 0) {
        const top = counts.slice(0, 6).map((row) => ({
          name: truncate(row[distCategory], 18),
          value: Number(row.count) || 0,
        }))
        out.push({
          kind: 'pie',
          title: `${analyzer.formatColumnName(distCategory)} Distribution`,
          subtitle: `Share across defined groups`,
          action: `${top.length} groups`,
          Icon: FiPieChart,
          data: top,
        })
      }
    }

    // 4. Secondary metric comparison — only if we genuinely have a 2nd metric
    const secondaryMetric = analyzer.metrics[1] || analyzer.numericColumns[1]
    if (secondaryMetric && secondaryMetric !== primaryMetric && primaryCategory) {
      const agg = analyzer.aggregateMetricByCategory(primaryCategory, secondaryMetric)
      if (agg && agg.length > 0) {
        const top = agg
          .slice()
          .sort((a, b) => (b[secondaryMetric] || 0) - (a[secondaryMetric] || 0))
          .slice(0, 6)
          .map((row) => ({
            name: truncate(row[primaryCategory]),
            value: Number(row[secondaryMetric]) || 0,
          }))
        out.push({
          kind: 'bar-alt',
          title: `${analyzer.formatColumnName(secondaryMetric)} by ${analyzer.formatColumnName(
            primaryCategory
          )}`,
          subtitle: `Secondary metric tracked across the same groups`,
          action: `Top ${top.length}`,
          Icon: FiLayers,
          data: top,
        })
      }
    }

    return out
  }, [data])

  // Empty state — no data loaded yet
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div
          className={`mx-auto h-12 w-12 rounded-xl flex items-center justify-center mb-3 ${theme.pillTint} ${theme.pillText}`}
        >
          <FiBarChart2 className="w-6 h-6" />
        </div>
        <p className="text-gray-600 font-medium">No dataset loaded yet</p>
        <p className="text-sm text-gray-400 mt-1">Upload a CSV to see live visualizations here</p>
      </div>
    )
  }

  // Stable gradient IDs per sector so SVG defs don't collide
  const gradIdArea = `grad-area-${theme.id}`

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {charts.map((chart, i) => (
        <ChartCard
          key={`${chart.kind}-${i}`}
          title={chart.title}
          subtitle={chart.subtitle}
          Icon={chart.Icon}
          theme={theme}
          action={<CardAction label={chart.action} theme={theme} />}
        >
          <div className="h-64">
            {chart.kind === 'area' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart.data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradIdArea} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={palette[0]} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={palette[0]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme.chartGridStroke}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={palette[0]}
                    strokeWidth={2.5}
                    fill={`url(#${gradIdArea})`}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {(chart.kind === 'bar' || chart.kind === 'bar-alt') && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart.data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme.chartGridStroke}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: `${theme.accentFrom}10` }}
                  />
                  <Bar
                    dataKey="value"
                    fill={chart.kind === 'bar-alt' ? palette[1] || theme.accentTo : theme.accentFrom}
                    radius={[8, 8, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}

            {chart.kind === 'pie' && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chart.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chart.data.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={palette[index % palette.length]}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      ))}
    </div>
  )
}

export default VisualizationGrid
