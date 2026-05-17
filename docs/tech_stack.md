# Adaptive Data Intelligence Platform - Technical Documentation

## Tech Stack Overview

### Frontend
* **Framework**: React 18.2.0 with Vite 5.0.0
* **Styling**: Tailwind CSS 3.4.0
* **Visualization**: D3.js 7.8.5 and Recharts 2.10.0
* **State Management**: Redux Toolkit 2.0.1
* **UI Components**: Custom component library

### Backend
* **API Framework**: FastAPI 0.104.1
* **Data Processing**: Pandas 2.1.3, NumPy 1.26.2, scikit-learn 1.3.2
* **Statistical Analysis**: SciPy 1.11.4
* **Forecasting Models**: Prophet 1.1.4 and statsmodels 0.14.0
* **Database**: SQLite 3.44.0
* **Caching**: Redis 7.2.3

### LLM Integration
* **Core Engine**: Groq API
* **Framework**: LangChain 0.1.0
* **Context Management**: Vector database for semantic search
* **Query Translation**: Custom NL-to-SQL conversion

## Deprecated Methods and Best Practices

### Frontend

#### React
* **Deprecated**: Class components with lifecycle methods
* **Use Instead**: Functional components with React Hooks
* **Deprecated**: Legacy context API
* **Use Instead**: Modern Context API with useContext hook
* **Deprecated**: React.createClass
* **Use Instead**: ES6 classes or functional components

#### D3.js
* **Deprecated**: d3.scale (v3)
* **Use Instead**: d3.scaleLinear, d3.scaleOrdinal, etc.
* **Deprecated**: d3.svg.axis
* **Use Instead**: d3.axisBottom, d3.axisLeft, etc.

#### Redux
* **Deprecated**: createStore
* **Use Instead**: configureStore from Redux Toolkit
* **Deprecated**: Manual action creators and reducers
* **Use Instead**: createSlice from Redux Toolkit

### Backend

#### Pandas
* **Deprecated**: pd.append
* **Use Instead**: pd.concat
* **Deprecated**: pd.read_table
* **Use Instead**: pd.read_csv with sep parameter
* **Deprecated**: DataFrame.append
* **Use Instead**: pd.concat([df1, df2])

#### NumPy
* **Deprecated**: np.float, np.int, np.bool
* **Use Instead**: float, int, bool or np.float64, np.int64, np.bool_
* **Deprecated**: np.matrix
* **Use Instead**: np.array

#### scikit-learn
* **Deprecated**: sklearn.cross_validation
* **Use Instead**: sklearn.model_selection
* **Deprecated**: sklearn.grid_search
* **Use Instead**: sklearn.model_selection.GridSearchCV

### LLM Integration

#### LangChain
* **Deprecated**: ConversationSummaryMemory
* **Use Instead**: ChatMessageHistory with specific summarization callbacks
* **Deprecated**: Direct OpenAI API calls without retry handling
* **Use Instead**: Structured API calls with proper error handling and retries

## Best Practices

1. **Performance Optimization**:
   * Use React.memo for pure functional components that render often but with the same props
   * Implement virtualization for long lists using react-window or react-virtualized
   * Use lazy loading for routes and heavy components

2. **Data Processing**:
   * Preprocess data on the backend whenever possible
   * Use efficient data structures (TypedArrays when appropriate)
   * Leverage Pandas vectorized operations instead of loops

3. **State Management**:
   * Use Redux Toolkit for global state
   * Use React Query for server state management
   * Separate UI state from data state

4. **API Implementation**:
   * Use FastAPI's dependency injection for reusable components
   * Implement proper validation with Pydantic models
   * Set up appropriate caching strategies with Redis

5. **Error Handling**:
   * Implement consistent error boundaries in React
   * Use try/except blocks with specific exception types in Python
   * Log errors with context for debugging

6. **Testing**:
   * Write unit tests for utility functions
   * Implement integration tests for API endpoints
   * Use React Testing Library for component tests

## Coding Standards

* **Frontend**: Follow Airbnb JavaScript Style Guide
* **Backend**: Follow PEP 8 guidelines for Python code
* **Git**: Use conventional commits format
* **Documentation**: Document all functions, classes, and complex logic
