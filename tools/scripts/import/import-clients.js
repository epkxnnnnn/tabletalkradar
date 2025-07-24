// Client Import Script - Run with: node import-clients.js
// Imports the 7 clients from Rep_Pro_Client_Directory.csv into Supabase

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key'
const supabase = createClient(supabaseUrl, supabaseKey)

// Your user ID (Super Admin) - replace with actual ID
const ADMIN_USER_ID = 'your_user_id_here'

const clientsData = [
  {
    "business_name": "LullaBar Thai Fusion",
    "website": "https://lullabarlv.com/",
    "contact_email": "lullabar@updates.reppro.io",
    "contact_phone": "(702) 760-7888",
    "industry": "food-beverage",
    "business_type": "restaurant",
    "category": "Thai Fusion Restaurant",
    "notes": "Code: lullabar, Google Biz ID: 05162981688351067589",
    "google_business_id": "05162981688351067589",
    "locations": [
      {
        "business_name": "LullaBar Thai Fusion",
        "address": "",
        "city": "Las Vegas",
        "state": "NV",
        "zip_code": "",
        "phone": "(702) 760-7888",
        "website": "https://lullabarlv.com/"
      }
    ]
  },
  {
    "business_name": "Alisa Sushi & Thai Bistro",
    "website": "https://alisasushithai.com/",
    "contact_email": "alisa@updates.reppro.io",
    "contact_phone": "(808) 359-7896",
    "industry": "food-beverage",
    "business_type": "restaurant",
    "category": "Sushi & Thai Restaurant",
    "notes": "Code: alisa_sushi, Google Biz ID: 13939946554744103274",
    "google_business_id": "13939946554744103274",
    "locations": [
      {
        "business_name": "Alisa Sushi & Thai Bistro",
        "address": "",
        "city": "Lihue",
        "state": "HI",
        "zip_code": "",
        "phone": "(808) 359-7896",
        "website": "https://alisasushithai.com/"
      }
    ]
  },
  {
    "business_name": "Koloa Thai Bistro",
    "website": "https://koloathai.com/",
    "contact_email": "koloa@updates.reppro.io",
    "contact_phone": "(808) 359-7878",
    "industry": "food-beverage",
    "business_type": "restaurant",
    "category": "Thai Restaurant",
    "notes": "Code: koloa_thai, Google Biz ID: 01432254699959395236",
    "google_business_id": "01432254699959395236",
    "locations": [
      {
        "business_name": "Koloa Thai Bistro",
        "address": "",
        "city": "Koloa",
        "state": "HI",
        "zip_code": "",
        "phone": "(808) 359-7878",
        "website": "https://koloathai.com/"
      }
    ]
  },
  {
    "business_name": "Daikon Vegan Sushi & More",
    "website": "https://daikonvegansushi.com/",
    "contact_email": "daikon@updates.reppro.io",
    "contact_phone": "(702) 749-3283",
    "industry": "food-beverage",
    "business_type": "restaurant",
    "category": "Vegan Sushi Restaurant",
    "notes": "Code: daikon_vegan, Google Biz ID: 17268413971148579646",
    "google_business_id": "17268413971148579646",
    "locations": [
      {
        "business_name": "Daikon Vegan Sushi & More",
        "address": "",
        "city": "Las Vegas",
        "state": "NV",
        "zip_code": "",
        "phone": "(702) 749-3283",
        "website": "https://daikonvegansushi.com/"
      }
    ]
  },
  {
    "business_name": "Basil Vegan Thai & Sushi",
    "website": "https://basilveganthai.com/",
    "contact_email": "basil@updates.reppro.io",
    "contact_phone": "(702) 357-3837",
    "industry": "food-beverage",
    "business_type": "restaurant",
    "category": "Vegan Thai & Sushi Restaurant",
    "notes": "Code: basil_vegan, Google Biz ID: 12704341248342351590",
    "google_business_id": "12704341248342351590",
    "locations": [
      {
        "business_name": "Basil Vegan Thai & Sushi",
        "address": "",
        "city": "Las Vegas",
        "state": "NV",
        "zip_code": "",
        "phone": "(702) 357-3837",
        "website": "https://basilveganthai.com/"
      }
    ]
  },
  {
    "business_name": "Bright Facial Spa & Thai Massage",
    "website": "https://www.brightspalv.com/",
    "contact_email": "brightspa@updates.reppro.io",
    "contact_phone": "(725) 696-4289",
    "industry": "health-wellness",
    "business_type": "spa",
    "category": "Facial Spa & Massage",
    "notes": "Code: bright_spa, Google Biz ID: 05826165322071156658",
    "google_business_id": "05826165322071156658",
    "locations": [
      {
        "business_name": "Bright Facial Spa & Thai Massage",
        "address": "",
        "city": "Las Vegas",
        "state": "NV",
        "zip_code": "",
        "phone": "(725) 696-4289",
        "website": "https://www.brightspalv.com/"
      }
    ]
  },
  {
    "business_name": "Chang Kao Thai Cuisine",
    "website": "https://www.changkaothai.com/",
    "contact_email": "changkao@updates.reppro.io",
    "contact_phone": "(941) 739-2217",
    "industry": "food-beverage",
    "business_type": "restaurant",
    "category": "Thai Restaurant",
    "notes": "Code: changkao, Google Biz ID: 7603485187217417605",
    "google_business_id": "7603485187217417605",
    "locations": [
      {
        "business_name": "Chang Kao Thai Cuisine",
        "address": "",
        "city": "Bradenton",
        "state": "FL",
        "zip_code": "",
        "phone": "(941) 739-2217",
        "website": "https://www.changkaothai.com/"
      }
    ]
  }
]

async function importClients() {
  console.log('Starting client import...')
  
  try {
    for (const clientData of clientsData) {
      console.log(`Importing ${clientData.business_name}...`)
      
      // Insert client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: ADMIN_USER_ID,
          business_name: clientData.business_name,
          contact_email: clientData.contact_email,
          contact_phone: clientData.contact_phone,
          website: clientData.website,
          industry: clientData.industry,
          business_type: clientData.business_type,
          category: clientData.category,
          notes: clientData.notes,
          google_account_id: clientData.google_business_id,
          status: 'active',
          is_agency: false
        })
        .select()
        .single()
      
      if (clientError) {
        console.error(`Error importing ${clientData.business_name}:`, clientError)
        continue
      }
      
      console.log(`✓ Created client: ${client.business_name}`)
      
      // Insert locations
      for (const locationData of clientData.locations) {
        const { data: location, error: locationError } = await supabase
          .from('client_locations')
          .insert({
            client_id: client.id,
            business_name: locationData.business_name,
            address: locationData.address || '',
            city: locationData.city,
            state: locationData.state,
            zip_code: locationData.zip_code || '',
            phone: locationData.phone,
            website: locationData.website,
            google_account_id: clientData.google_business_id,
            is_primary: true,
            is_active: true
          })
          .select()
          .single()
        
        if (locationError) {
          console.error(`Error importing location for ${clientData.business_name}:`, locationError)
        } else {
          console.log(`  ✓ Created location: ${location.city}, ${location.state}`)
        }
      }
    }
    
    console.log('\n✅ Client import completed successfully!')
    console.log('Next steps:')
    console.log('1. Go to your Agency Dashboard')
    console.log('2. Click "Google Business Manager" tab')
    console.log('3. Connect Google accounts for each client')
    
  } catch (error) {
    console.error('Import failed:', error)
  }
}

// Run the import
importClients()