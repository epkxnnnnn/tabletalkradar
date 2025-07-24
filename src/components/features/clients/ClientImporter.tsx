'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../providers/AuthProvider'

interface ImportedClient {
  business_name: string
  website?: string
  contact_email?: string
  contact_phone?: string
  industry?: string
  business_type?: string
  category?: string
  notes?: string
  locations?: {
    business_name: string
    address: string
    city: string
    state: string
    zip_code: string
    phone?: string
    website?: string
  }[]
}

export default function ClientImporter() {
  const { user } = useAuth()
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState('')
  const [importData, setImportData] = useState('')
  const [preview, setPreview] = useState<ImportedClient[]>([])

  const parseImportData = () => {
    try {
      let clients: ImportedClient[] = []
      
      if (importData.trim().startsWith('[') || importData.trim().startsWith('{')) {
        // JSON format
        const parsed = JSON.parse(importData)
        clients = Array.isArray(parsed) ? parsed : [parsed]
      } else {
        // CSV format - simple parser
        const lines = importData.trim().split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim())
          const client: any = {}
          
          headers.forEach((header, index) => {
            if (values[index]) {
              client[header.toLowerCase().replace(/\s+/g, '_')] = values[index]
            }
          })
          
          if (client.business_name) {
            clients.push(client as ImportedClient)
          }
        }
      }
      
      setPreview(clients)
      setMessage(`Preview: ${clients.length} clients ready for import`)
    } catch (error) {
      setMessage('Error parsing import data. Please check the format.')
      console.error('Parse error:', error)
    }
  }

  const importClients = async () => {
    if (!user || preview.length === 0) return

    setImporting(true)
    setMessage('')

    try {
      let successCount = 0
      let errorCount = 0

      for (const clientData of preview) {
        try {
          // Insert client
          const { data: client, error: clientError } = await supabase
            .from('clients')
            .insert({
              user_id: user.id,
              business_name: clientData.business_name,
              website: clientData.website,
              contact_email: clientData.contact_email,
              contact_phone: clientData.contact_phone,
              industry: clientData.industry || 'other',
              business_type: clientData.business_type,
              category: clientData.category,
              notes: clientData.notes,
              status: 'active',
              created_at: new Date().toISOString()
            })
            .select()
            .single()

          if (clientError) {
            console.error('Client insert error:', clientError)
            errorCount++
            continue
          }

          // Insert locations if provided
          if (clientData.locations && clientData.locations.length > 0) {
            for (let index = 0; index < clientData.locations.length; index++) {
              const locationData = clientData.locations[index]
              await supabase
                .from('client_locations')
                .insert({
                  client_id: client.id,
                  business_name: locationData.business_name || clientData.business_name,
                  address: locationData.address,
                  city: locationData.city,
                  state: locationData.state,
                  zip_code: locationData.zip_code,
                  phone: locationData.phone || clientData.contact_phone,
                  website: locationData.website || clientData.website,
                  is_primary: index === 0,
                  is_active: true,
                  created_at: new Date().toISOString()
                })
            }
          } else {
            // Create a default location from client data
            await supabase
              .from('client_locations')
              .insert({
                client_id: client.id,
                business_name: clientData.business_name,
                address: '',
                city: '',
                state: '',
                phone: clientData.contact_phone,
                website: clientData.website,
                is_primary: true,
                is_active: true,
                created_at: new Date().toISOString()
              })
          }

          successCount++
        } catch (error) {
          console.error('Error importing client:', error)
          errorCount++
        }
      }

      setMessage(`Import completed: ${successCount} clients imported successfully${errorCount > 0 ? `, ${errorCount} errors` : ''}`)
      
      if (successCount > 0) {
        setImportData('')
        setPreview([])
      }
    } catch (error) {
      console.error('Import error:', error)
      setMessage('Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Import Client Profiles</h3>
        <p className="text-slate-400 text-sm mb-6">
          Import multiple clients at once using JSON or CSV format. Include business details and location information.
        </p>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes('Error') || message.includes('failed') 
              ? 'bg-red-900/20 border border-red-500 text-red-400'
              : message.includes('completed') || message.includes('success')
              ? 'bg-green-900/20 border border-green-500 text-green-400'
              : 'bg-blue-900/20 border border-blue-500 text-blue-400'
          }`}>
            {message}
          </div>
        )}

        {/* Import Data Input */}
        <div className="mb-6">
          <label className="block text-slate-300 text-sm font-medium mb-2">
            Import Data (JSON or CSV format)
          </label>
          <textarea
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            className="w-full h-40 bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="Paste your client data here..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={parseImportData}
            disabled={!importData.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2 rounded font-medium"
          >
            Preview Import
          </button>
          
          {preview.length > 0 && (
            <button
              onClick={importClients}
              disabled={importing}
              className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-4 py-2 rounded font-medium"
            >
              {importing ? 'Importing...' : `Import ${preview.length} Clients`}
            </button>
          )}
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Import Preview</h4>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {preview.map((client, index) => (
                <div key={index} className="bg-slate-600 p-3 rounded text-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="text-white font-medium">{client.business_name}</h5>
                    <span className="text-slate-400 text-xs">#{index + 1}</span>
                  </div>
                  <div className="text-slate-300 space-y-1">
                    {client.website && <div>Website: {client.website}</div>}
                    {client.contact_email && <div>Email: {client.contact_email}</div>}
                    {client.contact_phone && <div>Phone: {client.contact_phone}</div>}
                    {client.industry && <div>Industry: {client.industry}</div>}
                    {client.locations && (
                      <div>Locations: {client.locations.length}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Format Examples */}
        <div className="mt-8 bg-slate-700 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Format Examples</h4>
          
          <div className="space-y-4">
            <div>
              <h5 className="text-slate-300 text-sm font-medium mb-2">JSON Format:</h5>
              <pre className="bg-slate-800 p-3 rounded text-xs text-slate-300 overflow-x-auto">
{`[
  {
    "business_name": "Sample Restaurant",
    "website": "https://example.com",
    "contact_email": "info@example.com",
    "contact_phone": "(555) 123-4567",
    "industry": "food-beverage",
    "business_type": "restaurant",
    "category": "Italian Restaurant",
    "locations": [
      {
        "business_name": "Sample Restaurant Downtown",
        "address": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zip_code": "10001"
      }
    ]
  }
]`}
              </pre>
            </div>
            
            <div>
              <h5 className="text-slate-300 text-sm font-medium mb-2">CSV Format:</h5>
              <pre className="bg-slate-800 p-3 rounded text-xs text-slate-300 overflow-x-auto">
{`business_name,website,contact_email,contact_phone,industry,business_type
Sample Restaurant,https://example.com,info@example.com,(555) 123-4567,food-beverage,restaurant
Another Business,https://another.com,contact@another.com,(555) 987-6543,professional-services,consulting`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}