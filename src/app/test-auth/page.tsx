'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestAuth() {
  const [status, setStatus] = useState('Initializing...')
  const [envVars, setEnvVars] = useState({
    url: '',
    key: ''
  })

  useEffect(() => {
    // Check environment variables on client side
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    setEnvVars({
      url: url || 'NOT SET',
      key: key ? key.substring(0, 50) + '...' : 'NOT SET'
    })

    // Test Supabase connection
    const testConnection = async () => {
      try {
        setStatus('Testing Supabase connection...')
        
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          setStatus(`Supabase Error: ${error.message}`)
        } else {
          setStatus(`Connection successful! Session: ${data.session ? 'Found' : 'None'}`)
        }
      } catch (err: any) {
        setStatus(`JavaScript Error: ${err.message}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Auth Connection Test</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Status:</strong> {status}
        </div>
        
        <div className="pt-4">
          <strong>Environment Variables (Client-side):</strong>
        </div>
        
        <div className="ml-4">
          <div><strong>URL:</strong> {envVars.url}</div>
          <div><strong>Key:</strong> {envVars.key}</div>
        </div>
      </div>
    </div>
  )
}