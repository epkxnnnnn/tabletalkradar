'use client'

import React, { useState } from 'react'

interface ImportResult {
  restaurant: string
  status: 'created' | 'updated' | 'error'
  google_business_id?: string
  location_id?: string
  error?: string
}

interface ImportResponse {
  success: boolean
  message: string
  statistics: {
    total_processed: number
    created: number
    updated: number
    errors: number
  }
  results: ImportResult[]
}

export default function ClientDataImporter() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ImportResponse | null>(null)
  const [message, setMessage] = useState('')

  const importClientData = async () => {
    setLoading(true)
    setMessage('')
    setResults(null)

    try {
      const response = await fetch('/api/import-client-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data)
        setMessage(`✅ ${data.message}`)
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error importing client data:', error)
      setMessage('❌ Failed to import client data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Client Data Importer</h3>
        <p className="text-slate-400 text-sm mb-4">
          Import restaurant client data from CSV file with Google Business IDs for enhanced Google My Business integration.
        </p>

        <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg mb-4">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">📄</div>
            <div>
              <h4 className="text-blue-400 font-semibold">CSV File Detected</h4>
              <p className="text-slate-300 text-sm mt-1">
                <code className="bg-slate-700 px-1 rounded">/Users/topwireless/Downloads/client/restaurant_full_info.csv</code>
              </p>
              <div className="mt-2 text-xs text-slate-400">
                <p><strong>Contains:</strong> Restaurant names, addresses, phone numbers, websites, Google Business IDs</p>
                <p><strong>Will Update:</strong> Client locations with Google Place IDs for advanced API features</p>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes('✅') ? 'bg-green-900/20 border border-green-500 text-green-400' :
            'bg-red-900/20 border border-red-500 text-red-400'
          }`}>
            {message}
          </div>
        )}

        <button
          onClick={importClientData}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {loading ? 'Importing Client Data...' : '🚀 Import Restaurant Data'}
        </button>
      </div>

      {results && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">Import Results</h4>
          
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-700 p-3 rounded">
              <div className="text-blue-400 font-bold text-xl">{results.statistics.total_processed}</div>
              <div className="text-slate-300 text-sm">Total Processed</div>
            </div>
            <div className="bg-slate-700 p-3 rounded">
              <div className="text-green-400 font-bold text-xl">{results.statistics.created}</div>
              <div className="text-slate-300 text-sm">New Clients</div>
            </div>
            <div className="bg-slate-700 p-3 rounded">
              <div className="text-yellow-400 font-bold text-xl">{results.statistics.updated}</div>
              <div className="text-slate-300 text-sm">Updated</div>
            </div>
            <div className="bg-slate-700 p-3 rounded">
              <div className="text-red-400 font-bold text-xl">{results.statistics.errors}</div>
              <div className="text-slate-300 text-sm">Errors</div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h5 className="text-white font-medium mb-2">Detailed Results:</h5>
            {results.results.map((result, index) => (
              <div 
                key={index} 
                className={`p-3 rounded text-sm ${
                  result.status === 'created' ? 'bg-green-900/20 border border-green-500/30' :
                  result.status === 'updated' ? 'bg-yellow-900/20 border border-yellow-500/30' :
                  'bg-red-900/20 border border-red-500/30'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium">{result.restaurant}</p>
                    {result.google_business_id && (
                      <p className="text-slate-400 text-xs">
                        Google Business ID: {result.google_business_id}
                      </p>
                    )}
                    {result.location_id && (
                      <p className="text-slate-400 text-xs">
                        Location ID: {result.location_id}
                      </p>
                    )}
                    {result.error && (
                      <p className="text-red-400 text-xs mt-1">
                        Error: {result.error}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    result.status === 'created' ? 'bg-green-600 text-white' :
                    result.status === 'updated' ? 'bg-yellow-600 text-white' :
                    'bg-red-600 text-white'
                  }`}>
                    {result.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Next Steps */}
          <div className="mt-6 bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
            <h5 className="text-blue-400 font-medium mb-2">✅ Next Steps:</h5>
            <div className="text-slate-300 text-sm space-y-1">
              <p>• Google Business IDs have been added to your locations</p>
              <p>• You can now use Google Business Manager for posting, reviews, and Q&A</p>
              <p>• Run Google Review Scraper to import existing reviews</p>
              <p>• Test Google My Business features in the Admin Panel</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}