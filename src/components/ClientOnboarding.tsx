'use client'

import React, { useState } from 'react'
import { useAgency } from './AgencyProvider'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import { CreateClientInput, ClientTier } from '@/lib/types/agency'

interface ClientOnboardingProps {
  onClientCreated?: (client: any) => void
  onClose?: () => void
}

export default function ClientOnboarding({ onClientCreated, onClose }: ClientOnboardingProps) {
  const { currentAgency, permissions, membership } = useAgency()
  const { user } = useAuth()
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateClientInput>({
    business_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    industry: '',
    location: '',
    client_tier: 'standard',
    services_enabled: [],
    assign_to: []
  })

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Retail', 'Real Estate', 'Restaurants',
    'Professional Services', 'Manufacturing', 'Education', 'Non-Profit',
    'E-commerce', 'Construction', 'Automotive', 'Travel', 'Entertainment', 'Other'
  ]

  const availableServices = [
    { id: 'seo', name: 'SEO Optimization', description: 'Search engine optimization and ranking' },
    { id: 'reputation', name: 'Reputation Management', description: 'Online review and reputation monitoring' },
    { id: 'social_media', name: 'Social Media Management', description: 'Social media presence and engagement' },
    { id: 'website_audit', name: 'Website Performance', description: 'Website speed and technical analysis' },
    { id: 'competitor_analysis', name: 'Competitor Intelligence', description: 'Market and competitor monitoring' },
    { id: 'local_seo', name: 'Local SEO', description: 'Local search optimization' },
    { id: 'content_marketing', name: 'Content Strategy', description: 'Content planning and optimization' },
    { id: 'paid_advertising', name: 'Ad Performance', description: 'Paid advertising campaign monitoring' }
  ]

  const clientTiers: { value: ClientTier; name: string; description: string; monthlyFee: string }[] = [
    { value: 'basic', name: 'Basic', description: 'Essential monitoring and reporting', monthlyFee: '$297' },
    { value: 'standard', name: 'Standard', description: 'Full-service management and optimization', monthlyFee: '$497' },
    { value: 'premium', name: 'Premium', description: 'Advanced analytics and automation', monthlyFee: '$797' },
    { value: 'enterprise', name: 'Enterprise', description: 'Custom solutions and dedicated support', monthlyFee: 'Custom' }
  ]

  const handleInputChange = (field: keyof CreateClientInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services_enabled: prev.services_enabled.includes(serviceId)
        ? prev.services_enabled.filter(id => id !== serviceId)
        : [...prev.services_enabled, serviceId]
    }))
  }

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.business_name && formData.contact_email && formData.industry)
      case 2:
        return formData.services_enabled.length > 0
      case 3:
        return !!formData.client_tier
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 4))
    }
  }

  const handlePrev = () => {
    setStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!currentAgency || !user || !permissions?.can_create_clients) {
      return
    }

    setLoading(true)
    try {
      // Create the client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          agency_id: currentAgency.id,
          business_name: formData.business_name,
          contact_name: formData.contact_name,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          website: formData.website?.startsWith('http') ? formData.website : `https://${formData.website}`,
          industry: formData.industry,
          location: formData.location,
          client_tier: formData.client_tier,
          services_enabled: formData.services_enabled,
          status: 'active',
          health_score: 50, // Starting neutral score
          priority_level: 'medium',
          audit_frequency: 'monthly'
        })
        .select()
        .single()

      if (clientError) {
        throw new Error('Failed to create client')
      }

      // Create client assignment for the current user
      if (formData.assign_to && formData.assign_to.length > 0) {
        const assignments = formData.assign_to.map(userId => ({
          client_id: client.id,
          user_id: userId,
          agency_id: currentAgency.id,
          role: userId === user.id ? 'primary' : 'assigned',
          assigned_by: user.id
        }))

        const { error: assignmentError } = await supabase
          .from('client_assignments')
          .insert(assignments)

        if (assignmentError) {
          console.error('Error creating client assignments:', assignmentError)
        }
      } else {
        // Auto-assign to current user
        await supabase
          .from('client_assignments')
          .insert({
            client_id: client.id,
            user_id: user.id,
            agency_id: currentAgency.id,
            role: 'primary',
            assigned_by: user.id
          })
      }

      // Trigger welcome communication
      await supabase
        .from('client_communications')
        .insert({
          agency_id: currentAgency.id,
          client_id: client.id,
          communication_type: 'email',
          subject: `Welcome to ${currentAgency.name} - Let's Get Started!`,
          content: `Welcome ${formData.contact_name || formData.business_name}! We're excited to help you grow your business with our ${formData.services_enabled.join(', ')} services.`,
          sent_by: user.id,
          recipients: [formData.contact_email],
          status: 'draft',
          auto_generated: true
        })

      onClientCreated?.(client)
      onClose?.()

    } catch (error) {
      console.error('Error creating client:', error)
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
              <h3 className="text-lg font-semibold text-white mb-4">Client Information</h3>
              <p className="text-slate-400 text-sm mb-6">Tell us about your new client to get started.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => handleInputChange('business_name', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Acme Corporation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => handleInputChange('contact_name', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="John Smith"
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
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="john@acme.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="acme.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Industry *
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select Industry</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="New York, NY"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Services & Monitoring</h3>
              <p className="text-slate-400 text-sm mb-6">Select the services you'll be providing for this client.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableServices.map(service => (
                <div
                  key={service.id}
                  onClick={() => handleServiceToggle(service.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.services_enabled.includes(service.id)
                      ? 'border-red-500 bg-red-900/20'
                      : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">{service.name}</h4>
                      <p className="text-sm text-slate-400 mt-1">{service.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      formData.services_enabled.includes(service.id)
                        ? 'bg-red-500 border-red-500'
                        : 'border-slate-500'
                    }`}>
                      {formData.services_enabled.includes(service.id) && (
                        <span className="text-white text-sm">✓</span>
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
              <h3 className="text-lg font-semibold text-white mb-4">Client Tier & Pricing</h3>
              <p className="text-slate-400 text-sm mb-6">Choose the service tier that best fits this client's needs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientTiers.map(tier => (
                <div
                  key={tier.value}
                  onClick={() => handleInputChange('client_tier', tier.value)}
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.client_tier === tier.value
                      ? 'border-red-500 bg-red-900/20'
                      : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white">{tier.name}</h4>
                    <span className="text-xl font-bold text-red-400">{tier.monthlyFee}</span>
                  </div>
                  <p className="text-slate-400 text-sm">{tier.description}</p>
                  <div className={`mt-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.client_tier === tier.value
                      ? 'bg-red-500 border-red-500'
                      : 'border-slate-500'
                  }`}>
                    {formData.client_tier === tier.value && (
                      <span className="text-white text-sm">●</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Review & Confirm</h3>
              <p className="text-slate-400 text-sm mb-6">Please review all information before creating the client.</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Business Name:</span>
                  <span className="text-white ml-2">{formData.business_name}</span>
                </div>
                <div>
                  <span className="text-slate-400">Contact:</span>
                  <span className="text-white ml-2">{formData.contact_name || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Email:</span>
                  <span className="text-white ml-2">{formData.contact_email}</span>
                </div>
                <div>
                  <span className="text-slate-400">Industry:</span>
                  <span className="text-white ml-2">{formData.industry}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-slate-400">Services:</span>
                  <span className="text-white ml-2">
                    {formData.services_enabled
                      .map(id => availableServices.find(s => s.id === id)?.name)
                      .join(', ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Tier:</span>
                  <span className="text-white ml-2 capitalize">{formData.client_tier}</span>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!permissions?.can_create_clients) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <div className="text-slate-400 mb-4">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No Permission</h3>
        <p className="text-slate-400">You don't have permission to create clients. Contact your agency administrator.</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-900 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-24 h-1 mx-4 ${
                    step > stepNum ? 'bg-red-600' : 'bg-slate-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-slate-400 mt-2">
            <span>Client Info</span>
            <span>Services</span>
            <span>Pricing</span>
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
            {step > 1 && (
              <button
                onClick={handlePrev}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Previous
              </button>
            )}
          </div>
          
          <div className="flex space-x-4">
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            )}
            
            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={!validateStep(step)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  validateStep(step)
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating Client...' : 'Create Client'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}