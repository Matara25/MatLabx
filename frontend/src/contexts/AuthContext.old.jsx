import React, { createContext, useContext, useReducer, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { createApiInstance } from '../services/api'

const AuthContext = createContext()

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
  loading: true, // Start with loading = true during initialization
  error: null,
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user)
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: parsedUser
        })
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        dispatch({ type: 'LOGOUT' })
      }
    } else {
      // No token found, set loading to false
      dispatch({ type: 'LOGOUT' })
    }
  }, [])

  const login = async (email, password) => {
    console.log("=== AUTH LOGIN START ===", { email, password: "***" });
    dispatch({ type: 'LOGIN_START' })
    
    try {
      console.log("=== MAKING API CALL ===");
      // Use centralized API instance without token for login
      const api = createApiInstance(null)
      const response = await api.post('/auth/login', { email, password })
      console.log("=== API RESPONSE RECEIVED ===", response);
      console.log("=== RESPONSE DATA ===", response.data);
      
      const { token, user } = response.data
      console.log("=== EXTRACTED TOKEN AND USER ===", { token: token ? "***" : null, user });
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      console.log("=== STORED IN LOCAL STORAGE ===");
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: user
      })
      console.log("=== DISPATCHED LOGIN SUCCESS ===");
      
      toast.success('Login successful!')
      
      const returnData = { 
        success: true, 
        user: {
          email: user.email,
          isVerified: user.isVerified || false,
          hasCompletedOnboarding: user.hasCompletedOnboarding || false
        }
      }
      console.log("=== RETURNING FROM LOGIN ===", returnData);
      return returnData
    } catch (error) {
      console.error("=== LOGIN CATCH ERROR ===", error);
      console.error("=== ERROR RESPONSE ===", error.response);
      const errorMessage = error.response?.data?.message || 'Login failed'
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      })
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const register = async (userData) => {
    dispatch({ type: 'REGISTER_START' })
    
    try {
      const response = await api.post('/auth/register', userData)
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: user
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

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    dispatch({ type: 'LOGOUT' })
    toast.success('Logged out successfully')
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value = {
    ...state,
    login,
    register,
    logout,
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
