/**
 * QueuePal CRUD Testing Script
 * Dedicated test to diagnose and resolve schema issues
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

class QueuePalTester {
  private results: TestResult[] = [];

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

  async inspectQueuePalSchema() {
    console.log('\n🔍 INSPECTING QUEUEPAL TABLE SCHEMA...\n');

    // Test 1: Get existing QueuePals to understand the current structure
    await this.runTest('Get All QueuePals', async () => {
      const { data, error } = await supabase.from('queuepal').select('*');
      if (error) throw new Error(`Failed to get QueuePals: ${error.message}`);
      
      console.log(`   Found ${data?.length || 0} existing QueuePals`);
      if (data && data.length > 0) {
        console.log(`   Sample record structure:`, Object.keys(data[0]));
        console.log(`   Sample record:`, data[0]);
      }
      return data;
    });

    // Test 2: Try to get schema information by selecting specific columns
    await this.runTest('Test Column Names', async () => {
      const columnTests = [
        'queuepalid',
        'name', 
        'contact',
        'assignedby',
        'assigned_by',
        'assignedBy',
        'created_at',
        'updated_at'
      ];

      const results = {};
      
      for (const column of columnTests) {
        try {
          const { data, error } = await supabase
            .from('queuepal')
            .select(column)
            .limit(1);
          
          if (!error) {
            results[column] = 'EXISTS';
            console.log(`   ✅ Column '${column}' exists`);
          } else {
            results[column] = `ERROR: ${error.message}`;
            console.log(`   ❌ Column '${column}' - ${error.message}`);
          }
        } catch (err) {
          results[column] = `EXCEPTION: ${err}`;
          console.log(`   ⚠️ Column '${column}' - Exception occurred`);
        }
      }
      
      return results;
    });
  }

  async testQueuePalCRUD() {
    console.log('\n🔧 TESTING QUEUEPAL CRUD OPERATIONS...\n');

    let createdQueuePalId: string | null = null;

    // Test 1: Get existing QueuePals with all columns
    await this.runTest('Get QueuePals with All Columns', async () => {
      const { data, error } = await supabase.from('queuepal').select('*');
      if (error) throw new Error(`Failed to select all columns: ${error.message}`);
      
      console.log(`   Retrieved ${data?.length || 0} QueuePals`);
      return data;
    });

    // Test 2: Try CREATE operation with different column name variations
    const createTestCases = [
      {
        name: 'Test with assignedby',
        data: {
          name: 'Test QueuePal 1',
          contact: '+1234567890',
          assignedby: 'Test Admin'
        }
      },
      {
        name: 'Test with assigned_by', 
        data: {
          name: 'Test QueuePal 2',
          contact: '+1234567890',
          assigned_by: 'Test Admin'
        }
      },
      {
        name: 'Test with assignedBy',
        data: {
          name: 'Test QueuePal 3', 
          contact: '+1234567890',
          assignedBy: 'Test Admin'
        }
      },
      {
        name: 'Test without assigned field',
        data: {
          name: 'Test QueuePal 4',
          contact: '+1234567890'
        }
      }
    ];

    for (const testCase of createTestCases) {
      await this.runTest(`CREATE QueuePal - ${testCase.name}`, async () => {
        const { data, error } = await supabase
          .from('queuepal')
          .insert([testCase.data])
          .select('*')
          .single();
        
        if (error) {
          throw new Error(`Failed to create QueuePal: ${error.message}`);
        }
        
        if (!createdQueuePalId && data) {
          // Get the ID field - try different possible names
          createdQueuePalId = data.queuepalid || data.queuepal_id || data.id || data.queuePalId;
          console.log(`   ✅ Created QueuePal with ID: ${createdQueuePalId}`);
        }
        
        console.log(`   Created record:`, data);
        return data;
      });
      
      // If we successfully created one, break and test other operations
      if (createdQueuePalId) break;
    }

    // Test 3: UPDATE operation (if we have a created record)
    if (createdQueuePalId) {
      await this.runTest('UPDATE QueuePal', async () => {
        const { data, error } = await supabase
          .from('queuepal')
          .update({ contact: '+9999999999' })
          .eq('queuepalid', createdQueuePalId)
          .select('*')
          .single();
        
        if (error) throw new Error(`Failed to update QueuePal: ${error.message}`);
        
        console.log(`   Updated QueuePal:`, data);
        return data;
      });

      // Test 4: DELETE operation
      await this.runTest('DELETE QueuePal', async () => {
        const { error } = await supabase
          .from('queuepal')
          .delete()
          .eq('queuepalid', createdQueuePalId);
        
        if (error) throw new Error(`Failed to delete QueuePal: ${error.message}`);
        
        console.log(`   Deleted QueuePal ID: ${createdQueuePalId}`);
        return { deleted: true, id: createdQueuePalId };
      });
    }
  }

  async testDirectAPIAccess() {
    console.log('\n🌐 TESTING DIRECT API ACCESS...\n');

    // Test direct REST API call to understand the schema
    await this.runTest('Direct API Schema Inspection', async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/queuepal?select=*&limit=1`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('   Direct API response:', JSON.stringify(data, null, 2));
      
      if (data && data.length > 0) {
        console.log('   Available columns:', Object.keys(data[0]));
      }
      
      return data;
    });

    // Test creating via direct API
    await this.runTest('Direct API Create Test', async () => {
      const testData = {
        name: 'API Test QueuePal',
        contact: '+5555555555'
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/queuepal`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(testData)
      });

      const responseText = await response.text();
      console.log('   API Response Status:', response.status);
      console.log('   API Response Body:', responseText);

      if (!response.ok) {
        throw new Error(`API create failed: ${response.status} - ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('   Created via API:', data);
      
      // Clean up - delete the created record
      if (data && data.length > 0) {
        const createdId = data[0].queuepalid || data[0].id;
        if (createdId) {
          await fetch(`${supabaseUrl}/rest/v1/queuepal?queuepalid=eq.${createdId}`, {
            method: 'DELETE',
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`,
            }
          });
          console.log('   Cleaned up created record');
        }
      }
      
      return data;
    });
  }

  generateReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;

    console.log('\n' + '='.repeat(60));
    console.log('🎯 QUEUEPAL TESTING REPORT');
    console.log('='.repeat(60));
    console.log(`📊 SUMMARY:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${failedTests}`);
    console.log(`   Success Rate: ${Math.round((passedTests/totalTests)*100)}%`);
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

    console.log('✅ PASSED TESTS:');
    this.results
      .filter(r => r.status === 'PASS')
      .forEach(result => {
        console.log(`   • ${result.test}`);
      });

    console.log('\n🎯 QUEUEPAL TESTING COMPLETED!');
    console.log('='.repeat(60));
  }

  async runAllTests() {
    console.log('🚀 Starting Dedicated QueuePal Testing...\n');
    console.log(`🔗 Testing against: ${supabaseUrl.substring(0, 30)}...\n`);

    try {
      await this.inspectQueuePalSchema();
      await this.testQueuePalCRUD();
      await this.testDirectAPIAccess();
    } catch (error) {
      console.error('💥 Critical error during QueuePal testing:', error);
    } finally {
      this.generateReport();
    }
  }
}

// Run the tests
async function main() {
  const tester = new QueuePalTester();
  await tester.runAllTests();
}

main().catch(console.error);
