import React, { createContext, useContext, useReducer, useEffect } from 'react'
import toast from 'react-hot-toast'
import apiClient from '../services/apiClient'

const AuthContext = createContext()

// Clean auth reducer - no localStorage logic
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null }
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        user: action.payload, 
        isAuthenticated: true,
        error: null 
      }
    case 'LOGIN_FAILURE':
      return { 
        ...state, 
        loading: false, 
        user: null, 
        isAuthenticated: false,
        error: action.payload 
      }
    case 'LOGOUT':
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false,
        loading: false 
      }
    case 'REGISTER_START':
      return { ...state, loading: true, error: null }
    case 'REGISTER_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        error: null 
      }
    case 'REGISTER_FAILURE':
      return { 
        ...state, 
        loading: false, 
        error: action.payload 
      }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true, // Start with loading during initialization
  error: null,
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // SINGLE PLACE for localStorage access - the only source of truth
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('token')
        const userStr = localStorage.getItem('user')
        
        if (token && userStr) {
          const user = JSON.parse(userStr)
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: user
          })
        } else {
          dispatch({ type: 'LOGOUT' })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        dispatch({ type: 'LOGOUT' })
      }
    }

    initializeAuth()
  }, [])

  // Login - SINGLE PLACE for auth decisions
  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' })
    
    try {
      const response = await apiClient.post('/auth/login', { email, password })
      const { token, user } = response.data
      
      // Only AuthContext touches localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: user
      })
      
      toast.success('Login successful!')
      
      return { 
        success: true, 
        user: {
          email: user.email,
          isVerified: user.isVerified || false,
          hasCompletedOnboarding: user.hasCompletedOnboarding || false
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed'
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      })
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Register
  const register = async (userData) => {
    dispatch({ type: 'REGISTER_START' })
    
    try {
      const response = await apiClient.post('/auth/register', userData)
      
      dispatch({
        type: 'REGISTER_SUCCESS'
      })
      
      toast.success('Registration successful!')
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed'
      dispatch({
        type: 'REGISTER_FAILURE',
        payload: errorMessage
      })
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Logout - SINGLE PLACE for cleanup
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    dispatch({ type: 'LOGOUT' })
    toast.success('Logged out successfully')
  }

  // Update user state (for onboarding, profile updates)
  const updateUser = (userData) => {
    const updatedUser = { ...state.user, ...userData }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: updatedUser
    })
  }

  // Get token for API calls
  const getToken = () => {
    return localStorage.getItem('token')
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    getToken,
    clearError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
