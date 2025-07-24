// TableTalk Radar - Create Super Admin API (v1)
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withValidation, 
  withMethods,
  successResponse,
  AuthenticationError
} from '@/lib/api-handler'
import { createSuperAdmin } from '@/lib/supabase-admin'

// Request validation schemas
const CreateSuperAdminSchema = z.object({
  secret: z.string().min(1, 'Secret is required')
})

// POST /api/v1/admin/admin/create-superadmin - Create super admin account
export const POST = withMethods(['POST'])(
  withValidation(CreateSuperAdminSchema)(
    async (req: NextRequest, data: z.infer<typeof CreateSuperAdminSchema>) => {
    const { secret } = data
    
    // Simple secret check - in production, use environment variables
    if (secret !== 'tabletalksuperadmin2025') {
      throw new AuthenticationError('Invalid secret')
    }

    const result = await createSuperAdmin()
    
    if (result.error) {
      throw new Error(`Failed to create superadmin account: ${result.error}`)
    }

    return successResponse(
      {
        user: {
          id: result.user?.id,
          email: 'kphstk@gmail.com'
        }
      },
      'Superadmin account created successfully'
    )
    }
  )
)

