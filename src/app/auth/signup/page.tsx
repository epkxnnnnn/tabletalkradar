import { Suspense } from 'react'
import SignupForm from '@/components/features/auth/SignupForm'

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
} 