/**
 * Utility functions for domain-specific data transformations
 */

/**
 * Transform retail data for visualization
 * @param {Array} data - Raw retail data
 * @returns {Object} - Transformed data with various aggregations
 */
export const transformRetailData = (data) => {
  if (!data || !data.length) return {};
  
  // Sales by date
  const salesByDate = {};
  const categoryTotals = {};
  const paymentMethods = {};
  
  data.forEach(item => {
    // Process date
    if (item.date) {
      const date = new Date(item.date).toLocaleDateString();
      salesByDate[date] = (salesByDate[date] || 0) + (item.totalAmount || 0);
    }
    
    // Process category
    if (item.productCategory) {
      categoryTotals[item.productCategory] = (categoryTotals[item.productCategory] || 0) + (item.totalAmount || 0);
    }
    
    // Process payment methods
    if (item.paymentMethod) {
      paymentMethods[item.paymentMethod] = (paymentMethods[item.paymentMethod] || 0) + 1;
    }
  });
  
  // Convert to arrays for charts
  const salesByDateArray = Object.entries(salesByDate).map(([name, value]) => ({ name, value }));
  const categoryTotalsArray = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
  const paymentMethodsArray = Object.entries(paymentMethods).map(([name, value]) => ({ name, value }));
  
  return {
    salesByDate: salesByDateArray,
    categories: categoryTotalsArray,
    paymentMethods: paymentMethodsArray
  };
};

/**
 * Transform finance data for visualization
 * @param {Array} data - Raw finance data
 * @returns {Object} - Transformed data with various aggregations
 */
export const transformFinanceData = (data) => {
  // Placeholder for finance domain transformations
  return {};
};

/**
 * Transform healthcare data for visualization
 * @param {Array} data - Raw healthcare data
 * @returns {Object} - Transformed data with various aggregations
 */
export const transformHealthcareData = (data) => {
  // Placeholder for healthcare domain transformations
  return {};
};

/**
 * Get color scheme for a specific domain
 * @param {string} domain - The data domain
 * @returns {Array} - Array of color hex codes
 */
export const getDomainColors = (domain) => {
  const colorSchemes = {
    Retail: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'],
    Finance: ['#003F5C', '#2F4B7C', '#665191', '#A05195', '#D45087', '#F95D6A', '#FF7C43', '#FFA600'],
    Healthcare: ['#66C5CC', '#F6CF71', '#F89C74', '#DCB0F2', '#87C55F', '#9EB9F3', '#FE88B1', '#C9DB74'],
    General: ['#7EB0D5', '#BD6A67', '#B0BF1A', '#E0C793', '#A9A9A9', '#D7B5A6', '#BD7D95', '#71A0A5']
  };
  
  return colorSchemes[domain] || colorSchemes.General;
};
