import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// HTML'deki 'root' id'li div içerisine React uygulamamızı yerleştiriyoruz
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)