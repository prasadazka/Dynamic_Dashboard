import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadCsvFile, analyzeData } from '../store/slices/dataSlice';

/**
 * Custom hook for managing the CSV file analysis process
 * @returns {Object} - Analysis state and functions
 */
export const useDataAnalysis = () => {
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, loading, success, error
  const [analysisStatus, setAnalysisStatus] = useState('idle'); // idle, loading, success, error
  const { data, fileId, domain, metrics, visualizations, error } = useSelector((state) => state.data);
  const dispatch = useDispatch();
  
  /**
   * Handle file upload and analysis
   * @param {File} file - The CSV file to process
   */
  const processFile = async (file) => {
    try {
      setUploadStatus('loading');
      await dispatch(uploadCsvFile(file)).unwrap();
      setUploadStatus('success');
      
      // Once file is uploaded, start analysis
      setAnalysisStatus('loading');
      await dispatch(analyzeData()).unwrap();
      setAnalysisStatus('success');
    } catch (err) {
      console.error('Error processing file:', err);
      setUploadStatus('error');
      setAnalysisStatus('error');
    }
  };
  
  /**
   * Reset the analysis state
   */
  const resetAnalysis = () => {
    setUploadStatus('idle');
    setAnalysisStatus('idle');
  };
  
  return {
    // State
    data,
    fileId,
    domain,
    metrics,
    visualizations,
    error,
    uploadStatus,
    analysisStatus,
    isLoading: uploadStatus === 'loading' || analysisStatus === 'loading',
    isComplete: uploadStatus === 'success' && analysisStatus === 'success',
    
    // Functions
    processFile,
    resetAnalysis
  };
};

export default useDataAnalysis;
