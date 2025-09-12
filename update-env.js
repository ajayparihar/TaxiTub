// TaxiTub Environment Update Script
// Run this after you get your Supabase credentials
// Command: node update-env.js

const fs = require('fs');
const readline = require('readline');

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function updateEnvFile() {
  log('🔧 TaxiTub Environment Setup', 'blue');
  log('=============================', 'blue');
  
  log('\n📋 This script will help you update your .env file with real Supabase credentials', 'cyan');
  log('Make sure you have completed steps 1-2 from the setup guide first!\n', 'yellow');

  // Get URL
  log('🔗 Enter your Supabase Project URL:', 'cyan');
  log('   (looks like: https://abcdefghijklmnop.supabase.co)', 'yellow');
  const supabaseUrl = await askQuestion('URL: ');

  if (!supabaseUrl || !supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    log('❌ Invalid URL format! Please make sure you copied the correct URL.', 'red');
    log('   It should start with "https://" and end with ".supabase.co"', 'yellow');
    rl.close();
    process.exit(1);
  }

  // Get API Key
  log('\n🔑 Enter your Supabase Anon Key:', 'cyan');
  log('   (long string starting with "eyJ...")', 'yellow');
  const supabaseKey = await askQuestion('Key: ');

  if (!supabaseKey || !supabaseKey.startsWith('eyJ') || supabaseKey.length < 100) {
    log('❌ Invalid API key format! Please make sure you copied the correct anon key.', 'red');
    log('   It should be a long string starting with "eyJ"', 'yellow');
    rl.close();
    process.exit(1);
  }

  // Confirm before updating
  log('\n📝 Ready to update .env file with:', 'cyan');
  log(`   URL: ${supabaseUrl}`, 'green');
  log(`   Key: ${supabaseKey.substring(0, 20)}...`, 'green');
  
  const confirm = await askQuestion('\nProceed with update? (y/n): ');
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    log('❌ Update cancelled.', 'yellow');
    rl.close();
    process.exit(0);
  }

  // Update .env file
  try {
    const envContent = `# TaxiTub Module: Environment Variables
# Version: v0.1.0
# Last Updated: ${new Date().toISOString().split('T')[0]}
# Author: AI Agent

# Supabase Configuration (Updated with real values)
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseKey}

# Application Settings
VITE_APP_NAME=TaxiTub
VITE_APP_VERSION=0.1.0
`;

    fs.writeFileSync('.env', envContent, 'utf8');
    
    log('\n✅ .env file updated successfully!', 'green');
    log('\n📝 Next steps:', 'cyan');
    log('1. Test the connection: node test-connection.js', 'cyan');
    log('2. If connection works, set up database schema in Supabase', 'cyan');
    log('3. Run the test again to verify everything works', 'cyan');
    
  } catch (error) {
    log(`❌ Error updating .env file: ${error.message}`, 'red');
    rl.close();
    process.exit(1);
  }

  rl.close();
}

// Handle errors
process.on('SIGINT', () => {
  log('\n❌ Update cancelled by user.', 'yellow');
  rl.close();
  process.exit(0);
});

// Run the update
updateEnvFile().catch((error) => {
  log(`❌ Update failed: ${error.message}`, 'red');
  process.exit(1);
});
