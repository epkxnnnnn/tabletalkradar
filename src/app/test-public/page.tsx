export default function TestPublic() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">TableTalk Radar is Live! 🚀</h1>
        <p className="text-xl mb-8">Your GMB management platform is working!</p>
        <div className="space-y-2">
          <p>✅ Build successful</p>
          <p>✅ Deployment successful</p>
          <p>✅ App is running</p>
        </div>
        <a 
          href="/auth/login"
          className="mt-8 inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
        >
          Go to Login
        </a>
      </div>
    </div>
  )
}