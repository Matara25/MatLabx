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
    case 'BOOTSTRAP_START':
      return { ...state, loading: true, bootstrapped: false }
    case 'BOOTSTRAP_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        bootstrapped: true,
        user: action.payload,
        isAuthenticated: !!action.payload
      }
    case 'BOOTSTRAP_FAILURE':
      return { 
        ...state, 
        loading: false, 
        bootstrapped: true,
        user: null,
        isAuthenticated: false
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
  loading: true, // Start with loading during bootstrap
  bootstrapped: false, // Critical: prevents route evaluation
  error: null,
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // SINGLE PLACE for localStorage access - the only source of truth
  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        dispatch({ type: 'BOOTSTRAP_FAILURE' });
        return;
      }

      try {
        // CRITICAL: Verify session with backend
        const response = await apiClient.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Backend confirmed valid session
        dispatch({
          type: 'BOOTSTRAP_SUCCESS',
          payload: response.data.user
        });

      } catch (err) {
        // Token invalid or network error
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        dispatch({ type: 'BOOTSTRAP_FAILURE' });
      }
    };

    bootstrapAuth();
  }, []);

  // Login - SINGLE PLACE for auth decisions
  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' })
    
    try {
      const response = await apiClient.post('/auth/login', { email, password })
      const { token, user } = response.data
      
      // Store token
      localStorage.setItem('token', token)
      
      // Set user in AuthContext
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: user
      })
      
      toast.success('Login successful!')
      
      return { 
        success: true, 
        user: {
          email: user.email,
          role: user.role,
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
