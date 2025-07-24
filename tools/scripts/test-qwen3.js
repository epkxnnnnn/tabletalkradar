#!/usr/bin/env node

// Test script for Qwen3 debugging integration
const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api/qwen-debug'

async function testQwen3Connection() {
  console.log('🤖 Testing Qwen3 Connection...\n')
  
  try {
    const response = await fetch(API_BASE)
    const data = await response.json()
    
    if (data.success) {
      console.log('✅ Qwen3 Connected Successfully!')
      console.log(`📝 Message: ${data.message}`)
      console.log(`🧪 Test Response: ${data.test_response}`)
    } else {
      console.log('❌ Connection Failed')
      console.log(`🔧 Error: ${data.error}`)
      if (data.configuration_needed) {
        console.log('📋 Configuration needed:')
        console.log(JSON.stringify(data.configuration_needed, null, 2))
      }
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
}

async function testAuthDebugging() {
  console.log('🔐 Testing Auth Issue Debugging...\n')
  
  const authIssue = {
    type: 'auth',
    error: 'Signup page shows "Loading..." infinitely and never renders the form',
    context: 'AuthProvider wrapping entire app, Supabase auth, Next.js 15',
    code: `
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  // ... rest of component
}
    `.trim()
  }
  
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authIssue)
    })
    
    const data = await response.json()
    
    if (data.success) {
      console.log('✅ Auth Debugging Successful!')
      console.log('🧠 AI Solution:')
      console.log(data.solution)
    } else {
      console.log('❌ Auth Debugging Failed:', data.error)
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
}

async function testBuildErrorDebugging() {
  console.log('🔨 Testing Build Error Debugging...\n')
  
  const buildIssue = {
    type: 'build',
    error: 'useSearchParams() should be wrapped in suspense boundary at page "/auth/reset-password"',
    context: 'Next.js 15 build process, trying to generate static pages'
  }
  
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildIssue)
    })
    
    const data = await response.json()
    
    if (data.success) {
      console.log('✅ Build Error Debugging Successful!')
      console.log('🧠 AI Solution:')
      console.log(data.solution)
    } else {
      console.log('❌ Build Debugging Failed:', data.error)
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
}

async function testSupabaseDebugging() {
  console.log('🗄️  Testing Supabase Issue Debugging...\n')
  
  const supabaseIssue = {
    type: 'supabase',
    error: 'infinite recursion detected in policy for relation "agencies"',
    code: `
CREATE POLICY "Users can view their agencies" ON agencies
FOR SELECT USING (
  owner_id = auth.uid() OR
  EXISTS (SELECT 1 FROM agency_memberships WHERE user_id = auth.uid())
);
    `.trim(),
    context: 'RLS policies, Super Admin access, multi-tenant app'
  }
  
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supabaseIssue)
    })
    
    const data = await response.json()
    
    if (data.success) {
      console.log('✅ Supabase Debugging Successful!')
      console.log('🧠 AI Solution:')
      console.log(data.solution)
    } else {
      console.log('❌ Supabase Debugging Failed:', data.error)
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
}

async function runAllTests() {
  console.log('🚀 TableTalk Radar - Qwen3 Debug Assistant Test Suite')
  console.log('='.repeat(60) + '\n')
  
  await testQwen3Connection()
  await testAuthDebugging()
  await testBuildErrorDebugging()
  await testSupabaseDebugging()
  
  console.log('🎉 Test Suite Complete!')
  console.log('Visit http://localhost:3000/qwen-debug for interactive debugging')
}

// Run if called directly
if (require.main === module) {
  runAllTests().catch(console.error)
}

module.exports = {
  testQwen3Connection,
  testAuthDebugging,
  testBuildErrorDebugging,
  testSupabaseDebugging
}