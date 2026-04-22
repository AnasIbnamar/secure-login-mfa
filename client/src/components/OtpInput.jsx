import { forwardRef, useImperativeHandle, useRef } from 'react'

const OTP_LENGTH = 6

/**
 * Reusable 6-box OTP input with:
 * - Auto-advance on digit entry
 * - Backspace → move to previous box
 * - Arrow key navigation
 * - Paste support (fills all boxes at once)
 * - ref.focus() to programmatically focus the first box
 *
 * Props:
 *   digits    — string[] of length 6 (controlled)
 *   onChange  — (nextDigits: string[]) => void
 *   centered  — boolean, centers the boxes (default false)
 */
const OtpInput = forwardRef(function OtpInput({ digits, onChange, centered = false }, ref) {
  const inputRefs = useRef([])

  // Expose a focus() method so parents can reset focus after an error
  useImperativeHandle(ref, () => ({
    focus: () => inputRefs.current[0]?.focus(),
  }))

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    onChange(next)
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = Array(OTP_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    onChange(next)
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
  }

  return (
    <div
      className={`flex items-center gap-2 ${centered ? 'justify-center' : ''}`}
      onPaste={handlePaste}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className={`
            w-12 h-14 text-center text-xl font-bold border-2 rounded-xl
            text-slate-900 bg-white transition-all duration-200
            focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200
            ${digit ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}
          `}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  )
})

export default OtpInput
