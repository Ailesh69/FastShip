import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { startDepthEngine } from './motion/depthEngine'
import { titleFor } from './config/pageTitles'
import GridBackground from './components/GridBackground'
import PixelSprites from './components/PixelSprites'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LoadingOverlay from './components/LoadingOverlay'
import WarpOverlay from './components/WarpOverlay'
import LoadingNavProvider from './context/LoadingNavProvider'
import AuthProvider from './context/AuthProvider'
import { useAuth } from './context/auth'
import Home from './pages/Home'
import Track from './pages/Track'
import SelectPath from './pages/SelectPath'
import PathSignup from './pages/PathSignup'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProfileEditor from './pages/ProfileEditor'
import SellerDashboard from './pages/SellerDashboard'
import SubmitShipment from './pages/SubmitShipment'
import SellerProfile from './pages/SellerProfile'
import PartnerDashboard from './pages/PartnerDashboard'
import UpdateShipment from './pages/UpdateShipment'
import PartnerProfile from './pages/PartnerProfile'
import About from './pages/About'
import NotFound from './pages/NotFound'

// Per-route background tuning — same GridBackground/PixelSprites everywhere,
// these props just move the horizon and sprite field.
const SELECT_SCENE = { horizon: '85%', bands: false, accents: false, floor: true, sprites: 'select' }
// Form screens: plain navy + sprites, no floor grid.
const FORM_SCENE = { horizon: '85%', bands: false, accents: false, floor: false, sprites: 'select' }
const DEFAULT_SCENE = { horizon: '46%', bands: true, accents: true, floor: true, sprites: 'hero' }

// Routes needing a session; unauthed users bounce to /login.
const PROTECTED_PREFIXES = ['/client/', '/seller/', '/partner/']
const isProtected = (path) =>
  PROTECTED_PREFIXES.some((p) => path.startsWith(p)) && !path.endsWith('/signup')

function RequireAuth({ children }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: pathname }} />
  return children
}

function sceneFor(pathname) {
  if (pathname === '/signup') return SELECT_SCENE
  // Centred-card screens (login/track/about) share the plain navy backdrop
  // instead of the hero's floor grid.
  if (
    pathname === '/login' ||
    pathname === '/track' ||
    pathname === '/about' ||
    pathname.endsWith('/signup')
  )
    return FORM_SCENE
  if (isProtected(pathname)) return SELECT_SCENE
  return DEFAULT_SCENE
}

// Shared layout: background + navbar + footer stay mounted; <Routes> swaps
// the middle content.
function Shell() {
  const { pathname } = useLocation()
  const scene = sceneFor(pathname)

  // One pointer/scroll listener + rAF loop site-wide, publishes --dx/--dy/--sy
  // on <html> for CSS parallax so nothing here re-renders on cursor move.
  useEffect(startDepthEngine, [])

  // Per-route title, kept here so it can't drift from the route table below.
  useEffect(() => {
    document.title = titleFor(pathname)
  }, [pathname])

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* navy base + grid horizon behind everything */}
      <GridBackground
        horizon={scene.horizon}
        bands={scene.bands}
        accents={scene.accents}
        floor={scene.floor}
      />

      {/* scattered 8-bit sprites */}
      <PixelSprites layout={scene.sprites} />

      {/* top bar — guest vs signed-in is driven by the mock session */}
      <Navbar />

      {/* key={pathname} remounts on nav to restart .page-enter (motion.css).
          Key stays on this <main> (not a wrapper div) since pages depend on
          being direct flex children of it (flex-1 on Home, my-auto on SelectPath). */}
      <main
        key={pathname}
        className="page-enter relative z-10 flex flex-1 flex-col items-center pt-[70px]"
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SelectPath />} />

          {/* Role sign-up forms */}
          <Route path="/client/signup" element={<PathSignup role="client" />} />
          <Route path="/seller/signup" element={<PathSignup role="seller" />} />
          <Route path="/partner/signup" element={<PathSignup role="partner" />} />

          {/* Client */}
          <Route
            path="/client/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/client/profile"
            element={
              <RequireAuth>
                <ProfileEditor />
              </RequireAuth>
            }
          />

          {/* Seller */}
          <Route
            path="/seller/dashboard"
            element={
              <RequireAuth>
                <SellerDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/seller/submit-shipment"
            element={
              <RequireAuth>
                <SubmitShipment />
              </RequireAuth>
            }
          />
          <Route
            path="/seller/profile"
            element={
              <RequireAuth>
                <SellerProfile />
              </RequireAuth>
            }
          />

          {/* Delivery partner */}
          <Route
            path="/partner/dashboard"
            element={
              <RequireAuth>
                <PartnerDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/partner/update-shipment"
            element={
              <RequireAuth>
                <UpdateShipment />
              </RequireAuth>
            }
          />
          <Route
            path="/partner/profile"
            element={
              <RequireAuth>
                <PartnerProfile />
              </RequireAuth>
            }
          />

          {/* Shipment lookup — submitting leaves the SPA for the backend page. */}
          <Route path="/track" element={<Track />} />

          {/* Legacy paths kept alive so older links don't dead-end. */}
          <Route path="/dashboard" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="/profile" element={<Navigate to="/client/profile" replace />} />
          <Route path="/seller" element={<Navigate to="/seller/dashboard" replace />} />
          <Route
            path="/seller/submit"
            element={<Navigate to="/seller/submit-shipment" replace />}
          />
          <Route path="/signup/customer" element={<Navigate to="/client/signup" replace />} />
          <Route path="/signup/seller" element={<Navigate to="/seller/signup" replace />} />
          <Route path="/signup/delivery" element={<Navigate to="/partner/signup" replace />} />

          {/* Real 404 — used to redirect to "/", which hid dead links. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

function App() {
  return (
    // Auth wraps navigation since navbar + signed-in pages need it.
    <AuthProvider>
      <LoadingNavProvider>
        <Shell />
        {/* Transition overlays, above everything; variant picked at random
            per-nav in LoadingNavProvider, only one active at a time. */}
        <LoadingOverlay />
        <WarpOverlay />
      </LoadingNavProvider>
    </AuthProvider>
  )
}

export default App
