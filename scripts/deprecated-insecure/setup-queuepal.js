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

async function setupQueuePal() {
  console.log('👥 Setting up QueuePal authentication...');
  console.log(`🔗 Connected to: ${supabaseUrl.substring(0, 30)}...`);

  try {
    // 1. Check current queuepal table structure
    console.log('\n📋 Step 1: Checking QueuePal table structure...');
    const { data: queuePals, error: selectError } = await supabase
      .from('queuepal')
      .select('*')
      .limit(1);

    if (selectError) {
      console.log('❌ QueuePal table error:', selectError.message);
      return;
    }

    console.log('✅ QueuePal table exists');
    
    // Check what columns exist
    if (queuePals && queuePals.length > 0) {
      console.log('📊 Existing columns:', Object.keys(queuePals[0]).join(', '));
    }

    // 2. Check if we have the required authentication fields
    console.log('\n🔧 Step 2: Checking authentication fields...');
    const { data: testSelect, error: testError } = await supabase
      .from('queuepal')
      .select('id, username, password, is_active, name, contact')
      .limit(1);

    if (testError) {
      console.log('⚠️  Missing required authentication fields:', testError.message);
      console.log('ℹ️  Please run the SQL migration script to update the table structure');
      return;
    }

    console.log('✅ Authentication fields exist');

    // 3. Create a test QueuePal user if none exists
    console.log('\n👤 Step 3: Setting up test QueuePal user...');
    const { data: existingQueuePal } = await supabase
      .from('queuepal')
      .select('username')
      .eq('username', 'queuepal01')
      .maybeSingle();

    if (!existingQueuePal) {
      // Create test QueuePal user with hashed password
      const hashedPassword = await bcrypt.hash('queuepal123', 12);
      
      const { error: insertError } = await supabase
        .from('queuepal')
        .insert({
          username: 'queuepal01',
          password: hashedPassword,
          name: 'Queue Manager',
          contact: '+91-9876543200',
          is_active: true,
          created_by: 'admin'  // Assuming this field exists from the schema
        });

      if (insertError) {
        console.log('❌ Failed to create QueuePal user:', insertError.message);
        return;
      } else {
        console.log('✅ Created test QueuePal user (username: queuepal01, password: queuepal123)');
      }
    } else {
      console.log('✅ QueuePal user already exists');
      
      // Update password to ensure it's properly hashed
      const { data: currentUser } = await supabase
        .from('queuepal')
        .select('id, password')
        .eq('username', 'queuepal01')
        .maybeSingle();

      if (currentUser && (!currentUser.password || !currentUser.password.startsWith('$2'))) {
        console.log('⚠️  Updating QueuePal password with proper hash...');
        const hashedPassword = await bcrypt.hash('queuepal123', 12);
        
        const { error: updateError } = await supabase
          .from('queuepal')
          .update({ 
            password: hashedPassword,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentUser.id);

        if (updateError) {
          console.log('❌ Failed to update QueuePal password:', updateError.message);
        } else {
          console.log('✅ Updated QueuePal password with proper hash');
        }
      }
    }

    // 4. Test QueuePal authentication
    console.log('\n🧪 Step 4: Testing QueuePal authentication...');
    const { data: testQueuePal } = await supabase
      .from('queuepal')
      .select('id, username, password, is_active')
      .eq('username', 'queuepal01')
      .eq('is_active', true)
      .maybeSingle();

    if (testQueuePal) {
      const passwordValid = await bcrypt.compare('queuepal123', testQueuePal.password);
      if (passwordValid) {
        console.log('✅ QueuePal authentication test PASSED!');
      } else {
        console.log('❌ QueuePal authentication test FAILED');
      }
    }

    console.log('\n🎉 QueuePal setup completed!');
    console.log('\n👥 Test Credentials:');
    console.log('  Username: queuepal01');
    console.log('  Password: queuepal123');
    
    console.log('\n🔐 Admin Credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin@123');

  } catch (error) {
    console.error('❌ Error setting up QueuePal:', error);
  }
}

// Run the setup
setupQueuePal()
  .then(() => {
    console.log('\n✨ QueuePal setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });
