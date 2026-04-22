import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import mfaService from '../services/mfaService'
import Navbar from '../components/Navbar'
import OtpInput from '../components/OtpInput'
import Spinner from '../components/Spinner'

const OTP_LENGTH = 6

// MFA setup progresses through three stages:
// 'idle'     → default state, shows "Enable MFA" button
// 'scanning' → QR code visible, user scans + enters code
// 'done'     → MFA successfully activated
const STAGES = { IDLE: 'idle', SCANNING: 'scanning', DONE: 'done' }

export default function SecuritySettings() {
  const { user, refreshUser } = useAuth()

  const [stage, setStage] = useState(STAGES.IDLE)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''))
  const [loadingSetup, setLoadingSetup] = useState(false)
  const [loadingVerify, setLoadingVerify] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const otpRef = useRef()

  const handleSetupMFA = async () => {
    setLoadingSetup(true)
    try {
      const data = await mfaService.setup()
      setQrCode(data.qrCode)
      setSecret(data.secret)
      setStage(STAGES.SCANNING)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoadingSetup(false)
    }
  }

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret)
      toast.success('Secret key copied to clipboard.')
    } catch {
      toast.error('Could not copy to clipboard. Please copy it manually.')
    }
  }

  const handleVerifyMFA = async (e) => {
    e.preventDefault()
    const code = digits.join('')
    if (code.length < OTP_LENGTH) {
      toast.error('Please enter all 6 digits.')
      return
    }

    setLoadingVerify(true)
    try {
      await mfaService.verify(code)
      await refreshUser() // updates user.mfaEnabled everywhere in the UI
      setStage(STAGES.DONE)
      toast.success('Two-factor authentication is now active!')
    } catch (err) {
      toast.error(err.message)
      setDigits(Array(OTP_LENGTH).fill(''))
      otpRef.current?.focus()
    } finally {
      setLoadingVerify(false)
    }
  }

  const handleCancel = () => {
    setStage(STAGES.IDLE)
    setDigits(Array(OTP_LENGTH).fill(''))
    setShowSecret(false)
  }

  const isComplete = digits.every((d) => d !== '')

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Security Settings</h1>
          <p className="text-slate-500 mt-1">Manage your account security and authentication methods.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Main MFA card ── */}
          <div className="lg:col-span-2">
            <div className="page-card">
              {/* Card header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3.75h3m-3 3.75h3" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Two-Factor Authentication</h2>
                    <p className="text-sm text-slate-500">Authenticator app (TOTP)</p>
                  </div>
                </div>
                {user?.mfaEnabled && (
                  <span className="badge-enabled">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Enabled
                  </span>
                )}
              </div>

              {/* ── Stage: IDLE ── */}
              {stage === STAGES.IDLE && (
                user?.mfaEnabled ? (
                  <div className="alert-success">
                    <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold">MFA is active on your account.</p>
                      <p className="text-xs mt-0.5 opacity-80">
                        Every login requires your authenticator code in addition to your password.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-600 mb-5">
                      Two-factor authentication adds an extra layer of security. After enabling it,
                      each login will require a 6-digit code from your authenticator app.
                    </p>
                    <button
                      onClick={handleSetupMFA}
                      disabled={loadingSetup}
                      className="btn-primary max-w-xs"
                    >
                      {loadingSetup
                        ? <><Spinner size="sm" color="white" /> Generating QR Code...</>
                        : 'Enable Two-Factor Auth'}
                    </button>
                  </div>
                )
              )}

              {/* ── Stage: SCANNING ── */}
              {stage === STAGES.SCANNING && (
                <div>
                  <p className="text-sm text-slate-600 mb-6">
                    Scan the QR code below with your authenticator app, then enter the 6-digit code
                    to confirm and activate.
                  </p>

                  {/* QR code + manual secret */}
                  <div className="flex flex-col sm:flex-row gap-6 mb-7">
                    <div className="shrink-0">
                      <div className="inline-block p-3 bg-white border-2 border-slate-200 rounded-xl shadow-sm">
                        <img src={qrCode} alt="MFA QR Code" className="h-44 w-44" />
                      </div>
                    </div>

                    <div className="flex flex-col justify-center gap-5">
                      {/* Manual secret */}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Can&apos;t scan? Enter this key manually:
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <code
                            className={`text-sm font-mono bg-slate-100 px-3 py-2 rounded-lg tracking-widest text-slate-800 transition-all ${
                              showSecret ? '' : 'blur-sm select-none'
                            }`}
                          >
                            {secret}
                          </code>
                          {/* Show/hide */}
                          <button
                            type="button"
                            onClick={() => setShowSecret((v) => !v)}
                            title={showSecret ? 'Hide secret' : 'Show secret'}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            {showSecret ? (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                          </button>
                          {/* Copy */}
                          <button
                            type="button"
                            onClick={handleCopySecret}
                            title="Copy secret key"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Steps */}
                      <ol className="text-xs text-slate-500 space-y-1 list-none">
                        <li className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">1</span>
                          Open your authenticator app
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                          Tap <strong className="text-slate-700">Add account</strong> → <strong className="text-slate-700">Scan QR code</strong>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">3</span>
                          Enter the 6-digit code below
                        </li>
                      </ol>
                    </div>
                  </div>

                  {/* OTP confirmation form */}
                  <form onSubmit={handleVerifyMFA}>
                    <p className="text-sm font-medium text-slate-700 mb-3">Verification code</p>
                    <div className="mb-5">
                      <OtpInput ref={otpRef} digits={digits} onChange={setDigits} />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loadingVerify || !isComplete}
                        className="btn-primary max-w-xs"
                      >
                        {loadingVerify
                          ? <><Spinner size="sm" color="white" /> Activating...</>
                          : 'Activate MFA'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="btn-secondary max-w-[8rem]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── Stage: DONE ── */}
              {stage === STAGES.DONE && (
                <div className="text-center py-6">
                  <div className="inline-flex h-16 w-16 rounded-full bg-green-100 items-center justify-center mb-4">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">MFA Activated!</h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                    Two-factor authentication is now active. Your next login will require a code
                    from your authenticator app.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Info sidebar ── */}
          <div className="space-y-4">
            <div className="page-card">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Why enable MFA?</h2>
              <ul className="space-y-3">
                {[
                  'Protects your account even if your password is stolen',
                  'Industry standard used by banks and tech companies',
                  'TOTP codes expire every 30 seconds — resistant to replay attacks',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <svg className="h-4 w-4 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-sm text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="page-card">
              <h2 className="text-base font-semibold text-slate-900 mb-3">Compatible Apps</h2>
              <ul className="space-y-2 text-sm text-slate-600">
                {[
                  'Google Authenticator',
                  'Microsoft Authenticator',
                  'Authy',
                  '1Password',
                  'Bitwarden',
                ].map((app) => (
                  <li key={app} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                    {app}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
