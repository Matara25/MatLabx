import React from 'react'
import { useNavigate } from 'react-router-dom'
import AuthModal from '../components/auth/AuthModal'

const AuthPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 to-secondary-900/20" />
      
      {/* Auth Modal */}
      <AuthModal onClose={() => navigate('/')} />
    </div>
  )
}

export default AuthPage
