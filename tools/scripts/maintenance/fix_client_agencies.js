const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixClientAgencyAssociation() {
  console.log('🔧 Fixing client-agency associations...');
  
  // Get Rep Pro Marketing Agency ID
  const { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .select('id, name, owner_id')
    .eq('name', 'Rep Pro Marketing Agency')
    .single();
    
  if (agencyError || !agency) {
    console.error('❌ Rep Pro Marketing Agency not found:', agencyError?.message);
    return;
  }
  
  console.log(`🏢 Found agency: ${agency.name} (ID: ${agency.id})`);
  
  // Update all clients with null agency_id to belong to Rep Pro Marketing Agency
  const { data: updatedClients, error: updateError } = await supabase
    .from('clients')
    .update({ agency_id: agency.id })
    .is('agency_id', null)
    .select('id, business_name');
    
  if (updateError) {
    console.error('❌ Error updating clients:', updateError.message);
    return;
  }
  
  console.log(`✅ Updated ${updatedClients?.length || 0} clients to belong to Rep Pro Marketing Agency`);
  
  if (updatedClients && updatedClients.length > 0) {
    console.log('\n📋 Updated clients:');
    updatedClients.forEach((client, i) => {
      console.log(`${i+1}. ${client.business_name}`);
    });
  }
  
  // Verify the update
  const { data: verifyClients } = await supabase
    .from('clients')
    .select('id, business_name, agency_id')
    .eq('agency_id', agency.id);
    
  console.log(`\n🎉 Total clients now associated with Rep Pro Marketing Agency: ${verifyClients?.length || 0}`);
  
  // Also create agency membership if it doesn't exist
  console.log('\n🔧 Checking agency membership...');
  const { data: existingMembership } = await supabase
    .from('agency_memberships')
    .select('*')
    .eq('agency_id', agency.id)
    .eq('user_id', agency.owner_id)
    .single();

  if (!existingMembership) {
    console.log('📝 Creating agency membership...');
    const { error: membershipError } = await supabase
      .from('agency_memberships')
      .insert({
        agency_id: agency.id,
        user_id: agency.owner_id,
        role: 'owner',
        status: 'active'
      });

    if (membershipError) {
      console.error('❌ Error creating membership:', membershipError.message);
    } else {
      console.log('✅ Agency membership created');
    }
  } else {
    console.log('✅ Agency membership already exists');
  }
}

fixClientAgencyAssociation().catch(console.error);