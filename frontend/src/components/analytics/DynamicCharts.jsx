import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts'
import {
  FiBarChart2,
  FiTrendingUp,
  FiPieChart,
  FiActivity,
  FiGrid,
  FiLayers,
} from 'react-icons/fi'
import { getTheme } from '../../utils/domainTheme'

// ---------------------------------------------------------------------------
// Shared chart shell — keeps every visualization visually in the sector palette
// ---------------------------------------------------------------------------
const ChartCard = ({ title, subtitle, Icon, theme, action, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
    <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-gray-50 gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`h-9 w-9 rounded-xl flex items-center justify-center ring-4 flex-shrink-0 ${theme.pillTint} ${theme.pillText} ${theme.ringTint}`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm md:text-base font-semibold text-gray-900 tracking-tight truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
    <div className="p-4">{children}</div>
  </div>
)

// Themed tooltip used by every chart below
const makeTooltip = (theme) => {
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
              style={{ backgroundColor: entry.color || entry.payload?.fill || theme.accentFrom }}
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
  return CustomTooltip
}

// Small sector-tinted pill used as each card's action
const TypePill = ({ label, theme }) => (
  <span
    className="inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0"
    style={{ color: theme.accentTo, backgroundColor: `${theme.accentFrom}15` }}
  >
    {label}
  </span>
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const iconForType = (type) => {
  if (type === 'line') return FiTrendingUp
  if (type === 'bar') return FiBarChart2
  if (type === 'pie') return FiPieChart
  if (type === 'scatter') return FiGrid
  if (type === 'area') return FiActivity
  if (type === 'composed') return FiLayers
  return FiBarChart2
}

const isCurrencyKey = (column) => {
  if (!column) return false
  const c = String(column).toLowerCase()
  return (
    c.includes('amount') ||
    c.includes('revenue') ||
    c.includes('sales') ||
    c.includes('price') ||
    c.includes('cost') ||
    c.includes('salary') ||
    c.includes('budget') ||
    c.includes('expense')
  )
}

const formatValue = (value, type) => {
  if (typeof value !== 'number') return value
  const t = String(type || '').toLowerCase()
  if (
    type === 'currency' ||
    t.includes('amount') ||
    t.includes('revenue') ||
    t.includes('sales') ||
    t.includes('salary') ||
    t.includes('cost') ||
    t.includes('budget')
  ) {
    return `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }
  if (t.includes('percent') || t.includes('rate')) {
    return `${value.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`
  }
  return value.toLocaleString()
}

// ---------------------------------------------------------------------------
// DynamicCharts — themed per sector
// ---------------------------------------------------------------------------
const DynamicCharts = ({ visualizations, data, analyzer }) => {
  const { domain } = useSelector((state) => state.data)
  const theme = getTheme(domain)
  const palette = theme.chartPalette
  const Tip = makeTooltip(theme)

  const enrichedVisualizations = useMemo(() => {
    if (!visualizations) return []
    if (visualizations.length < 1 && analyzer?.importantFields?.length > 0) {
      const next = [...visualizations]
      analyzer.metrics.forEach((metric) => {
        const existing = visualizations.find((v) => v.yAxis === metric || v.valueKey === metric)
        if (!existing && analyzer.categoricalColumns.length > 0) {
          next.push({
            type: 'bar',
            title: `${analyzer.formatColumnName(metric)} by ${analyzer.formatColumnName(
              analyzer.categoricalColumns[0]
            )}`,
            xAxis: analyzer.categoricalColumns[0],
            yAxis: metric,
            data: analyzer.aggregateMetricByCategory(analyzer.categoricalColumns[0], metric),
          })
        }
      })
      return next
    }
    return visualizations
  }, [visualizations, analyzer])

  if (!visualizations || visualizations.length === 0 || !data || !analyzer) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div
          className={`mx-auto h-12 w-12 rounded-xl flex items-center justify-center mb-3 ${theme.pillTint} ${theme.pillText}`}
        >
          <FiBarChart2 className="w-6 h-6" />
        </div>
        <p className="text-gray-600 font-medium">No visualizations available for this dataset</p>
        <p className="text-sm text-gray-400 mt-1">
          Upload a dataset with clear {theme.label.toLowerCase()} columns to generate charts
        </p>
      </div>
    )
  }

  const getInsight = (viz) => {
    if (!viz || !viz.data || viz.data.length === 0) return null
    try {
      if (viz.type === 'bar') {
        const sorted = [...viz.data].sort((a, b) => b[viz.yAxis] - a[viz.yAxis])
        const top = sorted[0]
        if (top) {
          return `${top[viz.xAxis]} leads ${analyzer.formatColumnName(viz.yAxis)} at ${formatValue(
            top[viz.yAxis],
            viz.yAxis
          )}`
        }
      } else if (viz.type === 'line' && String(viz.xAxis).toLowerCase().includes('date')) {
        if (viz.data.length > 2) {
          const first = viz.data[0]
          const last = viz.data[viz.data.length - 1]
          const change = last[viz.yAxis] - first[viz.yAxis]
          const pct = (change / first[viz.yAxis]) * 100
          const trend = change > 0 ? 'up' : 'down'
          return `${analyzer.formatColumnName(viz.yAxis)} ${trend} ${Math.abs(pct).toFixed(
            1
          )}% across the recorded period`
        }
      }
    } catch {
      return null
    }
    return null
  }

  return (
    <div>
      {/* Section heading */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center ring-4 ${theme.pillTint} ${theme.pillText} ${theme.ringTint}`}
          >
            <FiBarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h2
              className={`text-xl md:text-2xl font-bold text-gray-900 ${theme.fontTracking}`}
            >
              Visual Intelligence
            </h2>
            <p className="text-xs md:text-sm text-gray-500">
              Sector-tuned charts built from your {theme.label.toLowerCase()} dataset
            </p>
          </div>
        </div>
        <span
          className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider"
          style={{ color: theme.accentTo, backgroundColor: `${theme.accentFrom}15` }}
        >
          {enrichedVisualizations.length} charts
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {enrichedVisualizations.map((viz, index) => {
          const insight = getInsight(viz)
          return (
            <ChartCard
              key={index}
              title={viz.title}
              subtitle={insight}
              Icon={iconForType(viz.type)}
              theme={theme}
              action={<TypePill label={viz.type} theme={theme} />}
            >
              <div className="h-72">
                {viz.type === 'line' && (
                  <RenderLineChart
                    data={viz.data}
                    xAxis={viz.xAxis}
                    yAxis={viz.yAxis}
                    theme={theme}
                    palette={palette}
                    Tip={Tip}
                    isCurrencyY={isCurrencyKey(viz.yAxis)}
                    analyzer={analyzer}
                    chartId={`line-${index}`}
                  />
                )}
                {viz.type === 'bar' && (
                  <RenderBarChart
                    data={viz.data}
                    xAxis={viz.xAxis}
                    yAxis={viz.yAxis}
                    theme={theme}
                    Tip={Tip}
                    isCurrencyY={isCurrencyKey(viz.yAxis)}
                    analyzer={analyzer}
                  />
                )}
                {viz.type === 'pie' && (
                  <RenderPieChart
                    data={viz.data}
                    nameKey={viz.nameKey}
                    valueKey={viz.valueKey || 'value'}
                    theme={theme}
                    palette={palette}
                    Tip={Tip}
                    isCurrency={isCurrencyKey(viz.valueKey || 'value')}
                  />
                )}
                {viz.type === 'scatter' && (
                  <RenderScatterChart
                    data={viz.data}
                    xAxis={viz.xAxis}
                    yAxis={viz.yAxis}
                    theme={theme}
                    Tip={Tip}
                    analyzer={analyzer}
                  />
                )}
                {viz.type === 'area' && (
                  <RenderAreaChart
                    data={viz.data}
                    xAxis={viz.xAxis}
                    yAxis={viz.yAxis}
                    theme={theme}
                    Tip={Tip}
                    isCurrencyY={isCurrencyKey(viz.yAxis)}
                    analyzer={analyzer}
                    chartId={`area-${index}`}
                  />
                )}
                {viz.type === 'composed' && (
                  <RenderComposedChart
                    data={viz.data}
                    xAxis={viz.xAxis}
                    barAxis={viz.barAxis}
                    lineAxis={viz.lineAxis}
                    theme={theme}
                    palette={palette}
                    Tip={Tip}
                    analyzer={analyzer}
                  />
                )}
              </div>
            </ChartCard>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Line chart — single sector line with soft fill underneath
// ---------------------------------------------------------------------------
const RenderLineChart = ({ data, xAxis, yAxis, theme, palette, Tip, isCurrencyY, analyzer, chartId }) => {
  if (!data || data.length === 0)
    return <EmptyChart theme={theme} />
  const formatted = data.map((item) => ({ ...item, [yAxis]: Number(item[yAxis]) || 0 }))
  const gradId = `grad-${chartId}-${theme.id}`

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={formatted} margin={{ top: 5, right: 16, left: 0, bottom: 40 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette[0]} stopOpacity={0.25} />
            <stop offset="100%" stopColor={palette[0]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGridStroke} vertical={false} />
        <XAxis
          dataKey={xAxis}
          angle={-35}
          textAnchor="end"
          height={55}
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (isCurrencyY ? `$${v}` : v)}
        />
        <Tooltip content={<Tip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }} />
        <Line
          type="monotone"
          dataKey={yAxis}
          name={analyzer?.formatColumnName?.(yAxis) || yAxis}
          stroke={palette[0]}
          strokeWidth={2.5}
          fill={`url(#${gradId})`}
          activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
          dot={{ r: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------
// Bar chart — solid sector fill + rounded top corners
// ---------------------------------------------------------------------------
const RenderBarChart = ({ data, xAxis, yAxis, theme, Tip, isCurrencyY, analyzer }) => {
  if (!data || data.length === 0) return <EmptyChart theme={theme} />
  const formatted = data.map((item) => ({ ...item, [yAxis]: Number(item[yAxis]) || 0 }))
  const display = formatted.length > 10 ? formatted.slice(0, 10) : formatted

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={display} margin={{ top: 5, right: 16, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGridStroke} vertical={false} />
        <XAxis
          dataKey={xAxis}
          angle={-35}
          textAnchor="end"
          height={55}
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (isCurrencyY ? `$${v}` : v)}
        />
        <Tooltip content={<Tip />} cursor={{ fill: `${theme.accentFrom}10` }} />
        <Bar
          dataKey={yAxis}
          name={analyzer?.formatColumnName?.(yAxis) || yAxis}
          fill={theme.accentFrom}
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------
// Pie chart — donut rotating the full sector palette
// ---------------------------------------------------------------------------
const RenderPieChart = ({ data, nameKey, valueKey, theme, palette, Tip }) => {
  if (!data || data.length === 0) return <EmptyChart theme={theme} />
  const formatted = data.map((item) => ({ ...item, [valueKey]: Number(item[valueKey]) || 0 }))
  const display = formatted.length > 8 ? formatted.slice(0, 8) : formatted

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={display}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          dataKey={valueKey}
          nameKey={nameKey}
          labelLine={false}
          label={({ name, percent }) =>
            `${String(name).length > 10 ? String(name).substring(0, 10) + '…' : name} ${(
              percent * 100
            ).toFixed(0)}%`
          }
        >
          {display.map((_, i) => (
            <Cell
              key={`cell-${i}`}
              fill={palette[i % palette.length]}
              stroke="#fff"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<Tip />} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------
// Scatter chart — single sector color
// ---------------------------------------------------------------------------
const RenderScatterChart = ({ data, xAxis, yAxis, theme, Tip, analyzer }) => {
  if (!data || data.length === 0) return <EmptyChart theme={theme} />
  const formatted = data.map((item) => ({
    ...item,
    [xAxis]: Number(item[xAxis]) || 0,
    [yAxis]: Number(item[yAxis]) || 0,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGridStroke} />
        <XAxis
          type="number"
          dataKey={xAxis}
          name={analyzer?.formatColumnName?.(xAxis) || xAxis}
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="number"
          dataKey={yAxis}
          name={analyzer?.formatColumnName?.(yAxis) || yAxis}
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<Tip />} cursor={{ strokeDasharray: '3 3' }} />
        <Scatter
          name={`${analyzer?.formatColumnName?.(xAxis) || xAxis} vs ${
            analyzer?.formatColumnName?.(yAxis) || yAxis
          }`}
          data={formatted}
          fill={theme.accentFrom}
        />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------
// Area chart — single sector color with opacity fade
// ---------------------------------------------------------------------------
const RenderAreaChart = ({ data, xAxis, yAxis, theme, Tip, isCurrencyY, analyzer, chartId }) => {
  if (!data || data.length === 0) return <EmptyChart theme={theme} />
  const formatted = data.map((item) => ({ ...item, [yAxis]: Number(item[yAxis]) || 0 }))
  const gradId = `grad-${chartId}-${theme.id}`

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={formatted} margin={{ top: 5, right: 16, left: 0, bottom: 40 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.accentFrom} stopOpacity={0.4} />
            <stop offset="100%" stopColor={theme.accentFrom} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGridStroke} vertical={false} />
        <XAxis
          dataKey={xAxis}
          angle={-35}
          textAnchor="end"
          height={55}
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (isCurrencyY ? `$${v}` : v)}
        />
        <Tooltip content={<Tip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }} />
        <Area
          type="monotone"
          dataKey={yAxis}
          name={analyzer?.formatColumnName?.(yAxis) || yAxis}
          stroke={theme.accentFrom}
          strokeWidth={2.5}
          fill={`url(#${gradId})`}
          activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------
// Composed chart — bar + line, second palette color for the line
// ---------------------------------------------------------------------------
const RenderComposedChart = ({ data, xAxis, barAxis, lineAxis, theme, palette, Tip, analyzer }) => {
  if (!data || data.length === 0) return <EmptyChart theme={theme} />
  const formatted = data.map((item) => ({
    ...item,
    [barAxis]: Number(item[barAxis]) || 0,
    [lineAxis]: Number(item[lineAxis]) || 0,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={formatted} margin={{ top: 5, right: 16, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGridStroke} vertical={false} />
        <XAxis
          dataKey={xAxis}
          angle={-35}
          textAnchor="end"
          height={55}
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (isCurrencyKey(barAxis) ? `$${v}` : v)}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (isCurrencyKey(lineAxis) ? `$${v}` : v)}
        />
        <Tooltip content={<Tip />} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
        <Bar
          yAxisId="left"
          dataKey={barAxis}
          name={analyzer?.formatColumnName?.(barAxis) || barAxis}
          fill={theme.accentFrom}
          radius={[6, 6, 0, 0]}
          maxBarSize={40}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey={lineAxis}
          name={analyzer?.formatColumnName?.(lineAxis) || lineAxis}
          stroke={palette[1] || theme.accentTo}
          strokeWidth={2.5}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------
// Empty state — themed mini card when a chart has no rows
// ---------------------------------------------------------------------------
const EmptyChart = ({ theme }) => (
  <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-center">
    <div
      className={`h-10 w-10 rounded-xl flex items-center justify-center ${theme.pillTint} ${theme.pillText}`}
    >
      <FiBarChart2 className="w-5 h-5" />
    </div>
    <p className="text-xs text-gray-500 font-medium">No data available for this chart</p>
  </div>
)

export default DynamicCharts
