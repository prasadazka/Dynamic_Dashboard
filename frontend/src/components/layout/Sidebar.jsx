import { useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import { FiHome, FiUpload, FiBarChart2 } from 'react-icons/fi'
import { getTheme, gradientCss } from '../../utils/domainTheme'

const navItems = [
  { Icon: FiHome,       label: 'Dashboard', path: '/dashboard' },
  { Icon: FiUpload,     label: 'Upload',    path: '/' },
  { Icon: FiBarChart2,  label: 'Analytics', path: '/analytics' },
]

const Sidebar = ({ isOpen }) => {
  const location = useLocation()
  const { domain } = useSelector((state) => state.data)
  const theme = getTheme(domain)
  const ThemeIcon = theme.Icon

  return (
    <aside
      className={`bg-white shadow-lg z-20 transition-all duration-300 ease-in-out ${
        isOpen ? 'w-64' : 'w-0 -ml-64 md:w-16 md:ml-0'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Brand */}
        <div className="flex items-center gap-3 h-16 px-4 border-b border-gray-100">
          <div
            className="flex-shrink-0 h-9 w-9 rounded-xl shadow-md flex items-center justify-center text-white"
            style={{ background: gradientCss(theme) }}
          >
            <ThemeIcon className="w-5 h-5" />
          </div>
          {isOpen && (
            <div className="min-w-0">
              <h1 className={`text-sm font-bold text-gray-900 leading-tight truncate ${theme.fontTracking}`}>
                MISBAH DYNAMIC
              </h1>
              <p className="text-[11px] text-gray-500 truncate">
                {domain ? `${theme.label} Intelligence` : 'BI Platform'}
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(({ Icon, label, path }) => {
            const active = location.pathname === path
            return (
              <Link
                key={label}
                to={path}
                className={`relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  active
                    ? 'text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                style={active ? { background: gradientCss(theme) } : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={`ml-3 ${isOpen ? 'block' : 'hidden md:block md:ml-0 md:sr-only'}`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className={`text-xs text-gray-400 ${isOpen ? 'block' : 'hidden md:block'}`}>
            <p>v1.0.0</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
