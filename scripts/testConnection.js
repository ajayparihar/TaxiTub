// Test Supabase connection
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Set (length: ' + process.env.VITE_SUPABASE_ANON_KEY.length + ')' : 'Not set');

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.error('Environment variables not set');
  process.exit(1);
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    // First test basic connection
    const { data: healthData, error: healthError } = await supabase.from('carinfo').select('*').limit(1);
    if (healthError) {
      console.error('Database error:', healthError);
      
      // Try to check if table exists by listing tables
      console.log('Checking if table exists...');
      const { data: tables, error: tableError } = await supabase.rpc('get_table_info', {});
      if (tableError) {
        console.log('Cannot check tables, maybe RLS is blocking or table does not exist');
        console.log('Supabase error code:', healthError.code);
        console.log('Supabase error details:', healthError.details);
        console.log('Supabase error hint:', healthError.hint);
      }
      return;
    }
    console.log('Connection successful! Found', healthData?.length || 0, 'records');
    if (healthData && healthData.length > 0) {
      console.log('Sample record:', healthData[0]);
    }
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
}

testConnection();
