'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { useRouter, useSearchParams } from 'next/navigation'
import { businessCategories } from '@/lib/business-types'
import Image from 'next/image'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Building2, 
  Smartphone, 
  Chrome, 
  Github, 
  ArrowRight, 
  Sparkles,
  CheckCircle
} from 'lucide-react'
import PhoneAuthForm from './PhoneAuthForm'

export default function SignupFormRedesigned() {
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
    role: 'business_owner',
    industry: 'professional-services',
    businessType: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [invitationData, setInvitationData] = useState<{
    agencyName: string
    role: string
    valid: boolean
  } | null>(null)
  const [invitationLoading, setInvitationLoading] = useState(false)
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signUp, signInWithGoogle, signInWithGithub } = useAuth()
  const router = useRouter()

  // Check for invitation on component mount
  useEffect(() => {
    const invitationToken = searchParams.get('invitation')
    const agencyName = searchParams.get('agency')
    
    if (invitationToken) {
      validateInvitation(invitationToken, agencyName)
    }
  }, [searchParams])

  const validateInvitation = async (token: string, agencyName: string | null) => {
    setInvitationLoading(true)
    try {
      const response = await fetch('/api/auth/validate-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, agencyName })
      })
      
      const data = await response.json()
      
      if (data.success && data.invitation) {
        setInvitationData({
          agencyName: data.invitation.agencyName || agencyName || 'Unknown Agency',
          role: data.invitation.role,
          valid: true
        })

        // Pre-fill form with agency role
        setFormData(prev => ({
          ...prev,
          role: 'agency'
        }))
      } else {
        setError('Invalid or expired invitation. Please contact the agency administrator.')
      }
    } catch (error) {
      console.error('Error validating invitation:', error)
      setError('Failed to validate invitation. Please try again.')
    } finally {
      setInvitationLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.fullName,
      formData.companyName,
      formData.role,
      formData.industry,
      formData.businessType
    )
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // If this is an invitation signup, activate the membership
      const invitationToken = searchParams.get('invitation')
      if (invitationToken && invitationData?.valid) {
        try {
          // Get the newly created user
          const response = await fetch('/api/auth/activate-invitation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: invitationToken })
          })
          
          if (response.ok) {
            router.push('/dashboard?welcome=agency')
          } else {
            router.push('/auth/verify-email')
          }
        } catch (inviteError) {
          console.error('Error processing invitation:', inviteError)
          router.push('/auth/verify-email')
        }
      } else {
        router.push('/auth/verify-email')
      }
    }
    
    setLoading(false)
  }

  const handleGoogleSignUp = async () => {
    setLoading(true)
    setError('')
    
    const { error } = await signInWithGoogle()
    
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleGithubSignUp = async () => {
    setLoading(true)
    setError('')
    
    const { error } = await signInWithGithub()
    
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-red-800/10 via-transparent to-transparent" />
      
      <div className="relative z-10 w-full max-w-lg mx-4">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 rounded-2xl shadow-2xl shadow-red-900/20">
          <div className="p-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
                  <Image 
                    src="/tabletalk-radar-logo.png" 
                    alt="TableTalk Radar" 
                    width={200} 
                    height={60} 
                    className="relative h-12 w-auto mx-auto"
                  />
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {invitationData ? 'Join Your Team' : 'Create Your Account'}
                </h1>
                <p className="text-slate-400">
                  {invitationData 
                    ? `You've been invited to join ${invitationData.agencyName}`
                    : 'Join TableTalk Radar for AI-powered business intelligence'
                  }
                </p>
              </div>
            </div>

            {/* Invitation Banner */}
            {invitationLoading && (
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <div className="text-center text-slate-300">Validating invitation...</div>
              </div>
            )}

            {invitationData && (
              <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/30 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-8 w-8 text-red-400" />
                  <div>
                    <h3 className="text-white font-semibold">Team Invitation</h3>
                    <p className="text-sm text-slate-300">
                      Join <span className="font-medium">{invitationData.agencyName}</span> as{' '}
                      <span className="font-medium capitalize">
                        {invitationData.role === 'client_manager' ? 'Client Manager' : invitationData.role}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Auth Method Tabs */}
            {!invitationData && (
              <div className="flex bg-slate-800/50 rounded-lg p-1">
                <button
                  onClick={() => setAuthMethod('email')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    authMethod === 'email' 
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mail className="inline h-4 w-4 mr-2" />
                  Email
                </button>
                <button
                  onClick={() => setAuthMethod('phone')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    authMethod === 'phone' 
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="inline h-4 w-4 mr-2" />
                  Phone
                </button>
              </div>
            )}

            {/* Form Content */}
            {authMethod === 'email' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-slate-300 mb-2">
                      Company Name
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        id="companyName"
                        name="companyName"
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder="Enter your company name"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-2">
                      Account Type
                    </label>
                    <select
                      id="role"
                      name="role"
                      required
                      value={formData.role}
                      onChange={handleChange}
                      disabled={!!invitationData}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:opacity-50"
                    >
                      <option value="business_owner">Business Owner</option>
                      <option value="agency">Marketing Agency</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-slate-300 mb-2">
                      Industry
                    </label>
                    <select
                      id="industry"
                      name="industry"
                      required
                      value={formData.industry}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    >
                      {Object.entries(businessCategories).map(([key, config]) => (
                        <option key={key} value={key}>{config.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="businessType" className="block text-sm font-medium text-slate-300 mb-2">
                      Business Type
                    </label>
                    <select
                      id="businessType"
                      name="businessType"
                      required
                      value={formData.businessType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select Business Type</option>
                      {businessCategories[formData.industry as keyof typeof businessCategories]?.categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder="Create password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <PhoneAuthForm mode="signup" formData={formData} />
            )}

            {/* Social Signup */}
            {!invitationData && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-slate-900/80 text-slate-400">Or sign up with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleGoogleSignUp}
                    disabled={loading}
                    className="flex items-center justify-center space-x-2 py-3 px-4 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all duration-200 disabled:opacity-50"
                  >
                    <Chrome className="h-5 w-5" />
                    <span className="text-sm font-medium">Google</span>
                  </button>

                  <button
                    onClick={handleGithubSignUp}
                    disabled={loading}
                    className="flex items-center justify-center space-x-2 py-3 px-4 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all duration-200 disabled:opacity-50"
                  >
                    <Github className="h-5 w-5" />
                    <span className="text-sm font-medium">GitHub</span>
                  </button>
                </div>
              </>
            )}

            {/* Sign in link */}
            <div className="text-center">
              <p className="text-slate-400">
                Already have an account?{' '}
                <a href="/auth/login" className="text-red-400 hover:text-red-300 font-medium transition-colors">
                  Sign in
                </a>
              </p>
            </div>

            {/* Features */}
            <div className="border-t border-slate-800 pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <Sparkles className="h-5 w-5 text-red-400 mx-auto" />
                  <p className="text-xs text-slate-400">AI Insights</p>
                </div>
                <div className="space-y-1">
                  <CheckCircle className="h-5 w-5 text-red-400 mx-auto" />
                  <p className="text-xs text-slate-400">Real-time Data</p>
                </div>
                <div className="space-y-1">
                  <div className="h-5 w-5 bg-red-400 rounded mx-auto" />
                  <p className="text-xs text-slate-400">Smart Analytics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
