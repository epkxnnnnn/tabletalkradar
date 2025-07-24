'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { supabase } from '@/lib/supabase'

interface ReportTemplate {
  id: string
  name: string
  description: string
  sections: string[]
  is_default: boolean
}

interface Report {
  id: string
  audit_id: string
  template_id: string
  business_name: string
  created_at: string
  status: 'draft' | 'generated' | 'delivered'
  download_url?: string
}

export default function ReportGenerator() {
  const { user } = useAuth()
  const [audits, setAudits] = useState<any[]>([])
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [selectedAudit, setSelectedAudit] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    sections: ['executive_summary', 'audit_results', 'recommendations', 'action_items']
  })

  useEffect(() => {
    if (user) {
      loadAudits()
      loadTemplates()
      loadReports()
    }
  }, [user])

  const loadAudits = async () => {
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('client_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAudits(data || [])
    } catch (error) {
      console.error('Error loading audits:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports(data || [])
    } catch (error) {
      console.error('Error loading reports:', error)
    }
  }

  const generateReport = async () => {
    if (!selectedAudit || !selectedTemplate) {
      alert('Please select an audit and template')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audit_id: selectedAudit,
          template_id: selectedTemplate,
          user_id: user?.id
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const result = await response.json()
      alert('Report generated successfully!')
      loadReports()
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const createTemplate = async () => {
    try {
      const { error } = await supabase
        .from('report_templates')
        .insert({
          user_id: user?.id,
          name: newTemplate.name,
          description: newTemplate.description,
          sections: newTemplate.sections,
          is_default: false
        })

      if (error) throw error

      setNewTemplate({
        name: '',
        description: '',
        sections: ['executive_summary', 'audit_results', 'recommendations', 'action_items']
      })
      setShowTemplateEditor(false)
      loadTemplates()
    } catch (error) {
      console.error('Error creating template:', error)
    }
  }

  const downloadReport = async (reportId: string, downloadUrl: string) => {
    try {
      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-report-${reportId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading report:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Report Generation</h2>
          <p className="text-slate-400">Create professional PDF reports with custom branding</p>
        </div>
        <button
          onClick={() => setShowTemplateEditor(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Create Template
        </button>
      </div>

      {/* Generate New Report */}
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Generate New Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Audit</label>
            <select
              value={selectedAudit}
              onChange={(e) => setSelectedAudit(e.target.value)}
              className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
            >
              <option value="">Choose an audit...</option>
              {audits.map((audit) => (
                <option key={audit.id} value={audit.id}>
                  {audit.business_name} - {new Date(audit.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
            >
              <option value="">Choose a template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={generateReport}
          disabled={loading || !selectedAudit || !selectedTemplate}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Report Templates */}
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Report Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="border border-slate-600 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">{template.name}</h4>
              <p className="text-slate-400 text-sm mb-3">{template.description}</p>
              <div className="text-slate-500 text-xs">
                Sections: {template.sections.join(', ')}
              </div>
              {template.is_default && (
                <span className="inline-block bg-green-600 text-white text-xs px-2 py-1 rounded mt-2">
                  Default
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Generated Reports */}
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Generated Reports</h3>
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="flex justify-between items-center border border-slate-600 rounded-lg p-4">
              <div>
                <h4 className="text-white font-medium">{report.business_name}</h4>
                <p className="text-slate-400 text-sm">
                  {new Date(report.created_at).toLocaleDateString()}
                </p>
                <span className={`inline-block px-2 py-1 text-xs rounded ${
                  report.status === 'generated' ? 'bg-green-600 text-white' :
                  report.status === 'draft' ? 'bg-yellow-600 text-white' :
                  'bg-slate-600 text-white'
                }`}>
                  {report.status}
                </span>
              </div>
              <div className="flex gap-2">
                {report.download_url && (
                  <button
                    onClick={() => downloadReport(report.id, report.download_url!)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Download
                  </button>
                )}
                <button className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm">
                  Share
                </button>
              </div>
            </div>
          ))}
          {reports.length === 0 && (
            <p className="text-slate-400 text-center py-8">No reports generated yet.</p>
          )}
        </div>
      </div>

      {/* Template Editor Modal */}
      {showTemplateEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Create Report Template</h3>
              <button
                onClick={() => setShowTemplateEditor(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Template Name</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                  className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                  className="w-full p-3 border border-slate-600 rounded-lg bg-slate-700 text-white"
                  placeholder="Enter template description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Sections</label>
                <div className="space-y-2">
                  {['executive_summary', 'audit_results', 'recommendations', 'action_items', 'competitor_analysis'].map((section) => (
                    <label key={section} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTemplate.sections.includes(section)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewTemplate({
                              ...newTemplate,
                              sections: [...newTemplate.sections, section]
                            })
                          } else {
                            setNewTemplate({
                              ...newTemplate,
                              sections: newTemplate.sections.filter(s => s !== section)
                            })
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-slate-300 text-sm capitalize">
                        {section.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createTemplate}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                >
                  Create Template
                </button>
                <button
                  onClick={() => setShowTemplateEditor(false)}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 