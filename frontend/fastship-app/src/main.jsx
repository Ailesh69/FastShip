import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
// AFTER index.css, deliberately. The depth layer adds `transform` to elements
// that already declare a `transition` of their own (.path-card, .bracket-btn,
// .teal-outline-box). `transition` is a shorthand, so whichever rule comes
// last in the cascade wins outright — loading motion.css second is what lets
// .tilt / .mag state their full transition and have it stick. It defines no
// colours, fonts, spacing or layout, so nothing in index.css can be
// overridden by it. See src/motion/ for the engine that drives it.
import './motion/motion.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter enables client-side page navigation (URLs like /signup) */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
