import { createContext, useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import authService from '../services/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  // tempToken lives in memory only — short-lived, used exclusively for the MFA step
  const [tempToken, setTempToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, validate the stored token by calling /api/auth/me
  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('token')
    if (!storedToken) {
      setLoading(false)
      return
    }
    try {
      const data = await authService.getMe()
      setUser(data.user)
      setToken(storedToken)
    } catch {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Listen for 401 events dispatched by the Axios interceptor
  // (token expired while user was already logged in)
  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null)
      setUser(null)
      setTempToken(null)
      toast.error('Your session has expired. Please sign in again.')
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  /**
   * Step 1 of login.
   * Returns { mfaRequired: true } or { mfaRequired: false }
   * so the caller can decide where to navigate.
   */
  const login = async (email, password) => {
    const data = await authService.login(email, password)

    if (data.mfaRequired) {
      setTempToken(data.tempToken)
      return { mfaRequired: true }
    }

    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
    return { mfaRequired: false, user: data.user }
  }

  /**
   * Step 2 of login (only when MFA is enabled).
   * Uses the tempToken stored after step 1.
   */
  const completeMFALogin = async (code) => {
    const data = await authService.verifyMFALogin(code, tempToken)
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
    setTempToken(null)
    return data
  }

  /** Re-fetch the user profile (e.g. after enabling MFA). */
  const refreshUser = async () => {
    const data = await authService.getMe()
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setTempToken(null)
  }

  const value = {
    user,
    token,
    tempToken,
    loading,
    isAuthenticated: !!token,
    login,
    completeMFALogin,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
