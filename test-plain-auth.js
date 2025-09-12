// Test plain text authentication
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPlainTextAuth() {
  console.log('🧪 Testing plain text authentication...\n');
  
  try {
    // Test 1: Check queuepal users
    console.log('📊 Test 1: QueuePal users');
    const { data: queuepalUsers, error: queuepalError } = await supabase
      .from('queuepal')
      .select('username, password, name, is_active');
      
    if (queuepalError) {
      console.log('❌ Failed to fetch queuepal users:', queuepalError.message);
    } else {
      console.log('✅ QueuePal users found:');
      queuepalUsers.forEach(user => {
        console.log(`   - ${user.username}/${user.password} (${user.name}) - Active: ${user.is_active}`);
      });
    }
    
    // Test 2: Check admin users
    console.log('\n📊 Test 2: Admin users');
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin')
      .select('username, password, full_name, is_active');
      
    if (adminError) {
      console.log('❌ Failed to fetch admin users:', adminError.message);
    } else {
      console.log('✅ Admin users found:');
      adminUsers.forEach(user => {
        console.log(`   - ${user.username}/${user.password} (${user.full_name}) - Active: ${user.is_active}`);
      });
    }
    
    // Test 3: Simulate authentication for QueuePal
    console.log('\n📊 Test 3: Simulate QueuePal authentication');
    const testUsername = 'dev';
    const testPassword = 'dev';
    
    const { data: authTest, error: authError } = await supabase
      .from('queuepal')
      .select('id, username, name, password, is_active')
      .eq('username', testUsername)
      .eq('is_active', true)
      .maybeSingle();
      
    if (authError) {
      console.log('❌ Authentication test failed:', authError.message);
    } else if (!authTest) {
      console.log(`❌ User "${testUsername}" not found or inactive`);
    } else {
      const passwordMatch = authTest.password === testPassword;
      console.log(`✅ Found user: ${authTest.username} (${authTest.name})`);
      console.log(`🔐 Password match: ${passwordMatch ? '✅ YES' : '❌ NO'}`);
      console.log(`   Expected: "${testPassword}"`);
      console.log(`   Found: "${authTest.password}"`);
    }
    
  } catch (err) {
    console.log('❌ Test failed:', err.message);
  }
}

testPlainTextAuth();
