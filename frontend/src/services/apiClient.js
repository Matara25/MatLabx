import axios from 'axios'

// Clean API client - no auth logic inside
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Handle token expiration globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Let AuthContext handle logout - don't touch localStorage here
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

// Helper to add auth token to requests
export const withAuth = (config, token) => {
  if (token) {
    return {
      ...config,
      headers: {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      }
    }
  }
  return config
}

export default apiClient
