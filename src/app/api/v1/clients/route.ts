// TableTalk Radar - Clients API (v1)
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withApiHandler, 
  withValidation, 
  withMethods,
  successResponse,
  createdResponse,
  AuthenticationError,
  AuthorizationError
} from '@/lib/api-handler'
import { ClientImportSchema } from '@/types'
import { supabaseAdmin, getProfile } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'

// Request validation schemas
const GetClientsSchema = z.object({
  limit: z.string().optional(),
  offset: z.string().optional()
})

const CreateClientSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1)
})

// Authentication helper
async function getAuthenticatedProfile() {
  const cookieStore = await cookies()
  const access_token = cookieStore.get('sb-access-token')?.value
  
  if (!access_token) {
    throw new AuthenticationError('Not authenticated')
  }
  
  const profile = await getProfile(access_token)
  if (!profile?.id) {
    throw new AuthorizationError('Invalid profile')
  }
  
  return profile
}

// GET /api/v1/clients - List clients
export const GET = withMethods(['GET'])(
  withValidation(GetClientsSchema)(
    async (req: NextRequest, query: z.infer<typeof GetClientsSchema>) => {
    const profile = await getAuthenticatedProfile()
    const limit = Number(query.limit) || 50
    const offset = Number(query.offset) || 0
    
    let dbQuery = supabaseAdmin()
      .from('clients')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })
    
    // Super admin sees all clients, others see their own
    if ((profile as any).role !== 'superadmin') {
      dbQuery = dbQuery.eq('owner_id', (profile as any).id)
    }
    
    const { data: clients, error } = await dbQuery
    
    if (error) {
      throw new Error(`Failed to fetch clients: ${error.message}`)
    }
    
    return successResponse({ clients }, `Retrieved ${clients?.length || 0} clients`)
    }
  )
)

// POST /api/v1/clients - Create client
export const POST = withMethods(['POST'])(
  withValidation(CreateClientSchema)(
    async (req: NextRequest, data: z.infer<typeof CreateClientSchema>) => {
    const profile = await getAuthenticatedProfile()
    
    if ((profile as any).role !== 'superadmin') {
      throw new AuthorizationError('Only superadmin can create clients')
    }
    
    const { email, name } = data
    
    // Create user in Supabase Auth
    const { data: user, error: userError } = await supabaseAdmin().auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name, role: 'client' }
    })
    
    if (userError) {
      throw new Error(`Failed to create user: ${userError.message}`)
    }
    
    // Insert into clients table
    const { error: insertError } = await supabaseAdmin().from('clients').insert({
      id: user.user?.id,
      email,
      name
    })
    
    if (insertError) {
      throw new Error(`Failed to create client: ${insertError.message}`)
    }
    
    const client = { id: user.user?.id, email, name }
    return createdResponse(client, 'Client created successfully')
    }
  )
)

