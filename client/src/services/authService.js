import api from './api'

const authService = {
  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    return data
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },

  // MFA login step: tempToken goes in Authorization header, OTP code in body
  verifyMFALogin: async (code, tempToken) => {
    const { data } = await api.post(
      '/auth/login/mfa',
      { token: code },
      { headers: { Authorization: `Bearer ${tempToken}` } }
    )
    return data
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },
}

export default authService
