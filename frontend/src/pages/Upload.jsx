import FileUpload from '../components/upload/FileUpload'
import { useEffect } from 'react'

const Upload = () => {
  useEffect(() => {
    console.log('Upload component mounted')
  }, [])

  return (
    <div className="py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4 text-primary-700">
            Savant AI
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload a CSV and Savant AI infers the domain, builds a tailored dashboard, and answers questions about your data in plain English.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <FileUpload />
        </div>
        
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md transition-transform hover:scale-105">
              <div className="text-primary-600 mb-3 flex justify-center">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-center">Upload</h3>
              <p className="text-gray-600 text-center">
                Upload your CSV file and our system will automatically analyze its structure and domain.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md transition-transform hover:scale-105">
              <div className="text-primary-600 mb-3 flex justify-center">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-center">Analyze</h3>
              <p className="text-gray-600 text-center">
                The system identifies the domain and generates custom analytics specifically for your data.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md transition-transform hover:scale-105">
              <div className="text-primary-600 mb-3 flex justify-center">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-center">Visualize</h3>
              <p className="text-gray-600 text-center">
                Explore your data through interactive visualizations and ask questions in natural language.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Upload