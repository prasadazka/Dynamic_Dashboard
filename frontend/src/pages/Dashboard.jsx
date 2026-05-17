import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

// Dashboard components
import DomainHeader from '../components/dashboard/DomainHeader'
import MetricsOverview from '../components/dashboard/MetricsOverview'
import VisualizationGrid from '../components/dashboard/VisualizationGrid'

const Dashboard = () => {
  const { data, domain, loading, error } = useSelector((state) => state.data)
  const navigate = useNavigate()
  
  // Redirect to upload page if no data is available
  useEffect(() => {
    if (!data && !loading) {
      navigate('/')
    }
  }, [data, loading, navigate])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Analyzing your data...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 text-red-500 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Analysis Error</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/')}
        >
          Try Again
        </button>
      </div>
    )
  }
  
  return (
    <div className="h-full">
      {data && (
        <>
          <DomainHeader domain={domain} />
          <MetricsOverview />
          <VisualizationGrid />
        </>
      )}
    </div>
  )
}

export default Dashboard