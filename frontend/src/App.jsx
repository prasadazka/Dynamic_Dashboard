import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Analytics from './pages/Analytics'
import Layout from './components/layout/Layout'
import { useEffect } from 'react'

function App() {
  useEffect(() => {
    console.log('App component mounted')
    // Debug the paths to components
    console.log('Upload path:', Upload)
    console.log('Dashboard path:', Dashboard)
    console.log('Analytics path:', Analytics)
  }, [])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Layout>
  )
}

export default App
