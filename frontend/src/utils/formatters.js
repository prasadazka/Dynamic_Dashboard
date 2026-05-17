/**
 * Format utility functions for data visualization
 */

/**
 * Format a numeric value as currency with dollar sign and two decimal places
 * @param {number} value - The value to format
 * @param {string} [currencySymbol='$'] - The currency symbol to use
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currencySymbol = '$') => {
  if (value === null || value === undefined || isNaN(value)) {
    return `${currencySymbol}0.00`;
  }
  
  return `${currencySymbol}${parseFloat(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Format a numeric value as a percentage with specified decimal places
 * @param {number} value - The value to format
 * @param {number} [decimals=1] - Number of decimal places 
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  return `${parseFloat(value).toFixed(decimals)}%`;
};

/**
 * Format a numeric value with specified decimal places
 * @param {number} value - The value to format
 * @param {number} [decimals=0] - Number of decimal places
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  return parseFloat(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Format large numbers with abbreviations (K, M, B)
 * @param {number} value - The value to format
 * @returns {string} - Formatted number string
 */
export const formatLargeNumber = (value) => {
  const num = parseFloat(value);
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
};

/**
 * Format a date value to a readable string
 * @param {Date|string} date - The date to format
 * @param {string} [format='medium'] - Format style: 'short', 'medium', 'long'
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'medium') => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const options = { 
    year: 'numeric', 
    month: format === 'short' ? 'numeric' : 'short', 
    day: 'numeric' 
  };
  
  if (format === 'long') {
    options.weekday = 'long';
    options.month = 'long';
  }
  
  return dateObj.toLocaleDateString(undefined, options);
};

/**
 * Calculate percentage change between two values
 * @param {number} oldValue - Original value
 * @param {number} newValue - New value
 * @param {number} [decimals=1] - Decimal places in result
 * @returns {string} Formatted percentage change with sign
 */
export const percentChange = (oldValue, newValue, decimals = 1) => {
  if (!oldValue || isNaN(oldValue) || !newValue || isNaN(newValue)) {
    return '0%';
  }
  
  const change = ((newValue - oldValue) / oldValue) * 100;
  const sign = change >= 0 ? '+' : '';
  
  return `${sign}${change.toFixed(decimals)}%`;
};

/**
 * Truncate text to a specified length and add ellipsis if needed
 * @param {string} text - Text to truncate
 * @param {number} [length=50] - Maximum length before truncating
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 50) => {
  if (!text) return '';
  
  if (text.length <= length) return text;
  
  return `${text.substring(0, length)}...`;
};

/**
 * Format a value based on inferred type
 * @param {any} value - The value to format
 * @param {string} [columnName=''] - Column name for type inference
 * @returns {string} Appropriately formatted value
 */
export const smartFormat = (value, columnName = '') => {
  if (value === null || value === undefined) return '';
  
  const lowerColumn = (columnName || '').toLowerCase();
  
  // Currency detection
  if (lowerColumn.includes('price') || 
      lowerColumn.includes('cost') || 
      lowerColumn.includes('revenue') || 
      lowerColumn.includes('sales') || 
      lowerColumn.includes('salary') || 
      lowerColumn.includes('budget')) {
    return formatCurrency(value);
  }
  
  // Percentage detection
  if (lowerColumn.includes('percent') || 
      lowerColumn.includes('rate') || 
      lowerColumn.includes('ratio')) {
    return formatPercentage(value);
  }
  
  // Date detection
  if (lowerColumn.includes('date') || 
      lowerColumn.includes('time') || 
      /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return formatDate(value);
  }
  
  // Number detection
  if (!isNaN(parseFloat(value)) && isFinite(value)) {
    // Determine appropriate decimal places
    return Math.floor(value) === value ? 
      formatNumber(value, 0) : formatNumber(value, 2);
  }
  
  // Default to string
  return value.toString();
};
