import { Suspense } from 'react'
import LoginFormRedesigned from '@/components/features/auth/LoginFormRedesigned'

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginFormRedesigned />
    </Suspense>
  )
}
