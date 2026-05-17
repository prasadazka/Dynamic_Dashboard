import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { store } from './store'

// Debug the store state
console.log('Initial Redux Store State:', store.getState())

// Make sure the root element exists
const rootElement = document.getElementById('root')
console.log('Root element found:', rootElement)

// Add fallback rendering if root is missing
if (!rootElement) {
  console.error('Root element not found in the DOM')
  document.body.innerHTML = '<div id="root"><h1>Error: Root element not found</h1></div>'
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)
