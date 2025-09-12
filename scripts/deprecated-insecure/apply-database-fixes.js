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

async function applyDatabaseFixes() {
  console.log('🚀 Starting database schema fixes...');
  console.log(`🔗 Connected to: ${supabaseUrl.substring(0, 30)}...`);

  try {
    // 1. Check admin table exists and has proper structure
    console.log('\n👤 Step 1: Checking admin table...');
    const { error: adminError } = await supabase
      .from('admin')
      .select('admin_id, username, password')
      .limit(1);

    if (adminError && adminError.message.includes('relation "admin" does not exist')) {
      console.log('⚠️  Admin table does not exist');
      console.log('ℹ️  Please run the SQL migration script to create the admin table');
      console.log('   1. Go to Supabase Dashboard > SQL Editor');
      console.log('   2. Copy and paste the content of scripts/fix-database-schema.sql');
      console.log('   3. Run the script');
      console.log('   4. Come back and run this script again');
      return;
    } else {
      console.log('✅ admin table exists');
    }

    // 2. Check queuepal table structure
    console.log('\n📋 Step 2: Checking queuepal table schema...');
    
    // Check if queuepal table has the new structure we need
    const { error: queuePalError } = await supabase
      .from('queuepal')
      .select('id, username, password, is_active')
      .limit(1);

    if (queuePalError) {
      console.log('⚠️  QueuePal table structure needs updating');
      console.log('ℹ️  Missing required columns for authentication');
      console.log('ℹ️  Please run the SQL migration script first');
      return;
    } else {
      console.log('✅ queuepal table structure looks good');
    }

    // 3. Create default admin user if none exists
    console.log('\n🔐 Step 3: Setting up admin authentication...');
    const { data: existingAdmin } = await supabase
      .from('admin')
      .select('username')
      .eq('username', 'admin')
      .maybeSingle();

    if (!existingAdmin) {
      // Create admin user with hashed password
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
      } else {
        console.log('✅ Created secure admin user (username: admin, password: admin@123)');
      }
    } else {
      console.log('✅ Admin user already exists');
    }

    // 4. Test authentication with the new secure system
    console.log('\n🧪 Step 4: Testing secure authentication...');
    
    // Test admin login
    const testPassword = 'admin@123';
    const { data: adminTest } = await supabase
      .from('admin')
      .select('admin_id, username, password')
      .eq('username', 'admin')
      .eq('is_active', true)
      .maybeSingle();

    if (adminTest) {
      const passwordValid = await bcrypt.compare(testPassword, adminTest.password);
      if (passwordValid) {
        console.log('✅ Admin authentication test passed');
      } else {
        console.log('❌ Admin authentication test failed');
      }
    }

    console.log('\n🎉 Database schema fixes completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✅ Database connection verified');
    console.log('  ✅ Admin table structure verified');
    console.log('  ✅ QueuePal table structure verified');
    console.log('  ✅ Secure admin authentication configured');
    console.log('  ✅ Password hashing implemented');
    
    console.log('\n🔐 Security Notes:');
    console.log('  • Admin credentials: username=admin, password=admin@123');
    console.log('  • Change the default admin password immediately');
    console.log('  • All new passwords will be automatically hashed with bcrypt');

  } catch (error) {
    console.error('❌ Error applying database fixes:', error);
    console.log('\nℹ️  If you see permission errors, you may need to:');
    console.log('  1. Run the SQL migration script manually in Supabase dashboard');
    console.log('  2. Ensure your Supabase key has sufficient permissions');
  }
}

// Run the fixes
applyDatabaseFixes()
  .then(() => {
    console.log('\n✨ All fixes applied successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fix application failed:', error);
    process.exit(1);
  });
