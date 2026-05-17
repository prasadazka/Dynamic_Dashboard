import { useSelector, useDispatch } from 'react-redux'
import { toggleSidebar } from '../../store/slices/uiSlice'
import Sidebar from './Sidebar'
import Header from './Header'
import ChatPanel from '../dashboard/ChatPanel'

const Layout = ({ children }) => {
  const { sidebarOpen } = useSelector((state) => state.ui)
  const dispatch = useDispatch()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <Header
          toggleSidebar={() => dispatch(toggleSidebar())}
          isSidebarOpen={sidebarOpen}
        />

        <main className="relative flex-1 overflow-y-auto focus:outline-none p-4">
          <div className="container px-4 py-6 mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Global floating chat widget — available on every page */}
      <ChatPanel />
    </div>
  )
}

export default Layout