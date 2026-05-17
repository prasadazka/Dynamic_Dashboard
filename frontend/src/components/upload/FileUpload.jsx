import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { uploadCsvFile, analyzeData } from '../../store/slices/dataSlice'

const FileUpload = () => {
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }
  
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const uploadedFile = e.dataTransfer.files[0]
      if (uploadedFile.type === 'text/csv') {
        setFile(uploadedFile)
        setError(null)
      } else {
        setError('Please upload a CSV file.')
      }
    }
  }
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const uploadedFile = e.target.files[0]
      if (uploadedFile.type === 'text/csv') {
        setFile(uploadedFile)
        setError(null)
      } else {
        setError('Please upload a CSV file.')
      }
    }
  }
  
  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file to upload.')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      await dispatch(uploadCsvFile(file)).unwrap()
      await dispatch(analyzeData()).unwrap()
      
      // Redirect to dashboard
      navigate('/dashboard')
    } catch (err) {
      console.error('Error processing file:', err)
      setError(err.message || 'Failed to process file. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Upload Your CSV Data</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          <p className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}
      
      <div 
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
          dragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400'
        } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload').click()}
      >
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept=".csv"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        
        <div className="flex flex-col items-center justify-center space-y-3">
          <svg 
            className="w-16 h-16 text-gray-400"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
            />
          </svg>
          <p className="text-lg text-gray-600">
            Drag and drop your CSV file here, or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Supported format: CSV
          </p>
        </div>
      </div>
      
      {file && (
        <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              type="button"
              className="text-red-500 hover:text-red-700 focus:outline-none"
              onClick={() => setFile(null)}
              disabled={isLoading}
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
          
          <button
            type="button"
            className={`w-full mt-4 btn btn-primary py-3 flex items-center justify-center ${
              isLoading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : 'Analyze Data'}
          </button>
        </div>
      )}
    </div>
  )
}

export default FileUpload