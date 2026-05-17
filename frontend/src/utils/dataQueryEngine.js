import { formatCurrency, formatNumber, formatPercentage } from './formatters';

/**
 * Analyzes a user query and attempts to answer it based on the provided data
 * 
 * @param {string} query - The user's question
 * @param {Array} data - The dataset to analyze
 * @param {string} domain - The domain of the data (e.g., 'Retail')
 * @returns {Object} - Response with answer, statistics, and visualization data
 */
export const analyzeUserQuery = (query, data, domain) => {
  // Always delegate to the backend for better analysis
  return {
    canAnswer: false,
    answer: null
  };
};

/**
 * Determines if we can handle a query locally and returns the appropriate handler
 */
const determineQueryHandler = (query, data, domain) => {
  const queryHandlers = getQueryHandlers(domain);
  
  for (const handler of queryHandlers) {
    if (handler.patterns.some(pattern => query.includes(pattern))) {
      return {
        canAnswer: true,
        handler: handler.handler
      };
    }
  }
  
  return {
    canAnswer: false,
    handler: null
  };
};

/**
 * Returns a list of query handlers based on the domain
 */
const getQueryHandlers = (domain) => {
  // Common handlers for all domains
  const commonHandlers = [
    {
      patterns: ['total records', 'how many records', 'data size', 'number of rows'],
      handler: (data) => {
        return {
          canAnswer: true,
          answer: `There are ${formatNumber(data.length)} records in the dataset.`,
          statistics: {
            'Total Records': formatNumber(data.length)
          }
        };
      }
    },
    {
      patterns: ['summarize', 'summary', 'overview', 'key insights'],
      handler: (data) => {
        // Generate a summary based on available columns
        const summary = [];
        
        if (data.length > 0) {
          summary.push(`This dataset contains ${formatNumber(data.length)} records.`);
          
          const columns = Object.keys(data[0]);
          summary.push(`It has ${columns.length} columns: ${columns.join(', ')}.`);
          
          // Add domain-specific summary
          if (columns.includes('totalAmount')) {
            const totalRevenue = data.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
            summary.push(`Total revenue is ${formatCurrency(totalRevenue)}.`);
          }
        }
        
        return {
          canAnswer: true,
          answer: summary.join(' '),
          statistics: {
            'Total Records': formatNumber(data.length),
            'Columns': Object.keys(data[0]).length
          }
        };
      }
    }
  ];
  
  // Domain-specific handlers
  let domainHandlers = [];
  
  if (domain === 'Retail') {
    domainHandlers = [
      {
        patterns: ['total revenue', 'total sales', 'how much revenue', 'total income'],
        handler: (data) => {
          if (!data.some(item => item.totalAmount)) {
            return {
              canAnswer: true,
              answer: "I couldn't find revenue information in this dataset."
            };
          }
          
          const totalRevenue = data.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
          
          return {
            canAnswer: true,
            answer: `The total revenue is ${formatCurrency(totalRevenue)}.`,
            statistics: {
              'Total Revenue': formatCurrency(totalRevenue)
            }
          };
        }
      },
      {
        patterns: ['average order', 'average transaction', 'avg order value'],
        handler: (data) => {
          if (!data.some(item => item.totalAmount)) {
            return {
              canAnswer: true,
              answer: "I couldn't find order value information in this dataset."
            };
          }
          
          const totalRevenue = data.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
          const avgOrderValue = totalRevenue / data.length;
          
          return {
            canAnswer: true,
            answer: `The average order value is ${formatCurrency(avgOrderValue)}.`,
            statistics: {
              'Average Order Value': formatCurrency(avgOrderValue),
              'Total Orders': formatNumber(data.length)
            }
          };
        }
      },
      {
        patterns: ['top category', 'best selling category', 'highest revenue category', 'most popular category'],
        handler: (data) => {
          if (!data.some(item => item.productCategory && item.totalAmount)) {
            return {
              canAnswer: true,
              answer: "I couldn't find product category information in this dataset."
            };
          }
          
          // Aggregate sales by category
          const categorySales = {};
          
          data.forEach(item => {
            if (!item.productCategory || !item.totalAmount) return;
            
            if (!categorySales[item.productCategory]) {
              categorySales[item.productCategory] = 0;
            }
            
            categorySales[item.productCategory] += parseFloat(item.totalAmount) || 0;
          });
          
          // Find top category
          let topCategory = null;
          let topAmount = 0;
          
          for (const [category, amount] of Object.entries(categorySales)) {
            if (amount > topAmount) {
              topCategory = category;
              topAmount = amount;
            }
          }
          
          if (!topCategory) {
            return {
              canAnswer: true,
              answer: "I couldn't determine the top category from this data."
            };
          }
          
          // Calculate percentage of total revenue
          const totalRevenue = Object.values(categorySales).reduce((sum, val) => sum + val, 0);
          const percentage = (topAmount / totalRevenue) * 100;
          
          return {
            canAnswer: true,
            answer: `The top selling category is "${topCategory}" with ${formatCurrency(topAmount)}, representing ${formatPercentage(percentage)} of total revenue.`,
            statistics: {
              'Top Category': topCategory,
              'Revenue': formatCurrency(topAmount),
              'Percentage': formatPercentage(percentage)
            }
          };
        }
      },
      {
        patterns: ['average age', 'customer age', 'typical customer age'],
        handler: (data) => {
          if (!data.some(item => item.customerAge)) {
            return {
              canAnswer: true,
              answer: "I couldn't find customer age information in this dataset."
            };
          }
          
          // Calculate average age
          let totalAge = 0;
          let count = 0;
          
          data.forEach(item => {
            if (item.customerAge) {
              totalAge += parseFloat(item.customerAge) || 0;
              count++;
            }
          });
          
          const avgAge = totalAge / count;
          
          return {
            canAnswer: true,
            answer: `The average customer age is ${avgAge.toFixed(1)} years.`,
            statistics: {
              'Average Customer Age': `${avgAge.toFixed(1)} years`,
              'Total Customers': formatNumber(count)
            }
          };
        }
      },
      {
        patterns: ['payment method', 'how do customers pay', 'popular payment'],
        handler: (data) => {
          if (!data.some(item => item.paymentMethod)) {
            return {
              canAnswer: true,
              answer: "I couldn't find payment method information in this dataset."
            };
          }
          
          // Aggregate payment methods
          const paymentMethods = {};
          
          data.forEach(item => {
            if (!item.paymentMethod) return;
            
            if (!paymentMethods[item.paymentMethod]) {
              paymentMethods[item.paymentMethod] = 0;
            }
            
            paymentMethods[item.paymentMethod]++;
          });
          
          // Find top payment method
          let topMethod = null;
          let topCount = 0;
          
          for (const [method, count] of Object.entries(paymentMethods)) {
            if (count > topCount) {
              topMethod = method;
              topCount = count;
            }
          }
          
          if (!topMethod) {
            return {
              canAnswer: true,
              answer: "I couldn't determine the most popular payment method from this data."
            };
          }
          
          // Calculate percentage
          const totalTransactions = Object.values(paymentMethods).reduce((sum, val) => sum + val, 0);
          const percentage = (topCount / totalTransactions) * 100;
          
          return {
            canAnswer: true,
            answer: `The most popular payment method is "${topMethod}", used in ${formatNumber(topCount)} transactions (${formatPercentage(percentage)} of all orders).`,
            statistics: {
              'Top Payment Method': topMethod,
              'Usage Count': formatNumber(topCount),
              'Percentage': formatPercentage(percentage)
            }
          };
        }
      },
      {
        patterns: ['total units', 'items sold', 'quantity sold', 'products sold'],
        handler: (data) => {
          if (!data.some(item => item.quantity)) {
            return {
              canAnswer: true,
              answer: "I couldn't find sales quantity information in this dataset."
            };
          }
          
          const totalUnits = data.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
          
          return {
            canAnswer: true,
            answer: `The total number of units sold is ${formatNumber(totalUnits)}.`,
            statistics: {
              'Total Units Sold': formatNumber(totalUnits)
            }
          };
        }
      }
    ];
  }
  
  return [...commonHandlers, ...domainHandlers];
};
