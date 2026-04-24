import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const AuthModal = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const { login, register, clearError, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  
  const {
    register: registerForm,
    handleSubmit: handleSubmitRegister,
    formState: { errors: registerErrors }
  } = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student',
      profile: {
        firstName: '',
        lastName: '',
        institution: '',
        experienceLevel: 'beginner'
      }
    }
  })

  const {
    register: loginForm,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors }
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onRegisterSubmit = (data) => {
    clearError()
    register(data)
  }

  const onLoginSubmit = async (data) => {
    clearError()
    
    try {
      const result = await login(data.email, data.password)
      
      if (result.success) {
        // Intelligent routing based on user state
        // TEMPORARILY BYPASS EMAIL VERIFICATION FOR TESTING
        // if (!result.user.isVerified) {
        //   navigate('/verify-email')
        //   return
        // }
        
        // Route admin users directly to admin dashboard
        if (result.user.role === 'admin') {
          navigate('/admin/dashboard')
          return
        }
        
        if (!result.user.hasCompletedOnboarding) {
          navigate('/onboarding')
          return
        }
        
        // Returning user - go to dashboard
        navigate('/dashboard')
      }
    } catch (error) {
      // Error is handled by AuthContext
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-surface border border-dark-border rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-border px-6 py-4">
          <div className="flex">
            <button
              onClick={() => setIsLogin(true)}
              className={`px-6 py-2 text-sm font-medium transition-colors duration-200 ${
                isLogin 
                  ? 'text-primary-400 border-b-2 border-primary-400' 
                  : 'text-dark-muted hover:text-primary-400'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`px-6 py-2 text-sm font-medium transition-colors duration-200 ${
                !isLogin 
                  ? 'text-primary-400 border-b-2 border-primary-400' 
                  : 'text-dark-muted hover:text-primary-400'
              }`}
            >
              Register
            </button>
          </div>
          <button
            onClick={onClose || (() => navigate('/'))}
            className="text-dark-muted hover:text-primary-400 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {isLogin ? (
            /* Login Form */
            <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-6" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-dark-text mb-2">
                  Email Address
                </label>
                <input
                  {...loginForm('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' } })}
                  type="email"
                  id="email"
                  autoComplete="email"
                  className="input-field"
                  placeholder="Enter your email"
                />
                {loginErrors.email && (
                  <p className="text-error-400 text-sm mt-1">{loginErrors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-dark-text mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...loginForm('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    className="input-field pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-muted hover:text-primary-400 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {loginErrors.password && (
                  <p className="text-error-400 text-sm mt-1">{loginErrors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-dark-border bg-dark-surface text-primary-600 focus:ring-primary-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-dark-text">Remember me</span>
                </label>
                <a
                  href="#"
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors duration-200"
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full btn-primary"
              >
                Sign In
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleSubmitRegister(onRegisterSubmit)} className="space-y-6" noValidate>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-dark-text mb-2">
                  Username
                </label>
                <input
                  {...registerForm('username')}
                  type="text"
                  id="username"
                  autoComplete="username"
                  className="input-field"
                  placeholder="Choose a username"
                />
                {registerErrors.username && (
                  <p className="text-error-400 text-sm mt-1">{registerErrors.username.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-dark-text mb-2">
                  Email Address
                </label>
                <input
                  {...registerForm('email')}
                  type="email"
                  id="email"
                  autoComplete="email"
                  className="input-field"
                  placeholder="Enter your email"
                />
                {registerErrors.email && (
                  <p className="text-error-400 text-sm mt-1">{registerErrors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-dark-text mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...registerForm('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="new-password"
                    className="input-field pr-10"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-muted hover:text-primary-400 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {registerErrors.password && (
                  <p className="text-error-400 text-sm mt-1">{registerErrors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-text mb-2">
                  Confirm Password
                </label>
                <input
                  {...registerForm('confirmPassword')}
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  className="input-field"
                  placeholder="Confirm your password"
                />
                {registerErrors.confirmPassword && (
                  <p className="text-error-400 text-sm mt-1">{registerErrors.confirmPassword.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-dark-text mb-2">
                  Account Type
                </label>
                <select
                  {...registerForm('role')}
                  id="role"
                  className="input-field"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-dark-text mb-2">
                    First Name
                  </label>
                  <input
                    {...registerForm('profile.firstName')}
                    type="text"
                    id="firstName"
                    autoComplete="given-name"
                    className="input-field"
                    placeholder="Enter your first name"
                  />
                  {registerErrors.profile?.firstName && (
                    <p className="text-error-400 text-sm mt-1">{registerErrors.profile.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-dark-text mb-2">
                    Last Name
                  </label>
                  <input
                    {...registerForm('profile.lastName')}
                    type="text"
                    id="lastName"
                    autoComplete="family-name"
                    className="input-field"
                    placeholder="Enter your last name"
                  />
                  {registerErrors.profile?.lastName && (
                    <p className="text-error-400 text-sm mt-1">{registerErrors.profile.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="institution" className="block text-sm font-medium text-dark-text mb-2">
                  Institution
                </label>
                <input
                  {...registerForm('profile.institution')}
                  type="text"
                  id="institution"
                  autoComplete="organization"
                  className="input-field"
                  placeholder="Your institution (optional)"
                />
              </div>

              <div>
                <label htmlFor="experienceLevel" className="block text-sm font-medium text-dark-text mb-2">
                  Experience Level
                </label>
                <select
                  {...registerForm('profile.experienceLevel')}
                  id="experienceLevel"
                  className="input-field"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full btn-primary"
              >
                Create Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal
