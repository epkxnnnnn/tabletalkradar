'use client'

import React, { useState } from 'react'

interface SecurityIssue {
  name: string
  title: string
  level: 'ERROR' | 'WARNING' | 'INFO'
  description: string
  detail: string
  metadata: {
    name: string
    type: string
    schema: string
  }
}

interface SecurityAuditProps {
  issues: SecurityIssue[]
}

export default function SecurityAudit({ issues = [] }: SecurityAuditProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  // Group issues by type
  const rlsDisabledIssues = issues.filter(issue => issue.name === 'rls_disabled_in_public')
  const policyExistsRlsDisabledIssues = issues.filter(issue => issue.name === 'policy_exists_rls_disabled')
  const securityDefinerViewIssues = issues.filter(issue => issue.name === 'security_definer_view')

  const runSecurityFix = async () => {
    setLoading(true)
    setMessage('🔧 Running comprehensive security fix...')

    try {
      // In a real implementation, you would call an API endpoint that runs the SQL script
      // For now, we'll show the instructions
      setMessage('✅ Security fix SQL script generated! Please run fix_rls_security_issues.sql in your Supabase SQL editor.')
    } catch (error) {
      setMessage('❌ Error generating security fixes')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-400 bg-red-900/20 border-red-500'
      case 'WARNING': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500'
      case 'INFO': return 'text-blue-400 bg-blue-900/20 border-blue-500'
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500'
    }
  }

  const getTotalIssueCount = () => issues.length
  const getCriticalIssueCount = () => issues.filter(i => i.level === 'ERROR').length

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Database Security Audit</h3>
        <p className="text-slate-400 text-sm mb-4">
          Review and fix security issues found in your Supabase database configuration.
        </p>

        {/* Security Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-700 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-400">{getCriticalIssueCount()}</div>
            <div className="text-slate-300 text-sm">Critical Issues</div>
          </div>
          <div className="bg-slate-700 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400">{getTotalIssueCount()}</div>
            <div className="text-slate-300 text-sm">Total Issues</div>
          </div>
          <div className="bg-slate-700 p-4 rounded-lg">
            <div className="text-2xl font-bold text-slate-400">{rlsDisabledIssues.length}</div>
            <div className="text-slate-300 text-sm">Tables Missing RLS</div>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes('✅') ? 'bg-green-900/20 border border-green-500 text-green-400' :
            message.includes('🔧') ? 'bg-blue-900/20 border border-blue-500 text-blue-400' :
            'bg-red-900/20 border border-red-500 text-red-400'
          }`}>
            {message}
          </div>
        )}

        {/* Quick Fix Section */}
        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg mb-6">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">🚨</div>
            <div className="flex-1">
              <h4 className="text-red-400 font-semibold">Critical Security Issues Detected</h4>
              <p className="text-slate-300 text-sm mt-1">
                Your database has {getCriticalIssueCount()} critical security issues that need immediate attention.
                Row Level Security (RLS) is not enabled on several tables, making your data vulnerable.
              </p>
              <div className="mt-3 flex space-x-3">
                <button
                  onClick={runSecurityFix}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white px-4 py-2 rounded text-sm font-medium"
                >
                  {loading ? 'Generating Fix...' : '🔧 Generate Security Fix'}
                </button>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded text-sm font-medium"
                >
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Issues */}
        {showDetails && (
          <div className="space-y-4">
            {/* RLS Disabled Issues */}
            {rlsDisabledIssues.length > 0 && (
              <div className="bg-slate-700 p-4 rounded-lg">
                <h5 className="text-white font-medium mb-3">
                  🔓 Tables Missing Row Level Security ({rlsDisabledIssues.length})
                </h5>
                <div className="space-y-2 text-sm">
                  {rlsDisabledIssues.map((issue, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-600 p-2 rounded">
                      <span className="text-slate-300">{issue.metadata.name}</span>
                      <span className="text-red-400 text-xs">RLS Disabled</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Policy Exists but RLS Disabled */}
            {policyExistsRlsDisabledIssues.length > 0 && (
              <div className="bg-slate-700 p-4 rounded-lg">
                <h5 className="text-white font-medium mb-3">
                  ⚠️ Tables with Policies but RLS Disabled ({policyExistsRlsDisabledIssues.length})
                </h5>
                <div className="space-y-2 text-sm">
                  {policyExistsRlsDisabledIssues.map((issue, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-600 p-2 rounded">
                      <span className="text-slate-300">{issue.metadata.name}</span>
                      <span className="text-yellow-400 text-xs">Has Policies, RLS Off</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Definer Views */}
            {securityDefinerViewIssues.length > 0 && (
              <div className="bg-slate-700 p-4 rounded-lg">
                <h5 className="text-white font-medium mb-3">
                  🔍 Security Definer Views ({securityDefinerViewIssues.length})
                </h5>
                <div className="space-y-2 text-sm">
                  {securityDefinerViewIssues.map((issue, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-600 p-2 rounded">
                      <span className="text-slate-300">{issue.metadata.name}</span>
                      <span className="text-orange-400 text-xs">Security Definer</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
          <h5 className="text-blue-400 font-medium mb-2">🛠️ How to Fix These Issues:</h5>
          <div className="text-slate-300 text-sm space-y-2">
            <p><strong>1.</strong> Open your Supabase project dashboard</p>
            <p><strong>2.</strong> Go to SQL Editor</p>
            <p><strong>3.</strong> Copy and run the content from <code className="bg-slate-700 px-1 rounded">fix_rls_security_issues.sql</code></p>
            <p><strong>4.</strong> Verify all tables have RLS enabled</p>
            <p><strong>5.</strong> Test your application to ensure proper access control</p>
          </div>
        </div>

        {/* What This Fixes */}
        <div className="mt-4 bg-green-900/20 border border-green-500/30 p-4 rounded-lg">
          <h5 className="text-green-400 font-medium mb-2">✅ This Security Fix Will:</h5>
          <div className="text-slate-300 text-sm space-y-1">
            <p>• Enable Row Level Security on all {rlsDisabledIssues.length} tables</p>
            <p>• Create proper RLS policies for multi-tenant access control</p>
            <p>• Fix security definer views to use proper permissions</p>
            <p>• Ensure users can only access their own agency/client data</p>
            <p>• Protect sensitive data from unauthorized access</p>
            <p>• Comply with Supabase security best practices</p>
          </div>
        </div>
      </div>
    </div>
  )
}