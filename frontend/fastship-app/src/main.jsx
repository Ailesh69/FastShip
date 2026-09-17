import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
// Must load AFTER index.css: `transition` is a shorthand, so this file's
// rules (.tilt/.mag etc.) need to come last in the cascade to win. See src/motion/.
import './motion/motion.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
