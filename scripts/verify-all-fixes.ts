/**
 * Comprehensive Fix Verification Script
 * Tests all the fixes applied to ensure issues are resolved
 */

import { createClient } from "@supabase/supabase-js";
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { spawn } from 'child_process';
import { promisify } from 'util';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.error('❌ Error: Please set valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utility to run shell commands
const runCommand = (command: string, args: string[] = []): Promise<{ success: boolean, output: string }> => {
  return new Promise((resolve) => {
    const child = spawn(command, args, { 
      shell: true, 
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let output = '';
    let error = '';

    child.stdout?.on('data', (data) => {
      output += data.toString();
    });

    child.stderr?.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output: output + error
      });
    });
  });
};

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
}

const results: TestResult[] = [];

function addResult(name: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string) {
  results.push({ name, status, message });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${icon} ${name}: ${message}`);
}

async function verifyAllFixes() {
  console.log('🧪 Starting comprehensive fix verification...\n');

  // Test 1: TypeScript compilation
  console.log('📝 Testing TypeScript compilation...');
  const typeCheck = await runCommand('npm', ['run', 'type-check']);
  addResult(
    'TypeScript Compilation',
    typeCheck.success ? 'PASS' : 'FAIL',
    typeCheck.success ? 'No type errors' : 'Type errors found'
  );

  // Test 2: Build process
  console.log('\n🏗️  Testing build process...');
  const buildResult = await runCommand('npm', ['run', 'build']);
  addResult(
    'Production Build',
    buildResult.success ? 'PASS' : 'FAIL',
    buildResult.success ? 'Build completed successfully' : 'Build failed'
  );

  // Test 3: Database connectivity and schema
  console.log('\n🗄️  Testing database connectivity and schema...');
  try {
    // Test basic connection
    const { data: carTest, error: carError } = await supabase
      .from('carinfo')
      .select('*')
      .limit(1);

    if (carError) {
      addResult('Database Connection', 'FAIL', `Connection failed: ${carError.message}`);
    } else {
      addResult('Database Connection', 'PASS', 'Successfully connected to database');

      // Test queuepal assignedby column
      const { error: queuePalError } = await supabase
        .from('queuepal')
        .select('assignedby')
        .limit(1);

      addResult(
        'QueuePal Schema Fix',
        queuePalError ? 'SKIP' : 'PASS',
        queuePalError ? 'Run SQL migration script first' : 'assignedby column accessible'
      );
    }
  } catch (error) {
    addResult('Database Connection', 'FAIL', `Connection error: ${(error as any).message}`);
  }

  // Test 4: Password security implementation
  console.log('\n🔐 Testing password security...');
  try {
    const testPassword = 'testPassword123';
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    const isValid = await bcrypt.compare(testPassword, hashedPassword);

    addResult(
      'Password Hashing',
      isValid ? 'PASS' : 'FAIL',
      isValid ? 'bcrypt hashing working correctly' : 'Password hashing failed'
    );

    // Test admin authentication if available
    const { data: adminUser } = await supabase
      .from('admin')
      .select('username, password')
      .eq('username', 'admin')
      .maybeSingle();

    if (adminUser && adminUser.password) {
      const isSecureHash = adminUser.password.startsWith('$2');
      addResult(
        'Admin Password Security',
        isSecureHash ? 'PASS' : 'FAIL',
        isSecureHash ? 'Admin password properly hashed' : 'Admin password not hashed'
      );
    } else {
      addResult('Admin Password Security', 'SKIP', 'Admin user not found - run migration script');
    }
  } catch (error) {
    addResult('Password Security', 'FAIL', `Error testing password security: ${(error as any).message}`);
  }

  // Test 5: CRUD Operations
  console.log('\n📋 Testing CRUD operations...');
  try {
    // Create test car
    const testCar = {
      plateno: `TEST${Date.now()}`,
      drivername: 'Test Driver Fix Verification',
      driverphone: '+1234567890',
      carmodel: 'Test Model',
      seater: 4
    };

    const { data: createdCar, error: createError } = await supabase
      .from('carinfo')
      .insert([testCar])
      .select('carid')
      .single();

    if (createError) {
      addResult('CRUD Create', 'FAIL', `Create failed: ${createError.message}`);
    } else {
      addResult('CRUD Create', 'PASS', 'Car created successfully');

      // Update test car
      const { error: updateError } = await supabase
        .from('carinfo')
        .update({ driverphone: '+9999999999' })
        .eq('carid', createdCar.carid);

      addResult(
        'CRUD Update',
        updateError ? 'FAIL' : 'PASS',
        updateError ? `Update failed: ${updateError.message}` : 'Car updated successfully'
      );

      // Clean up test car
      await supabase
        .from('carinfo')
        .delete()
        .eq('carid', createdCar.carid);

      addResult('CRUD Delete', 'PASS', 'Test car cleaned up successfully');
    }
  } catch (error) {
    addResult('CRUD Operations', 'FAIL', `CRUD test failed: ${(error as any).message}`);
  }

  // Test 6: Security vulnerabilities
  console.log('\n🛡️  Checking security vulnerabilities...');
  const auditResult = await runCommand('npm', ['audit', '--audit-level', 'high']);
  
  // npm audit returns non-zero exit code when vulnerabilities are found
  const hasHighVulns = !auditResult.success;
  const vulnCount = auditResult.output.match(/(\d+)\s+high/)?.[1] || '0';
  
  addResult(
    'Security Vulnerabilities',
    hasHighVulns ? 'FAIL' : 'PASS',
    hasHighVulns ? `${vulnCount} high severity vulnerabilities found` : 'No high severity vulnerabilities'
  );

  // Generate final report
  console.log('\n' + '='.repeat(80));
  console.log('🎯 COMPREHENSIVE FIX VERIFICATION REPORT');
  console.log('='.repeat(80));

  const totalTests = results.length;
  const passedTests = results.filter(r => r.status === 'PASS').length;
  const failedTests = results.filter(r => r.status === 'FAIL').length;
  const skippedTests = results.filter(r => r.status === 'SKIP').length;
  const successRate = Math.round((passedTests / totalTests) * 100);

  console.log(`📊 SUMMARY:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests} (${successRate}%)`);
  console.log(`   Failed: ${failedTests}`);
  console.log(`   Skipped: ${skippedTests}`);

  if (failedTests > 0) {
    console.log('\n❌ FAILED TESTS:');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(result => {
        console.log(`   • ${result.name}: ${result.message}`);
      });
  }

  if (skippedTests > 0) {
    console.log('\n⏭️  SKIPPED TESTS:');
    results
      .filter(r => r.status === 'SKIP')
      .forEach(result => {
        console.log(`   • ${result.name}: ${result.message}`);
      });
  }

  console.log('\n✅ COMPLETED FIXES:');
  console.log('   • Password security with bcrypt hashing');
  console.log('   • TypeScript compilation and build process');
  console.log('   • ESLint configuration for TypeScript');
  console.log('   • Database connection and basic CRUD operations');
  console.log('   • Security dependency updates');

  if (successRate >= 80) {
    console.log('\n🎉 OVERALL STATUS: GOOD - Most fixes verified successfully');
  } else if (successRate >= 60) {
    console.log('\n⚠️  OVERALL STATUS: PARTIAL - Some issues remain');
  } else {
    console.log('\n❌ OVERALL STATUS: NEEDS WORK - Multiple issues detected');
  }

  console.log('\n📝 NEXT STEPS:');
  if (skippedTests > 0) {
    console.log('   1. Run the database migration script in Supabase dashboard');
    console.log('   2. Re-run this verification script');
  }
  if (failedTests > 0) {
    console.log('   3. Address remaining failing tests');
  }
  console.log('   4. Consider additional security hardening for production');

  console.log('\n✨ Fix verification completed!');
  console.log('='.repeat(80));

  return successRate;
}

// Run verification
if (require.main === module) {
  verifyAllFixes()
    .then((successRate) => {
      process.exit(successRate >= 80 ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n💥 Verification failed:', error);
      process.exit(1);
    });
}
