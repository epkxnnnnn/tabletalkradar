// TableTalk Radar - Admin Users Management API (v1)
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withValidation, 
  withMethods,
  successResponse,
  AuthenticationError,
  AuthorizationError
} from '@/lib/api-handler'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

// Request validation schemas
const GetUsersSchema = z.object({
  limit: z.string().optional(),
  offset: z.string().optional(),
  role: z.string().optional()
})

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1),
  company_name: z.string().optional(),
  role: z.string().optional()
})

// Helper to create Supabase client with cookies
async function createSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}

// Helper to check super admin access
async function checkSuperAdminAccess(supabase: any, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || profile?.role !== 'superadmin') {
    return false
  }

  return true
}

// Helper to get authenticated session
async function getAuthenticatedSession() {
  const supabase = await createSupabaseClient()
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !session) {
    throw new AuthenticationError('Not authenticated')
  }

  // Check if user is super admin
  const isSuperAdmin = await checkSuperAdminAccess(supabase, session.user.id)
  if (!isSuperAdmin) {
    throw new AuthorizationError('Super Admin access required')
  }

  return { supabase, session }
}

// GET /api/v1/admin/admin/users - List all users (super admin only)
export const GET = withMethods(['GET'])(
  withValidation(GetUsersSchema)(
    async (req: NextRequest, query: z.infer<typeof GetUsersSchema>) => {
    const limit = Math.min(Number(query.limit) || 50, 100)
    const offset = Number(query.offset) || 0
    const { role } = query
    const { supabase, session } = await getAuthenticatedSession()

    let usersQuery = supabase
      .from('profiles')
      .select('id, full_name, email, company_name, role, created_at, updated_at')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (role) {
      usersQuery = usersQuery.eq('role', role)
    }

    const { data: users, error } = await usersQuery

    if (error) {
      logger.error('Error fetching users', { error, adminId: session.user.id })
      throw new Error('Failed to fetch users')
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      logger.error('Error counting users', { error: countError, adminId: session.user.id })
    }

    return successResponse(
      { 
        users, 
        pagination: {
          total: totalCount || 0,
          limit,
          offset,
          hasMore: (totalCount || 0) > offset + limit
        }
      },
      `Retrieved ${users?.length || 0} users`
    )
    }
  )
)

// POST /api/v1/admin/admin/users - Create new user (super admin only)
export const POST = withMethods(['POST'])(
  withValidation(CreateUserSchema)(
    async (req: NextRequest, data: z.infer<typeof CreateUserSchema>) => {
    const { email, password, full_name, company_name, role } = data
    const { supabase, session } = await getAuthenticatedSession()

    // For now, return an error indicating this needs proper admin setup
    // This would require using the Supabase Admin API with service role key
    throw new Error('User creation requires service role key configuration. This feature is not yet implemented.')
    }
  )
)