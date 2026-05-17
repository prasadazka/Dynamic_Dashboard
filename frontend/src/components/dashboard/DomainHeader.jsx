import { useSelector } from 'react-redux'
import { FiDownload, FiMoreHorizontal } from 'react-icons/fi'
import { getTheme, gradientCss } from '../../utils/domainTheme'

const DomainHeader = ({ domain = 'Generic' }) => {
  const { data } = useSelector((state) => state.data)
  const theme = getTheme(domain)
  const Icon = theme.Icon

  const rowCount = data?.length || 0
  const colCount = data && data.length > 0 ? Object.keys(data[0]).length : 0
  const today = new Date().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-lg mb-6 bg-white border border-gray-100">
      {/* Decorative gradient blobs tinted to the sector */}
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
            {/* Domain icon tile */}
            <div
              className="flex-shrink-0 h-14 w-14 rounded-2xl shadow-lg flex items-center justify-center text-white"
              style={{ background: gradientCss(theme) }}
            >
              <Icon className="w-7 h-7" strokeWidth={2} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 text-xs font-medium text-gray-500">
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  Live
                </span>
                <span className="text-gray-300">•</span>
                <span>{today}</span>
              </div>
              <h2
                className={`text-2xl md:text-3xl font-bold text-gray-900 truncate ${theme.fontTracking}`}
              >
                {theme.label} Dashboard
              </h2>
              <p className="text-gray-600 mt-1 text-sm md:text-base">{theme.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition"
              style={{ background: gradientCss(theme) }}
            >
              <FiDownload className="w-4 h-4" />
              Export
            </button>
            <button
              className="p-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
              aria-label="More actions"
            >
              <FiMoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 pt-5 border-t border-gray-100">
          <SummaryPill label="Records" value={rowCount.toLocaleString()} />
          <SummaryPill label="Columns" value={colCount.toLocaleString()} />
          <SummaryPill label="Domain" value={theme.label} />
          <SummaryPill label="Status" value="Ready" highlight />
        </div>
      </div>
    </div>
  )
}

const SummaryPill = ({ label, value, highlight = false }) => (
  <div className="flex flex-col">
    <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
      {label}
    </span>
    <span
      className={`text-sm md:text-base font-semibold truncate ${
        highlight ? 'text-emerald-600' : 'text-gray-800'
      }`}
    >
      {value}
    </span>
  </div>
)

export default DomainHeader
