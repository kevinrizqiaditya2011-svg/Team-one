import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { FullLoader } from './components/ui/Loading'
import AppLayout from './layouts/AppLayout'
import { PlaceProvider } from './context/PlaceContext'
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Buildings from './pages/Buildings'
import EnergyMonitor from './pages/EnergyMonitor'
import Recommendations from './pages/Recommendations'
import CarbonFootprint from './pages/CarbonFootprint'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    // Jika ada hash, scroll ke element tersebut dengan smooth
    if (hash) {
      // Delay sedikit agar element sudah ter-render
      const timer = setTimeout(() => {
        const el = document.getElementById(hash.slice(1))
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
    // Tanpa hash, scroll ke atas
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])
  return null
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullLoader />
  if (user) return <Navigate to="/app" replace />
  return children
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPassword />
            </GuestRoute>
          }
        />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <PlaceProvider>
                <AppLayout />
              </PlaceProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="buildings" element={<Buildings />} />
          <Route path="monitor" element={<EnergyMonitor />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="carbon" element={<CarbonFootprint />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
