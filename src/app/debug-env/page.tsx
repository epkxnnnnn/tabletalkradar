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
          <strong>Node ENV:</strong> {process.env.NODE_ENV}
        </div>
        <div className="pt-4">
          <strong>Full URL (first 50 chars):</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50)}...
        </div>
      </div>
    </div>
  )
}