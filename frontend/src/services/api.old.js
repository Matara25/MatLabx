import axios from 'axios'

// STUPID API layer - no auth logic inside
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api
export const useApi = () => {
  const { getToken, loading } = useAuth()
  
  if (loading) {
    return null // Don't provide API until auth is resolved
  }

  const token = getToken()
  return createApiInstance(token)
}

// For non-hook contexts (like App.jsx socket)
export const getApiToken = () => {
  // This will be updated to use AuthContext
  return null
}
