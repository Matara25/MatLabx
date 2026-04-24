import axios from 'axios'

// STUPID API layer - no auth logic inside
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api
