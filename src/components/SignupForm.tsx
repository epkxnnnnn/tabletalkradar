'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
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
  const { signUp } = useAuth()
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="TableTalk Radar" width={200} height={50} className="h-12 w-auto" />
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