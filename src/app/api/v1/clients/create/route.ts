import { NextRequest } from 'next/server'
import { z } from 'zod'
import { apiHandler, withAuth } from '@/lib/api-handler'
import { createServerClient } from '@/lib/supabase/server'
import { generateClientSlug } from '@/lib/utils/client-urls'

// Validation schema matching database structure
const CreateClientSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  contact_email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  category: z.string().optional(),
  industry: z.string().optional(),
  business_type: z.string().optional(),
  client_tier: z.enum(['basic', 'standard', 'premium', 'enterprise']).optional(),
})

export const POST = apiHandler(
  async (req: NextRequest) => {
    return withAuth(req, async (user) => {
      const supabase = createServerClient()
      const body = await req.json()
      
      // Validate input
      const validationResult = CreateClientSchema.safeParse(body)
      if (!validationResult.success) {
        return Response.json(
          { error: 'Invalid input', details: validationResult.error.errors },
          { status: 400 }
        )
      }
      
      const data = validationResult.data

      // Get user's agency membership
      const { data: membership, error: membershipError } = await supabase
        .from('agency_memberships')
        .select('agency_id, role')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin'])
        .eq('status', 'active')
        .single()

      if (membershipError || !membership) {
        return Response.json(
          { error: 'You must be an agency admin to create clients' },
          { status: 403 }
        )
      }

      // Generate unique slug
      const baseSlug = generateClientSlug(data.business_name)
      let slug = baseSlug
      let counter = 1

      // Check for existing slugs and make unique
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .eq('slug', slug)
          .single()

        if (!existing) break
        
        slug = `${baseSlug}-${counter}`
        counter++
      }

      // Create the client
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          owner_id: user.id,
          agency_id: membership.agency_id,
          business_name: data.business_name,
          phone: data.phone,
          website: data.website,
          category: data.category,
          industry: data.industry,
          business_type: data.business_type,
          client_tier: data.client_tier || 'basic',
          status: 'active',
          is_agency: false,
          slug: slug
        })
        .select()
        .single()

      if (clientError) {
        console.error('Client creation error:', clientError)
        return Response.json(
          { error: 'Failed to create client', details: clientError.message },
          { status: 500 }
        )
      }

      // If contact email provided, create a client user record
      if (data.contact_email) {
        // Create or get auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: data.contact_email,
          email_confirm: true,
          user_metadata: {
            full_name: data.business_name,
            role: 'client'
          }
        })

        if (!authError && authUser.user) {
          // Create client_users record
          await supabase
            .from('client_users')
            .insert({
              user_id: authUser.user.id,
              client_id: newClient.id,
              agency_id: membership.agency_id,
              role: 'owner',
              is_active: true,
              invited_by: user.id
            })
        }
      }

      return Response.json({
        success: true,
        data: {
          ...newClient,
          dashboard_url: `/clients/${newClient.slug}`
        },
        message: 'Client created successfully'
      })
    })
  }
)