import { Suspense } from 'react'
import SignupFormRedesigned from '@/components/features/auth/SignupFormRedesigned'

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SignupFormRedesigned />
    </Suspense>
  )
}
