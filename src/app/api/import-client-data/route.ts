import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import fs from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RestaurantData {
  Code: string
  Name: string
  Phone: string
  Email: string
  'Twilio Number': string
  Location: string
  Website: string
  'Order Link': string
  RSVP: string
  Review: string
  'Google Business ID': string
}

export async function POST(request: NextRequest) {
  try {
    const csvFilePath = '/Users/topwireless/Downloads/client/restaurant_full_info.csv'
    
    // Check if file exists
    if (!fs.existsSync(csvFilePath)) {
      return NextResponse.json({ 
        error: 'CSV file not found',
        path: csvFilePath 
      }, { status: 404 })
    }

    // Read and parse CSV file
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8')
    const records: RestaurantData[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    })

    console.log(`Found ${records.length} restaurants in CSV`)

    const results = []
    let updated = 0
    let created = 0

    for (const restaurant of records) {
      try {
        // Skip empty rows
        if (!restaurant.Code || !restaurant.Name) continue

        // Parse address
        const addressParts = restaurant.Location.split(', ')
        const zipMatch = restaurant.Location.match(/\d{5}(-\d{4})?/)
        const stateMatch = restaurant.Location.match(/([A-Z]{2})\s+\d{5}/)
        
        const zipCode = zipMatch ? zipMatch[0] : ''
        const state = stateMatch ? stateMatch[1] : ''
        const city = addressParts.length >= 2 ? addressParts[addressParts.length - 2].replace(/\s+[A-Z]{2}$/, '') : ''
        const address = addressParts[0] || restaurant.Location

        // Check if client already exists by business name or code
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .or(`business_name.eq.${restaurant.Name},external_id.eq.${restaurant.Code}`)
          .single()

        let clientId = existingClient?.id

        if (!clientId) {
          // Create new client
          const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert({
              business_name: restaurant.Name,
              contact_name: restaurant.Name,
              email: restaurant.Email,
              phone: restaurant.Phone,
              website: restaurant.Website,
              industry: 'Food & Dining',
              business_type: 'Restaurant',
              external_id: restaurant.Code,
              service_tier: 'premium',
              status: 'active',
              agency_id: (await getDefaultAgencyId())
            })
            .select('id')
            .single()

          if (clientError) {
            console.error(`Error creating client ${restaurant.Name}:`, clientError)
            results.push({
              restaurant: restaurant.Name,
              status: 'error',
              error: clientError.message
            })
            continue
          }

          clientId = newClient.id
          created++
        }

        // Check if location already exists
        const { data: existingLocation } = await supabase
          .from('client_locations')
          .select('id')
          .eq('client_id', clientId)
          .eq('is_primary_location', true)
          .single()

        const locationData = {
          client_id: clientId,
          agency_id: (await getDefaultAgencyId()),
          location_name: 'Main Location',
          business_name: restaurant.Name,
          address: address,
          city: city,
          state: state,
          zip_code: zipCode,
          phone: restaurant.Phone,
          website: restaurant.Website,
          email: restaurant.Email,
          google_place_id: restaurant['Google Business ID'] || null,
          google_business_profile_url: restaurant.Review || null,
          is_primary_location: true,
          is_active: true,
          display_order: 1,
          business_description: `${restaurant.Name} - ${restaurant.Location}`,
          custom_fields: {
            order_link: restaurant['Order Link'],
            rsvp_link: restaurant.RSVP,
            twilio_number: restaurant['Twilio Number'],
            external_code: restaurant.Code
          }
        }

        if (existingLocation) {
          // Update existing location
          const { error: updateError } = await supabase
            .from('client_locations')
            .update(locationData)
            .eq('id', existingLocation.id)

          if (updateError) {
            console.error(`Error updating location ${restaurant.Name}:`, updateError)
            results.push({
              restaurant: restaurant.Name,
              status: 'error',
              error: updateError.message
            })
          } else {
            results.push({
              restaurant: restaurant.Name,
              status: 'updated',
              google_business_id: restaurant['Google Business ID'],
              location_id: existingLocation.id
            })
            updated++
          }
        } else {
          // Create new location
          const { data: newLocation, error: locationError } = await supabase
            .from('client_locations')
            .insert(locationData)
            .select('id')
            .single()

          if (locationError) {
            console.error(`Error creating location ${restaurant.Name}:`, locationError)
            results.push({
              restaurant: restaurant.Name,
              status: 'error',
              error: locationError.message
            })
          } else {
            results.push({
              restaurant: restaurant.Name,
              status: 'created',
              google_business_id: restaurant['Google Business ID'],
              location_id: newLocation.id
            })
            created++
          }
        }

      } catch (error) {
        console.error(`Error processing ${restaurant.Name}:`, error)
        results.push({
          restaurant: restaurant.Name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${created} created, ${updated} updated`,
      statistics: {
        total_processed: records.length,
        created: created,
        updated: updated,
        errors: results.filter(r => r.status === 'error').length
      },
      results: results
    })

  } catch (error) {
    console.error('Error importing client data:', error)
    return NextResponse.json(
      { error: 'Failed to import client data' },
      { status: 500 }
    )
  }
}

// Helper function to get default agency ID
async function getDefaultAgencyId(): Promise<string> {
  const { data: agency } = await supabase
    .from('agencies')
    .select('id')
    .limit(1)
    .single()
  
  return agency?.id || 'default-agency-id'
}