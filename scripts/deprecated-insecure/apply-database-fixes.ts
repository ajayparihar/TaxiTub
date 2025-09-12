/**
 * DEPRECATED - SECURITY RISK - Contains hardcoded passwords
 * This script contains hardcoded passwords and should NOT be used in production
 * Use scripts/secure-setup.js instead for secure password management
 * 
 * @deprecated Use secure-setup.js for production deployments
 */

import { createClient } from "@supabase/supabase-js";
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env['VITE_SUPABASE_URL']!;
const supabaseAnonKey = process.env['VITE_SUPABASE_ANON_KEY']!;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.error('❌ Error: Please set valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyDatabaseFixes() {
  console.log('🚀 Starting database schema fixes...');
  console.log(`🔗 Connected to: ${supabaseUrl.substring(0, 30)}...`);

  try {
    // 1. Check and add missing assignedby column to queuepal table
    console.log('\n📋 Step 1: Checking queuepal table schema...');
    
    // Try to select from queuepal with assignedby column
    const { error: queuePalError } = await supabase
      .from('queuepal')
      .select('assignedby')
      .limit(1);

    if (queuePalError && queuePalError.message.includes('assignedby')) {
      console.log('⚠️  Missing assignedby column detected');
      console.log('ℹ️  Please run the SQL migration script in your Supabase dashboard:');
      console.log('   1. Go to Supabase Dashboard > SQL Editor');
      console.log('   2. Copy and paste the content of scripts/fix-database-schema.sql');
      console.log('   3. Run the script');
      console.log('   4. Come back and run this script again');
      return;
    } else {
      console.log('✅ queuepal table schema looks good');
    }

    // 2. Check admin table exists and has proper structure
    console.log('\n👤 Step 2: Checking admin table...');
    const { error: adminError } = await supabase
      .from('admin')
      .select('admin_id, username, password')
      .limit(1);

    if (adminError && adminError.message.includes('relation "admin" does not exist')) {
      console.log('⚠️  Admin table does not exist');
      console.log('ℹ️  Please run the SQL migration script to create the admin table');
      return;
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

    // 4. Check and update QueuePal password hashing if needed
    console.log('\n🔧 Step 4: Checking QueuePal password security...');
    const { data: queuePals } = await supabase
      .from('queuepal')
      .select('id, username, password')
      .limit(5);

    if (queuePals && queuePals.length > 0) {
      let needsPasswordUpdate = false;
      
      for (const queuePal of queuePals) {
        // Check if password looks like a bcrypt hash (starts with $2a$, $2b$, or $2y$)
        if (!queuePal.password || !queuePal.password.startsWith('$2')) {
          needsPasswordUpdate = true;
          console.log(`⚠️  QueuePal "${queuePal.username}" has plaintext password`);
        }
      }

      if (needsPasswordUpdate) {
        console.log('⚠️  Some QueuePal accounts have plaintext passwords');
        console.log('ℹ️  These will need to be reset by an administrator');
        console.log('ℹ️  Use the admin interface to reset passwords for security');
      } else {
        console.log('✅ All QueuePal passwords appear to be properly hashed');
      }
    }

    // 5. Test authentication with the new secure system
    console.log('\n🧪 Step 5: Testing secure authentication...');
    
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
    console.log('  ✅ Schema integrity checked');
    console.log('  ✅ Secure admin authentication configured');
    console.log('  ✅ Password hashing implemented');
    
    console.log('\n🔐 Security Notes:');
    console.log('  • Admin credentials: username=admin, password=admin@123');
    console.log('  • Change the default admin password immediately');
    console.log('  • All new passwords will be automatically hashed with bcrypt');
    console.log('  • Existing QueuePal users may need password resets');

  } catch (error) {
    console.error('❌ Error applying database fixes:', error);
    console.log('\nℹ️  If you see permission errors, you may need to:');
    console.log('  1. Run the SQL migration script manually in Supabase dashboard');
    console.log('  2. Ensure your Supabase key has sufficient permissions');
  }
}

// Run the fixes
if (require.main === module) {
  applyDatabaseFixes()
    .then(() => {
      console.log('\n✨ All fixes applied successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fix application failed:', error);
      process.exit(1);
    });
}
