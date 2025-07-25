'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SimpleSignup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Test User',
            company_name: 'Test Company',
            role: 'business_owner'
          }
        }
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Check your email for confirmation link!')
        console.log('Signup successful:', data)
      }
    } catch (err: any) {
      setError('Signup failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setError(error.message)
      } else {
        console.log('Login successful:', data)
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError('Login failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Simple Auth Test</h1>
          <p className="text-gray-400">Test Supabase authentication directly</p>
        </div>

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-400 text-sm bg-green-900/20 p-3 rounded-md">
              {success}
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleSignup}
              disabled={loading || !email || !password}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-md font-medium transition-colors"
            >
              {loading ? 'Loading...' : 'Sign Up'}
            </button>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading || !email || !password}
              className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-md font-medium transition-colors"
            >
              {loading ? 'Loading...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-400">
          <p>This bypasses the AuthProvider to test direct Supabase connection</p>
        </div>
      </div>
    </div>
  )
}