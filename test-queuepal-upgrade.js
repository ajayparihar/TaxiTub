// Test queuepal table after upgrade
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQueuepalTable() {
  console.log('🧪 Testing queuepal table after upgrade...\n');
  
  try {
    // Test 1: Check if table exists and what columns it has
    console.log('📊 Test 1: Table structure check');
    const { data, error } = await supabase
      .from('queuepal')
      .select('*')
      .limit(3);
      
    if (error) {
      console.log('❌ queuepal table access failed:', error.message);
      return;
    }
    
    console.log('✅ queuepal table is accessible!');
    console.log(`📋 Found ${data.length} records`);
    
    if (data.length > 0) {
      console.log('🔍 Available columns:', Object.keys(data[0]).join(', '));
      console.log('\n📝 Sample record:');
      console.log(JSON.stringify(data[0], null, 2));
      
      // Check if authentication columns exist
      const firstRecord = data[0];
      const hasAuthCols = firstRecord.hasOwnProperty('username') && 
                         firstRecord.hasOwnProperty('password') && 
                         firstRecord.hasOwnProperty('is_active');
      
      if (hasAuthCols) {
        console.log('\n✅ Authentication columns are present!');
        
        // Test 2: Try authentication-style query
        console.log('\n📊 Test 2: Authentication query test');
        const { data: authTest, error: authError } = await supabase
          .from('queuepal')
          .select('id, username, name, password, is_active')
          .eq('is_active', true);
          
        if (authError) {
          console.log('❌ Authentication query failed:', authError.message);
        } else {
          console.log('✅ Authentication query successful!');
          console.log(`👥 Found ${authTest.length} active users:`);
          authTest.forEach(user => {
            console.log(`   - ${user.username} (${user.name}) - Password set: ${!!user.password}`);
          });
        }
      } else {
        console.log('\n⚠️ Authentication columns missing. Run the upgrade SQL script first.');
        console.log('Required columns: username, password, is_active');
      }
    } else {
      console.log('⚠️ No records found in queuepal table');
    }
    
  } catch (err) {
    console.log('❌ Test failed:', err.message);
  }
}

testQueuepalTable();
