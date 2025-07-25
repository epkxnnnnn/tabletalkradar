#!/usr/bin/env node
/**
 * Setup Script for Linking 7 Clients to Google Business Profile
 * 
 * This script helps you connect your 7 clients to Google Business Profile
 * using the existing TableTalk Radar infrastructure.
 * 
 * Usage:
 * 1. Run: npm run setup:gmb-clients
 * 2. Follow the interactive prompts
 * 3. The script will create client locations and link them to Google Business
 */

import { googleBusinessSyncService } from '../src/lib/google-business-sync'
import { supabaseAdmin } from '../src/lib/supabase-admin'
import { logger } from '../src/lib/logger'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

interface ClientSetup {
  clientId: string
  businessName: string
  googleAccountId: string
  locationName: string
  address: string
  city: string
  state: string
  zipCode: string
  phone?: string
  website?: string
}

async function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve)
  })
}

async function getClients() {
  const { data: clients, error } = await (supabaseAdmin() as any)
    .from('clients')
    .select('id, business_name, email, phone, website')
    .order('business_name')

  if (error) {
    throw error as any
  }

  return clients || []
}

async function createClientLocation(clientSetup: ClientSetup) {
  try {
    // Create client location
    const { data: location, error: locationError } = await (supabaseAdmin() as any)
      .from('client_locations')
      .insert({
        client_id: clientSetup.clientId,
        agency_id: 'your-agency-id', // You'll need to set this
        location_name: clientSetup.locationName || 'Main Location',
        business_name: clientSetup.businessName,
        address: clientSetup.address,
        city: clientSetup.city,
        state: clientSetup.state,
        zip_code: clientSetup.zipCode,
        phone: clientSetup.phone,
        website: clientSetup.website,
        is_primary_location: true,
        is_active: true,
        display_order: 1
      })
      .select()
      .single()

    if (locationError) {
      throw locationError as any
    }

    return location
  } catch (error) {
    logger.error('Failed to create client location:', error as any)
    throw error
  }
}

async function initiateGoogleOAuth(clientId: string, locationId: string) {
  console.log(`\n🔐 Setting up Google Business Profile for client ${clientId}`)
  console.log(`📍 Location ID: ${locationId}`)
  
  const authUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/v1/google-business/auth?client_id=${clientId}`
  console.log(`\n🔗 Please visit this URL to authorize Google Business Profile:`)
  console.log(authUrl)
  
  const googleAccountId = await prompt('\nEnter the Google Account ID after authorization: ')
  
  return googleAccountId
}

async function setupClient(client: any) {
  console.log(`\n🎯 Setting up: ${client.business_name}`)
  
  const locationName = await prompt('Location name (e.g., "Main Location", "Downtown Branch"): ') || 'Main Location'
  const address = await prompt('Business address: ')
  const city = await prompt('City: ')
  const state = await prompt('State: ')
  const zipCode = await prompt('ZIP Code: ')
  
  const clientSetup: ClientSetup = {
    clientId: client.id,
    businessName: client.business_name,
    googleAccountId: '',
    locationName,
    address,
    city,
    state,
    zipCode,
    phone: client.phone,
    website: client.website
  }

  try {
    // Create client location
    const location = await createClientLocation(clientSetup)
    console.log(`✅ Created location: ${location.id}`)
    
    // Get Google Account ID
    const googleAccountId = await initiateGoogleOAuth(client.id, location.id)
    
    // Link to Google Business
    await googleBusinessSyncService.linkClientToGoogleBusiness({
      clientId: client.id,
      locationId: location.id,
      googleAccountId,
      accessToken: 'placeholder' // Will be updated during OAuth
    })
    
    // Sync initial data
    await googleBusinessSyncService.syncLocationData(client.id, location.id, googleAccountId)
    
    console.log(`✅ Successfully linked ${client.business_name} to Google Business Profile`)
    
  } catch (error) {
    console.error(`❌ Failed to setup ${client.business_name}:`, error as any)
  }
}

async function main() {
  console.log('🚀 TableTalk Radar - Google Business Profile Setup')
  console.log('================================================\n')
  
  try {
    // Get existing clients
    const clients = await getClients()
    
    if (clients.length === 0) {
      console.log('❌ No clients found. Please create clients first.')
      return
    }
    
    console.log(`Found ${clients.length} clients:\n`)
    clients.forEach((client: any, index: number) => {
      console.log(`${index + 1}. ${client.business_name} (${client.email})`)
    })
    
    console.log('\n📋 Starting setup process...\n')
    
    for (const client of clients) {
      const shouldSetup = await prompt(`\nSetup Google Business for ${client.business_name}? (y/n): `)
      if (shouldSetup.toLowerCase() === 'y') {
        await setupClient(client)
      }
    }
    
    console.log('\n🎉 Setup complete! All selected clients are now linked to Google Business Profile.')
    
  } catch (error) {
    console.error('❌ Setup failed:', error as any)
  } finally {
    rl.close()
  }
}

// Run if called directly
if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  main().catch(console.error);
}

export { main as setupGoogleBusinessClients }
