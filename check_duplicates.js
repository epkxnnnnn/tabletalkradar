const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDuplicates() {
  const { data } = await supabase
    .from('clients')
    .select('id, business_name, location, created_at')
    .order('created_at');
  
  console.log('📋 All clients with creation dates:\n');
  
  const groups = {};
  data.forEach((client, i) => {
    const key = `${client.business_name} - ${client.location}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push({...client, index: i+1});
  });
  
  let duplicateCount = 0;
  Object.keys(groups).forEach(key => {
    const clients = groups[key];
    if (clients.length > 1) {
      duplicateCount += clients.length - 1;
      console.log(`🔴 DUPLICATE: ${key} (${clients.length} entries)`);
      clients.forEach(c => {
        console.log(`   - ID: ${c.id} | Created: ${c.created_at}`);
      });
      console.log('');
    } else {
      console.log(`✅ ${key}`);
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`Total records: ${data.length}`);
  console.log(`Unique businesses: ${Object.keys(groups).length}`);
  console.log(`Duplicates to remove: ${duplicateCount}`);
}

checkDuplicates();