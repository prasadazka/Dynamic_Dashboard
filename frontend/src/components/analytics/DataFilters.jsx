import { useState, useEffect } from 'react';

const DataFilters = ({ 
  data, 
  dateRange, 
  setDateRange, 
  selectedCategories, 
  setSelectedCategories,
  selectedCustomerSegment,
  setSelectedCustomerSegment
}) => {
  const [availableCategories, setAvailableCategories] = useState([]);
  const [hasDateField, setHasDateField] = useState(false);
  const [hasAgeField, setHasAgeField] = useState(false);
  const [minDate, setMinDate] = useState(null);
  const [maxDate, setMaxDate] = useState(null);
  
  // Extract unique categories and date range from data
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Check if data has productCategory field
    if (data.some(item => item.productCategory)) {
      const categories = [...new Set(data.map(item => item.productCategory))].filter(Boolean);
      setAvailableCategories(categories);
    }
    
    // Check if data has date field
    if (data.some(item => item.date)) {
      setHasDateField(true);
      
      // Find min and max dates
      const dates = data.map(item => new Date(item.date)).filter(d => !isNaN(d.getTime()));
      
      if (dates.length > 0) {
        setMinDate(new Date(Math.min(...dates)));
        setMaxDate(new Date(Math.max(...dates)));
        
        // Initialize date range if not set
        if (!dateRange.startDate || !dateRange.endDate) {
          setDateRange({
            startDate: new Date(Math.min(...dates)),
            endDate: new Date(Math.max(...dates))
          });
        }
      }
    }
    
    // Check if data has customerAge field
    if (data.some(item => item.customerAge)) {
      setHasAgeField(true);
    }
    
  }, [data, dateRange, setDateRange]);
  
  // Handle category selection
  const handleCategoryChange = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(cat => cat !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };
  
  // Handle date range changes
  const handleDateChange = (type, event) => {
    const date = new Date(event.target.value);
    if (type === 'start') {
      setDateRange({ ...dateRange, startDate: date });
    } else if (type === 'end') {
      setDateRange({ ...dateRange, endDate: date });
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSelectedCategories([]);
    if (minDate && maxDate) {
      setDateRange({ startDate: minDate, endDate: maxDate });
    }
    setSelectedCustomerSegment('all');
  };
  
  if (!data || data.length === 0) return null;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2 md:mb-0">Data Filters</h2>
        <button
          onClick={resetFilters}
          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
        >
          Reset All Filters
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Date Range Filter */}
        {hasDateField && minDate && maxDate && (
          <div className="bg-gray-50 p-3 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Date Range</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={dateRange.startDate ? dateRange.startDate.toISOString().split('T')[0] : ''}
                  min={minDate.toISOString().split('T')[0]}
                  max={maxDate.toISOString().split('T')[0]}
                  onChange={(e) => handleDateChange('start', e)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={dateRange.endDate ? dateRange.endDate.toISOString().split('T')[0] : ''}
                  min={minDate.toISOString().split('T')[0]}
                  max={maxDate.toISOString().split('T')[0]}
                  onChange={(e) => handleDateChange('end', e)}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Category Filter */}
        {availableCategories.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Product Categories</h3>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map(category => (
                <div key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`category-${category}`}
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`category-${category}`} className="ml-2 text-sm text-gray-700">
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Customer Segment Filter */}
        {hasAgeField && (
          <div className="bg-gray-50 p-3 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Customer Segment</h3>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="segment-all"
                  name="customer-segment"
                  value="all"
                  checked={selectedCustomerSegment === 'all'}
                  onChange={() => setSelectedCustomerSegment('all')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <label htmlFor="segment-all" className="ml-2 text-sm text-gray-700">
                  All Customers
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="segment-youth"
                  name="customer-segment"
                  value="youth"
                  checked={selectedCustomerSegment === 'youth'}
                  onChange={() => setSelectedCustomerSegment('youth')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <label htmlFor="segment-youth" className="ml-2 text-sm text-gray-700">
                  Youth (Under 25)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="segment-adults"
                  name="customer-segment"
                  value="adults"
                  checked={selectedCustomerSegment === 'adults'}
                  onChange={() => setSelectedCustomerSegment('adults')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <label htmlFor="segment-adults" className="ml-2 text-sm text-gray-700">
                  Adults (25-64)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="segment-seniors"
                  name="customer-segment"
                  value="seniors"
                  checked={selectedCustomerSegment === 'seniors'}
                  onChange={() => setSelectedCustomerSegment('seniors')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <label htmlFor="segment-seniors" className="ml-2 text-sm text-gray-700">
                  Seniors (65+)
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Applied Filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        {selectedCategories.length > 0 && (
          <div className="bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full">
            {selectedCategories.length} Categories Selected
          </div>
        )}
        {hasDateField && dateRange.startDate && dateRange.endDate && (
          <div className="bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full">
            Date: {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
          </div>
        )}
        {hasAgeField && selectedCustomerSegment !== 'all' && (
          <div className="bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full">
            Segment: {selectedCustomerSegment.charAt(0).toUpperCase() + selectedCustomerSegment.slice(1)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataFilters;