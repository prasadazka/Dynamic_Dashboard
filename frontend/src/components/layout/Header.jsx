import { useSelector, useDispatch } from 'react-redux'
import { FiMenu, FiMessageSquare } from 'react-icons/fi'
import { toggleChat } from '../../store/slices/uiSlice'
import { getTheme, gradientCss } from '../../utils/domainTheme'

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const dispatch = useDispatch()
  const { chatOpen } = useSelector((state) => state.ui)
  const { domain } = useSelector((state) => state.data)
  const theme = getTheme(domain)

  return (
    <header className="sticky top-0 z-10 flex items-center bg-white border-b border-gray-200 h-16">
      <div className="flex items-center justify-between w-full px-4">
        <div className="flex items-center min-w-0">
          <button
            type="button"
            className="p-2 text-gray-500 rounded-md hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <FiMenu className="w-6 h-6" />
          </button>

          <h2
            className={`ml-4 text-xl font-semibold text-gray-800 hidden md:block truncate ${theme.fontTracking}`}
          >
            Savant AI
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            className="px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={() => dispatch(toggleChat())}
            style={
              chatOpen
                ? { background: gradientCss(theme), color: 'white' }
                : { backgroundColor: `${theme.accentFrom}15`, color: theme.accentTo }
            }
          >
            <FiMessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Ask Data</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
