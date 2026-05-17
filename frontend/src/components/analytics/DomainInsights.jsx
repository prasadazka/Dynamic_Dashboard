import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import {
  FiZap,
  FiTrendingUp,
  FiTrendingDown,
  FiAward,
  FiTarget,
  FiAlertTriangle,
  FiActivity,
  FiBarChart2,
  FiClock,
  FiUsers,
  FiHeart,
  FiBookOpen,
  FiDollarSign,
  FiStar,
  FiLayers,
} from 'react-icons/fi'
import { getTheme } from '../../utils/domainTheme'

// Pick an icon that matches the insight's title / keywords
const iconForTitle = (title = '') => {
  const n = String(title).toLowerCase()
  if (n.includes('top') || n.includes('best') || n.includes('leader')) return FiAward
  if (n.includes('opportunity') || n.includes('improvement') || n.includes('lowest'))
    return FiTarget
  if (n.includes('alert') || n.includes('deficit') || n.includes('risk'))
    return FiAlertTriangle
  if (n.includes('trend') && n.includes('decreas')) return FiTrendingDown
  if (n.includes('trend') || n.includes('time')) return FiTrendingUp
  if (n.includes('distribution') || n.includes('category')) return FiLayers
  if (n.includes('performance') || n.includes('rating')) return FiStar
  if (n.includes('stay') || n.includes('duration')) return FiClock
  if (n.includes('compensation') || n.includes('income') || n.includes('expense'))
    return FiDollarSign
  if (n.includes('workforce') || n.includes('department')) return FiUsers
  if (n.includes('diagnosis') || n.includes('patient')) return FiHeart
  if (n.includes('subject') || n.includes('student') || n.includes('course'))
    return FiBookOpen
  if (n.includes('metric') || n.includes('range')) return FiBarChart2
  return FiActivity
}

const DomainInsights = ({ data, domain, analyzer }) => {
  const { domain: activeDomain } = useSelector((state) => state.data)
  const theme = getTheme(activeDomain || domain)

  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

  // -------------------------------------------------------------------------
  // Domain-specific insight generators (logic unchanged — theming around it)
  // -------------------------------------------------------------------------
  const getRetailInsights = () => {
    const insights = []
    const revenueColumn = analyzer.findColumnByPatterns(['revenue', 'sales', 'amount', 'total'])
    const categoryColumn = analyzer.findColumnByPatterns(['category', 'department', 'type'])

    if (revenueColumn) {
      if (categoryColumn) {
        const categoryData = analyzer.aggregateMetricByCategory(categoryColumn, revenueColumn)
        if (categoryData.length > 0) {
          const topCategory = categoryData[0]
          insights.push({
            title: 'Top Performing Category',
            content: `${topCategory[categoryColumn]} is your best performing category with ${formatter.format(
              topCategory[revenueColumn]
            )} in sales.`,
          })
          if (categoryData.length > 1) {
            const bottomCategory = categoryData[categoryData.length - 1]
            insights.push({
              title: 'Opportunity for Growth',
              content: `${bottomCategory[categoryColumn]} is your lowest performing category with ${formatter.format(
                bottomCategory[revenueColumn]
              )} in sales.`,
            })
          }
        }
      }
      const dateColumn = analyzer.dateColumns[0]
      if (dateColumn) {
        const timeData = analyzer.aggregateByDate(dateColumn, revenueColumn)
        if (timeData.length > 1) {
          const lastIndex = timeData.length - 1
          const currentPeriod = timeData[lastIndex].value
          const previousPeriod = timeData[lastIndex - 1].value
          const percentChange = ((currentPeriod - previousPeriod) / previousPeriod) * 100
          if (!isNaN(percentChange)) {
            insights.push({
              title: 'Revenue Trend',
              content: `Your revenue ${
                percentChange >= 0 ? 'increased' : 'decreased'
              } by ${Math.abs(percentChange).toFixed(1)}% compared to the previous period.`,
            })
          }
        }
      }
    }
    return insights
  }

  const getHRInsights = () => {
    const insights = []
    const departmentColumn = analyzer.findColumnByPatterns(['department', 'dept', 'division'])
    const salaryColumn = analyzer.findColumnByPatterns(['salary', 'compensation', 'pay'])
    const performanceColumn = analyzer.findColumnByPatterns([
      'performance',
      'rating',
      'evaluation',
    ])

    if (departmentColumn) {
      const deptCounts = analyzer.aggregateByCategory(departmentColumn)
      if (deptCounts.length > 0) {
        const largestDept = deptCounts[0]
        insights.push({
          title: 'Department Distribution',
          content: `${largestDept[departmentColumn]} is your largest department with ${
            largestDept.count
          } employees (${((largestDept.count / data.length) * 100).toFixed(
            1
          )}% of workforce).`,
        })
      }
    }

    if (salaryColumn && departmentColumn) {
      const salaryByDept = analyzer.aggregateMetricByCategory(departmentColumn, salaryColumn)
      if (salaryByDept.length > 1) {
        const highestPaidDept = salaryByDept[0]
        const lowestPaidDept = salaryByDept[salaryByDept.length - 1]
        const gap = highestPaidDept[salaryColumn] - lowestPaidDept[salaryColumn]
        insights.push({
          title: 'Compensation Analysis',
          content: `${highestPaidDept[departmentColumn]} has the highest average compensation at ${formatter.format(
            highestPaidDept[salaryColumn]
          )}, which is ${formatter.format(gap)} more than ${lowestPaidDept[departmentColumn]}.`,
        })
      }
    }

    if (performanceColumn && departmentColumn) {
      const perfByDept = {}
      data.forEach((row) => {
        const dept = row[departmentColumn]
        const perf = parseFloat(row[performanceColumn]) || 0
        if (!perfByDept[dept]) perfByDept[dept] = { sum: 0, count: 0 }
        perfByDept[dept].sum += perf
        perfByDept[dept].count++
      })
      const deptPerformance = Object.entries(perfByDept)
        .map(([dept, stats]) => ({ department: dept, avgPerformance: stats.sum / stats.count }))
        .sort((a, b) => b.avgPerformance - a.avgPerformance)
      if (deptPerformance.length > 0) {
        const topPerformer = deptPerformance[0]
        insights.push({
          title: 'Performance Leaders',
          content: `${topPerformer.department} is your highest performing department with an average rating of ${topPerformer.avgPerformance.toFixed(
            2
          )}.`,
        })
      }
    }
    return insights
  }

  const getFinanceInsights = () => {
    const insights = []
    const amountColumn = analyzer.findColumnByPatterns(['amount', 'sum', 'total', 'value'])
    const categoryColumn = analyzer.findColumnByPatterns(['category', 'type', 'description'])
    const dateColumn = analyzer.dateColumns[0]

    if (categoryColumn && amountColumn) {
      let income = 0
      let expense = 0
      data.forEach((row) => {
        const category = row[categoryColumn]?.toLowerCase() || ''
        const amount = parseFloat(row[amountColumn]) || 0
        if (
          category.includes('expense') ||
          category.includes('payment') ||
          category.includes('purchase') ||
          amount < 0
        ) {
          expense += Math.abs(amount)
        } else {
          income += amount
        }
      })
      const balance = income - expense
      insights.push({
        title: 'Income vs. Expenses',
        content: `Your total income is ${formatter.format(income)} with ${formatter.format(
          expense
        )} in expenses, resulting in a ${
          balance >= 0 ? 'positive' : 'negative'
        } balance of ${formatter.format(Math.abs(balance))}.`,
      })
      if (balance < 0) {
        insights.push({
          title: 'Budget Alert',
          content:
            "You're currently running a deficit. Consider reducing expenses or increasing income sources.",
        })
      }
    }

    if (dateColumn && amountColumn) {
      const timeData = analyzer.aggregateByDate(dateColumn, amountColumn)
      if (timeData.length > 2) {
        const lastPeriods = timeData.slice(-3)
        let trend = 'stable'
        if (
          lastPeriods[2].value > lastPeriods[1].value &&
          lastPeriods[1].value > lastPeriods[0].value
        ) {
          trend = 'increasing'
        } else if (
          lastPeriods[2].value < lastPeriods[1].value &&
          lastPeriods[1].value < lastPeriods[0].value
        ) {
          trend = 'decreasing'
        }
        insights.push({
          title: 'Financial Trend',
          content: `Your financial activity is showing a ${trend} trend over the past 3 periods.`,
        })
      }
    }
    return insights
  }

  const getHealthcareInsights = () => {
    const insights = []
    const diagnosisColumn = analyzer.findColumnByPatterns(['diagnosis', 'condition', 'disease'])
    const costColumn = analyzer.findColumnByPatterns(['cost', 'charge', 'bill', 'amount'])
    const stayColumn = analyzer.findColumnByPatterns(['stay', 'days', 'length', 'duration'])

    if (diagnosisColumn) {
      const diagnosesCounts = analyzer.aggregateByCategory(diagnosisColumn)
      if (diagnosesCounts.length > 0) {
        const topDiagnosis = diagnosesCounts[0]
        insights.push({
          title: 'Most Common Diagnosis',
          content: `${topDiagnosis[diagnosisColumn]} is the most common diagnosis with ${
            topDiagnosis.count
          } cases (${((topDiagnosis.count / data.length) * 100).toFixed(1)}% of total).`,
        })
      }
    }

    if (costColumn && diagnosisColumn) {
      const costByDiagnosis = analyzer.aggregateMetricByCategory(diagnosisColumn, costColumn)
      if (costByDiagnosis.length > 0) {
        const highestCostDiagnosis = costByDiagnosis[0]
        insights.push({
          title: 'Cost Analysis',
          content: `${highestCostDiagnosis[diagnosisColumn]} has the highest total cost at ${formatter.format(
            highestCostDiagnosis[costColumn]
          )}.`,
        })
      }
    }

    if (stayColumn && diagnosisColumn) {
      const stayByDiagnosis = {}
      data.forEach((row) => {
        const diagnosis = row[diagnosisColumn]
        const stay = parseFloat(row[stayColumn]) || 0
        if (!stayByDiagnosis[diagnosis]) stayByDiagnosis[diagnosis] = { sum: 0, count: 0 }
        stayByDiagnosis[diagnosis].sum += stay
        stayByDiagnosis[diagnosis].count++
      })
      const diagnosisStay = Object.entries(stayByDiagnosis)
        .map(([diagnosis, stats]) => ({ diagnosis, avgStay: stats.sum / stats.count }))
        .sort((a, b) => b.avgStay - a.avgStay)
      if (diagnosisStay.length > 0) {
        const longestStay = diagnosisStay[0]
        insights.push({
          title: 'Length of Stay',
          content: `${longestStay.diagnosis} requires the longest average stay at ${longestStay.avgStay.toFixed(
            1
          )} days.`,
        })
      }
    }
    return insights
  }

  const getEducationInsights = () => {
    const insights = []
    const subjectColumn = analyzer.findColumnByPatterns(['subject', 'course', 'class'])
    const scoreColumn = analyzer.findColumnByPatterns(['score', 'grade', 'mark', 'result'])
    const studentColumn = analyzer.findColumnByPatterns(['student', 'learner', 'pupil'])

    if (subjectColumn && scoreColumn) {
      const scoresBySubject = {}
      data.forEach((row) => {
        const subject = row[subjectColumn]
        const score = parseFloat(row[scoreColumn]) || 0
        if (!scoresBySubject[subject]) scoresBySubject[subject] = { sum: 0, count: 0 }
        scoresBySubject[subject].sum += score
        scoresBySubject[subject].count++
      })
      const subjectScores = Object.entries(scoresBySubject)
        .map(([subject, stats]) => ({ subject, avgScore: stats.sum / stats.count }))
        .sort((a, b) => b.avgScore - a.avgScore)
      if (subjectScores.length > 0) {
        const bestSubject = subjectScores[0]
        const worstSubject = subjectScores[subjectScores.length - 1]
        insights.push({
          title: 'Subject Performance',
          content: `${bestSubject.subject} has the highest average score at ${bestSubject.avgScore.toFixed(
            1
          )}.`,
        })
        if (subjectScores.length > 1) {
          insights.push({
            title: 'Areas for Improvement',
            content: `${worstSubject.subject} has the lowest average score at ${worstSubject.avgScore.toFixed(
              1
            )} and may require additional focus.`,
          })
        }
      }
    }

    if (studentColumn && scoreColumn) {
      const studentPerformance = {}
      data.forEach((row) => {
        const student = row[studentColumn]
        const score = parseFloat(row[scoreColumn]) || 0
        if (!studentPerformance[student]) studentPerformance[student] = { sum: 0, count: 0 }
        studentPerformance[student].sum += score
        studentPerformance[student].count++
      })
      const avgPerformance = Object.entries(studentPerformance)
        .map(([student, stats]) => ({ student, avgScore: stats.sum / stats.count }))
        .sort((a, b) => b.avgScore - a.avgScore)
      if (avgPerformance.length > 3) {
        insights.push({
          title: 'Top Performers',
          content: `Your top 3 students are ${avgPerformance[0].student}, ${avgPerformance[1].student}, and ${avgPerformance[2].student}.`,
        })
      }
    }
    return insights
  }

  const getGenericInsights = () => {
    const insights = []
    if (analyzer.categoricalColumns.length > 0) {
      const categoryColumn = analyzer.categoricalColumns[0]
      const categoryCounts = analyzer.aggregateByCategory(categoryColumn)
      if (categoryCounts.length > 0) {
        const topCategory = categoryCounts[0]
        const percentage = ((topCategory.count / data.length) * 100).toFixed(1)
        insights.push({
          title: 'Category Distribution',
          content: `${topCategory[categoryColumn]} is the most common ${analyzer.formatColumnName(
            categoryColumn
          )} representing ${percentage}% of your data.`,
        })
      }
    }

    if (analyzer.metrics.length > 0) {
      const metricColumn = analyzer.metrics[0]
      const values = data.map((row) => parseFloat(row[metricColumn]) || 0)
      const sum = values.reduce((acc, val) => acc + val, 0)
      const avg = sum / values.length
      const max = Math.max(...values)
      const min = Math.min(...values)
      insights.push({
        title: 'Metric Analysis',
        content: `The average ${analyzer.formatColumnName(
          metricColumn
        )} is ${avg.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })} with a range from ${min.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })} to ${max.toLocaleString(undefined, { maximumFractionDigits: 2 })}.`,
      })

      if (analyzer.categoricalColumns.length > 0 && analyzer.metrics.length > 0) {
        const categoryColumn = analyzer.categoricalColumns[0]
        const metricByCategory = analyzer.aggregateMetricByCategory(categoryColumn, metricColumn)
        if (metricByCategory.length > 0) {
          const topCategoryByMetric = metricByCategory[0]
          insights.push({
            title: 'Top Performer',
            content: `${topCategoryByMetric[categoryColumn]} has the highest ${analyzer.formatColumnName(
              metricColumn
            )} at ${topCategoryByMetric[metricColumn].toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}.`,
          })
        }
      }
    }

    if (analyzer.dateColumns.length > 0 && analyzer.metrics.length > 0) {
      const dateColumn = analyzer.dateColumns[0]
      const metricColumn = analyzer.metrics[0]
      const timeData = analyzer.aggregateByDate(dateColumn, metricColumn)
      if (timeData.length > 1) {
        const firstValue = timeData[0].value
        const lastValue = timeData[timeData.length - 1].value
        const change = ((lastValue - firstValue) / firstValue) * 100
        if (!isNaN(change)) {
          insights.push({
            title: 'Time Trend',
            content: `Your ${analyzer.formatColumnName(metricColumn)} has ${
              change >= 0 ? 'increased' : 'decreased'
            } by ${Math.abs(change).toFixed(1)}% over the recorded period.`,
          })
        }
      }
    }
    return insights
  }

  const getInsights = () => {
    if (!data || data.length === 0) return []
    switch (domain) {
      case 'Retail':
        return getRetailInsights()
      case 'HR':
        return getHRInsights()
      case 'Finance':
        return getFinanceInsights()
      case 'Healthcare':
        return getHealthcareInsights()
      case 'Education':
        return getEducationInsights()
      default:
        return getGenericInsights()
    }
  }

  const insights = getInsights()

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center ring-4 ${theme.pillTint} ${theme.pillText} ${theme.ringTint}`}
          >
            <FiZap className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base md:text-lg font-semibold text-gray-900 ${theme.fontTracking}`}>
              {theme.label} Insights
            </h2>
            <p className="text-xs text-gray-500">
              Auto-generated findings from your {theme.label.toLowerCase()} dataset
            </p>
          </div>
        </div>
        <span
          className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider"
          style={{ color: theme.accentTo, backgroundColor: `${theme.accentFrom}15` }}
        >
          {insights.length} insights
        </span>
      </div>

      {/* Body */}
      {insights.length === 0 ? (
        <div className="p-8 text-center">
          <div
            className={`mx-auto h-12 w-12 rounded-xl flex items-center justify-center mb-3 ${theme.pillTint} ${theme.pillText}`}
          >
            <FiZap className="w-6 h-6" />
          </div>
          <p className="text-gray-600 font-medium">No insights available for this dataset</p>
          <p className="text-sm text-gray-400 mt-1">
            Try loading a dataset with clearer {theme.label.toLowerCase()} signals
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-5">
          {insights.map((insight, index) => {
            const InsightIcon = iconForTitle(insight.title)
            const isAlert = /alert|deficit|risk|opportunity|lowest|improve/i.test(insight.title)
            return (
              <div
                key={index}
                className="relative bg-gray-50/60 border border-gray-100 rounded-xl p-4 pl-5 hover:border-gray-200 transition overflow-hidden"
              >
                {/* Accent stripe — sector color (rose tint if it's a warning) */}
                <span
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: isAlert ? '#f43f5e' : theme.accentFrom }}
                  aria-hidden="true"
                />
                <div className="flex items-start gap-3">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isAlert
                        ? 'bg-rose-50 text-rose-600 ring-4 ring-rose-100'
                        : `${theme.pillTint} ${theme.pillText} ring-4 ${theme.ringTint}`
                    }`}
                  >
                    <InsightIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 tracking-tight">
                      {insight.title}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 mt-1 leading-relaxed">
                      {insight.content}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

DomainInsights.propTypes = {
  data: PropTypes.array.isRequired,
  domain: PropTypes.string.isRequired,
  analyzer: PropTypes.object.isRequired,
}

export default DomainInsights
