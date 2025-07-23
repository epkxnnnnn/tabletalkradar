'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth?error=oauth_callback_failed')
          return
        }

        if (data.session) {
          // Check if user has a profile, create one if not
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create one
            const userData = data.session.user
            await supabase.from('profiles').insert({
              id: userData.id,
              full_name: userData.user_metadata.full_name || userData.user_metadata.name,
              email: userData.email,
              avatar_url: userData.user_metadata.avatar_url,
              role: 'agency', // Default role for OAuth users
            })
          }

          // Redirect to dashboard
          router.push('/dashboard')
        } else {
          router.push('/auth')
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error)
        router.push('/auth?error=unexpected_error')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        <p className="text-white mt-4">Completing sign in...</p>
      </div>
    </div>
  )
}