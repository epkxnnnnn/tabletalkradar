#!/usr/bin/env node
/**
 * Client Import Script for Agency Management Platform
 * Imports clients from CSV file to Supabase database
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const CSV_FILE_PATH = '/Users/topwireless/Downloads/client/updated_business_citations.csv';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_KEY';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
  console.error('❌ Error: Please set your Supabase environment variables');
  console.log('Either set them in your .env.local file or run:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_url SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/import-clients.js');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Parse CSV file
 */
function parseCSV(filePath) {
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line (handling quoted values)
    const values = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim()); // Add the last value
    
    if (values.length >= headers.length) {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      records.push(record);
    }
  }
  
  return records;
}

/**
 * Map CSV data to client record
 */
function mapToClientRecord(csvRecord, agencyId) {
  // Extract location parts
  const address = csvRecord['Street Address'] || '';
  const locationMatch = address.match(/(.*),\s*([A-Z]{2})\s*(\d{5})/);
  const city = locationMatch ? locationMatch[1].split(',').pop().trim() : '';
  const state = locationMatch ? locationMatch[2] : '';
  const zipCode = locationMatch ? locationMatch[3] : '';
  
  // Determine industry from categories
  const categories = csvRecord['Categories'] || '';
  let industry = 'Restaurant';
  if (categories.toLowerCase().includes('spa') || categories.toLowerCase().includes('massage')) {
    industry = 'Health & Wellness';
  } else if (categories.toLowerCase().includes('thai') || categories.toLowerCase().includes('sushi')) {
    industry = 'Food & Beverage';
  }
  
  // Determine business type
  let businessType = 'Restaurant';
  if (categories.toLowerCase().includes('spa')) {
    businessType = 'Spa & Wellness';
  } else if (categories.toLowerCase().includes('vegan')) {
    businessType = 'Vegan Restaurant';
  } else if (categories.toLowerCase().includes('thai')) {
    businessType = 'Thai Restaurant';
  } else if (categories.toLowerCase().includes('sushi')) {
    businessType = 'Sushi Restaurant';
  }
  
  // Parse hours
  const hours = csvRecord['Hours of Operation'] || '';
  
  // Determine status
  const status = csvRecord['Status'] || '';
  let clientStatus = 'active';
  if (status.toLowerCase().includes('inaccessible') || status.toLowerCase().includes('inactive')) {
    clientStatus = 'inactive';
  }
  
  // Create health score based on website status
  let healthScore = 85;
  if (clientStatus === 'inactive') {
    healthScore = 45;
  } else if (csvRecord['Website URL'] && csvRecord['Website URL'].startsWith('http')) {
    healthScore = 90;
  }
  
  return {
    agency_id: agencyId,
    business_name: csvRecord['Business Name'] || 'Unnamed Business',
    contact_name: null, // Not in CSV
    email: null, // Not in CSV
    phone: csvRecord['Phone Number'] || null,
    website: csvRecord['Website URL'] || null,
    
    // Business details
    industry,
    business_type: businessType,
    location: `${city}, ${state}`.replace(/^,\s*/, '') || 'Unknown',
    address,
    
    // Business characteristics
    founded_year: null,
    employee_count: null,
    annual_revenue: null,
    target_audience: 'Local customers and tourists',
    unique_selling_proposition: csvRecord['Description'] || null,
    
    // Service management
    service_tier: 'standard',
    account_manager: null,
    client_since: new Date().toISOString().split('T')[0],
    contract_value: null,
    billing_cycle: 'monthly',
    
    // Status and health
    status: clientStatus,
    health_score: healthScore,
    satisfaction_score: null,
    
    // Business intelligence
    competitors: [],
    market_position: null,
    growth_stage: 'mature',
    
    // Configuration
    audit_frequency: 'monthly',
    reporting_preferences: {
      email_reports: true,
      dashboard_access: true,
      frequency: 'weekly'
    },
    communication_preferences: {
      preferred_method: 'email',
      best_time: 'business_hours'
    },
    
    // Custom fields
    custom_fields: {
      categories: categories,
      hours_of_operation: hours,
      csv_imported: true,
      import_date: new Date().toISOString(),
      original_status: status,
      notes: csvRecord['Login/Notes'] || null
    },
    
    // Audit configuration
    audit_categories: ['website', 'social_media', 'reviews', 'seo', 'local_listings'],
    priority_areas: [industry.toLowerCase().replace(/\s+/g, '_')],
    
    // Timestamps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_audit_at: null,
    next_audit_due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
  };
}

/**
 * Get the first agency (assumes user has an agency)
 */
async function getFirstAgency() {
  const { data: agencies, error } = await supabase
    .from('agencies')
    .select('id, name, owner_id')
    .limit(1);
    
  if (error) {
    console.error('❌ Error fetching agencies:', error);
    return null;
  }
  
  if (!agencies || agencies.length === 0) {
    console.error('❌ No agencies found. Please create an agency first.');
    return null;
  }
  
  return agencies[0];
}

/**
 * Import clients
 */
async function importClients() {
  console.log('🚀 Starting client import process...\n');
  
  try {
    // Check if CSV file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.error(`❌ CSV file not found: ${CSV_FILE_PATH}`);
      return;
    }
    
    // Get agency
    console.log('📋 Fetching agency information...');
    const agency = await getFirstAgency();
    if (!agency) return;
    
    console.log(`✅ Found agency: ${agency.name} (ID: ${agency.id})\n`);
    
    // Parse CSV
    console.log('📄 Parsing CSV file...');
    const csvRecords = parseCSV(CSV_FILE_PATH);
    console.log(`✅ Found ${csvRecords.length} records in CSV\n`);
    
    if (csvRecords.length === 0) {
      console.log('⚠️  No valid records found in CSV file.');
      return;
    }
    
    // Convert to client records
    console.log('🔄 Converting CSV records to client format...');
    const clientRecords = csvRecords.map(record => mapToClientRecord(record, agency.id));
    
    // Insert clients
    console.log('💾 Inserting clients into database...');
    const { data: insertedClients, error: insertError } = await supabase
      .from('clients')
      .insert(clientRecords)
      .select('id, business_name, status, health_score');
    
    if (insertError) {
      console.error('❌ Error inserting clients:', insertError);
      return;
    }
    
    console.log(`✅ Successfully imported ${insertedClients.length} clients!\n`);
    
    // Display summary
    console.log('📊 Import Summary:');
    console.log('─'.repeat(50));
    
    const statusCounts = insertedClients.reduce((acc, client) => {
      acc[client.status] = (acc[client.status] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count} clients`);
    });
    
    const avgHealthScore = insertedClients.reduce((sum, client) => sum + (client.health_score || 0), 0) / insertedClients.length;
    console.log(`Average health score: ${Math.round(avgHealthScore)}/100`);
    
    console.log('\n📋 Imported Clients:');
    console.log('─'.repeat(70));
    insertedClients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.business_name} (${client.status}) - Health: ${client.health_score}/100`);
    });
    
    console.log('\n🎉 Client import completed successfully!');
    console.log('💡 Next steps:');
    console.log('   • Review clients in your agency dashboard');
    console.log('   • Run audits for imported clients');
    console.log('   • Set up contact information and account managers');
    
  } catch (error) {
    console.error('❌ Unexpected error during import:', error);
  }
}

// Run the import
importClients();