const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function removeDuplicateBusinesses() {
  console.log('🔧 Removing duplicate businesses...');
  
  // Get Rep Pro Marketing Agency ID
  const { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .select('id, name')
    .eq('name', 'Rep Pro Marketing Agency')
    .single();
    
  if (agencyError || !agency) {
    console.error('❌ Rep Pro Marketing Agency not found:', agencyError?.message);
    return;
  }
  
  console.log(`🏢 Found agency: ${agency.name} (ID: ${agency.id})`);
  
  // Get all clients for this agency
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('id, business_name, created_at')
    .eq('agency_id', agency.id)
    .order('created_at', { ascending: true });
    
  if (clientError) {
    console.error('❌ Error fetching clients:', clientError.message);
    return;
  }
  
  console.log(`📊 Total clients found: ${clients?.length || 0}`);
  
  // Group clients by business name (case insensitive)
  const businessGroups = {};
  clients.forEach(client => {
    const normalizedName = client.business_name.toLowerCase().trim();
    if (!businessGroups[normalizedName]) {
      businessGroups[normalizedName] = [];
    }
    businessGroups[normalizedName].push(client);
  });
  
  // Find duplicates and mark them for deletion
  const toDelete = [];
  let duplicateCount = 0;
  
  console.log('\n📋 Analyzing duplicates:');
  Object.entries(businessGroups).forEach(([normalizedName, group]) => {
    if (group.length > 1) {
      console.log(`\n🔍 Found ${group.length} duplicates of "${group[0].business_name}":`);
      // Keep the first one (oldest), mark others for deletion
      const toKeep = group[0];
      const duplicates = group.slice(1);
      
      console.log(`  ✅ Keeping: ${toKeep.business_name} (ID: ${toKeep.id}, Created: ${toKeep.created_at})`);
      duplicates.forEach(duplicate => {
        console.log(`  ❌ Deleting: ${duplicate.business_name} (ID: ${duplicate.id}, Created: ${duplicate.created_at})`);
        toDelete.push(duplicate.id);
        duplicateCount++;
      });
    }
  });
  
  if (toDelete.length === 0) {
    console.log('\n🎉 No duplicates found!');
    return;
  }
  
  console.log(`\n🗑️  Deleting ${toDelete.length} duplicate entries...`);
  
  // Delete duplicates
  const { error: deleteError } = await supabase
    .from('clients')
    .delete()
    .in('id', toDelete);
    
  if (deleteError) {
    console.error('❌ Error deleting duplicates:', deleteError.message);
    return;
  }
  
  console.log(`✅ Successfully deleted ${duplicateCount} duplicate businesses`);
  
  // Verify final count
  const { data: finalClients } = await supabase
    .from('clients')
    .select('id, business_name')
    .eq('agency_id', agency.id);
    
  console.log(`\n🎉 Final client count: ${finalClients?.length || 0}`);
  
  if (finalClients && finalClients.length > 0) {
    console.log('\n📋 Remaining unique businesses:');
    finalClients.forEach((client, i) => {
      console.log(`${i+1}. ${client.business_name}`);
    });
  }
}

removeDuplicateBusinesses().catch(console.error);