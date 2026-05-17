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

        {/* Sample data — download a curated bundle to try the demo */}
        <div className="mt-6 bg-gradient-to-r from-primary-50 to-white border border-primary-100 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">First time here? Try the demo.</h3>
            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
              Download a bundle of nine ready-to-use sample CSVs covering Retail, Finance, Healthcare,
              HR, Education, Manufacturing, Logistics, Marketing, and an unmapped (Generic) dataset.
              Unzip it, then upload any one file to see Savant AI infer the domain and build a tailored
              dashboard.
            </p>
          </div>
          <a
            href="/sample_data.zip"
            download="sample_data.zip"
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            Download Sample Data
          </a>
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