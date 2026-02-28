import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log("Main executing...");
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode disabled to prevent WebSocket double-mounting issues
  <App />
)
