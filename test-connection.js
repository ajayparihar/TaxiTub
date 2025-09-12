// TaxiTub Database Connection Test
// Run this script after setting up your .env file with real Supabase credentials
// Command: node test-connection.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testDatabaseConnection() {
  log('🚀 TaxiTub Database Connection Test', 'blue');
  log('====================================', 'blue');

  // Step 1: Check environment variables
  log('\n📋 Step 1: Checking environment variables...', 'cyan');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    log('❌ Missing environment variables!', 'red');
    log('Please make sure your .env file contains:', 'yellow');
    log('  VITE_SUPABASE_URL=your-supabase-url', 'yellow');
    log('  VITE_SUPABASE_ANON_KEY=your-supabase-anon-key', 'yellow');
    process.exit(1);
  }

  if (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
    log('❌ Still using placeholder values!', 'red');
    log('Please update your .env file with real Supabase credentials', 'yellow');
    process.exit(1);
  }

  log('✅ Environment variables found', 'green');
  log(`   URL: ${supabaseUrl.substring(0, 30)}...`, 'cyan');
  log(`   Key: ${supabaseAnonKey.substring(0, 20)}...`, 'cyan');

  // Step 2: Initialize Supabase client
  log('\n🔌 Step 2: Initializing Supabase client...', 'cyan');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  log('✅ Supabase client initialized', 'green');

  // Step 3: Test basic connection
  log('\n📡 Step 3: Testing database connection...', 'cyan');
  try {
    const { data, error } = await supabase
      .from('carinfo')
      .select('carid')
      .limit(1);

    if (error) {
      log(`❌ Connection failed: ${error.message}`, 'red');
      
      if (error.message.includes('relation "carinfo" does not exist')) {
        log('\n💡 The carinfo table doesn\'t exist yet.', 'yellow');
        log('Please run the database-schema.sql script in your Supabase dashboard:', 'yellow');
        log('1. Go to your Supabase dashboard', 'yellow');
        log('2. Open SQL Editor', 'yellow');
        log('3. Copy and paste the contents of database-schema.sql', 'yellow');
        log('4. Run the script', 'yellow');
      }
      
      return false;
    }

    log('✅ Database connection successful!', 'green');
  } catch (error) {
    log(`❌ Connection error: ${error.message}`, 'red');
    return false;
  }

  // Step 4: Test all required tables
  log('\n📊 Step 4: Checking required tables...', 'cyan');
  
  const requiredTables = [
    'carinfo',
    'queue_4seater', 
    'queue_5seater',
    'queue_6seater',
    'queue_7seater',
    'queue_8seater',
    'admin',
    'queuepal'
  ];

  let allTablesExist = true;

  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        log(`   ❌ ${tableName}: ${error.message}`, 'red');
        allTablesExist = false;
      } else {
        const count = data ? data.length : 0;
        log(`   ✅ ${tableName}: accessible (${count} sample record${count !== 1 ? 's' : ''})`, 'green');
      }
    } catch (error) {
      log(`   ❌ ${tableName}: ${error.message}`, 'red');
      allTablesExist = false;
    }
  }

  if (!allTablesExist) {
    log('\n⚠️ Some tables are missing. Please run the database-schema.sql script.', 'yellow');
    return false;
  }

  // Step 5: Test sample data
  log('\n🔍 Step 5: Checking sample data...', 'cyan');

  try {
    // Check cars
    const { data: cars } = await supabase
      .from('carinfo')
      .select('plateno, drivername, seater');
    
    log(`   🚗 Cars: ${cars ? cars.length : 0} registered`, 'green');
    if (cars && cars.length > 0) {
      cars.forEach(car => {
        log(`      ${car.plateno} - ${car.drivername} (${car.seater}-seater)`, 'cyan');
      });
    }

    // Check admin users  
    const { data: admins } = await supabase
      .from('admin')
      .select('username, full_name, is_active');
      
    log(`   👤 Admin users: ${admins ? admins.length : 0}`, 'green');
    if (admins && admins.length > 0) {
      admins.forEach(admin => {
        const status = admin.is_active ? 'active' : 'inactive';
        log(`      ${admin.username} - ${admin.full_name} (${status})`, 'cyan');
      });
    }

    // Check queues
    const queueTables = ['queue_4seater', 'queue_5seater', 'queue_6seater', 'queue_7seater', 'queue_8seater'];
    for (const queueTable of queueTables) {
      const { data: queueData } = await supabase
        .from(queueTable)
        .select('position')
        .order('position');
        
      const seaterType = queueTable.replace('queue_', '').replace('seater', '');
      log(`   📋 ${seaterType}-seater queue: ${queueData ? queueData.length : 0} cars`, 'green');
    }

  } catch (error) {
    log(`⚠️ Error checking sample data: ${error.message}`, 'yellow');
  }

  // Step 6: Final status
  log('\n🎉 Database Connection Test Complete!', 'blue');
  log('=====================================', 'blue');
  log('✅ All systems ready!', 'green');
  log('\n📝 Next steps:', 'cyan');
  log('1. Start your development server: npm run dev', 'cyan');
  log('2. Open http://localhost:5173 in your browser', 'cyan');
  log('3. The network errors should be resolved!', 'cyan');
  log('\n🔐 Admin credentials:', 'cyan');
  log('   Username: admin', 'cyan');
  log('   Password: admin@123', 'cyan');

  return true;
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled rejection: ${reason}`, 'red');
  process.exit(1);
});

// Run the test
testDatabaseConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    log(`❌ Test failed: ${error.message}`, 'red');
    process.exit(1);
  });
