/**
 * DEPRECATED - SECURITY RISK - Contains hardcoded passwords
 * This script contains hardcoded passwords and should NOT be used in production
 * Use scripts/secure-setup.js instead for secure password management
 * 
 * @deprecated Use secure-setup.js for production deployments
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.error('❌ Error: Please set valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixAdminPassword() {
  console.log('🔐 Fixing admin password with proper bcrypt hashing...');
  console.log(`🔗 Connected to: ${supabaseUrl.substring(0, 30)}...`);

  try {
    // 1. Check current admin user
    console.log('\n📋 Step 1: Checking current admin user...');
    const { data: admin } = await supabase
      .from('admin')
      .select('admin_id, username, password')
      .eq('username', 'admin')
      .maybeSingle();

    if (!admin) {
      console.log('⚠️  No admin user found. Creating one...');
      
      // Create admin user with properly hashed password
      const hashedPassword = await bcrypt.hash('admin@123', 12);
      
      const { error: insertError } = await supabase
        .from('admin')
        .insert({
          username: 'admin',
          password: hashedPassword,
          full_name: 'System Administrator',
          is_active: true
        });

      if (insertError) {
        console.log('❌ Failed to create admin user:', insertError.message);
        return;
      } else {
        console.log('✅ Created new admin user with hashed password');
      }
    } else {
      console.log('✅ Found admin user:', admin.username);
      
      // Check if password is already properly hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      if (admin.password && admin.password.startsWith('$2')) {
        console.log('✅ Password appears to be already hashed');
        
        // Test the existing hash
        const testValid = await bcrypt.compare('admin@123', admin.password);
        if (testValid) {
          console.log('✅ Existing password hash is valid for "admin@123"');
          return;
        } else {
          console.log('⚠️  Existing password hash doesn\'t match "admin@123", updating...');
        }
      } else {
        console.log('⚠️  Password is not properly hashed, updating...');
      }
      
      // Update with properly hashed password
      const hashedPassword = await bcrypt.hash('admin@123', 12);
      
      const { error: updateError } = await supabase
        .from('admin')
        .update({ 
          password: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('admin_id', admin.admin_id);

      if (updateError) {
        console.log('❌ Failed to update admin password:', updateError.message);
        return;
      } else {
        console.log('✅ Updated admin password with proper bcrypt hash');
      }
    }

    // 2. Test the authentication
    console.log('\n🧪 Step 2: Testing authentication...');
    const { data: testAdmin } = await supabase
      .from('admin')
      .select('admin_id, username, password')
      .eq('username', 'admin')
      .eq('is_active', true)
      .maybeSingle();

    if (testAdmin) {
      const passwordValid = await bcrypt.compare('admin@123', testAdmin.password);
      if (passwordValid) {
        console.log('✅ Authentication test PASSED - admin login should work now!');
      } else {
        console.log('❌ Authentication test FAILED - there may be an issue');
      }
    }

    console.log('\n🎉 Admin password fix completed!');
    console.log('\n🔐 Credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin@123');
    console.log('\n⚠️  Remember to change the default password after first login!');

  } catch (error) {
    console.error('❌ Error fixing admin password:', error);
  }
}

// Run the fix
fixAdminPassword()
  .then(() => {
    console.log('\n✨ Admin password fix completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fix failed:', error);
    process.exit(1);
  });
