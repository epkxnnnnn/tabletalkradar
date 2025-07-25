'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase-client';
import { User } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Mail, Lock, Eye, EyeOff, Smartphone, Chrome, Github, ArrowRight, Sparkles } from 'lucide-react'

const PhoneAuthForm = dynamic(() => import('./PhoneAuthForm'), { ssr: false })

export default function LoginFormRedesigned() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<null | User>(null)

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: string, session: { user: User | null } | null) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          router.push('/dashboard')
        }
      }
    )

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user)
        router.push('/dashboard')
      }
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [router])

  // Pre-fill email from URL params
  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data?.session) {
      // Handle successful login
      setLoading(false);
      router.push('/dashboard');
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  const handleGithubSignIn = async () => {
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-red-800/10 via-transparent to-transparent" />
      
      <div className="relative z-10 w-full max-w-md mx-4">
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
                  Welcome Back
                </h1>
                <p className="text-slate-400">
                  Access your AI-powered business intelligence
                </p>
              </div>
            </div>

            {/* Auth Method Tabs */}
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

            {/* Form Content */}
            {authMethod === 'email' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

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
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder="Enter your password"
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
                </div>

                {error && (
                  <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <a href="/auth/forgot-password" className="text-sm text-red-400 hover:text-red-300 transition-colors">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <PhoneAuthForm mode="login" />
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-slate-900/80 text-slate-400">Or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex items-center justify-center space-x-2 py-3 px-4 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all duration-200 disabled:opacity-50"
              >
                <Chrome className="h-5 w-5" />
                <span className="text-sm font-medium">Google</span>
              </button>

              <button
                onClick={handleGithubSignIn}
                disabled={loading}
                className="flex items-center justify-center space-x-2 py-3 px-4 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all duration-200 disabled:opacity-50"
              >
                <Github className="h-5 w-5" />
                <span className="text-sm font-medium">GitHub</span>
              </button>
            </div>

            {/* Sign up link */}
            <div className="text-center">
              <p className="text-slate-400">
                Don&apos;t have an account?{' '}
                <a href="/auth/signup" className="text-red-400 hover:text-red-300 font-medium transition-colors">
                  Sign up now
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
                  <div className="h-5 w-5 bg-red-400 rounded mx-auto" />
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
