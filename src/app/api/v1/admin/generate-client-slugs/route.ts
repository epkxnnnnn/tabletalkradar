import { NextRequest } from 'next/server'
import { apiHandler, withAuth } from '@/lib/api-handler'
import { createServerClient } from '@/lib/supabase/server'
import { generateClientSlug } from '@/lib/utils/client-urls'

export const POST = apiHandler(
  async (req: NextRequest) => {
    return withAuth(req, async (user) => {
      const supabase = createServerClient()

      // Verify user is agency superadmin
      const { data: membership } = await supabase
        .from('agency_memberships')
        .select('agency_id, role')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin'])
        .eq('status', 'active')
        .single()

      if (!membership) {
        return Response.json(
          { error: 'Unauthorized - Agency admin access required' },
          { status: 403 }
        )
      }

      // Get all clients for this agency without slugs
      const { data: clients, error: fetchError } = await supabase
        .from('clients')
        .select('id, business_name, slug')
        .eq('agency_id', membership.agency_id)
        .is('slug', null)

      if (fetchError) throw fetchError

      const updates = []
      const slugMap = new Map<string, number>()

      // Generate unique slugs for each client
      for (const client of clients || []) {
        let baseSlug = generateClientSlug(client.business_name)
        let slug = baseSlug
        
        // Handle duplicates by appending numbers
        if (slugMap.has(baseSlug)) {
          const count = slugMap.get(baseSlug)! + 1
          slugMap.set(baseSlug, count)
          slug = `${baseSlug}-${count}`
        } else {
          slugMap.set(baseSlug, 1)
        }

        // Add first 8 chars of ID for extra uniqueness
        slug = `${slug}-${client.id.substring(0, 8)}`

        updates.push({
          id: client.id,
          slug
        })
      }

      // Update all clients with their new slugs
      const updatePromises = updates.map(({ id, slug }) =>
        supabase
          .from('clients')
          .update({ slug })
          .eq('id', id)
      )

      await Promise.all(updatePromises)

      return Response.json({
        success: true,
        updated: updates.length,
        clients: updates
      })
    })
  }
)