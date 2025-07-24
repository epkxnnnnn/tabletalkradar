'use client'

import { useState } from 'react'

export default function QwenDebugPage() {
  const [error, setError] = useState('')
  const [code, setCode] = useState('')
  const [file, setFile] = useState('')
  const [context, setContext] = useState('')
  const [type, setType] = useState('general')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const debugTypes = [
    { value: 'general', label: 'General Error Analysis' },
    { value: 'auth', label: 'Authentication Issues' },
    { value: 'supabase', label: 'Supabase/Database Issues' },
    { value: 'build', label: 'Build/Compilation Errors' },
    { value: 'typescript', label: 'TypeScript Errors' },
    { value: 'component', label: 'React Component Optimization' }
  ]

  const handleDebug = async () => {
    if (!error.trim()) {
      alert('Please enter an error or issue to debug')
      return
    }

    setLoading(true)
    setResponse('')

    try {
      const res = await fetch('/api/qwen-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          error,
          code: code || undefined,
          file: file || undefined,
          context: context || undefined
        })
      })

      const data = await res.json()

      if (data.success) {
        setResponse(data.solution)
      } else {
        setResponse(`Error: ${data.error}\n\n${data.details || ''}`)
      }
    } catch (err: any) {
      setResponse(`Network Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setLoading(true)
    setResponse('')

    try {
      const res = await fetch('/api/qwen-debug')
      const data = await res.json()

      if (data.success) {
        setResponse(`✅ Qwen3 Connected Successfully!\n\n${data.message}\n\nTest Response: ${data.test_response}`)
      } else {
        setResponse(`❌ Connection Failed\n\nError: ${data.error}\n\nConfiguration needed:\n${JSON.stringify(data.configuration_needed, null, 2)}`)
      }
    } catch (err: any) {
      setResponse(`❌ Network Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Qwen3 Code Assistant</h1>
          <p className="text-gray-400">Debug and fix issues with AI-powered assistance</p>
          
          <div className="mt-4 flex space-x-4">
            <button
              onClick={testConnection}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-md font-medium transition-colors"
            >
              Test Connection
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Debug Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {debugTypes.map((debugType) => (
                  <option key={debugType.value} value={debugType.value}>
                    {debugType.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Error/Issue *</label>
              <textarea
                value={error}
                onChange={(e) => setError(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Describe the error or issue you're facing..."
                required
              />
            </div>

            {(type === 'typescript' || type === 'component' || type === 'supabase') && (
              <div>
                <label className="block text-sm font-medium mb-2">Code Snippet</label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={6}
                  placeholder="Paste the problematic code here..."
                />
              </div>
            )}

            {(type === 'typescript' || type === 'component') && (
              <div>
                <label className="block text-sm font-medium mb-2">File Path</label>
                <input
                  type="text"
                  value={file}
                  onChange={(e) => setFile(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., src/components/AuthProvider.tsx"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Additional Context</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Any additional information that might help..."
              />
            </div>

            <button
              onClick={handleDebug}
              disabled={loading || !error.trim()}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-md font-medium transition-colors"
            >
              {loading ? 'Analyzing with Qwen3...' : 'Debug with AI'}
            </button>
          </div>

          {/* Response Section */}
          <div>
            <label className="block text-sm font-medium mb-2">AI Solution</label>
            <div className="bg-gray-800 border border-gray-700 rounded-md p-4 min-h-96">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2">Qwen3 is analyzing...</span>
                </div>
              ) : response ? (
                <pre className="whitespace-pre-wrap text-sm text-gray-300 overflow-x-auto">
                  {response}
                </pre>
              ) : (
                <p className="text-gray-500 italic">AI solution will appear here...</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Examples */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Quick Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-800 p-4 rounded-md">
              <h3 className="font-semibold mb-2">Auth Issue</h3>
              <p className="text-sm text-gray-400">Loading stuck on signup page</p>
              <button
                onClick={() => {
                  setType('auth')
                  setError('Signup page shows "Loading..." indefinitely and never renders the form')
                  setContext('AuthProvider wrapping the entire app with loading state')
                }}
                className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                Load Example
              </button>
            </div>

            <div className="bg-gray-800 p-4 rounded-md">
              <h3 className="font-semibold mb-2">Supabase Error</h3>
              <p className="text-sm text-gray-400">RLS policy infinite recursion</p>
              <button
                onClick={() => {
                  setType('supabase')
                  setError('infinite recursion detected in policy for relation "agencies"')
                  setCode('CREATE POLICY "Users can view their agencies" ON agencies FOR SELECT USING...')
                }}
                className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                Load Example
              </button>
            </div>

            <div className="bg-gray-800 p-4 rounded-md">
              <h3 className="font-semibold mb-2">CSS Missing</h3>
              <p className="text-sm text-gray-400">Tailwind styles not loading</p>
              <button
                onClick={() => {
                  setType('build')
                  setError('Tailwind CSS classes not applying, page shows unstyled content')
                  setContext('Next.js 15 development server, Tailwind config looks correct')
                }}
                className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                Load Example
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}