/**
 * Dynamically analyzes any dataset to identify its characteristics and important columns
 */
export class DataAnalyzer {
  constructor(data) {
    this.data = data;
    this.columns = data && data.length > 0 ? Object.keys(data[0]) : [];
    this.columnTypes = {};
    this.metrics = [];
    this.dimensions = [];
    this.dateColumns = [];
    this.numericColumns = [];
    this.categoricalColumns = [];
    this.idColumns = [];
    this.importantFields = [];
    this.domain = "Generic";
    
    // Initialize
    if (data && data.length > 0) {
      this.analyzeColumns();
      this.identifyColumnRoles();
      this.detectDomain();
      this.identifyImportantFields();
    }
  }
  
  /**
   * Analyze each column to determine its data type
   */
  analyzeColumns() {
    this.columns.forEach(column => {
      const values = this.data
        .map(row => row[column])
        .filter(val => val !== null && val !== undefined && val !== "");
      
      // Skip if no values
      if (values.length === 0) {
        this.columnTypes[column] = "unknown";
        return;
      }
      
      // Check if column contains dates
      const datePattern = /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/;
      const hasDateFormat = values.some(val => typeof val === 'string' && datePattern.test(val));
      if (hasDateFormat) {
        this.columnTypes[column] = "date";
        this.dateColumns.push(column);
        return;
      }
      
      // Check if column is numeric
      const numericValues = values.filter(val => !isNaN(parseFloat(val)) && isFinite(val));
      if (numericValues.length > 0.9 * values.length) { // 90% of values are numeric
        this.columnTypes[column] = "numeric";
        this.numericColumns.push(column);
        return;
      }
      
      // Check if column is categorical
      const uniqueValues = [...new Set(values)];
      if (uniqueValues.length < 0.2 * values.length) { // Less than 20% unique values
        this.columnTypes[column] = "categorical";
        this.categoricalColumns.push(column);
        return;
      }
      
      // Check if it's an ID column
      if (uniqueValues.length > 0.9 * values.length) { // More than 90% unique values
        if (column.toLowerCase().includes('id') || 
            column.toLowerCase().includes('code') ||
            column.toLowerCase().includes('number') ||
            column.toLowerCase().includes('emp') ||
            column.toLowerCase().includes('employee')) {
          this.columnTypes[column] = "id";
          this.idColumns.push(column);
          return;
        }
      }
      
      // Default to text
      this.columnTypes[column] = "text";
    });
  }
  
  /**
   * Identify column roles (metrics vs dimensions)
   */
  identifyColumnRoles() {
    this.columns.forEach(column => {
      const type = this.columnTypes[column];
      const name = column.toLowerCase();
      
      // Metrics are typically numeric and not IDs
      if (type === "numeric" && !this.idColumns.includes(column)) {
        // Common metric patterns
        if (name.includes('amount') || 
            name.includes('price') || 
            name.includes('cost') || 
            name.includes('revenue') || 
            name.includes('sales') ||
            name.includes('profit') || 
            name.includes('income') || 
            name.includes('expense') ||
            name.includes('budget') ||
            name.includes('count') ||
            name.includes('quantity') ||
            name.includes('number') ||
            name.includes('total') ||
            name.includes('sum') ||
            name.includes('rate') ||
            name.includes('ratio') ||
            name.includes('percentage') ||
            name.includes('score') ||
            name.includes('length') ||
            name.includes('duration') ||
            name.includes('salary') ||
            name.includes('compensation') ||
            name.includes('performance') ||
            name.includes('rating') ||
            name.includes('age') ||
            name.includes('years') ||
            name.includes('experience')) {
          this.metrics.push(column);
        }
      }
      
      // Dimensions are typically categorical, dates, or IDs
      if (type === "categorical" || type === "date" || type === "id") {
        this.dimensions.push(column);
      }
    });
    
    // If no metrics identified, try to infer from numeric columns
    if (this.metrics.length === 0 && this.numericColumns.length > 0) {
      this.numericColumns.forEach(column => {
        if (!this.idColumns.includes(column)) {
          this.metrics.push(column);
        }
      });
    }
  }
  
  /**
   * Attempt to detect the domain of the dataset
   */
  detectDomain() {
    const allColumnNames = this.columns.join(' ').toLowerCase();
    
    // Enhanced domain detection patterns with more comprehensive HR patterns
    const domainPatterns = [
      { domain: "Retail", patterns: ['product', 'item', 'sale', 'customer', 'price', 'order', 'discount', 'store', 'transaction'] },
      { domain: "Healthcare", patterns: ['patient', 'diagnosis', 'treatment', 'doctor', 'hospital', 'medical', 'medication', 'health', 'symptom', 'care'] },
      { 
        domain: "HR", 
        patterns: [
          'employee', 'salary', 'department', 'job', 'hire', 'staff', 'position', 'recruitment', 'hr', 'personnel', 
          'payroll', 'compensation', 'benefit', 'performance', 'rating', 'review', 'manager', 'supervisor', 
          'attendance', 'leave', 'absence', 'training', 'development', 'experience', 'skill', 'qualification',
          'promotion', 'tenure', 'termination', 'resignation', 'headcount', 'manpower', 'workforce', 'talent',
          'satisfaction', 'engagement', 'turnover', 'retention', 'onboarding', 'workday', 'timesheet', 'location',
          'designation', 'role', 'team', 'division', 'title', 'grade', 'level', 'band'
        ]
      },
      { domain: "Finance", patterns: ['account', 'balance', 'transaction', 'bank', 'payment', 'credit', 'loan', 'investment', 'interest', 'financial'] },
      { domain: "Education", patterns: ['student', 'course', 'grade', 'class', 'teacher', 'school', 'education', 'university', 'academic', 'learning'] },
      { domain: "Manufacturing", patterns: ['production', 'factory', 'assembly', 'inventory', 'quality', 'machine', 'manufacturing', 'maintenance', 'supply'] },
      { domain: "Logistics", patterns: ['shipment', 'delivery', 'transport', 'route', 'vehicle', 'warehouse', 'logistics', 'shipping', 'tracking'] },
    ];
    
    // Score each domain, with higher weight for HR domain detection
    const domainScores = domainPatterns.map(({ domain, patterns }) => {
      let score = 0;
      patterns.forEach(pattern => {
        if (allColumnNames.includes(pattern)) {
          // Give higher score to HR patterns to ensure better detection
          score += domain === "HR" ? 1.5 : 1;
        }
      });
      
      // Additional checks for HR data: Look for common HR department names or job titles
      if (domain === "HR") {
        const hrDepartmentPatterns = ['human resources', 'finance', 'marketing', 'sales', 'engineering', 'operations', 'it ', 'r&d'];
        const jobTitlePatterns = ['manager', 'director', 'analyst', 'coordinator', 'assistant', 'specialist', 'lead', 'head', 'chief', 'vp', 'president'];
        
        // Check for department column with common department names
        const departmentColumn = this.columns.find(col => 
          col.toLowerCase().includes('department') || 
          col.toLowerCase().includes('dept') || 
          col.toLowerCase().includes('division'));
          
        if (departmentColumn) {
          const departmentValues = new Set(this.data.map(row => 
            row[departmentColumn] ? row[departmentColumn].toString().toLowerCase() : ''));
          
          hrDepartmentPatterns.forEach(dept => {
            if (Array.from(departmentValues).some(val => val.includes(dept))) {
              score += 2;
            }
          });
        }
        
        // Check for job title column with common job titles
        const titleColumn = this.columns.find(col => 
          col.toLowerCase().includes('title') || 
          col.toLowerCase().includes('position') || 
          col.toLowerCase().includes('job') ||
          col.toLowerCase().includes('role') ||
          col.toLowerCase().includes('designation'));
          
        if (titleColumn) {
          const titleValues = new Set(this.data.map(row => 
            row[titleColumn] ? row[titleColumn].toString().toLowerCase() : ''));
          
          jobTitlePatterns.forEach(title => {
            if (Array.from(titleValues).some(val => val.includes(title))) {
              score += 1.5;
            }
          });
        }
        
        // Check for salary/compensation column which is very common in HR data
        const hasSalaryColumn = this.columns.some(col => 
          col.toLowerCase().includes('salary') || 
          col.toLowerCase().includes('compensation') || 
          col.toLowerCase().includes('pay'));
          
        if (hasSalaryColumn) {
          score += 3;
        }
        
        // Check for employee ID column which is very common in HR data
        const hasEmployeeIdColumn = this.columns.some(col => 
          col.toLowerCase().includes('employee') && col.toLowerCase().includes('id'));
          
        if (hasEmployeeIdColumn) {
          score += 2.5;
        }
      }
      
      return { domain, score };
    });
    
    // Find domain with highest score
    const bestMatch = domainScores.reduce((best, current) => 
      current.score > best.score ? current : best, { domain: "Generic", score: 0 });
    
    // Set domain if score is above threshold
    if (bestMatch.score >= 2) {
      this.domain = bestMatch.domain;
    }
    
    // Log detected domain and score for debugging
    console.log(`Detected domain: ${this.domain} with score ${bestMatch.score}`);
  }
  
  /**
   * Identify the most important fields based on domain and data
   */
  identifyImportantFields() {
    // Add important fields based on domain
    switch(this.domain) {
      case "Retail":
        this.addImportantFieldsByPatterns([
          'revenue', 'sales', 'price', 'product', 'category', 'customer', 
          'quantity', 'order', 'date', 'store', 'discount'
        ]);
        break;
      case "Healthcare":
        this.addImportantFieldsByPatterns([
          'patient', 'diagnosis', 'treatment', 'doctor', 'hospital', 'cost',
          'date', 'admission', 'discharge', 'medication', 'procedure'
        ]);
        break;
      case "HR":
        this.addImportantFieldsByPatterns([
          'employee', 'salary', 'department', 'hire', 'position', 'performance',
          'rating', 'date', 'manager', 'attendance', 'leave', 'satisfaction',
          'compensation', 'benefit', 'bonus', 'review', 'training', 'experience',
          'skill', 'education', 'certification', 'project', 'promotion', 'title',
          'role', 'location', 'age', 'gender', 'team', 'division', 'level',
          'band', 'grade', 'designation', 'status', 'termination', 'resignation', 
          'join', 'start', 'end', 'year', 'review', 'appraisal', 'feedback'
        ]);
        break;
      case "Finance":
        this.addImportantFieldsByPatterns([
          'amount', 'transaction', 'account', 'balance', 'date', 'category',
          'description', 'credit', 'debit', 'customer', 'currency'
        ]);
        break;
      case "Education":
        this.addImportantFieldsByPatterns([
          'student', 'course', 'grade', 'score', 'teacher', 'subject',
          'date', 'semester', 'year', 'attendance', 'performance'
        ]);
        break;
      case "Manufacturing":
        this.addImportantFieldsByPatterns([
          'product', 'quantity', 'quality', 'machine', 'time', 'defect',
          'cost', 'batch', 'inventory', 'production', 'material'
        ]);
        break;
      case "Logistics":
        this.addImportantFieldsByPatterns([
          'shipment', 'delivery', 'transport', 'destination', 'origin', 'date',
          'status', 'weight', 'distance', 'cost', 'vehicle'
        ]);
        break;
      default:
        // For generic domain, prioritize dates, metrics and non-ID dimensions
        if (this.dateColumns.length > 0) {
          this.importantFields.push(...this.dateColumns);
        }
        if (this.metrics.length > 0) {
          this.importantFields.push(...this.metrics);
        }
        this.dimensions.forEach(dim => {
          if (!this.idColumns.includes(dim) && !this.importantFields.includes(dim)) {
            this.importantFields.push(dim);
          }
        });
    }
    
    // Remove duplicates
    this.importantFields = [...new Set(this.importantFields)];
    
    // Always add all metrics columns (numeric fields) as important fields
    this.metrics.forEach(metric => {
      if (!this.importantFields.includes(metric)) {
        this.importantFields.push(metric);
      }
    });
    
    // Always add categorical columns as important fields for segmentation
    this.categoricalColumns.forEach(cat => {
      if (!this.importantFields.includes(cat) && 
          !this.idColumns.includes(cat) &&
          this.categoricalColumns.length <= 10) { // Only if we don't have too many categorical columns
        this.importantFields.push(cat);
      }
    });
    
    // Always add date columns as important for time series analysis
    this.dateColumns.forEach(date => {
      if (!this.importantFields.includes(date)) {
        this.importantFields.push(date);
      }
    });
    
    // Ensure we have at least some important fields
    if (this.importantFields.length === 0) {
      // Add the first 5-10 non-ID columns as important
      this.columns
        .filter(col => !this.idColumns.includes(col))
        .slice(0, 10)
        .forEach(col => this.importantFields.push(col));
    }
    
    // Log important fields for debugging
    console.log('Important fields:', this.importantFields);
  }
  
  /**
   * Helper method to add important fields by matching patterns
   */
  addImportantFieldsByPatterns(patterns) {
    patterns.forEach(pattern => {
      this.columns.forEach(column => {
        if (column.toLowerCase().includes(pattern) && 
            !this.importantFields.includes(column)) {
          this.importantFields.push(column);
        }
      });
    });
    
    // Add key metrics if not already included
    this.metrics.slice(0, 3).forEach(metric => {
      if (!this.importantFields.includes(metric)) {
        this.importantFields.push(metric);
      }
    });
    
    // Add key dimensions if not already included
    this.dimensions.slice(0, 3).forEach(dimension => {
      if (!this.idColumns.includes(dimension) && 
          !this.importantFields.includes(dimension)) {
        this.importantFields.push(dimension);
      }
    });
  }
  
  /**
   * Generate appropriate KPIs based on the identified domain and data
   */
  generateKPIs() {
    const kpis = [];
    
    // Add domain-specific KPIs
    switch(this.domain) {
      case "Retail":
        this.addRetailKPIs(kpis);
        break;
      case "Healthcare":
        this.addHealthcareKPIs(kpis);
        break;
      case "HR":
        this.addHRKPIs(kpis);
        break;
      case "Finance":
        this.addFinanceKPIs(kpis);
        break;
      case "Education":
        this.addEducationKPIs(kpis);
        break;
      default:
        this.addGenericKPIs(kpis);
    }
    
    // Add general KPIs for all domains
    kpis.push({
      id: 'total-records',
      title: 'Total Records',
      value: this.data.length.toLocaleString(),
      icon: 'document-text',
      color: 'gray'
    });
    
    return kpis;
  }
  
  /**
   * Generate appropriate visualizations based on the identified domain and data
   */
  generateVisualizations() {
    const visualizations = [];
    
    // Time-series visualization if date column exists
    if (this.dateColumns.length > 0 && this.metrics.length > 0) {
      const dateColumn = this.dateColumns[0];
      const metricColumn = this.metrics[0];

      // aggregateByDate returns { date, value } — remap to real column keys
      // so the chart (which reads item[xAxis]/item[yAxis]) actually finds values.
      const series = this.aggregateByDate(dateColumn, metricColumn).map((row) => ({
        [dateColumn]: row.date,
        [metricColumn]: row.value,
      }));

      if (series.length > 0) {
        visualizations.push({
          type: 'line',
          title: `${this.formatColumnName(metricColumn)} Over Time`,
          xAxis: dateColumn,
          yAxis: metricColumn,
          data: series,
        });
      }
    }
    
    // Category distribution if categorical column exists
    if (this.categoricalColumns.length > 0) {
      const categoryColumn = this.categoricalColumns[0];
      
      visualizations.push({
        type: 'bar',
        title: `Distribution by ${this.formatColumnName(categoryColumn)}`,
        xAxis: categoryColumn,
        yAxis: 'count',
        data: this.aggregateByCategory(categoryColumn)
      });
      
      // Add pie chart if few categories
      const categories = this.aggregateByCategory(categoryColumn);
      if (categories.length <= 10) {
        visualizations.push({
          type: 'pie',
          title: `${this.formatColumnName(categoryColumn)} Distribution`,
          nameKey: categoryColumn,
          valueKey: 'count',
          data: categories
        });
      }
    }
    
    // Metric by category if both exist
    if (this.categoricalColumns.length > 0 && this.metrics.length > 0) {
      const categoryColumn = this.categoricalColumns[0];
      const metricColumn = this.metrics[0];
      
      visualizations.push({
        type: 'bar',
        title: `${this.formatColumnName(metricColumn)} by ${this.formatColumnName(categoryColumn)}`,
        xAxis: categoryColumn,
        yAxis: metricColumn,
        data: this.aggregateMetricByCategory(categoryColumn, metricColumn)
      });
    }
    
    // Domain-specific visualizations
    switch(this.domain) {
      case "Retail":
        this.addRetailVisualizations(visualizations);
        break;
      case "Healthcare":
        this.addHealthcareVisualizations(visualizations);
        break;
      case "HR":
        this.addHRVisualizations(visualizations);
        break;
      case "Finance":
        this.addFinanceVisualizations(visualizations);
        break;
      case "Education":
        this.addEducationVisualizations(visualizations);
        break;
    }
    
    return visualizations;
  }
  
  /**
   * Helper method to aggregate data by date
   */
  aggregateByDate(dateColumn, metricColumn) {
    // Group by date and calculate sum
    const dateGroups = {};
    
    this.data.forEach(row => {
      if (!row[dateColumn] || !row[metricColumn]) return;
      
      const dateObj = new Date(row[dateColumn]);
      if (isNaN(dateObj.getTime())) return;
      
      const dateStr = dateObj.toISOString().split('T')[0];
      if (!dateGroups[dateStr]) {
        dateGroups[dateStr] = 0;
      }
      
      dateGroups[dateStr] += parseFloat(row[metricColumn]) || 0;
    });
    
    // Convert to array and sort by date
    return Object.entries(dateGroups)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }
  
  /**
   * Helper method to aggregate data by category
   */
  aggregateByCategory(categoryColumn) {
    // Count occurrences of each category
    const categoryGroups = {};
    
    this.data.forEach(row => {
      if (!row[categoryColumn]) return;
      
      const category = row[categoryColumn];
      if (!categoryGroups[category]) {
        categoryGroups[category] = 0;
      }
      
      categoryGroups[category]++;
    });
    
    // Convert to array
    return Object.entries(categoryGroups)
      .map(([category, count]) => ({ [categoryColumn]: category, count }))
      .sort((a, b) => b.count - a.count);
  }
  
  /**
   * Helper method to aggregate a metric by category
   */
  aggregateMetricByCategory(categoryColumn, metricColumn) {
    // Group by category and calculate sum of metric
    const groups = {};
    
    this.data.forEach(row => {
      if (!row[categoryColumn] || !row[metricColumn]) return;
      
      const category = row[categoryColumn];
      if (!groups[category]) {
        groups[category] = 0;
      }
      
      groups[category] += parseFloat(row[metricColumn]) || 0;
    });
    
    // Convert to array
    return Object.entries(groups)
      .map(([category, value]) => ({ [categoryColumn]: category, [metricColumn]: value }))
      .sort((a, b) => b[metricColumn] - a[metricColumn]);
  }
  
  /**
   * Format a column name for display (convert camelCase/snake_case to Title Case)
   */
  formatColumnName(column) {
    return column
      .replace(/([A-Z])/g, ' $1') // Convert camelCase to spaces
      .replace(/_/g, ' ') // Convert snake_case to spaces
      .replace(/^\w/, c => c.toUpperCase()) // Capitalize first letter
      .trim();
  }
  
  /**
   * Add Retail-specific KPIs
   */
  addRetailKPIs(kpis) {
    // Look for revenue/sales columns
    const revenueColumn = this.findColumnByPatterns(['revenue', 'sales', 'amount', 'total']);
    if (revenueColumn) {
      const totalRevenue = this.data.reduce((sum, row) => sum + (parseFloat(row[revenueColumn]) || 0), 0);
      kpis.push({
        id: 'total-revenue',
        title: 'Total Revenue',
        value: '$' + totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        icon: 'currency-dollar',
        color: 'blue'
      });
      
      // Average per transaction
      kpis.push({
        id: 'avg-transaction',
        title: 'Avg. Transaction',
        value: '$' + (totalRevenue / this.data.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        icon: 'shopping-cart',
        color: 'green'
      });
    }
    
    // Look for quantity/units columns
    const quantityColumn = this.findColumnByPatterns(['quantity', 'units', 'items']);
    if (quantityColumn) {
      const totalUnits = this.data.reduce((sum, row) => sum + (parseInt(row[quantityColumn]) || 0), 0);
      kpis.push({
        id: 'total-units',
        title: 'Total Units',
        value: totalUnits.toLocaleString(),
        icon: 'cube',
        color: 'teal'
      });
    }
    
    // Look for customer columns
    const customerColumn = this.findColumnByPatterns(['customer', 'client', 'buyer']);
    if (customerColumn && this.columnTypes[customerColumn] === 'id') {
      const uniqueCustomers = new Set(this.data.map(row => row[customerColumn])).size;
      kpis.push({
        id: 'unique-customers',
        title: 'Unique Customers',
        value: uniqueCustomers.toLocaleString(),
        icon: 'users',
        color: 'rose'
      });
    }
  }
  
  /**
   * Add Healthcare-specific KPIs
   */
  addHealthcareKPIs(kpis) {
    // Patient count
    const patientColumn = this.findColumnByPatterns(['patient', 'client']);
    if (patientColumn && this.columnTypes[patientColumn] === 'id') {
      const uniquePatients = new Set(this.data.map(row => row[patientColumn])).size;
      kpis.push({
        id: 'total-patients',
        title: 'Total Patients',
        value: uniquePatients.toLocaleString(),
        icon: 'users',
        color: 'blue'
      });
    }
    
    // Average length of stay
    const stayColumn = this.findColumnByPatterns(['stay', 'days', 'length', 'duration']);
    if (stayColumn && this.columnTypes[stayColumn] === 'numeric') {
      const avgStay = this.data.reduce((sum, row) => sum + (parseFloat(row[stayColumn]) || 0), 0) / this.data.length;
      kpis.push({
        id: 'avg-stay',
        title: 'Avg. Length of Stay',
        value: avgStay.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' days',
        icon: 'clock',
        color: 'green'
      });
    }
    
    // Cost/charges
    const costColumn = this.findColumnByPatterns(['cost', 'charge', 'bill', 'amount']);
    if (costColumn && this.columnTypes[costColumn] === 'numeric') {
      const totalCost = this.data.reduce((sum, row) => sum + (parseFloat(row[costColumn]) || 0), 0);
      kpis.push({
        id: 'total-charges',
        title: 'Total Charges',
        value: '$' + totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        icon: 'currency-dollar',
        color: 'red'
      });
      
      // Average cost per patient
      if (patientColumn) {
        const uniquePatients = new Set(this.data.map(row => row[patientColumn])).size;
        kpis.push({
          id: 'avg-cost-per-patient',
          title: 'Avg. Cost Per Patient',
          value: '$' + (totalCost / uniquePatients).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          icon: 'chart-bar',
          color: 'yellow'
        });
      }
    }
  }
  
  /**
   * Add HR-specific KPIs
   */
  addHRKPIs(kpis) {
    // Employee count
    const employeeColumn = this.findColumnByPatterns(['employee', 'staff', 'personnel']);
    if (employeeColumn && this.columnTypes[employeeColumn] === 'id') {
      const uniqueEmployees = new Set(this.data.map(row => row[employeeColumn])).size;
      kpis.push({
        id: 'total-employees',
        title: 'Total Employees',
        value: uniqueEmployees.toLocaleString(),
        icon: 'users',
        color: 'blue'
      });
    }
    
    // Salary metrics
    const salaryColumn = this.findColumnByPatterns(['salary', 'compensation', 'pay']);
    if (salaryColumn && this.columnTypes[salaryColumn] === 'numeric') {
      const salaries = this.data.map(row => parseFloat(row[salaryColumn]) || 0).filter(salary => salary > 0);
      if (salaries.length > 0) {
        const avgSalary = salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length;
        kpis.push({
          id: 'avg-salary',
          title: 'Average Salary',
          value: '$' + avgSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          icon: 'currency-dollar',
          color: 'green'
        });
      }
    }
    
    // Department distribution
    const departmentColumn = this.findColumnByPatterns(['department', 'dept', 'division', 'team']);
    if (departmentColumn) {
      const departments = new Set(this.data.map(row => row[departmentColumn])).size;
      kpis.push({
        id: 'department-count',
        title: 'Departments',
        value: departments.toLocaleString(),
        icon: 'office-building',
        color: 'rose'
      });
    }
    
    // Performance/rating metrics
    const performanceColumn = this.findColumnByPatterns(['performance', 'rating', 'score', 'evaluation']);
    if (performanceColumn && this.columnTypes[performanceColumn] === 'numeric') {
      const ratings = this.data.map(row => parseFloat(row[performanceColumn]) || 0).filter(rating => rating > 0);
      if (ratings.length > 0) {
        const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        
        // Determine scale (1-5, 1-10, etc.)
        const maxRating = Math.max(...ratings);
        const scale = maxRating <= 5 ? 5 : maxRating <= 10 ? 10 : 100;
        
        kpis.push({
          id: 'avg-performance',
          title: 'Avg. Performance',
          value: avgRating.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ` / ${scale}`,
          icon: 'chart-bar',
          color: 'orange'
        });
      }
    }
  }
  
  /**
   * Add Finance-specific KPIs
   */
  addFinanceKPIs(kpis) {
    // Total amount
    const amountColumn = this.findColumnByPatterns(['amount', 'sum', 'total', 'value']);
    if (amountColumn && this.columnTypes[amountColumn] === 'numeric') {
      const totalAmount = this.data.reduce((sum, row) => sum + (parseFloat(row[amountColumn]) || 0), 0);
      kpis.push({
        id: 'total-amount',
        title: 'Total Amount',
        value: '$' + totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        icon: 'currency-dollar',
        color: 'blue'
      });
    }
    
    // Transaction count
    const transactionColumn = this.findColumnByPatterns(['transaction', 'tx', 'id']);
    if (transactionColumn && this.columnTypes[transactionColumn] === 'id') {
      const uniqueTransactions = new Set(this.data.map(row => row[transactionColumn])).size;
      kpis.push({
        id: 'transaction-count',
        title: 'Transaction Count',
        value: uniqueTransactions.toLocaleString(),
        icon: 'document-text',
        color: 'teal'
      });
    }
    
    // Balance
    const balanceColumn = this.findColumnByPatterns(['balance', 'available', 'remaining']);
    if (balanceColumn && this.columnTypes[balanceColumn] === 'numeric') {
      // Get the latest balance (assuming the dataset is sorted)
      const latestBalance = this.data[this.data.length - 1][balanceColumn];
      kpis.push({
        id: 'current-balance',
        title: 'Current Balance',
        value: '$' + parseFloat(latestBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        icon: 'cash',
        color: 'green'
      });
    }
  }
  
  /**
   * Add Education-specific KPIs
   */
  addEducationKPIs(kpis) {
    // Student count
    const studentColumn = this.findColumnByPatterns(['student', 'learner', 'pupil']);
    if (studentColumn && this.columnTypes[studentColumn] === 'id') {
      const uniqueStudents = new Set(this.data.map(row => row[studentColumn])).size;
      kpis.push({
        id: 'total-students',
        title: 'Total Students',
        value: uniqueStudents.toLocaleString(),
        icon: 'users',
        color: 'blue'
      });
    }
    
    // Course count
    const courseColumn = this.findColumnByPatterns(['course', 'class', 'subject']);
    if (courseColumn) {
      const uniqueCourses = new Set(this.data.map(row => row[courseColumn])).size;
      kpis.push({
        id: 'total-courses',
        title: 'Total Courses',
        value: uniqueCourses.toLocaleString(),
        icon: 'book-open',
        color: 'rose'
      });
    }
    
    // Average grade/score
    const gradeColumn = this.findColumnByPatterns(['grade', 'score', 'mark', 'result']);
    if (gradeColumn && this.columnTypes[gradeColumn] === 'numeric') {
      const grades = this.data.map(row => parseFloat(row[gradeColumn]) || 0).filter(grade => grade > 0);
      if (grades.length > 0) {
        const avgGrade = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
        
        // Determine scale (0-100, 0-4, etc.)
        const maxGrade = Math.max(...grades);
        let display;
        if (maxGrade <= 4) {
          display = avgGrade.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' / 4.0';
        } else if (maxGrade <= 10) {
          display = avgGrade.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' / 10';
        } else {
          display = avgGrade.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
        }
        
        kpis.push({
          id: 'avg-grade',
          title: 'Average Grade',
          value: display,
          icon: 'academic-cap',
          color: 'green'
        });
      }
    }
  }
  
  /**
   * Add generic KPIs for any domain
   */
  addGenericKPIs(kpis) {
    // Add KPIs based on metrics
    this.metrics.slice(0, 4).forEach((metric, index) => {
      const values = this.data.map(row => parseFloat(row[metric]) || 0);
      const total = values.reduce((sum, val) => sum + val, 0);
      const avg = total / values.length;
      
      // Determine if it's likely a currency
      const isCurrency = metric.toLowerCase().includes('amount') || 
                          metric.toLowerCase().includes('price') || 
                          metric.toLowerCase().includes('cost') || 
                          metric.toLowerCase().includes('revenue') || 
                          metric.toLowerCase().includes('salary');
      
      const formatValue = (val) => {
        if (isCurrency) {
          return '$' + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
          return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        }
      };
      
      // Colors
      const colors = ['blue', 'green', 'teal', 'rose', 'amber', 'orange'];
      
      kpis.push({
        id: `total-${metric}`,
        title: `Total ${this.formatColumnName(metric)}`,
        value: formatValue(total),
        icon: isCurrency ? 'currency-dollar' : 'chart-bar',
        color: colors[index % colors.length]
      });
      
      kpis.push({
        id: `avg-${metric}`,
        title: `Average ${this.formatColumnName(metric)}`,
        value: formatValue(avg),
        icon: 'calculation',
        color: colors[(index + 3) % colors.length]
      });
    });
    
    // Count unique values for main categorical columns
    this.categoricalColumns.slice(0, 2).forEach((category, index) => {
      const uniqueValues = new Set(this.data.map(row => row[category])).size;
      
      // Colors
      const colors = ['rose', 'teal', 'blue', 'green'];
      
      kpis.push({
        id: `unique-${category}`,
        title: `Unique ${this.formatColumnName(category)}`,
        value: uniqueValues.toLocaleString(),
        icon: 'view-list',
        color: colors[index % colors.length]
      });
    });
  }
  
  /**
   * Add Retail-specific visualizations
   */
  addRetailVisualizations(visualizations) {
    // Sales by product category
    const categoryColumn = this.findColumnByPatterns(['category', 'department', 'type']);
    const revenueColumn = this.findColumnByPatterns(['revenue', 'sales', 'amount', 'total']);
    
    if (categoryColumn && revenueColumn) {
      visualizations.push({
        type: 'bar',
        title: 'Sales by Category',
        xAxis: categoryColumn,
        yAxis: revenueColumn,
        data: this.aggregateMetricByCategory(categoryColumn, revenueColumn)
      });
      
      visualizations.push({
        type: 'pie',
        title: 'Sales Distribution',
        nameKey: categoryColumn,
        valueKey: revenueColumn,
        data: this.aggregateMetricByCategory(categoryColumn, revenueColumn)
      });
    }
    
    // Customer analysis if relevant columns exist
    const customerColumn = this.findColumnByPatterns(['customer', 'client', 'buyer']);
    const customerAgeColumn = this.findColumnByPatterns(['age', 'years']);
    
    if (customerAgeColumn && this.columnTypes[customerAgeColumn] === 'numeric') {
      // Age distribution in groups
      const ageGroups = {
        'Under 18': 0,
        '18-24': 0,
        '25-34': 0,
        '35-44': 0,
        '45-54': 0,
        '55-64': 0,
        '65+': 0
      };
      
      this.data.forEach(row => {
        const age = parseFloat(row[customerAgeColumn]);
        if (isNaN(age)) return;
        
        if (age < 18) ageGroups['Under 18']++;
        else if (age < 25) ageGroups['18-24']++;
        else if (age < 35) ageGroups['25-34']++;
        else if (age < 45) ageGroups['35-44']++;
        else if (age < 55) ageGroups['45-54']++;
        else if (age < 65) ageGroups['55-64']++;
        else ageGroups['65+']++;
      });
      
      const ageData = Object.entries(ageGroups)
        .map(([range, count]) => ({ ageRange: range, count }))
        .filter(item => item.count > 0);
      
      if (ageData.length > 0) {
        visualizations.push({
          type: 'bar',
          title: 'Customer Age Distribution',
          xAxis: 'ageRange',
          yAxis: 'count',
          data: ageData
        });
      }
    }
  }
  
  /**
   * Add Healthcare-specific visualizations
   */
  addHealthcareVisualizations(visualizations) {
    // Diagnoses distribution
    const diagnosisColumn = this.findColumnByPatterns(['diagnosis', 'condition', 'disease', 'illness']);
    if (diagnosisColumn) {
      const diagnosisData = this.aggregateByCategory(diagnosisColumn);
      if (diagnosisData.length > 0) {
        visualizations.push({
          type: 'bar',
          title: 'Diagnosis Distribution',
          xAxis: diagnosisColumn,
          yAxis: 'count',
          data: diagnosisData
        });
        
        if (diagnosisData.length <= 10) {
          visualizations.push({
            type: 'pie',
            title: 'Diagnosis Distribution',
            nameKey: diagnosisColumn,
            valueKey: 'count',
            data: diagnosisData
          });
        }
      }
    }
    
    // Length of stay distribution
    const stayColumn = this.findColumnByPatterns(['stay', 'days', 'length', 'duration']);
    if (stayColumn && this.columnTypes[stayColumn] === 'numeric') {
      // Group by stay length ranges
      const stayGroups = {
        '1 day': 0,
        '2-3 days': 0,
        '4-7 days': 0,
        '1-2 weeks': 0,
        '2+ weeks': 0
      };
      
      this.data.forEach(row => {
        const stay = parseFloat(row[stayColumn]);
        if (isNaN(stay)) return;
        
        if (stay <= 1) stayGroups['1 day']++;
        else if (stay <= 3) stayGroups['2-3 days']++;
        else if (stay <= 7) stayGroups['4-7 days']++;
        else if (stay <= 14) stayGroups['1-2 weeks']++;
        else stayGroups['2+ weeks']++;
      });
      
      const stayData = Object.entries(stayGroups)
        .map(([range, count]) => ({ stayRange: range, count }))
        .filter(item => item.count > 0);
      
      if (stayData.length > 0) {
        visualizations.push({
          type: 'bar',
          title: 'Length of Stay Distribution',
          xAxis: 'stayRange',
          yAxis: 'count',
          data: stayData
        });
      }
    }
  }
  
  /**
   * Add HR-specific visualizations
   */
  addHRVisualizations(visualizations) {
    // Department distribution
    const departmentColumn = this.findColumnByPatterns(['department', 'dept', 'division', 'team']);
    if (departmentColumn) {
      const deptData = this.aggregateByCategory(departmentColumn);
      if (deptData.length > 0) {
        visualizations.push({
          type: 'bar',
          title: 'Employees by Department',
          xAxis: departmentColumn,
          yAxis: 'count',
          data: deptData
        });
        
        if (deptData.length <= 10) {
          visualizations.push({
            type: 'pie',
            title: 'Department Distribution',
            nameKey: departmentColumn,
            valueKey: 'count',
            data: deptData
          });
        }
      }
    }
    
    // Salary distribution
    const salaryColumn = this.findColumnByPatterns(['salary', 'compensation', 'pay']);
    if (salaryColumn && this.columnTypes[salaryColumn] === 'numeric') {
      // If we have department column, show salary by department
      if (departmentColumn) {
        const salaryByDept = this.aggregateMetricByCategory(departmentColumn, salaryColumn);
        if (salaryByDept.length > 0) {
          visualizations.push({
            type: 'bar',
            title: 'Average Salary by Department',
            xAxis: departmentColumn,
            yAxis: salaryColumn,
            data: salaryByDept
          });
        }
      }
      
      // Salary ranges distribution
      const salaries = this.data.map(row => parseFloat(row[salaryColumn]) || 0).filter(salary => salary > 0);
      if (salaries.length > 0) {
        // Determine salary ranges based on data
        const minSalary = Math.min(...salaries);
        const maxSalary = Math.max(...salaries);
        const range = maxSalary - minSalary;
        const step = range / 5; // 5 buckets
        
        const salaryGroups = {};
        for (let i = 0; i < 5; i++) {
          const start = minSalary + i * step;
          const end = minSalary + (i + 1) * step;
          salaryGroups[`$${Math.round(start).toLocaleString()} - $${Math.round(end).toLocaleString()}`] = 0;
        }
        
        this.data.forEach(row => {
          const salary = parseFloat(row[salaryColumn]);
          if (isNaN(salary) || salary <= 0) return;
          
          for (let i = 0; i < 5; i++) {
            const start = minSalary + i * step;
            const end = minSalary + (i + 1) * step;
            if (salary >= start && salary <= end) {
              const key = `$${Math.round(start).toLocaleString()} - $${Math.round(end).toLocaleString()}`;
              salaryGroups[key]++;
              break;
            }
          }
        });
        
        const salaryData = Object.entries(salaryGroups)
          .map(([range, count]) => ({ salaryRange: range, count }))
          .filter(item => item.count > 0);
        
        if (salaryData.length > 0) {
          visualizations.push({
            type: 'bar',
            title: 'Salary Distribution',
            xAxis: 'salaryRange',
            yAxis: 'count',
            data: salaryData
          });
        }
      }
    }

    // Performance/Rating Analysis
    const performanceColumn = this.findColumnByPatterns(['performance', 'rating', 'score', 'evaluation', 'review']);
    if (performanceColumn && this.columnTypes[performanceColumn] === 'numeric') {
      // Performance distribution
      const ratings = this.data
        .map(row => parseFloat(row[performanceColumn]) || 0)
        .filter(rating => rating > 0);
      
      if (ratings.length > 0) {
        // Determine scale (1-5, 1-10, etc.)
        const maxRating = Math.max(...ratings);
        const scale = maxRating <= 5 ? 5 : maxRating <= 10 ? 10 : 100;
        
        // Group by rating bands
        const ratingGroups = {};
        
        if (scale === 5) {
          this.data.forEach(row => {
            const rating = parseFloat(row[performanceColumn]) || 0;
            if (rating <= 0) return;
            
            const band = rating >= 4.5 ? '4.5-5.0' :
                         rating >= 4.0 ? '4.0-4.4' :
                         rating >= 3.5 ? '3.5-3.9' :
                         rating >= 3.0 ? '3.0-3.4' :
                         rating >= 2.5 ? '2.5-2.9' :
                         rating >= 2.0 ? '2.0-2.4' :
                         rating >= 1.5 ? '1.5-1.9' :
                         rating >= 1.0 ? '1.0-1.4' : '0-0.9';
            
            if (!ratingGroups[band]) {
              ratingGroups[band] = 0;
            }
            
            ratingGroups[band]++;
          });
        } else if (scale === 10) {
          this.data.forEach(row => {
            const rating = parseFloat(row[performanceColumn]) || 0;
            if (rating <= 0) return;
            
            const band = rating >= 9 ? '9-10' :
                         rating >= 8 ? '8-8.9' :
                         rating >= 7 ? '7-7.9' :
                         rating >= 6 ? '6-6.9' :
                         rating >= 5 ? '5-5.9' :
                         rating >= 4 ? '4-4.9' :
                         rating >= 3 ? '3-3.9' :
                         rating >= 2 ? '2-2.9' : '0-1.9';
            
            if (!ratingGroups[band]) {
              ratingGroups[band] = 0;
            }
            
            ratingGroups[band]++;
          });
        } else {
          this.data.forEach(row => {
            const rating = parseFloat(row[performanceColumn]) || 0;
            if (rating <= 0) return;
            
            const band = rating >= 90 ? '90-100' :
                         rating >= 80 ? '80-89' :
                         rating >= 70 ? '70-79' :
                         rating >= 60 ? '60-69' :
                         rating >= 50 ? '50-59' :
                         rating >= 40 ? '40-49' :
                         rating >= 30 ? '30-39' :
                         rating >= 20 ? '20-29' : '0-19';
            
            if (!ratingGroups[band]) {
              ratingGroups[band] = 0;
            }
            
            ratingGroups[band]++;
          });
        }
        
        const ratingData = Object.entries(ratingGroups)
          .map(([band, count]) => ({ ratingBand: band, count }))
          .sort((a, b) => {
            // Extract the lower bound number from each band
            const aLower = parseFloat(a.ratingBand.split('-')[0]);
            const bLower = parseFloat(b.ratingBand.split('-')[0]);
            return bLower - aLower; // Sort descending
          });
        
        if (ratingData.length > 0) {
          visualizations.push({
            type: 'bar',
            title: 'Performance Rating Distribution',
            xAxis: 'ratingBand',
            yAxis: 'count',
            data: ratingData
          });
        }
        
        // If we have department data, show performance by department
        if (departmentColumn) {
          // Calculate average performance by department
          const deptPerformance = {};
          let validCount = 0;
          
          this.data.forEach(row => {
            if (!row[departmentColumn] || !row[performanceColumn]) return;
            
            const dept = row[departmentColumn];
            const rating = parseFloat(row[performanceColumn]);
            
            if (isNaN(rating) || rating <= 0) return;
            
            if (!deptPerformance[dept]) {
              deptPerformance[dept] = { sum: 0, count: 0 };
            }
            
            deptPerformance[dept].sum += rating;
            deptPerformance[dept].count++;
            validCount++;
          });
          
          if (validCount > 0) {
            const performanceByDept = Object.entries(deptPerformance)
              .map(([dept, data]) => ({
                [departmentColumn]: dept,
                averageRating: data.sum / data.count
              }))
              .sort((a, b) => b.averageRating - a.averageRating);
            
            if (performanceByDept.length > 0) {
              visualizations.push({
                type: 'bar',
                title: 'Average Performance by Department',
                xAxis: departmentColumn,
                yAxis: 'averageRating',
                data: performanceByDept
              });
            }
          }
        }
      }
    }
    
    // Tenure/Experience Analysis
    const experienceColumn = this.findColumnByPatterns(['experience', 'tenure', 'years', 'service']);
    const hireDateColumn = this.findColumnByPatterns(['hire', 'join', 'start']);
    
    // Option 1: Direct experience column
    if (experienceColumn && this.columnTypes[experienceColumn] === 'numeric') {
      const experienceData = this.data
        .map(row => parseFloat(row[experienceColumn]) || 0)
        .filter(exp => exp > 0);
      
      if (experienceData.length > 0) {
        // Group by experience bands
        const experienceGroups = {
          '0-1 years': 0,
          '1-3 years': 0,
          '3-5 years': 0,
          '5-10 years': 0,
          '10+ years': 0
        };
        
        this.data.forEach(row => {
          const years = parseFloat(row[experienceColumn]) || 0;
          if (years <= 0) return;
          
          if (years <= 1) experienceGroups['0-1 years']++;
          else if (years <= 3) experienceGroups['1-3 years']++;
          else if (years <= 5) experienceGroups['3-5 years']++;
          else if (years <= 10) experienceGroups['5-10 years']++;
          else experienceGroups['10+ years']++;
        });
        
        const experienceBands = Object.entries(experienceGroups)
          .map(([band, count]) => ({ experienceBand: band, count }))
          .filter(item => item.count > 0);
        
        if (experienceBands.length > 0) {
          visualizations.push({
            type: 'bar',
            title: 'Employee Experience Distribution',
            xAxis: 'experienceBand',
            yAxis: 'count',
            data: experienceBands
          });
          
          visualizations.push({
            type: 'pie',
            title: 'Experience Distribution',
            nameKey: 'experienceBand',
            valueKey: 'count',
            data: experienceBands
          });
        }
        
        // If we have department data, show experience by department
        if (departmentColumn) {
          const experienceByDept = this.aggregateMetricByCategory(departmentColumn, experienceColumn);
          if (experienceByDept.length > 0) {
            visualizations.push({
              type: 'bar',
              title: 'Average Years of Experience by Department',
              xAxis: departmentColumn,
              yAxis: experienceColumn,
              data: experienceByDept
            });
          }
        }
      }
    }
    // Option 2: Calculate tenure from hire date
    else if (hireDateColumn && this.columnTypes[hireDateColumn] === 'date') {
      const today = new Date();
      const tenureData = [];
      const tenureGroups = {
        '0-1 years': 0,
        '1-3 years': 0,
        '3-5 years': 0,
        '5-10 years': 0,
        '10+ years': 0
      };
      
      this.data.forEach(row => {
        if (!row[hireDateColumn]) return;
        
        const hireDate = new Date(row[hireDateColumn]);
        if (isNaN(hireDate.getTime())) return;
        
        const diffTime = today - hireDate;
        const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
        
        tenureData.push({
          hireDate: row[hireDateColumn],
          years: diffYears
        });
        
        if (diffYears <= 1) tenureGroups['0-1 years']++;
        else if (diffYears <= 3) tenureGroups['1-3 years']++;
        else if (diffYears <= 5) tenureGroups['3-5 years']++;
        else if (diffYears <= 10) tenureGroups['5-10 years']++;
        else tenureGroups['10+ years']++;
      });
      
      if (tenureData.length > 0) {
        const tenureBands = Object.entries(tenureGroups)
          .map(([band, count]) => ({ tenureBand: band, count }))
          .filter(item => item.count > 0);
        
        if (tenureBands.length > 0) {
          visualizations.push({
            type: 'bar',
            title: 'Employee Tenure Distribution',
            xAxis: 'tenureBand',
            yAxis: 'count',
            data: tenureBands
          });
          
          visualizations.push({
            type: 'pie',
            title: 'Tenure Distribution',
            nameKey: 'tenureBand',
            valueKey: 'count',
            data: tenureBands
          });
        }
        
        // If we have department data, show average tenure by department
        if (departmentColumn) {
          const deptTenure = {};
          
          this.data.forEach(row => {
            if (!row[departmentColumn] || !row[hireDateColumn]) return;
            
            const dept = row[departmentColumn];
            const hireDate = new Date(row[hireDateColumn]);
            if (isNaN(hireDate.getTime())) return;
            
            const diffTime = today - hireDate;
            const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
            
            if (!deptTenure[dept]) {
              deptTenure[dept] = { sum: 0, count: 0 };
            }
            
            deptTenure[dept].sum += diffYears;
            deptTenure[dept].count++;
          });
          
          const tenureByDept = Object.entries(deptTenure)
            .map(([dept, data]) => ({
              [departmentColumn]: dept,
              averageTenure: data.sum / data.count
            }))
            .sort((a, b) => b.averageTenure - a.averageTenure);
          
          if (tenureByDept.length > 0) {
            visualizations.push({
              type: 'bar',
              title: 'Average Tenure by Department (Years)',
              xAxis: departmentColumn,
              yAxis: 'averageTenure',
              data: tenureByDept
            });
          }
        }
      }
    }
    
    // Age Analysis (if available)
    const ageColumn = this.findColumnByPatterns(['age', 'birthdate', 'birth', 'birth year']);
    
    if (ageColumn) {
      if (this.columnTypes[ageColumn] === 'numeric') {
        // Direct age column
        const ageData = this.data
          .map(row => parseFloat(row[ageColumn]) || 0)
          .filter(age => age >= 18 && age <= 100); // Filter valid ages only
        
        if (ageData.length > 0) {
          // Group by age bands
          const ageGroups = {
            '18-25': 0,
            '26-35': 0,
            '36-45': 0,
            '46-55': 0,
            '56+': 0
          };
          
          this.data.forEach(row => {
            const age = parseFloat(row[ageColumn]) || 0;
            if (age < 18 || age > 100) return;
            
            if (age <= 25) ageGroups['18-25']++;
            else if (age <= 35) ageGroups['26-35']++;
            else if (age <= 45) ageGroups['36-45']++;
            else if (age <= 55) ageGroups['46-55']++;
            else ageGroups['56+']++;
          });
          
          const ageBands = Object.entries(ageGroups)
            .map(([band, count]) => ({ ageBand: band, count }))
            .filter(item => item.count > 0);
          
          if (ageBands.length > 0) {
            visualizations.push({
              type: 'bar',
              title: 'Age Distribution',
              xAxis: 'ageBand',
              yAxis: 'count',
              data: ageBands
            });
            
            visualizations.push({
              type: 'pie',
              title: 'Employee Age Groups',
              nameKey: 'ageBand',
              valueKey: 'count',
              data: ageBands
            });
          }
          
          // If we have both age and salary, create a scatter plot
          if (salaryColumn && this.columnTypes[salaryColumn] === 'numeric') {
            const ageSalaryData = this.data
              .filter(row => 
                row[ageColumn] && row[salaryColumn] && 
                !isNaN(parseFloat(row[ageColumn])) && 
                !isNaN(parseFloat(row[salaryColumn])))
              .map(row => ({
                age: parseFloat(row[ageColumn]),
                [salaryColumn]: parseFloat(row[salaryColumn])
              }));
            
            if (ageSalaryData.length > 0) {
              visualizations.push({
                type: 'scatter',
                title: 'Age vs Salary',
                xAxis: 'age',
                yAxis: salaryColumn,
                data: ageSalaryData
              });
            }
          }
          
          // If we have both age and performance, create a scatter plot
          if (performanceColumn && this.columnTypes[performanceColumn] === 'numeric') {
            const agePerformanceData = this.data
              .filter(row => 
                row[ageColumn] && row[performanceColumn] && 
                !isNaN(parseFloat(row[ageColumn])) && 
                !isNaN(parseFloat(row[performanceColumn])))
              .map(row => ({
                age: parseFloat(row[ageColumn]),
                performance: parseFloat(row[performanceColumn])
              }));
            
            if (agePerformanceData.length > 0) {
              visualizations.push({
                type: 'scatter',
                title: 'Age vs Performance',
                xAxis: 'age',
                yAxis: 'performance',
                data: agePerformanceData
              });
            }
          }
        }
      } else if (this.columnTypes[ageColumn] === 'date') {
        // Calculate age from birthdate
        const today = new Date();
        const currentYear = today.getFullYear();
        
        const ageGroups = {
          '18-25': 0,
          '26-35': 0,
          '36-45': 0,
          '46-55': 0,
          '56+': 0
        };
        
        this.data.forEach(row => {
          if (!row[ageColumn]) return;
          
          const birthDate = new Date(row[ageColumn]);
          if (isNaN(birthDate.getTime())) return;
          
          const age = currentYear - birthDate.getFullYear();
          if (age < 18 || age > 100) return; // Filter valid ages only
          
          if (age <= 25) ageGroups['18-25']++;
          else if (age <= 35) ageGroups['26-35']++;
          else if (age <= 45) ageGroups['36-45']++;
          else if (age <= 55) ageGroups['46-55']++;
          else ageGroups['56+']++;
        });
        
        const ageBands = Object.entries(ageGroups)
          .map(([band, count]) => ({ ageBand: band, count }))
          .filter(item => item.count > 0);
        
        if (ageBands.length > 0) {
          visualizations.push({
            type: 'bar',
            title: 'Age Distribution',
            xAxis: 'ageBand',
            yAxis: 'count',
            data: ageBands
          });
        }
      }
    }
    
    // Gender Distribution (if available)
    const genderColumn = this.findColumnByPatterns(['gender', 'sex']);
    
    if (genderColumn && this.columnTypes[genderColumn] === 'categorical') {
      const genderData = this.aggregateByCategory(genderColumn);
      if (genderData.length > 0 && genderData.length <= 5) {
        visualizations.push({
          type: 'pie',
          title: 'Gender Distribution',
          nameKey: genderColumn,
          valueKey: 'count',
          data: genderData
        });
        
        // If we have department data, show gender distribution by department
        if (departmentColumn) {
          const genderByDept = {};
          
          this.data.forEach(row => {
            if (!row[departmentColumn] || !row[genderColumn]) return;
            
            const dept = row[departmentColumn];
            const gender = row[genderColumn];
            
            if (!genderByDept[dept]) {
              genderByDept[dept] = {};
            }
            
            if (!genderByDept[dept][gender]) {
              genderByDept[dept][gender] = 0;
            }
            
            genderByDept[dept][gender]++;
          });
          
          const deptGenderData = [];
          Object.entries(genderByDept).forEach(([dept, genders]) => {
            Object.entries(genders).forEach(([gender, count]) => {
              deptGenderData.push({
                [departmentColumn]: dept,
                gender,
                count
              });
            });
          });
          
          if (deptGenderData.length > 0) {
            visualizations.push({
              type: 'bar',
              title: 'Gender Distribution by Department',
              xAxis: departmentColumn,
              yAxis: 'count',
              data: deptGenderData,
              groupBy: 'gender'
            });
          }
        }
      }
    }
    
    // Location Analysis (if available)
    const locationColumn = this.findColumnByPatterns(['location', 'city', 'state', 'country', 'region', 'office']);
    
    if (locationColumn && this.columnTypes[locationColumn] === 'categorical') {
      const locationData = this.aggregateByCategory(locationColumn);
      if (locationData.length > 0 && locationData.length <= 10) {
        visualizations.push({
          type: 'bar',
          title: 'Employees by Location',
          xAxis: locationColumn,
          yAxis: 'count',
          data: locationData
        });
        
        if (locationData.length <= 7) {
          visualizations.push({
            type: 'pie',
            title: 'Location Distribution',
            nameKey: locationColumn,
            valueKey: 'count',
            data: locationData
          });
        }
      }
    }
    
    // Bonus/Compensation Analysis if available
    const bonusColumn = this.findColumnByPatterns(['bonus', 'incentive', 'variable']);
    
    if (bonusColumn && this.columnTypes[bonusColumn] === 'numeric' && departmentColumn) {
      const bonusByDept = this.aggregateMetricByCategory(departmentColumn, bonusColumn);
      if (bonusByDept.length > 0) {
        visualizations.push({
          type: 'bar',
          title: 'Average Bonus by Department',
          xAxis: departmentColumn,
          yAxis: bonusColumn,
          data: bonusByDept
        });
      }
      
      // If we have both salary and bonus, create a composed chart
      if (salaryColumn && this.columnTypes[salaryColumn] === 'numeric') {
        const combinedData = [];
        
        // Group by department
        const deptData = {};
        
        this.data.forEach(row => {
          if (!row[departmentColumn] || !row[salaryColumn] || !row[bonusColumn]) return;
          
          const dept = row[departmentColumn];
          const salary = parseFloat(row[salaryColumn]) || 0;
          const bonus = parseFloat(row[bonusColumn]) || 0;
          
          if (!deptData[dept]) {
            deptData[dept] = { 
              salarySum: 0, 
              bonusSum: 0, 
              count: 0 
            };
          }
          
          deptData[dept].salarySum += salary;
          deptData[dept].bonusSum += bonus;
          deptData[dept].count++;
        });
        
        Object.entries(deptData).forEach(([dept, data]) => {
          if (data.count > 0) {
            combinedData.push({
              [departmentColumn]: dept,
              avgSalary: data.salarySum / data.count,
              avgBonus: data.bonusSum / data.count
            });
          }
        });
        
        if (combinedData.length > 0) {
          visualizations.push({
            type: 'composed',
            title: 'Compensation Analysis by Department',
            xAxis: departmentColumn,
            barAxis: 'avgSalary',
            lineAxis: 'avgBonus',
            data: combinedData
          });
        }
      }
    }
    
    // Education Level Analysis if available
    const educationColumn = this.findColumnByPatterns(['education', 'degree', 'qualification']);
    
    if (educationColumn && this.columnTypes[educationColumn] === 'categorical') {
      const educationData = this.aggregateByCategory(educationColumn);
      if (educationData.length > 0 && educationData.length <= 10) {
        visualizations.push({
          type: 'bar',
          title: 'Education Level Distribution',
          xAxis: educationColumn,
          yAxis: 'count',
          data: educationData
        });
        
        if (educationData.length <= 7) {
          visualizations.push({
            type: 'pie',
            title: 'Education Level',
            nameKey: educationColumn,
            valueKey: 'count',
            data: educationData
          });
        }
        
        // If we have salary, show average salary by education level
        if (salaryColumn && this.columnTypes[salaryColumn] === 'numeric') {
          const salaryByEducation = this.aggregateMetricByCategory(educationColumn, salaryColumn);
          if (salaryByEducation.length > 0) {
            visualizations.push({
              type: 'bar',
              title: 'Average Salary by Education Level',
              xAxis: educationColumn,
              yAxis: salaryColumn,
              data: salaryByEducation
            });
          }
        }
      }
    }
  }
  
  /**
   * Add Finance-specific visualizations
   */
  addFinanceVisualizations(visualizations) {
    const amountColumn = this.findColumnByPatterns(['amount', 'value', 'sum', 'total']);
    const categoryColumn = this.findColumnByPatterns(['category', 'type', 'merchant', 'description']);
    const accountColumn = this.findColumnByPatterns(['account', 'wallet']);
    const dateColumn = this.dateColumns[0];

    // Amount by category
    if (categoryColumn && amountColumn && this.columnTypes[amountColumn] === 'numeric') {
      const byCategory = this.aggregateMetricByCategory(categoryColumn, amountColumn);
      if (byCategory.length > 0) {
        visualizations.push({
          type: 'bar',
          title: `Total ${this.formatColumnName(amountColumn)} by ${this.formatColumnName(categoryColumn)}`,
          xAxis: categoryColumn,
          yAxis: amountColumn,
          data: byCategory.slice(0, 15),
        });

        if (byCategory.length <= 10) {
          visualizations.push({
            type: 'pie',
            title: `${this.formatColumnName(amountColumn)} Distribution`,
            nameKey: categoryColumn,
            valueKey: amountColumn,
            data: byCategory,
          });
        }
      }
    }

    // Credit vs Debit breakdown (common finance pattern)
    const txTypeColumn = this.findColumnByPatterns(['credit', 'debit', 'direction', 'type']);
    if (txTypeColumn && this.columnTypes[txTypeColumn] === 'categorical' && amountColumn) {
      const breakdown = this.aggregateMetricByCategory(txTypeColumn, amountColumn);
      if (breakdown.length > 0 && breakdown.length <= 6) {
        visualizations.push({
          type: 'pie',
          title: 'Credit vs Debit',
          nameKey: txTypeColumn,
          valueKey: amountColumn,
          data: breakdown,
        });
      }
    }

    // Amount ranges (distribution)
    if (amountColumn && this.columnTypes[amountColumn] === 'numeric') {
      const amounts = this.data
        .map(row => parseFloat(row[amountColumn]))
        .filter(v => !isNaN(v) && v !== 0);

      if (amounts.length > 0) {
        const absMax = Math.max(...amounts.map(Math.abs));
        const step = absMax / 5;
        const ranges = {
          [`0 - $${Math.round(step).toLocaleString()}`]: 0,
          [`$${Math.round(step).toLocaleString()} - $${Math.round(step * 2).toLocaleString()}`]: 0,
          [`$${Math.round(step * 2).toLocaleString()} - $${Math.round(step * 3).toLocaleString()}`]: 0,
          [`$${Math.round(step * 3).toLocaleString()} - $${Math.round(step * 4).toLocaleString()}`]: 0,
          [`$${Math.round(step * 4).toLocaleString()}+`]: 0,
        };
        const keys = Object.keys(ranges);
        amounts.forEach(val => {
          const abs = Math.abs(val);
          if (abs < step) ranges[keys[0]]++;
          else if (abs < step * 2) ranges[keys[1]]++;
          else if (abs < step * 3) ranges[keys[2]]++;
          else if (abs < step * 4) ranges[keys[3]]++;
          else ranges[keys[4]]++;
        });

        const rangeData = Object.entries(ranges)
          .map(([range, count]) => ({ amountRange: range, count }))
          .filter(item => item.count > 0);

        if (rangeData.length > 0) {
          visualizations.push({
            type: 'bar',
            title: 'Transaction Amount Distribution',
            xAxis: 'amountRange',
            yAxis: 'count',
            data: rangeData,
          });
        }
      }
    }

    // Account balances (top N accounts)
    if (accountColumn && amountColumn && this.columnTypes[amountColumn] === 'numeric') {
      const byAccount = this.aggregateMetricByCategory(accountColumn, amountColumn);
      if (byAccount.length > 0) {
        visualizations.push({
          type: 'bar',
          title: `Top Accounts by ${this.formatColumnName(amountColumn)}`,
          xAxis: accountColumn,
          yAxis: amountColumn,
          data: byAccount.slice(0, 10),
        });
      }
    }

    // Trend over time (finance-specific framing)
    if (dateColumn && amountColumn && this.columnTypes[amountColumn] === 'numeric') {
      const trend = this.aggregateByDate(dateColumn, amountColumn).map((row) => ({
        [dateColumn]: row.date,
        [amountColumn]: row.value,
      }));
      if (trend.length > 1) {
        visualizations.push({
          type: 'line',
          title: `${this.formatColumnName(amountColumn)} Trend`,
          xAxis: dateColumn,
          yAxis: amountColumn,
          data: trend,
        });
      }
    }
  }

  /**
   * Add Education-specific visualizations
   */
  addEducationVisualizations(visualizations) {
    const gradeColumn = this.findColumnByPatterns(['grade', 'score', 'mark', 'result', 'gpa']);
    const courseColumn = this.findColumnByPatterns(['course', 'class', 'subject', 'module']);
    const studentColumn = this.findColumnByPatterns(['student', 'learner', 'pupil']);
    const semesterColumn = this.findColumnByPatterns(['semester', 'term', 'year', 'period']);

    // Students per course
    if (courseColumn) {
      const byCourse = this.aggregateByCategory(courseColumn);
      if (byCourse.length > 0) {
        visualizations.push({
          type: 'bar',
          title: `Enrollment by ${this.formatColumnName(courseColumn)}`,
          xAxis: courseColumn,
          yAxis: 'count',
          data: byCourse.slice(0, 15),
        });

        if (byCourse.length <= 10) {
          visualizations.push({
            type: 'pie',
            title: `${this.formatColumnName(courseColumn)} Distribution`,
            nameKey: courseColumn,
            valueKey: 'count',
            data: byCourse,
          });
        }
      }
    }

    // Grade distribution (bands)
    if (gradeColumn && this.columnTypes[gradeColumn] === 'numeric') {
      const grades = this.data
        .map(row => parseFloat(row[gradeColumn]))
        .filter(v => !isNaN(v) && v >= 0);

      if (grades.length > 0) {
        const maxGrade = Math.max(...grades);
        let groups;
        if (maxGrade <= 4) {
          groups = { '0-1': 0, '1-2': 0, '2-3': 0, '3-3.5': 0, '3.5-4': 0 };
          grades.forEach(g => {
            if (g < 1) groups['0-1']++;
            else if (g < 2) groups['1-2']++;
            else if (g < 3) groups['2-3']++;
            else if (g < 3.5) groups['3-3.5']++;
            else groups['3.5-4']++;
          });
        } else if (maxGrade <= 10) {
          groups = { '0-2': 0, '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 };
          grades.forEach(g => {
            if (g < 2) groups['0-2']++;
            else if (g < 4) groups['2-4']++;
            else if (g < 6) groups['4-6']++;
            else if (g < 8) groups['6-8']++;
            else groups['8-10']++;
          });
        } else {
          groups = { 'F (<60)': 0, 'D (60-69)': 0, 'C (70-79)': 0, 'B (80-89)': 0, 'A (90+)': 0 };
          grades.forEach(g => {
            if (g < 60) groups['F (<60)']++;
            else if (g < 70) groups['D (60-69)']++;
            else if (g < 80) groups['C (70-79)']++;
            else if (g < 90) groups['B (80-89)']++;
            else groups['A (90+)']++;
          });
        }

        const gradeData = Object.entries(groups)
          .map(([band, count]) => ({ gradeBand: band, count }))
          .filter(item => item.count > 0);

        if (gradeData.length > 0) {
          visualizations.push({
            type: 'bar',
            title: 'Grade Distribution',
            xAxis: 'gradeBand',
            yAxis: 'count',
            data: gradeData,
          });

          visualizations.push({
            type: 'pie',
            title: 'Grade Bands',
            nameKey: 'gradeBand',
            valueKey: 'count',
            data: gradeData,
          });
        }
      }
    }

    // Average grade by course
    if (courseColumn && gradeColumn && this.columnTypes[gradeColumn] === 'numeric') {
      const avgByCourse = this.aggregateMetricByCategory(courseColumn, gradeColumn);
      if (avgByCourse.length > 0) {
        // Convert totals to averages for display
        const counts = this.aggregateByCategory(courseColumn);
        const countMap = Object.fromEntries(counts.map(c => [c[courseColumn], c.count]));
        const averaged = avgByCourse.map(row => ({
          [courseColumn]: row[courseColumn],
          [gradeColumn]: countMap[row[courseColumn]]
            ? row[gradeColumn] / countMap[row[courseColumn]]
            : row[gradeColumn],
        }));

        visualizations.push({
          type: 'bar',
          title: `Average ${this.formatColumnName(gradeColumn)} by ${this.formatColumnName(courseColumn)}`,
          xAxis: courseColumn,
          yAxis: gradeColumn,
          data: averaged.slice(0, 15),
        });
      }
    }

    // Grade trend by semester/term
    if (semesterColumn && gradeColumn && this.columnTypes[gradeColumn] === 'numeric') {
      const bySemester = this.aggregateMetricByCategory(semesterColumn, gradeColumn);
      if (bySemester.length > 1) {
        visualizations.push({
          type: 'line',
          title: `${this.formatColumnName(gradeColumn)} Trend by ${this.formatColumnName(semesterColumn)}`,
          xAxis: semesterColumn,
          yAxis: gradeColumn,
          data: bySemester,
        });
      }
    }

    // Unique student count if student column is an ID
    if (studentColumn && this.columnTypes[studentColumn] === 'id' && courseColumn) {
      const studentsPerCourse = {};
      this.data.forEach(row => {
        const course = row[courseColumn];
        const student = row[studentColumn];
        if (!course || !student) return;
        if (!studentsPerCourse[course]) studentsPerCourse[course] = new Set();
        studentsPerCourse[course].add(student);
      });
      const data = Object.entries(studentsPerCourse)
        .map(([course, set]) => ({ [courseColumn]: course, students: set.size }))
        .sort((a, b) => b.students - a.students)
        .slice(0, 15);

      if (data.length > 0) {
        visualizations.push({
          type: 'bar',
          title: `Unique Students per ${this.formatColumnName(courseColumn)}`,
          xAxis: courseColumn,
          yAxis: 'students',
          data,
        });
      }
    }
  }

  /**
   * Helper method to find a column that matches any of the patterns
   */
  findColumnByPatterns(patterns) {
    for (const pattern of patterns) {
      const found = this.columns.find(col => 
        col.toLowerCase().includes(pattern.toLowerCase()));
      
      if (found) return found;
    }
    return null;
  }
}
