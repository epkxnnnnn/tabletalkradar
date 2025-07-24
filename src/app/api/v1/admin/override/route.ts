// TableTalk Radar - Super Admin Override API (v1)
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withValidation, 
  withMethods,
  successResponse,
  errorResponse,
  AuthenticationError,
  AuthorizationError
} from '@/lib/api-handler'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Request validation schemas
const OverrideActionSchema = z.object({
  action: z.enum(['impersonate_user', 'override_permissions', 'force_action', 'emergency_access']),
  target_user_id: z.string().uuid().optional(),
  target_client_id: z.string().uuid().optional(),
  target_agency_id: z.string().uuid().optional(),
  override_data: z.record(z.any()).optional(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  emergency: z.boolean().default(false)
})

// Helper to get authenticated super admin
async function getAuthenticatedSuperAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        }
      },
    }
  )
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new AuthenticationError('Authentication required')
  }
  
  // Check if user is super admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  const isSuperAdmin = profile?.role === 'superadmin' || user.email === 'kphstk@gmail.com'
  
  if (!isSuperAdmin) {
    throw new AuthorizationError('Super admin privileges required')
  }
  
  return { user, supabase }
}

// Helper to log admin actions
async function logAdminAction(
  supabase: any,
  adminUserId: string,
  action: string,
  details: any,
  targetUserId?: string,
  targetClientId?: string,
  targetAgencyId?: string
) {
  await supabase
    .from('admin_audit_log')
    .insert({
      admin_user_id: adminUserId,
      action_type: action,
      target_user_id: targetUserId,
      target_client_id: targetClientId,
      target_agency_id: targetAgencyId,
      action_details: details,
      ip_address: '', // Would get from headers in real implementation
      user_agent: '', // Would get from headers in real implementation
      created_at: new Date().toISOString()
    })
}

// POST /api/v1/admin/override - Execute super admin override actions
export const POST = withMethods(['POST'])(
  withValidation(OverrideActionSchema)(
    async (req: NextRequest, data: z.infer<typeof OverrideActionSchema>) => {
      const { user, supabase } = await getAuthenticatedSuperAdmin()
      
      const { action, target_user_id, target_client_id, target_agency_id, override_data, reason, emergency = false } = data
      
      let result: any = {}
      
      try {
        switch (action) {
          case 'impersonate_user':
            if (!target_user_id) {
              throw new Error('target_user_id required for impersonate_user action')
            }
            
            // Create impersonation session
            const impersonationToken = crypto.randomUUID()
            await supabase
              .from('admin_impersonation_sessions')
              .insert({
                admin_user_id: user.id,
                target_user_id,
                session_token: impersonationToken,
                reason,
                is_active: true,
                expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
                created_at: new Date().toISOString()
              })
            
            result = { impersonation_token: impersonationToken, expires_in: 4 * 60 * 60 * 1000 }
            break
            
          case 'override_permissions':
            if (!target_user_id) {
              throw new Error('target_user_id required for override_permissions action')
            }
            
            // Create temporary permission override
            const overrideId = crypto.randomUUID()
            await supabase
              .from('admin_permission_overrides')
              .insert({
                id: overrideId,
                admin_user_id: user.id,
                target_user_id,
                override_permissions: override_data,
                reason,
                is_active: true,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
                created_at: new Date().toISOString()
              })
            
            result = { override_id: overrideId, permissions: override_data }
            break
            
          case 'force_action':
            // Execute forced actions on behalf of users/clients
            if (target_client_id && override_data?.action === 'run_audit') {
              // Force run audit for client
              const auditResult = await fetch('/api/v1/audits/run-safe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  client_id: target_client_id,
                  force_run: true,
                  admin_override: true
                })
              })
              result = { audit_forced: true, audit_result: await auditResult.json() }
            } else if (target_client_id && override_data?.action === 'update_client') {
              // Force update client data
              const { error: updateError } = await supabase
                .from('clients')
                .update({
                  ...override_data.updates,
                  updated_at: new Date().toISOString(),
                  updated_by_admin: user.id
                })
                .eq('id', target_client_id)
              
              if (updateError) throw updateError
              result = { client_updated: true, updates: override_data.updates }
            }
            break
            
          case 'emergency_access':
            // Emergency access to locked accounts or systems
            if (target_user_id) {
              // Unlock user account
              await supabase
                .from('profiles')
                .update({
                  account_locked: false,
                  failed_login_attempts: 0,
                  locked_until: null,
                  updated_at: new Date().toISOString()
                })
                .eq('id', target_user_id)
              
              result = { user_unlocked: true, target_user_id }
            }
            
            if (target_client_id) {
              // Emergency client access restore
              await supabase
                .from('clients')
                .update({
                  status: 'active',
                  emergency_access_granted: true,
                  emergency_access_by: user.id,
                  emergency_access_at: new Date().toISOString()
                })
                .eq('id', target_client_id)
              
              result = { ...result, client_access_restored: true }
            }
            break
            
          default:
            throw new Error(`Unsupported admin action: ${action}`)
        }
        
        // Log the admin action
        await logAdminAction(
          supabase,
          user.id,
          action,
          { reason, emergency, override_data, result },
          target_user_id,
          target_client_id,
          target_agency_id
        )
        
        return successResponse(
          { 
            action_executed: action,
            result,
            timestamp: new Date().toISOString(),
            admin_user: user.email
          },
          `Admin override action '${action}' executed successfully`
        )
        
      } catch (error) {
        // Log failed admin action
        await logAdminAction(
          supabase,
          user.id,
          `${action}_FAILED`,
          { reason, emergency, error: error.message },
          target_user_id,
          target_client_id,
          target_agency_id
        )
        
        throw error
      }
    }
  )
)

// GET /api/v1/admin/override - Get admin override history and active sessions
export const GET = withMethods(['GET'])(
  async (req: NextRequest) => {
    const { user, supabase } = await getAuthenticatedSuperAdmin()
    
    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    
    if (action === 'active_sessions') {
      // Get active impersonation sessions
      const { data: sessions, error } = await supabase
        .from('admin_impersonation_sessions')
        .select(`
          *,
          target_user:profiles!admin_impersonation_sessions_target_user_id_fkey(email, role),
          admin_user:profiles!admin_impersonation_sessions_admin_user_id_fkey(email)
        `)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      
      return successResponse(
        { active_sessions: sessions },
        'Active admin sessions retrieved'
      )
    }
    
    if (action === 'audit_log') {
      // Get admin audit log
      const { data: logs, error } = await supabase
        .from('admin_audit_log')
        .select(`
          *,
          admin_user:profiles!admin_audit_log_admin_user_id_fkey(email),
          target_user:profiles!admin_audit_log_target_user_id_fkey(email),
          target_client:clients(business_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      
      return successResponse(
        { audit_log: logs },
        'Admin audit log retrieved'
      )
    }
    
    // Default: get permission overrides
    const { data: overrides, error } = await supabase
      .from('admin_permission_overrides')
      .select(`
        *,
        admin_user:profiles!admin_permission_overrides_admin_user_id_fkey(email),
        target_user:profiles!admin_permission_overrides_target_user_id_fkey(email)
      `)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return successResponse(
      { permission_overrides: overrides },
      'Active permission overrides retrieved'
    )
  }
)

// DELETE /api/v1/admin/override - Revoke admin overrides
export const DELETE = withMethods(['DELETE'])(
  async (req: NextRequest) => {
    const { user, supabase } = await getAuthenticatedSuperAdmin()
    
    const url = new URL(req.url)
    const session_id = url.searchParams.get('session_id')
    const override_id = url.searchParams.get('override_id')
    
    if (session_id) {
      // Revoke impersonation session
      const { error } = await supabase
        .from('admin_impersonation_sessions')
        .update({ 
          is_active: false,
          revoked_by: user.id,
          revoked_at: new Date().toISOString()
        })
        .eq('id', session_id)
      
      if (error) throw error
      
      await logAdminAction(supabase, user.id, 'revoke_impersonation', { session_id })
      
      return successResponse(
        { session_revoked: session_id },
        'Impersonation session revoked'
      )
    }
    
    if (override_id) {
      // Revoke permission override
      const { error } = await supabase
        .from('admin_permission_overrides')
        .update({ 
          is_active: false,
          revoked_by: user.id,
          revoked_at: new Date().toISOString()
        })
        .eq('id', override_id)
      
      if (error) throw error
      
      await logAdminAction(supabase, user.id, 'revoke_permission_override', { override_id })
      
      return successResponse(
        { override_revoked: override_id },
        'Permission override revoked'
      )
    }
    
    throw new Error('session_id or override_id required')
  }
)