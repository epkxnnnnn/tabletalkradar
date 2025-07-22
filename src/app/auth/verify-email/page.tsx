export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Check your email
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            We've sent you a verification link to confirm your email address
          </p>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="text-slate-300 mb-4">
            Please check your email and click the verification link to complete your registration.
          </p>
          <p className="text-slate-400 text-sm">
            If you don't see the email, check your spam folder.
          </p>
        </div>
        <div>
          <a 
            href="/auth/login" 
            className="font-medium text-red-400 hover:text-red-300"
          >
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  )
} 