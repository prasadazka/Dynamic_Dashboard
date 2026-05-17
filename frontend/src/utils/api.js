/**
 * API client for interacting with the backend
 */

// API base URL
const API_BASE_URL = '/api';

/**
 * Upload a CSV file to the server
 * @param {File} file - The CSV file to upload
 * @returns {Promise<Object>} - Response data
 */
export const uploadCsvFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to upload file');
  }
  
  return await response.json();
};

/**
 * Analyze the uploaded CSV file
 * @param {string} fileId - The ID of the uploaded file
 * @returns {Promise<Object>} - Analysis results
 */
export const analyzeData = async (fileId) => {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileId }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to analyze data');
  }
  
  return await response.json();
};

/**
 * Send a chat message to the AI assistant
 * @param {string} fileId - The ID of the uploaded file
 * @param {string} message - The user's message
 * @returns {Promise<Object>} - AI response
 */
export const sendChatMessage = async (fileId, message) => {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileId, message }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to process chat message');
  }
  
  return await response.json();
};
