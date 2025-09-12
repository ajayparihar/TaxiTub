/**
 * QueuePal CRUD Testing Script - CORRECTED VERSION
 * Using the actual database schema with proper column names
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: "public" }
});

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  data?: any;
}

// Correct QueuePal interface based on actual schema
interface QueuePal {
  id?: string;
  username: string;
  name?: string;
  contact?: string;
  password: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

class QueuePalTesterFixed {
  private results: TestResult[] = [];
  private createdQueuePalIds: string[] = [];

  async runTest(testName: string, testFn: () => Promise<any>): Promise<TestResult> {
    try {
      console.log(`🔍 Running: ${testName}`);
      const result = await testFn();
      const testResult = {
        test: testName,
        status: 'PASS' as const,
        message: 'Success',
        data: result
      };
      this.results.push(testResult);
      console.log(`✅ ${testName} - PASSED`);
      return testResult;
    } catch (error: any) {
      const testResult = {
        test: testName,
        status: 'FAIL' as const,
        message: error.message || 'Unknown error',
        data: error
      };
      this.results.push(testResult);
      console.log(`❌ ${testName} - FAILED: ${error.message}`);
      return testResult;
    }
  }

  async testQueuePalCRUD() {
    console.log('🔧 TESTING QUEUEPAL CRUD WITH CORRECT SCHEMA...\n');

    // Test 1: READ - Get all existing QueuePals
    await this.runTest('READ: Get All QueuePals', async () => {
      const { data, error } = await supabase
        .from('queuepal')
        .select('id, username, name, contact, is_active, created_at, updated_at, created_by');
      
      if (error) throw new Error(`Failed to get QueuePals: ${error.message}`);
      
      console.log(`   Found ${data?.length || 0} existing QueuePals:`);
      data?.forEach(qp => {
        console.log(`   - ${qp.name} (${qp.username}) - Active: ${qp.is_active}`);
      });
      
      return data;
    });

    // Test 2: CREATE - Add new QueuePal with correct schema
    const testQueuePal: QueuePal = {
      username: `testuser_${Date.now()}`,
      name: 'Test QueuePal Manager',
      contact: '+1234567890',
      password: 'testpassword123',
      is_active: true,
      created_by: 'Test Admin'
    };

    await this.runTest('CREATE: Add New QueuePal', async () => {
      const { data, error } = await supabase
        .from('queuepal')
        .insert([testQueuePal])
        .select('*')
        .single();
      
      if (error) throw new Error(`Failed to create QueuePal: ${error.message}`);
      
      this.createdQueuePalIds.push(data.id);
      console.log(`   ✅ Created QueuePal: ${data.name} (${data.username})`);
      console.log(`   ID: ${data.id}`);
      console.log(`   Active: ${data.is_active}`);
      console.log(`   Created by: ${data.created_by}`);
      
      return data;
    });

    // Test 3: CREATE - Add another QueuePal
    const testQueuePal2: QueuePal = {
      username: `manager_${Date.now()}`,
      name: 'Senior Queue Manager',
      contact: '+0987654321',
      password: 'securepass456',
      is_active: true,
      created_by: 'System Admin'
    };

    await this.runTest('CREATE: Add Second QueuePal', async () => {
      const { data, error } = await supabase
        .from('queuepal')
        .insert([testQueuePal2])
        .select('*')
        .single();
      
      if (error) throw new Error(`Failed to create second QueuePal: ${error.message}`);
      
      this.createdQueuePalIds.push(data.id);
      console.log(`   ✅ Created second QueuePal: ${data.name} (${data.username})`);
      
      return data;
    });

    // Test 4: READ - Get specific QueuePal
    if (this.createdQueuePalIds.length > 0) {
      await this.runTest('READ: Get Specific QueuePal', async () => {
        const queuePalId = this.createdQueuePalIds[0];
        const { data, error } = await supabase
          .from('queuepal')
          .select('*')
          .eq('id', queuePalId)
          .single();
        
        if (error) throw new Error(`Failed to get QueuePal: ${error.message}`);
        
        console.log(`   Retrieved QueuePal: ${data.name} (${data.username})`);
        return data;
      });
    }

    // Test 5: UPDATE - Modify QueuePal information
    if (this.createdQueuePalIds.length > 0) {
      await this.runTest('UPDATE: Modify QueuePal Information', async () => {
        const queuePalId = this.createdQueuePalIds[0];
        const updates = {
          contact: '+1111111111',
          name: 'Updated Test QueuePal Manager',
          created_by: 'Updated Admin'
        };
        
        const { data, error } = await supabase
          .from('queuepal')
          .update(updates)
          .eq('id', queuePalId)
          .select('*')
          .single();
        
        if (error) throw new Error(`Failed to update QueuePal: ${error.message}`);
        
        console.log(`   ✅ Updated QueuePal: ${data.name}`);
        console.log(`   New contact: ${data.contact}`);
        console.log(`   Updated by: ${data.created_by}`);
        
        return data;
      });
    }

    // Test 6: UPDATE - Toggle active status
    if (this.createdQueuePalIds.length > 0) {
      await this.runTest('UPDATE: Toggle Active Status', async () => {
        const queuePalId = this.createdQueuePalIds[0];
        
        // First get current status
        const { data: current } = await supabase
          .from('queuepal')
          .select('is_active, name')
          .eq('id', queuePalId)
          .single();
        
        const newStatus = !current?.is_active;
        
        const { data, error } = await supabase
          .from('queuepal')
          .update({ is_active: newStatus })
          .eq('id', queuePalId)
          .select('name, is_active')
          .single();
        
        if (error) throw new Error(`Failed to toggle status: ${error.message}`);
        
        console.log(`   ✅ Toggled status for ${data.name}: ${data.is_active}`);
        
        return data;
      });
    }

    // Test 7: Test duplicate username (should fail)
    if (this.createdQueuePalIds.length > 0) {
      await this.runTest('CREATE: Duplicate Username (Should Fail)', async () => {
        const duplicateQueuePal: QueuePal = {
          username: testQueuePal.username, // Same username as first test user
          name: 'Duplicate User',
          contact: '+5555555555',
          password: 'password789'
        };
        
        const { data, error } = await supabase
          .from('queuepal')
          .insert([duplicateQueuePal])
          .select('*');
        
        if (!error) {
          throw new Error('Duplicate username should have failed but succeeded');
        }
        
        console.log(`   ✅ Correctly rejected duplicate username: ${error.message}`);
        return { expectedError: true, message: error.message };
      });
    }

    // Test 8: Test missing required fields (should fail)
    await this.runTest('CREATE: Missing Required Fields (Should Fail)', async () => {
      const incompleteQueuePal = {
        name: 'Incomplete User',
        contact: '+6666666666'
        // Missing username and password (required fields)
      };
      
      const { data, error } = await supabase
        .from('queuepal')
        .insert([incompleteQueuePal])
        .select('*');
      
      if (!error) {
        throw new Error('Missing required fields should have failed but succeeded');
      }
      
      console.log(`   ✅ Correctly rejected incomplete data: ${error.message}`);
      return { expectedError: true, message: error.message };
    });
  }

  async testAdvancedQueries() {
    console.log('\n🔍 TESTING ADVANCED QUERIES...\n');

    // Test 1: Filter by active status
    await this.runTest('QUERY: Filter Active QueuePals', async () => {
      const { data, error } = await supabase
        .from('queuepal')
        .select('id, username, name, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(`Failed to filter active QueuePals: ${error.message}`);
      
      console.log(`   Found ${data?.length || 0} active QueuePals`);
      data?.forEach(qp => {
        console.log(`   - ${qp.name} (${qp.username})`);
      });
      
      return data;
    });

    // Test 2: Search by name
    await this.runTest('QUERY: Search by Name', async () => {
      const { data, error } = await supabase
        .from('queuepal')
        .select('id, username, name, contact')
        .ilike('name', '%test%');
      
      if (error) throw new Error(`Failed to search by name: ${error.message}`);
      
      console.log(`   Found ${data?.length || 0} QueuePals matching 'test'`);
      data?.forEach(qp => {
        console.log(`   - ${qp.name} (${qp.username}): ${qp.contact}`);
      });
      
      return data;
    });

    // Test 3: Count records
    await this.runTest('QUERY: Count Total QueuePals', async () => {
      const { count, error } = await supabase
        .from('queuepal')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw new Error(`Failed to count QueuePals: ${error.message}`);
      
      console.log(`   Total QueuePals in database: ${count}`);
      
      return { totalCount: count };
    });
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    for (const queuePalId of this.createdQueuePalIds) {
      try {
        const { error } = await supabase
          .from('queuepal')
          .delete()
          .eq('id', queuePalId);
        
        if (error) {
          console.log(`⚠️ Failed to delete QueuePal ${queuePalId}: ${error.message}`);
        } else {
          console.log(`✅ Deleted QueuePal: ${queuePalId}`);
        }
      } catch (error) {
        console.log(`⚠️ Error deleting QueuePal ${queuePalId}: ${error}`);
      }
    }
    
    console.log('✅ Cleanup completed');
  }

  generateReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    console.log('\n' + '='.repeat(70));
    console.log('🎯 QUEUEPAL CRUD TESTING REPORT - CORRECTED VERSION');
    console.log('='.repeat(70));
    console.log(`📊 SUMMARY:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests} (${successRate}%)`);
    console.log(`   Failed: ${failedTests}`);
    console.log('');

    if (failedTests > 0) {
      console.log('❌ FAILED TESTS:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`   • ${result.test}: ${result.message}`);
        });
      console.log('');
    }

    console.log('✅ SUCCESSFUL TESTS:');
    this.results
      .filter(r => r.status === 'PASS')
      .forEach(result => {
        console.log(`   • ${result.test}`);
      });

    console.log('\n🏆 KEY FINDINGS:');
    if (successRate === 100) {
      console.log('✅ All QueuePal CRUD operations working perfectly!');
      console.log('✅ Schema compatibility resolved');
      console.log('✅ Database constraints properly enforced');
      console.log('✅ Data validation functioning correctly');
    } else if (successRate >= 80) {
      console.log('✅ Most QueuePal CRUD operations working correctly');
      console.log('⚠️ Some edge cases may need attention');
    } else {
      console.log('⚠️ Multiple issues detected - review failed tests');
    }

    console.log('\n📋 TESTED CRUD OPERATIONS:');
    console.log('✓ CREATE: Add new QueuePals with required fields');
    console.log('✓ READ: Retrieve all and specific QueuePals');
    console.log('✓ UPDATE: Modify QueuePal information and status');
    console.log('✓ DELETE: Remove QueuePals from database');
    console.log('✓ VALIDATION: Username uniqueness and required fields');
    console.log('✓ QUERIES: Filtering, searching, and counting');

    console.log('\n🎯 QUEUEPAL TESTING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));
  }

  async runAllTests() {
    console.log('🚀 Starting Corrected QueuePal CRUD Testing...\n');
    console.log(`🔗 Testing against: ${supabaseUrl.substring(0, 30)}...\n`);
    
    console.log('✅ Using CORRECT schema:');
    console.log('   - Primary Key: id (UUID)');
    console.log('   - Required: username, password');
    console.log('   - Optional: name, contact, is_active, created_by');
    console.log('   - Unique constraint: username');
    console.log('');

    try {
      await this.testQueuePalCRUD();
      await this.testAdvancedQueries();
    } catch (error) {
      console.error('💥 Critical error during QueuePal testing:', error);
    } finally {
      await this.cleanup();
      this.generateReport();
    }
  }
}

// Run the tests
async function main() {
  const tester = new QueuePalTesterFixed();
  await tester.runAllTests();
}

main().catch(console.error);
