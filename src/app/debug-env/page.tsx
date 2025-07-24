export default function DebugEnv() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Environment Debug</h1>
      <div className="space-y-4">
        <div>
          <strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set ✓' : 'Missing ✗'}
        </div>
        <div>
          <strong>Supabase Anon Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set ✓' : 'Missing ✗'}
        </div>
        <div>
          <strong>Service Role Key:</strong> {process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set ✓' : 'Missing ✗'}
        </div>
        <div>
          <strong>Node ENV:</strong> {process.env.NODE_ENV}
        </div>
        <div className="pt-4">
          <strong>Full URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}
        </div>
        <div className="pt-4">
          <strong>Anon Key (first 50 chars):</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50)}...
        </div>
        <div className="pt-4">
          <strong>Service Key (first 50 chars):</strong> {process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 50) + '...' : 'Not Set'}
        </div>
      </div>
    </div>
  )
}