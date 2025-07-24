'use client'

import React, { useState } from 'react'
import { useAgency } from '../../providers/AgencyProvider'
import { useAuth } from '../../providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { CreateAgencyInput, SubscriptionPlan, Agency } from '@/lib/types/agency'

interface AgencyCreationProps {
  onAgencyCreated?: (agency: Agency) => void
  onCancel?: () => void
}

export default function AgencyCreation({ onAgencyCreated, onCancel }: AgencyCreationProps) {
  const { createAgency, refreshAgencyData } = useAgency()
  const { user } = useAuth()
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateAgencyInput>({
    name: '',
    contact_email: user?.email || '',
    contact_phone: '',
    website: '',
    industry: '',
    subscription_plan: 'starter'
  })

  const subscriptionPlans = [
    {
      value: 'starter' as SubscriptionPlan,
      name: 'Starter Plan',
      price: '$97/month',
      features: ['Up to 5 clients', 'Basic analytics', 'Email support', 'Monthly reports'],
      maxClients: 5,
      maxTeamMembers: 2
    },
    {
      value: 'professional' as SubscriptionPlan,
      name: 'Professional Plan',
      price: '$297/month',
      features: ['Up to 20 clients', 'Advanced analytics', 'Priority support', 'Weekly reports', 'Team collaboration'],
      maxClients: 20,
      maxTeamMembers: 5,
      popular: true
    },
    {
      value: 'enterprise' as SubscriptionPlan,
      name: 'Enterprise Plan',
      price: '$597/month',
      features: ['Unlimited clients', 'AI-powered insights', '24/7 support', 'Custom reports', 'Advanced automation'],
      maxClients: -1,
      maxTeamMembers: 15
    }
  ]

  const industries = [
    'Digital Marketing Agency', 'SEO Agency', 'Web Development', 'Consulting', 
    'Real Estate Services', 'Healthcare Marketing', 'Legal Services', 
    'Financial Services', 'E-commerce', 'SaaS/Technology', 'Other'
  ]

  const handleInputChange = (field: keyof CreateAgencyInput, value: string | SubscriptionPlan) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.name && formData.contact_email)
      case 2:
        return !!formData.subscription_plan
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 3))
    }
  }

  const handlePrev = () => {
    setStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Create the agency
      const agency = await createAgency({
        name: formData.name,
        contact_email: formData.contact_email
      })

      // Update agency settings and subscription
      await supabase
        .from('agencies')
        .update({
          subscription_plan: formData.subscription_plan,
          contact_phone: formData.contact_phone,
          website: formData.website,
          settings: {
            industry: formData.industry,
            auto_assign_clients: true,
            default_audit_frequency: 'monthly',
            enable_ai_insights: formData.subscription_plan !== 'starter',
            enable_predictive_analytics: formData.subscription_plan === 'enterprise'
          },
          branding: {
            company_name: formData.name,
            support_email: formData.contact_email
          }
        })
        .eq('id', agency.id)

      // Set limits based on subscription plan
      const selectedPlan = subscriptionPlans.find(p => p.value === formData.subscription_plan)
      if (selectedPlan) {
        await supabase
          .from('agencies')
          .update({
            max_clients: selectedPlan.maxClients === -1 ? 1000 : selectedPlan.maxClients,
            max_team_members: selectedPlan.maxTeamMembers,
            max_monthly_audits: formData.subscription_plan === 'starter' ? 50 : 
                               formData.subscription_plan === 'professional' ? 200 : 1000
          })
          .eq('id', agency.id)
      }

      // Refresh agency data to load the new agency
      await refreshAgencyData()

      onAgencyCreated?.(agency)

    } catch (error) {
      console.error('Error creating agency:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Create Your Agency</h3>
              <p className="text-slate-400 mb-6">Let&apos;s get your agency set up to manage multiple clients with AI-powered insights.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Agency Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Digital Marketing Pro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="you@agency.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="https://agency.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Agency Type
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select your agency type</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Choose Your Plan</h3>
              <p className="text-slate-400 mb-6">Select the plan that best fits your agency&apos;s needs. You can upgrade anytime.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionPlans.map(plan => (
                <div
                  key={plan.value}
                  onClick={() => handleInputChange('subscription_plan', plan.value)}
                  className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.subscription_plan === plan.value
                      ? 'border-red-500 bg-red-900/20'
                      : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-red-600 text-white px-3 py-1 text-xs font-medium rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-white mb-2">{plan.name}</h4>
                    <div className="text-3xl font-bold text-red-400 mb-4">{plan.price}</div>
                    
                    <ul className="space-y-2 text-sm text-slate-300 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <span className="text-green-400 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className={`w-6 h-6 mx-auto rounded-full border-2 flex items-center justify-center ${
                      formData.subscription_plan === plan.value
                        ? 'bg-red-500 border-red-500'
                        : 'border-slate-500'
                    }`}>
                      {formData.subscription_plan === plan.value && (
                        <span className="text-white text-sm">●</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Review & Confirm</h3>
              <p className="text-slate-400 mb-6">Please review your agency details before creating your account.</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Agency Name:</span>
                  <span className="text-white ml-2 font-medium">{formData.name}</span>
                </div>
                <div>
                  <span className="text-slate-400">Contact Email:</span>
                  <span className="text-white ml-2">{formData.contact_email}</span>
                </div>
                <div>
                  <span className="text-slate-400">Phone:</span>
                  <span className="text-white ml-2">{formData.contact_phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Website:</span>
                  <span className="text-white ml-2">{formData.website || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Agency Type:</span>
                  <span className="text-white ml-2">{formData.industry || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Subscription:</span>
                  <span className="text-white ml-2 capitalize font-medium">{formData.subscription_plan} Plan</span>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4 mt-4">
                <div className="bg-slate-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">What&apos;s Next?</h4>
                  <ul className="text-sm text-slate-300 space-y-1">
                    <li>• Your agency will be created with owner permissions</li>
                    <li>• You can start adding clients immediately</li>
                    <li>• Invite team members to collaborate</li>
                    <li>• Access AI-powered insights and automation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-16 h-1 mx-4 ${
                    step > stepNum ? 'bg-red-600' : 'bg-slate-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-slate-400 mt-2 max-w-md mx-auto">
            <span>Details</span>
            <span>Plan</span>
            <span>Review</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-slate-800 rounded-lg p-8 mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <div>
            {step > 1 ? (
              <button
                onClick={handlePrev}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Previous
              </button>
            ) : onCancel && (
              <button
                onClick={onCancel}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Back to Dashboard
              </button>
            )}
          </div>
          
          <div className="flex space-x-4">
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={!validateStep(step)}
                className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                  validateStep(step)
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating Agency...' : 'Create Agency'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}