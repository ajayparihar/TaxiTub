// Fix database by creating missing authentication tables
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixDatabase() {
  console.log('🔧 Creating missing authentication tables...');
  
  // Read the SQL script
  const sqlScript = fs.readFileSync('fix-auth-tables.sql', 'utf8');
  
  // Split into individual statements and execute them
  const statements = sqlScript
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    .filter(stmt => !stmt.toLowerCase().includes('select ') || stmt.toLowerCase().includes('create') || stmt.toLowerCase().includes('insert'));

  console.log(`📝 Found ${statements.length} SQL statements to execute`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.trim() === '') continue;
    
    console.log(`⚡ Executing statement ${i + 1}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        // Try direct SQL execution if RPC fails
        console.log('🔄 Trying alternative approach...');
        
        // For CREATE TABLE statements, we can simulate them with individual operations
        if (statement.toLowerCase().includes('create table')) {
          console.log('⚠️ Table creation needs to be done manually in Supabase dashboard');
          console.log('Statement:', statement);
        } else {
          console.log('❌ Error:', error.message);
        }
      } else {
        console.log('✅ Statement executed successfully');
      }
    } catch (err) {
      console.log('⚠️ Statement failed:', err.message);
    }
  }
  
  // Test the new tables
  console.log('\n🧪 Testing table access...');
  
  try {
    const { data, error } = await supabase
      .from('queuepal_staff')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log('❌ queuepal_staff table not accessible:', error.message);
      console.log('\n📋 Manual setup required:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Open the SQL Editor');
      console.log('3. Copy and paste the contents of fix-auth-tables.sql');
      console.log('4. Run the script');
    } else {
      console.log('✅ queuepal_staff table is accessible!');
      console.log(`📊 Found ${data ? data.length : 0} records`);
    }
  } catch (err) {
    console.log('⚠️ Table test failed:', err.message);
  }
}

fixDatabase().catch(console.error);
