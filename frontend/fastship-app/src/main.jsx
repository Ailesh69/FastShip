import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter enables client-side page navigation (URLs like /signup) */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
