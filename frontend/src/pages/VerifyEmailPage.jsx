import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const VerifyEmailPage = () => {
  const [isResending, setIsResending] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const navigate = useNavigate()
  const { user, getToken } = useAuth()

  const handleResendVerification = async () => {
    setIsResending(true)
    try {
      // API call to resend verification email
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ email: user.email })
      })
      
      if (response.ok) {
        toast.success('Verification email sent! Check your inbox.')
      } else {
        throw new Error('Failed to resend verification email')
      }
    } catch (error) {
      toast.error('Failed to resend verification email')
    } finally {
      setIsResending(false)
    }
  }

  const handleVerifyEmail = async (token) => {
    try {
      const response = await fetch(`/api/auth/verify-email/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        setIsVerified(true)
        toast.success('Email verified successfully!')
        
        // Update user state in context
        setTimeout(() => {
          navigate('/onboarding')
        }, 2000)
      } else {
        throw new Error('Invalid or expired verification link')
      }
    } catch (error) {
      toast.error('Invalid or expired verification link')
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="bg-dark-surface border border-dark-border rounded-xl shadow-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <EnvelopeIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-dark-text mb-2">
            Verify Your Email
          </h1>
          <p className="text-dark-muted">
            We've sent a verification link to <span className="text-primary-400">{user?.email}</span>
          </p>
        </div>

        {/* Verification Status */}
        {!isVerified ? (
          <div className="space-y-6">
            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
              <h3 className="font-semibold text-dark-text mb-2">Next Steps:</h3>
              <ol className="text-sm text-dark-muted space-y-2 list-decimal list-inside">
                <li>Check your email inbox</li>
                <li>Click the verification link</li>
                <li>Complete your onboarding</li>
              </ol>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full btn-secondary disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend Verification Email'}
              </button>

              <button
                onClick={() => navigate('/auth')}
                className="w-full text-sm text-dark-muted hover:text-primary-400 transition-colors duration-200"
              >
                <ArrowLeftIcon className="w-4 h-4 inline mr-2" />
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-dark-text">Email Verified!</h3>
            <p className="text-dark-muted">Redirecting to onboarding...</p>
          </div>
        )}

        {/* Development Helper */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 bg-yellow-900/20 border border-yellow-600 rounded-lg">
            <p className="text-xs text-yellow-400">
              <strong>Dev Mode:</strong> Check console for verification link or use the resend button.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default VerifyEmailPage
