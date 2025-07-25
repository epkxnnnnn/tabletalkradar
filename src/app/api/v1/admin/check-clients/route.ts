import { NextRequest, NextResponse } from 'next/server'
import { withApiHandler, successResponse } from '@/lib/api-handler'
import { createServerClient } from '@/lib/supabase/server'
import type { Client } from '@/types'

export const GET = withApiHandler(
  async (req: NextRequest) => {
    const supabase = await createServerClient()

    // For now, skip auth check - TODO: implement proper auth
    // const { data: membership } = await supabase
    //   .from('agency_memberships')
    //   .select('agency_id, role')
    //   .eq('user_id', user.id)
    //   .in('role', ['owner', 'admin'])
    //   .eq('status', 'active')
    //   .single()

    // if (!membership) {
    //   return Response.json(
    //     { error: 'Unauthorized - Agency admin access required' },
    //     { status: 403 }
    //   )
    // }

      // Get total client count
      const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        // Skip agency filter for now

      // Get clients with details
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          agencies (
            id,
            name
          ),
          client_users (
            id,
            user_id,
            role,
            is_active
          )
        `)
        // Skip agency filter for now
        .order('created_at', { ascending: false })

      if (clientsError) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Failed to fetch clients', 
            details: clientsError 
          },
          { status: 500 }
        )
      }

      // Analyze the data
      const analysis = {
        total_clients: totalClients || 0,
        clients_with_slugs: clients?.filter((c: Client) => c.slug).length || 0,
        clients_without_slugs: clients?.filter((c: Client) => !c.slug).length || 0,
        active_clients: clients?.filter((c: Client) => c.status === 'active').length || 0,
        clients_with_users: clients?.filter((c: any) => c.client_users && c.client_users.length > 0).length || 0,
        clients_by_tier: {
          basic: clients?.filter((c: Client) => c.client_tier === 'basic').length || 0,
          standard: clients?.filter((c: Client) => c.client_tier === 'standard').length || 0,
          premium: clients?.filter((c: Client) => c.client_tier === 'premium').length || 0,
          enterprise: clients?.filter((c: Client) => c.client_tier === 'enterprise').length || 0,
          unassigned: clients?.filter((c: Client) => !c.client_tier).length || 0
        }
      }

      // Get client locations count
      const { count: locationsCount } = await supabase
        .from('client_locations')
        .select('*', { count: 'exact', head: true })
        .in('client_id', clients?.map((c: Client) => c.id) || [])

      // List clients that need attention
      const clientsNeedingAttention = clients?.filter((c: any) => 
        !c.slug || 
        !c.client_tier || 
        (!c.client_users || c.client_users.length === 0)
      ).map((c: any) => ({
        id: c.id,
        business_name: c.business_name,
        issues: [
          !c.slug && 'Missing slug',
          !c.client_tier && 'No tier assigned',
          (!c.client_users || c.client_users.length === 0) && 'No client users'
        ].filter(Boolean)
      }))

      return NextResponse.json({
        success: true,
        data: {
          summary: analysis,
          total_locations: locationsCount || 0,
          clients_needing_attention: clientsNeedingAttention,
          all_clients: clients?.map((c: any) => ({
            id: c.id,
            business_name: c.business_name,
            slug: c.slug,
            status: c.status,
            client_tier: c.client_tier,
            has_users: c.client_users && c.client_users.length > 0,
            user_count: c.client_users?.length || 0,
            created_at: c.created_at
          }))
        }
      })
  }
)