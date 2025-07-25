'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { supabase } from '@/lib/supabase'

interface Client {
  id: string
  business_name: string
  category: string
  industry: string
  business_type: string | null
  target_market: string | null
}

export default function BusinessAuditAnalyzer() {
  const { user } = useAuth()
  const [auditData, setAuditData] = useState({
    business_name: '',
    website: '',
    address: '',
    phone: '',
    category: ''
  })
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    if (user) {
      loadUserProfile()
      loadClients()
    }
  }, [user])

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (!error && data) {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, business_name, category, industry, business_type, target_market')
        .eq('user_id', user?.id)

      if (!error && data) {
        setClients(data)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setAuditData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResults(null)

    try {
      const response = await fetch('/api/audit/run-safe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...auditData,
          client_id: selectedClient || null
        }),
      })

      if (!response.ok) {
        throw new Error('Audit failed')
      }

      const data = await response.json()
      setResults(data)

      // Save audit to database
      await saveAuditToDatabase(data)

    } catch (error) {
      console.error('Error running audit:', error)
      setResults({ error: 'Failed to run audit. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const saveAuditToDatabase = async (auditResults: any) => {
    try {
      const response = await fetch('/api/audit/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_name: auditData.business_name,
          website: auditData.website,
          category: auditData.category,
          overall_score: auditResults.overall_score || 0,
          audit_data: auditResults,
          client_id: selectedClient || null
        }),
      })

      if (!response.ok) {
        console.error('Failed to save audit to database')
      }
    } catch (error) {
      console.error('Error saving audit:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white font-bold text-2xl mb-2">BusinessScope AI</h1>
            <p className="text-slate-300">5-AI Universal Business Intelligence That Never Sleeps</p>
          </div>
        </div>

        {/* Client Selection for Agencies */}
        {userProfile?.role === 'agency' && clients.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-slate-200">Select Client</label>
            <select 
              className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              <option value="">Select a client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.business_name} ({client.category})
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-200">Business Name</label>
              <input
                type="text"
                value={auditData.business_name}
                onChange={(e) => handleInputChange('business_name', e.target.value)}
                className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter business name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-200">Website</label>
              <input
                type="url"
                value={auditData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-200">Address</label>
              <input
                type="text"
                value={auditData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter business address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-200">Phone</label>
              <input
                type="tel"
                value={auditData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-200">Business Category</label>
              <select 
                className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                value={auditData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                <option value="">Select Business Type</option>
                <optgroup label="Professional Services">
                  <option value="law-firm">Law Firm</option>
                  <option value="accounting">Accounting Firm</option>
                  <option value="consulting">Consulting Firm</option>
                  <option value="marketing">Marketing Agency</option>
                  <option value="real-estate">Real Estate Agency</option>
                  <option value="insurance">Insurance Agency</option>
                  <option value="web-design">Web Design Company</option>
                  <option value="photography">Photography Studio</option>
                  <option value="event-planning">Event Planning</option>
                </optgroup>
                <optgroup label="Food & Hospitality">
                  <option value="restaurant">Restaurant</option>
                  <option value="cafe">Cafe</option>
                  <option value="bakery">Bakery</option>
                  <option value="food-truck">Food Truck</option>
                  <option value="catering">Catering Service</option>
                  <option value="hotel">Hotel</option>
                  <option value="bar">Bar & Nightlife</option>
                </optgroup>
                <optgroup label="Healthcare & Wellness">
                  <option value="medical">Medical Practice</option>
                  <option value="dental">Dental Office</option>
                  <option value="spa">Spa & Wellness</option>
                  <option value="fitness">Fitness Center</option>
                  <option value="massage">Massage Therapy</option>
                  <option value="chiropractic">Physical Therapy</option>
                  <option value="veterinary">Veterinary Services</option>
                </optgroup>
                <optgroup label="Technology">
                  <option value="software">Software Company</option>
                  <option value="saas">SaaS Platform</option>
                  <option value="mobile-app">Mobile App</option>
                  <option value="web-development">Web Development</option>
                  <option value="cybersecurity">Cybersecurity</option>
                  <option value="cloud-services">Cloud Services</option>
                </optgroup>
                <optgroup label="Retail & E-commerce">
                  <option value="online-store">Online Store</option>
                  <option value="physical-retail">Physical Retail</option>
                  <option value="fashion">Fashion</option>
                  <option value="electronics">Electronics</option>
                  <option value="home-garden">Home & Garden</option>
                  <option value="beauty">Beauty & Personal Care</option>
                  <option value="automotive">Automotive</option>
                </optgroup>
                <optgroup label="Manufacturing">
                  <option value="consumer-goods">Consumer Goods</option>
                  <option value="industrial-equipment">Industrial Equipment</option>
                  <option value="food-processing">Food Processing</option>
                  <option value="textiles">Textiles</option>
                  <option value="pharmaceutical">Pharmaceutical</option>
                </optgroup>
                <optgroup label="Education">
                  <option value="school">School</option>
                  <option value="university">University</option>
                  <option value="online-learning">Online Learning</option>
                  <option value="vocational-training">Vocational Training</option>
                  <option value="tutoring">Tutoring Services</option>
                  <option value="corporate-training">Corporate Training</option>
                </optgroup>
                <optgroup label="Financial Services">
                  <option value="banking">Banking</option>
                  <option value="investment">Investment Firm</option>
                  <option value="insurance-company">Insurance Company</option>
                  <option value="accounting-firm">Accounting Firm</option>
                  <option value="wealth-management">Wealth Management</option>
                </optgroup>
                <optgroup label="Non-Profit">
                  <option value="charity">Charity Organization</option>
                  <option value="foundation">Foundation</option>
                  <option value="religious">Religious Organization</option>
                  <option value="community-service">Community Service</option>
                  <option value="advocacy">Advocacy Group</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="startup">Startup</option>
                  <option value="family-business">Family Business</option>
                  <option value="cooperative">Cooperative</option>
                  <option value="social-enterprise">Social Enterprise</option>
                  <option value="government">Government Agency</option>
                  <option value="other">Other</option>
                </optgroup>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Running 5-AI Analysis...' : 'Run Business Audit'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-slate-700 rounded-lg">
          <h3 className="text-white font-semibold mb-3">AI Engine Overview</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span><strong>Perplexity:</strong> Market Research & Competitors</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span><strong>Kimi:</strong> Technical SEO & Performance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-300 rounded-full"></div>
              <span><strong>Claude:</strong> Industry Expertise & Insights</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span><strong>OpenAI:</strong> Customer Sentiment Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span><strong>Gemini:</strong> Google Ecosystem Optimization</span>
            </div>
          </div>
        </div>
      </div>

      {results && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Audit Results</h2>
          
          {results.error ? (
            <div className="text-red-400">{results.error}</div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-700 p-4 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Overall Score</h3>
                  <div className="text-3xl font-bold text-red-400">{results.overall_score}/100</div>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Business Name</h3>
                  <div className="text-slate-300">{results.business_name}</div>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Category</h3>
                  <div className="text-slate-300">{results.category}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-semibold mb-3">Immediate Actions</h3>
                  <ul className="space-y-2">
                    {results.recommendations?.immediate?.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-slate-300">
                        <span className="text-red-400">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-3">Short Term (1-4 weeks)</h3>
                  <ul className="space-y-2">
                    {results.recommendations?.shortTerm?.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-slate-300">
                        <span className="text-blue-400">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-3">Long Term (1-3 months)</h3>
                <ul className="space-y-2">
                  {results.recommendations?.longTerm?.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-slate-300">
                      <span className="text-green-400">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-3">AI Insights</h3>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {Object.entries(results.aiInsights || {}).map(([ai, insight]) => (
                     <div key={ai} className="bg-slate-700 p-3 rounded-lg">
                       <div className="text-red-400 font-medium capitalize">{ai}</div>
                       <div className="text-slate-300 text-sm">{String(insight)}</div>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}