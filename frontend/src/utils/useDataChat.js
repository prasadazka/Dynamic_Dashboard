import { useState } from 'react';
import { sendChatMessage } from './api';

/**
 * Custom hook for managing chat interactions with the AI
 * @param {string} fileId - The ID of the uploaded file
 * @returns {Object} - Chat state and functions
 */
export const useDataChat = (fileId) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'system',
      content: 'Hello! I\'m your AI Data Assistant. Ask me anything about your data or request specific analytics.',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  /**
   * Send a message to the AI assistant
   * @param {string} content - The message content
   */
  const sendMessage = async (content) => {
    if (!content.trim() || !fileId) return;
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    
    try {
      // Send message to the API
      const response = await sendChatMessage(fileId, content);
      
      // Add AI response
      const aiMessage = {
        id: Date.now() + 1,
        sender: 'system',
        content: response.response,
        statistics: response.statistics,
        visualization: response.visualization,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message);
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'system',
        content: `Sorry, I couldn't process your request: ${err.message}`,
        timestamp: new Date(),
        isError: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Clear the chat history
   */
  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'system',
        content: 'Chat history cleared. How can I help you analyze your data?',
        timestamp: new Date(),
      },
    ]);
    setError(null);
  };
  
  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
};

export default useDataChat;
