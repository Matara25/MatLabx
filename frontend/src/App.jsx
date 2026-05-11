import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from 'react-query'
import io from 'socket.io-client'

// Components
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import LoadingSpinner from './components/ui/LoadingSpinner'
import AuthModal from './components/auth/AuthModal'

// Pages
import HomePage from './pages/HomePage'
import LabsPage from './pages/LabsPage'
import Phase3LabsPage from './pages/Phase3LabsPage'
import LabDetailPage from './pages/LabDetailPage'
import SimulationPage from './pages/SimulationPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import OnboardingPage from './pages/OnboardingPage'
import CurriculumPage from './pages/CurriculumPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import CreateLabPage from './pages/admin/CreateLabPage'
import CreateCurriculumPage from './pages/admin/CreateCurriculumPage'
import BatchUploadPage from './pages/BatchUploadPage'
import AuthPage from './pages/AuthPage'
import TerminalTestPage from './pages/TerminalTestPage'
import Phase2LabsPage from './pages/Phase2LabsPage'

// Context
import { useAuth } from './contexts/AuthContext'

function App() {
  const { user, loading: authLoading, bootstrapped, getToken } = useAuth()
  const [socket, setSocket] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  
  // Initialize Socket.IO connection
  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:5001', {
        auth: {
          token: getToken()
        }
      })

      newSocket.on('connect', () => {
        console.log('Connected to server')
      })

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server')
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    }
  }, [user])

  // Check authentication status
  const { data: healthData, isLoading: healthLoading } = useQuery(
    'health',
    async () => {
      const response = await fetch('/api/health')
      return response.json()
    },
    {
      refetchInterval: 30000, // Check every 30 seconds
    }
  )

  // CRITICAL: Wait for auth bootstrap before any routing decisions
  if (!bootstrapped || authLoading || healthLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      <Navbar />
      
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/labs" element={<LabsPage />} />
          <Route path="/labs/:id" element={<LabDetailPage />} />
          <Route path="/curriculum" element={<CurriculumPage />} />
          <Route 
            path="/simulation/:labId" 
            element={
              user ? <SimulationPage socket={socket} /> : <Navigate to="/auth" replace />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              authLoading ? (
                <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                  <LoadingSpinner size="large" />
                </div>
              ) : user ? (
                <DashboardPage socket={socket} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/profile" 
            element={
              authLoading ? (
                <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                  <LoadingSpinner size="large" />
                </div>
              ) : user ? (
                <ProfilePage />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/verify-email" 
            element={
              authLoading ? (
                <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                  <LoadingSpinner size="large" />
                </div>
              ) : user ? (
                <VerifyEmailPage />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/onboarding" 
            element={
              authLoading ? (
                <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                  <LoadingSpinner size="large" />
                </div>
              ) : user ? (
                <OnboardingPage />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              authLoading ? (
                <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                  <LoadingSpinner size="large" />
                </div>
              ) : user ? (
                <AdminDashboardPage />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          <Route 
            path="/admin/create-lab" 
            element={
              authLoading ? (
                <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                  <LoadingSpinner size="large" />
                </div>
              ) : user ? (
                <CreateLabPage />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          <Route 
            path="/admin/create-curriculum" 
            element={
              authLoading ? (
                <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                  <LoadingSpinner size="large" />
                </div>
              ) : user ? (
                <CreateCurriculumPage />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          <Route 
            path="/terminal-test" 
            element={
              authLoading ? (
                <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                  <LoadingSpinner size="large" />
                </div>
              ) : user ? (
                <TerminalTestPage />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          <Route 
            path="/phase2-labs" 
            element={
              authLoading ? (
                <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                  <LoadingSpinner size="large" />
                </div>
              ) : user ? (
                <Phase2LabsPage />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          <Route 
            path="/phase3-labs" 
            element={
              authLoading ? (
                <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                  <LoadingSpinner size="large" />
                </div>
              ) : user ? (
                <Phase3LabsPage />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          <Route 
            path="/batch-upload" 
            element={
              authLoading ? (
                <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                  <LoadingSpinner size="large" />
                </div>
              ) : user ? (
                <BatchUploadPage />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App
