// Check and update current users to use simple plain text passwords
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAndUpdateUsers() {
  console.log('🔍 Checking current users...\n');
  
  try {
    // Check current queuepal users
    console.log('📊 Current QueuePal users:');
    const { data: queuepalUsers } = await supabase
      .from('queuepal')
      .select('id, username, password, name');
      
    if (queuepalUsers && queuepalUsers.length > 0) {
      queuepalUsers.forEach(user => {
        console.log(`   - ID: ${user.id}`);
        console.log(`     Username: ${user.username || 'NULL'}`);
        console.log(`     Password: ${user.password || 'NULL'}`);
        console.log(`     Name: ${user.name || 'NULL'}`);
        console.log('');
      });
      
      // Update existing users with simple credentials
      console.log('🔧 Updating users with simple credentials...');
      
      // Update the first user to be 'dev'
      if (queuepalUsers[0]) {
        const { error } = await supabase
          .from('queuepal')
          .update({
            username: 'dev',
            password: 'dev',
            name: 'Developer'
          })
          .eq('id', queuepalUsers[0].id);
          
        if (error) {
          console.log('❌ Failed to update first user:', error.message);
        } else {
          console.log('✅ Updated first user to: dev/dev');
        }
      }
      
      // Update the second user to be 'test' if it exists
      if (queuepalUsers[1]) {
        const { error } = await supabase
          .from('queuepal')
          .update({
            username: 'test',
            password: 'test',
            name: 'Test User'
          })
          .eq('id', queuepalUsers[1].id);
          
        if (error) {
          console.log('❌ Failed to update second user:', error.message);
        } else {
          console.log('✅ Updated second user to: test/test');
        }
      }
    }
    
    // Check admin users  
    console.log('\n📊 Current Admin users:');
    const { data: adminUsers } = await supabase
      .from('admin')
      .select('admin_id, username, password, full_name');
      
    if (adminUsers && adminUsers.length > 0) {
      adminUsers.forEach(user => {
        console.log(`   - ${user.username}: ${user.password} (${user.full_name})`);
      });
      
      // Update admin passwords to be simple
      for (const user of adminUsers) {
        const simplePassword = user.username; // admin -> admin, dev -> dev
        if (user.password !== simplePassword) {
          const { error } = await supabase
            .from('admin')
            .update({ password: simplePassword })
            .eq('admin_id', user.admin_id);
            
          if (!error) {
            console.log(`✅ Updated admin ${user.username} password to: ${simplePassword}`);
          }
        }
      }
    }
    
    console.log('\n🎉 User update completed!');
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkAndUpdateUsers();
