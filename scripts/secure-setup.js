/**
 * Secure Database Setup Script
 * Uses environment variables for default passwords - NO HARDCODED CREDENTIALS
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Secure password configuration from environment
const ADMIN_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD;
const QUEUEPAL_PASSWORD = process.env.QUEUEPAL_DEFAULT_PASSWORD;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.error('❌ Error: Please set valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Generate a secure random password
 * @param {number} length - Password length
 * @returns {string} - Secure random password
 */
function generateSecurePassword(length = 16) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

async function secureSetup() {
  console.log('🔒 Starting SECURE database setup...');
  console.log('⚠️  NO HARDCODED PASSWORDS - Using environment variables or generated passwords');
  console.log(`🔗 Connected to: ${supabaseUrl.substring(0, 30)}...`);

  try {
    // 1. Setup Admin User
    console.log('\n👤 Step 1: Setting up admin authentication...');
    const { data: existingAdmin } = await supabase
      .from('admin')
      .select('username')
      .eq('username', 'admin')
      .maybeSingle();

    if (!existingAdmin) {
      // Use environment variable or generate secure password
      const adminPassword = ADMIN_PASSWORD || generateSecurePassword(20);
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
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
        console.log('✅ Created secure admin user');
        console.log('🔑 SAVE THIS PASSWORD: ' + adminPassword);
        console.log('⚠️  This password will not be shown again!');
      }
    } else {
      console.log('✅ Admin user already exists');
    }

    // 2. Setup QueuePal User (optional, for testing)
    if (process.env.CREATE_TEST_QUEUEPAL === 'true') {
      console.log('\n👥 Step 2: Setting up test QueuePal user...');
      const { data: existingQueuePal } = await supabase
        .from('queuepal')
        .select('username')
        .eq('username', 'queuepal01')
        .maybeSingle();

      if (!existingQueuePal) {
        const queuepalPassword = QUEUEPAL_PASSWORD || generateSecurePassword(16);
        const hashedPassword = await bcrypt.hash(queuepalPassword, 12);
        
        const { error: insertError } = await supabase
          .from('queuepal')
          .insert({
            username: 'queuepal01',
            password: hashedPassword,
            name: 'Queue Manager',
            contact: '+91-9876543200',
            is_active: true,
            created_by: 'admin'
          });

        if (insertError) {
          console.log('❌ Failed to create QueuePal user:', insertError.message);
        } else {
          console.log('✅ Created secure QueuePal user');
          console.log('🔑 SAVE THIS PASSWORD: ' + queuepalPassword);
          console.log('⚠️  This password will not be shown again!');
        }
      } else {
        console.log('✅ QueuePal user already exists');
      }
    }

    console.log('\n🎉 Secure setup completed!');
    console.log('\n🔒 Security Notes:');
    console.log('  • No passwords are stored in code');
    console.log('  • All passwords are bcrypt hashed in database');
    console.log('  • Use strong, unique passwords in production');
    console.log('  • Consider implementing password reset functionality');

  } catch (error) {
    console.error('❌ Error in secure setup:', error);
  }
}

// Run only if explicitly requested
if (process.argv.includes('--run-secure-setup')) {
  secureSetup()
    .then(() => {
      console.log('\n✨ Secure setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Secure setup failed:', error);
      process.exit(1);
    });
} else {
  console.log('🔒 Secure Setup Script');
  console.log('This script creates admin and optionally QueuePal users with secure passwords.');
  console.log('');
  console.log('Usage:');
  console.log('  node secure-setup.js --run-secure-setup');
  console.log('');
  console.log('Environment Variables (optional):');
  console.log('  ADMIN_DEFAULT_PASSWORD - Set admin password (or will be generated)');
  console.log('  QUEUEPAL_DEFAULT_PASSWORD - Set QueuePal password (or will be generated)');
  console.log('  CREATE_TEST_QUEUEPAL=true - Create test QueuePal user');
  console.log('');
  console.log('⚠️  Generated passwords will be shown once and must be saved!');
}
