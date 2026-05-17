import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const TrendAnalysis = ({ data, domain }) => {
  const [trendData, setTrendData] = useState([]);
  const [timeframe, setTimeframe] = useState('daily');
  const [metric, setMetric] = useState('revenue');
  const [forecast, setForecast] = useState(true);
  
  // Process data for trend analysis
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Check if we have the necessary fields
    const hasDate = data.some(item => item.date);
    const hasRevenue = data.some(item => item.totalAmount);
    const hasQuantity = data.some(item => item.quantity);
    
    if (!hasDate || (!hasRevenue && !hasQuantity)) return;
    
    // Determine which data to aggregate
    let valueKey;
    switch (metric) {
      case 'revenue':
        valueKey = 'totalAmount';
        break;
      case 'units':
        valueKey = 'quantity';
        break;
      default:
        valueKey = 'totalAmount';
    }
    
    // Aggregate data by time periods
    const aggregatedData = {};
    
    data.forEach(item => {
      if (!item.date || !item[valueKey]) return;
      
      const date = new Date(item.date);
      let periodKey;
      
      // Format the date based on selected timeframe
      switch (timeframe) {
        case 'daily':
          periodKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'weekly':
          // Get the week number
          const startOfYear = new Date(date.getFullYear(), 0, 1);
          const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
          const weekNumber = Math.ceil((date.getDay() + 1 + days) / 7);
          periodKey = `Week ${weekNumber}, ${date.getFullYear()}`;
          break;
        case 'monthly':
          periodKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
          break;
        default:
          periodKey = date.toISOString().split('T')[0];
      }
      
      if (!aggregatedData[periodKey]) {
        aggregatedData[periodKey] = 0;
      }
      
      // Add the value
      if (valueKey === 'totalAmount') {
        aggregatedData[periodKey] += parseFloat(item[valueKey]) || 0;
      } else {
        aggregatedData[periodKey] += parseInt(item[valueKey]) || 0;
      }
    });
    
    // Convert to array and sort by date
    let trendsArray = Object.entries(aggregatedData).map(([period, value]) => ({ period, value }));
    
    // Sort based on timeframe
    if (timeframe === 'daily') {
      trendsArray = trendsArray.sort((a, b) => new Date(a.period) - new Date(b.period));
    } else if (timeframe === 'monthly') {
      // Custom sort for month year format
      trendsArray = trendsArray.sort((a, b) => {
        const [aMonth, aYear] = a.period.split(' ');
        const [bMonth, bYear] = b.period.split(' ');
        if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.indexOf(aMonth) - months.indexOf(bMonth);
      });
    }
    
    // Calculate moving average for the trend line (3-period)
    if (trendsArray.length >= 3) {
      for (let i = 2; i < trendsArray.length; i++) {
        const avg = (trendsArray[i].value + trendsArray[i-1].value + trendsArray[i-2].value) / 3;
        trendsArray[i].trendline = avg;
      }
    }
    
    // Add simple forecast (3 periods ahead) if enabled
    if (forecast && trendsArray.length >= 6) {
      // Calculate average growth rate from the last 6 periods
      const lastSixPeriods = trendsArray.slice(-6);
      const growthRates = [];
      
      for (let i = 1; i < lastSixPeriods.length; i++) {
        const prevValue = lastSixPeriods[i-1].value;
        const currValue = lastSixPeriods[i].value;
        if (prevValue > 0) {
          growthRates.push((currValue - prevValue) / prevValue);
        }
      }
      
      // Calculate average growth rate
      const avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
      
      // Generate forecast periods
      const lastPeriod = trendsArray[trendsArray.length - 1];
      let lastValue = lastPeriod.value;
      
      // Generate names for forecast periods
      let forecastPeriods = [];
      if (timeframe === 'daily') {
        // Add 1 day for each forecast period
        const lastDate = new Date(lastPeriod.period);
        for (let i = 1; i <= 3; i++) {
          const nextDate = new Date(lastDate);
          nextDate.setDate(nextDate.getDate() + i);
          forecastPeriods.push(nextDate.toISOString().split('T')[0]);
        }
      } else if (timeframe === 'monthly') {
        // Add 1 month for each forecast period
        const [lastMonth, lastYear] = lastPeriod.period.split(' ');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let monthIndex = months.indexOf(lastMonth);
        let year = parseInt(lastYear);
        
        for (let i = 1; i <= 3; i++) {
          monthIndex++;
          if (monthIndex > 11) {
            monthIndex = 0;
            year++;
          }
          forecastPeriods.push(`${months[monthIndex]} ${year}`);
        }
      }
      
      // Generate forecast data
      for (let i = 0; i < 3; i++) {
        const forecastValue = lastValue * (1 + avgGrowthRate);
        trendsArray.push({
          period: forecastPeriods[i],
          forecast: forecastValue,
          isForecast: true
        });
        lastValue = forecastValue;
      }
    }
    
    setTrendData(trendsArray);
  }, [data, domain, timeframe, metric, forecast]);
  
  if (!data || data.length === 0 || trendData.length === 0) return null;
  
  // Helper function to format the value based on the metric
  const formatValue = (value) => {
    if (metric === 'revenue') {
      return formatCurrency(value);
    } else {
      return value.toLocaleString();
    }
  };
  
  // Determine if we have forecast data
  const hasForecast = trendData.some(item => item.isForecast);
  
  // Find the index where forecast begins
  const forecastStartIndex = hasForecast ? trendData.findIndex(item => item.isForecast) : -1;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Trend Analysis</h2>
        
        <div className="flex flex-wrap mt-3 md:mt-0 gap-3">
          {/* Timeframe selector */}
          <div>
            <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700 mb-1">
              Timeframe
            </label>
            <select
              id="timeframe"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          {/* Metric selector */}
          <div>
            <label htmlFor="metric" className="block text-sm font-medium text-gray-700 mb-1">
              Metric
            </label>
            <select
              id="metric"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="revenue">Revenue</option>
              <option value="units">Units Sold</option>
            </select>
          </div>
          
          {/* Forecast toggle */}
          <div className="flex items-end">
            <div className="flex items-center h-9">
              <input
                id="forecast"
                type="checkbox"
                checked={forecast}
                onChange={(e) => setForecast(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="forecast" className="ml-2 block text-sm text-gray-700">
                Show Forecast
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trendData}
            margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              angle={-45} 
              textAnchor="end" 
              height={70} 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => metric === 'revenue' ? `$${value}` : value}
            />
            <Tooltip 
              formatter={(value) => [formatValue(value), metric === 'revenue' ? 'Revenue' : 'Units Sold']} 
              labelFormatter={(label) => `Period: ${label}`}
            />
            <Legend />
            
            {/* Actual data line */}
            <Line 
              type="monotone" 
              dataKey="value" 
              name={metric === 'revenue' ? 'Actual Revenue' : 'Actual Units'} 
              stroke="#4F46E5" 
              strokeWidth={2}
              activeDot={{ r: 8 }} 
              dot={{ r: 4 }}
            />
            
            {/* Trendline (moving average) */}
            <Line 
              type="monotone" 
              dataKey="trendline" 
              name="Trend Line" 
              stroke="#10B981" 
              strokeWidth={2}
              dot={false}
              activeDot={false}
            />
            
            {/* Forecast line */}
            {forecast && (
              <Line 
                type="monotone" 
                dataKey="forecast" 
                name="Forecast" 
                stroke="#F59E0B" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4, strokeWidth: 2 }}
              />
            )}
            
            {/* Reference line for where forecast begins */}
            {hasForecast && forecastStartIndex > 0 && (
              <ReferenceLine x={trendData[forecastStartIndex].period} stroke="#6B7280" strokeDasharray="3 3" label={{ value: 'Forecast Start', position: 'insideTopRight', fill: '#6B7280', fontSize: 12 }} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {forecast && (
        <div className="mt-4 text-sm text-gray-500">
          <p>* Forecast based on historical growth patterns over the last 6 periods. This is a simple projection and should be used for reference only.</p>
        </div>
      )}
    </div>
  );
};

export default TrendAnalysis;