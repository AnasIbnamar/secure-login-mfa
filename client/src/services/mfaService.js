import api from './api'

const mfaService = {
  // Initiate MFA setup — returns { qrCode, secret }
  setup: async () => {
    const { data } = await api.post('/mfa/setup')
    return data
  },

  // Confirm OTP code to activate MFA on the account
  verify: async (code) => {
    const { data } = await api.post('/mfa/verify', { token: code })
    return data
  },
}

export default mfaService
