import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import OtpInput from '../components/OtpInput'
import Spinner from '../components/Spinner'

const OTP_LENGTH = 6

export default function MFAVerify() {
  const { tempToken, completeMFALogin, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const otpRef = useRef()

  // Already authenticated → go to dashboard
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  // No tempToken means user landed here directly without logging in first
  useEffect(() => {
    if (!tempToken && !isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [tempToken, isAuthenticated, navigate])

  // Auto-focus the first OTP box on mount
  useEffect(() => {
    otpRef.current?.focus()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const code = digits.join('')
    if (code.length < OTP_LENGTH) {
      toast.error('Please enter all 6 digits of your authenticator code.')
      return
    }

    setLoading(true)
    try {
      const data = await completeMFALogin(code)
      const name = data.user?.name?.split(' ')[0] || 'back'
      toast.success(`Welcome back, ${name}!`)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message)
      // Clear inputs so the user can try again cleanly
      setDigits(Array(OTP_LENGTH).fill(''))
      otpRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  const isComplete = digits.every((d) => d !== '')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="auth-card">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-indigo-600 items-center justify-center mb-4">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3.75h3m-3 3.75h3" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Two-Factor Authentication</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Open your authenticator app and enter the 6-digit code
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* OTP boxes */}
          <div className="mb-8">
            <OtpInput ref={otpRef} digits={digits} onChange={setDigits} centered />
          </div>

          <button type="submit" disabled={loading || !isComplete} className="btn-primary">
            {loading
              ? <><Spinner size="sm" color="white" /> Verifying...</>
              : 'Verify & Sign In'}
          </button>
        </form>

        {/* Hint */}
        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500 text-center leading-relaxed">
            Use Google Authenticator, Authy, or any TOTP-compatible app.
            <br />Codes refresh every 30 seconds.
          </p>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
