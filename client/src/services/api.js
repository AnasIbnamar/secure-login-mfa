import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach the JWT token to every outgoing request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: normalize errors + handle session expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''

    // If we get 401 from a *protected* endpoint while we have a stored token,
    // the session has expired. Dispatch an event so the AuthContext can react.
    // Auth endpoints (login, register) legitimately return 401 — exclude them.
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register')

    if (status === 401 && !isAuthEndpoint && localStorage.getItem('token')) {
      localStorage.removeItem('token')
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }

    // Always surface a clean, readable error message to callers
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'An unexpected error occurred. Please try again.'

    return Promise.reject(new Error(message))
  }
)

export default api
