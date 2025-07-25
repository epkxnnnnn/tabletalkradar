'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, Lock, ArrowRight, CheckCircle } from 'lucide-react'

interface PhoneAuthFormProps {
  mode: 'login' | 'signup'
  formData?: {
    email: string
    fullName: string
    companyName: string
    role: string
    industry: string
    businessType: string
  }
}

export default function PhoneAuthForm({ mode, formData }: PhoneAuthFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '')
    
    // Format as US phone number
    if (phoneNumber.length <= 3) {
      return phoneNumber
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
    }
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
    setError('')
  }

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const cleanPhone = `+1${phoneNumber.replace(/\D/g, '')}`
      const response = await fetch('/api/auth/phone/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: cleanPhone })
      })

      const data = await response.json()

      if (data.success) {
        setIsCodeSent(true)
        setCountdown(60)
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(data.error || 'Failed to send verification code')
      }
    } catch (error) {
      setError('Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const cleanPhone = `+1${phoneNumber.replace(/\D/g, '')}`
      const payload: any = {
        phoneNumber: cleanPhone,
        code: verificationCode
      }

      // If signup mode, include additional data
      if (mode === 'signup' && formData) {
        payload.email = formData.email
        payload.fullName = formData.fullName
        payload.companyName = formData.companyName
        payload.role = formData.role
        payload.industry = formData.industry
        payload.businessType = formData.businessType
      }

      const response = await fetch('/api/auth/phone/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        if (mode === 'login') {
          // For login, redirect to email login with pre-filled email
          router.push(`/auth/login?email=${encodeURIComponent(data.user.email)}&phone_verified=true`)
        } else {
          // For signup, redirect to dashboard
          router.push('/dashboard?welcome=true')
        }
      } else {
        setError(data.error || 'Invalid verification code')
      }
    } catch (error) {
      setError('Failed to verify code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {!isCodeSent ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                placeholder="(555) 123-4567"
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                maxLength={14}
              />
            </div>
          </div>

          <button
            onClick={handleSendCode}
            disabled={loading || !phoneNumber || phoneNumber.replace(/\D/g, '').length !== 10}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Send Verification Code</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-slate-300">
              Verification code sent to {phoneNumber}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Verification Code
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setVerificationCode(value)
                  setError('')
                }}
                placeholder="123456"
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-center tracking-widest"
                maxLength={6}
              />
            </div>
          </div>

          <button
            onClick={handleVerifyCode}
            disabled={loading || !verificationCode || verificationCode.length !== 6}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Verify & Continue</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-slate-400">
                Resend code in {countdown}s
              </p>
            ) : (
              <button
                onClick={() => {
                  setIsCodeSent(false)
                  setVerificationCode('')
                }}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Change phone number
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
