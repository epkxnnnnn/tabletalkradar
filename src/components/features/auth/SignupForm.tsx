'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { useRouter, useSearchParams } from 'next/navigation'
import { businessCategories } from '@/lib/business-types'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

export default function SignupForm() {
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
      const { data: invitation, error } = await supabase
        .from('agency_memberships')
        .select(`
          *,
          agency:agencies(name)
        `)
        .eq('invitation_token', token)
        .eq('status', 'invited')
        .gt('invitation_expires_at', new Date().toISOString())
        .single()

      if (error || !invitation) {
        setError('Invalid or expired invitation. Please contact the agency administrator.')
        return
      }

      setInvitationData({
        agencyName: invitation.agency?.name || agencyName || 'Unknown Agency',
        role: invitation.role,
        valid: true
      })

      // Pre-fill form with agency role
      setFormData(prev => ({
        ...prev,
        role: 'agency'
      }))

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
    } else {
      // If this is an invitation signup, activate the membership
      const invitationToken = searchParams.get('invitation')
      if (invitationToken && invitationData?.valid) {
        try {
          // Get the newly created user
          const { data: user } = await supabase.auth.getUser()
          
          if (user.user) {
            // Update the invitation to link it to the new user and activate it
            await supabase
              .from('agency_memberships')
              .update({
                user_id: user.user.id,
                status: 'active',
                joined_at: new Date().toISOString()
              })
              .eq('invitation_token', invitationToken)

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
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <div className="flex justify-center mb-6">
            <Image src="/tabletalk-radar-logo.png" alt="TableTalk Radar" width={250} height={75} className="h-16 w-auto" />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-white">
            {invitationData ? 'Join Your Team' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            {invitationData 
              ? `You've been invited to join ${invitationData.agencyName}`
              : 'Join TableTalk Radar for AI-powered business intelligence'
            }
          </p>
        </div>

        {invitationLoading && (
          <div className="bg-slate-800 p-4 rounded-md">
            <div className="text-center text-slate-300">Validating invitation...</div>
          </div>
        )}

        {invitationData && (
          <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/30 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🎉</div>
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

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-300">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-600 placeholder-slate-400 text-white bg-slate-700 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-600 placeholder-slate-400 text-white bg-slate-700 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-slate-300">
                Company Name
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-600 placeholder-slate-400 text-white bg-slate-700 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Enter your company name"
                value={formData.companyName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-300">
                Account Type
              </label>
              <select
                id="role"
                name="role"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-600 placeholder-slate-400 text-white bg-slate-700 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="business_owner">Business Owner</option>
                <option value="agency">Marketing Agency</option>
              </select>
            </div>

            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-slate-300">
                Industry
              </label>
              <select
                id="industry"
                name="industry"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-600 placeholder-slate-400 text-white bg-slate-700 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                value={formData.industry}
                onChange={(e) => {
                  const industry = e.target.value
                  setFormData({
                    ...formData,
                    industry,
                    businessType: '' // Reset business type when industry changes
                  })
                }}
              >
                {Object.entries(businessCategories).map(([key, config]) => (
                  <option key={key} value={key}>{config.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-slate-300">
                Business Type
              </label>
              <select
                id="businessType"
                name="businessType"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-600 placeholder-slate-400 text-white bg-slate-700 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                value={formData.businessType}
                onChange={handleChange}
              >
                <option value="">Select Business Type</option>
                {businessCategories[formData.industry as keyof typeof businessCategories]?.categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-600 placeholder-slate-400 text-white bg-slate-700 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-slate-600 placeholder-slate-400 text-white bg-slate-700 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          {!invitationData && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-900 text-slate-400">Or sign up with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={loading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-slate-600 rounded-md shadow-sm bg-slate-700 text-sm font-medium text-slate-200 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="ml-2">Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleGithubSignUp}
                  disabled={loading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-slate-600 rounded-md shadow-sm bg-slate-700 text-sm font-medium text-slate-200 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-2">GitHub</span>
                </button>
              </div>
            </div>
          )}

          <div className="text-center">
            <div className="text-sm">
              <a href="/auth/login" className="font-medium text-red-400 hover:text-red-300">
                Already have an account? Sign in
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 