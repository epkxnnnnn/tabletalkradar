import Link from 'next/link'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-brand-primary mb-4">
          TableTalk Radar - Test Page
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Deployment Status</h2>
          <p className="text-green-600 font-medium">✅ If you can see this, the deployment is working!</p>
          <p className="text-gray-600 mt-2">Build time: {new Date().toISOString()}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <div className="space-y-2">
            <Link href="/" className="block text-blue-600 hover:underline">→ Go to Main App</Link>
            <a href="/api/debug" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">→ Check Debug Info</a>
            <a href="/api/health" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">→ Check API Health</a>
            <a href="/api/test" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">→ Check Environment Variables</a>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 mb-2">Troubleshooting Steps:</h3>
          <ol className="list-decimal list-inside space-y-1 text-yellow-700">
            <li>Check browser console for errors (F12)</li>
            <li>Visit /api/debug to see missing environment variables</li>
            <li>Ensure all environment variables are added in Vercel</li>
            <li>Check Vercel deployment logs for build errors</li>
          </ol>
        </div>
      </div>
    </div>
  )
}