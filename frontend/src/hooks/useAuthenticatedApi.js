import { useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import apiClient, { withAuth } from '../services/apiClient'

// Hook for making authenticated API calls
export const useAuthenticatedApi = () => {
  const { getToken } = useAuth()

  const get = useCallback(async (url, config = {}) => {
    const token = getToken()
    return apiClient.get(url, withAuth(config, token))
  }, [getToken])

  const post = useCallback(async (url, data = {}, config = {}) => {
    const token = getToken()
    return apiClient.post(url, data, withAuth(config, token))
  }, [getToken])

  const put = useCallback(async (url, data = {}, config = {}) => {
    const token = getToken()
    return apiClient.put(url, data, withAuth(config, token))
  }, [getToken])

  const deleteRequest = useCallback(async (url, config = {}) => {
    const token = getToken()
    return apiClient.delete(url, withAuth(config, token))
  }, [getToken])

  return {
    get,
    post,
    put,
    delete: deleteRequest
  }
}
