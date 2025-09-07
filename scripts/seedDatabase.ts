#!/usr/bin/env tsx
// TaxiTub Module: Database Seeding Script
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Script to populate database with mock car data for development/testing

import { createClient } from '@supabase/supabase-js';
import { generateMockCarsWithProgress, analyzeGeneratedCars, validateMockCar } from '../src/utils/mockDataGenerator';
import type { CarInfo } from '../src/types';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BATCH_SIZE = 100; // Insert cars in batches to avoid timeout
const TARGET_COUNT = 2000;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Display colored console output
 */
function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Display progress bar
 */
function displayProgressBar(current: number, total: number, label: string = 'Progress') {
  const percentage = Math.round((current / total) * 100);
  const completed = Math.round((current / total) * 40); // 40 character progress bar
  const remaining = 40 - completed;
  
  const progressBar = '█'.repeat(completed) + '░'.repeat(remaining);
  const progressText = `${label}: [${progressBar}] ${percentage}% (${current}/${total})`;
  
  // Clear the line and print progress
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(`${colors.cyan}${progressText}${colors.reset}`);
  
  if (current === total) {
    process.stdout.write('\n');
  }
}

/**
 * Check if database is accessible
 */
async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('carinfo').select('*').limit(1);
    if (error) {
      log(`❌ Database connection error: ${error.message}`, 'red');
      log(`   Error code: ${error.code}`, 'red');
      log(`   Error details: ${error.details}`, 'red');
      return false;
    }
    return true;
  } catch (error) {
    log(`❌ Failed to connect to database: ${error}`, 'red');
    return false;
  }
}

/**
 * Get current count of cars in database
 */
async function getCurrentCarCount(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('carinfo')
      .select('carid');
    
    if (error) {
      log(`❌ Error getting car count: ${error.message}`, 'red');
      return 0;
    }
    
    return data?.length || 0;
  } catch (error) {
    log(`❌ Error getting car count: ${error}`, 'red');
    return 0;
  }
}

/**
 * Clear existing cars from database (with confirmation)
 */
async function clearExistingCars(): Promise<boolean> {
  const currentCount = await getCurrentCarCount();
  
  if (currentCount === 0) {
    log('✅ Database is empty, no need to clear', 'green');
    return true;
  }
  
  log(`⚠️  Found ${currentCount} existing cars in database`, 'yellow');
  
  // In a real scenario, you might want to prompt for confirmation
  // For this script, we'll assume we want to clear the data
  log('🗑️  Clearing existing car data...', 'yellow');
  
  try {
    // Delete all records using a condition that matches all rows
    const { error } = await supabase.from('carinfo').delete().not('carid', 'is', null);
    
    if (error) {
      log(`❌ Error clearing existing data: ${error.message}`, 'red');
      return false;
    }
    
    log('✅ Existing car data cleared successfully', 'green');
    return true;
  } catch (error) {
    log(`❌ Error clearing existing data: ${error}`, 'red');
    return false;
  }
}

/**
 * Convert CarInfo to database format
 */
function convertToDbFormat(car: Omit<CarInfo, 'carId'>): any {
  return {
    plateno: car.plateNo,
    drivername: car.driverName,
    driverphone: car.driverPhone,
    carmodel: car.carModel,
    seater: car.seater,
  };
}

/**
 * Insert cars in batches
 */
async function insertCarsInBatches(cars: Array<Omit<CarInfo, 'carId'>>): Promise<boolean> {
  const batches = [];
  
  // Split cars into batches
  for (let i = 0; i < cars.length; i += BATCH_SIZE) {
    batches.push(cars.slice(i, i + BATCH_SIZE));
  }
  
  log(`📦 Inserting ${cars.length} cars in ${batches.length} batches of ${BATCH_SIZE}...`, 'blue');
  
  let totalInserted = 0;
  let failedBatches = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const dbBatch = batch.map(convertToDbFormat);
    
    try {
      const { data, error } = await supabase
        .from('carinfo')
        .insert(dbBatch)
        .select('carid');
      
      if (error) {
        log(`❌ Batch ${i + 1} failed: ${error.message}`, 'red');
        failedBatches++;
        
        // Try to handle duplicate plate numbers by retrying with different data
        if (error.code === '23505') {
          log(`🔄 Retrying batch ${i + 1} with new plate numbers...`, 'yellow');
          // Generate new batch with different plate numbers
          const retryBatch = batch.map(() => generateMockCarsWithProgress(1)[0]).map(convertToDbFormat);
          
          const { data: retryData, error: retryError } = await supabase
            .from('carinfo')
            .insert(retryBatch)
            .select('carid');
          
          if (!retryError && retryData) {
            totalInserted += retryData.length;
            log(`✅ Batch ${i + 1} succeeded on retry (${retryData.length} cars)`, 'green');
          } else {
            log(`❌ Batch ${i + 1} retry failed: ${retryError?.message}`, 'red');
          }
        }
      } else if (data) {
        totalInserted += data.length;
        displayProgressBar(totalInserted, cars.length, 'Inserting');
      }
      
      // Add small delay between batches to avoid overwhelming the database
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
    } catch (error) {
      log(`❌ Batch ${i + 1} failed with exception: ${error}`, 'red');
      failedBatches++;
    }
  }
  
  log(`\n📊 Insertion complete:`, 'blue');
  log(`   ✅ Successfully inserted: ${totalInserted} cars`, 'green');
  log(`   ❌ Failed batches: ${failedBatches}`, failedBatches > 0 ? 'red' : 'green');
  
  return totalInserted > 0;
}

/**
 * Verify insertion by counting database records
 */
async function verifyInsertion(expectedCount: number): Promise<boolean> {
  log('🔍 Verifying database insertion...', 'blue');
  
  const actualCount = await getCurrentCarCount();
  
  if (actualCount >= expectedCount * 0.95) { // Allow 5% variance
    log(`✅ Verification successful: ${actualCount} cars in database`, 'green');
    return true;
  } else {
    log(`⚠️  Verification warning: Expected ~${expectedCount}, found ${actualCount}`, 'yellow');
    return false;
  }
}

/**
 * Display statistics about the seeded data
 */
async function displayStatistics(): Promise<void> {
  log('\n📈 Database Statistics:', 'blue');
  
  try {
    // Get seater distribution
    const { data: seaterStats, error: seaterError } = await supabase
      .from('carinfo')
      .select('seater')
      .then(result => {
        if (result.error) return result;
        
        const distribution = result.data.reduce((acc: any, car: any) => {
          acc[car.seater] = (acc[car.seater] || 0) + 1;
          return acc;
        }, {});
        
        return { data: distribution, error: null };
      });
    
    if (!seaterError && seaterStats) {
      log('   🚗 Seater Distribution:', 'cyan');
      Object.entries(seaterStats).forEach(([seater, count]) => {
        const percentage = ((count as number) / TARGET_COUNT * 100).toFixed(1);
        log(`     ${seater}-seater: ${count} cars (${percentage}%)`, 'reset');
      });
    }
    
    // Get top car models
    const { data: modelStats, error: modelError } = await supabase
      .from('carinfo')
      .select('carmodel')
      .then(result => {
        if (result.error) return result;
        
        const modelCounts = result.data.reduce((acc: any, car: any) => {
          acc[car.carmodel] = (acc[car.carmodel] || 0) + 1;
          return acc;
        }, {});
        
        const topModels = Object.entries(modelCounts)
          .map(([model, count]) => ({ model, count }))
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 5);
        
        return { data: topModels, error: null };
      });
    
    if (!modelError && modelStats) {
      log('   🏎️  Top 5 Car Models:', 'cyan');
      modelStats.forEach(({ model, count }: any) => {
        log(`     ${model}: ${count} cars`, 'reset');
      });
    }
    
  } catch (error) {
    log(`❌ Error generating statistics: ${error}`, 'red');
  }
}

/**
 * Main seeding function
 */
async function seedDatabase(): Promise<void> {
  log('🚀 TaxiTub Database Seeding Script', 'bright');
  log('=====================================', 'bright');
  
  // Step 1: Check database connection
  log('\n🔌 Checking database connection...', 'blue');
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    log('❌ Database connection failed. Please check your .env configuration.', 'red');
    process.exit(1);
  }
  log('✅ Database connection successful', 'green');
  
  // Step 2: Clear existing data (optional)
  log('\n🗑️  Checking existing data...', 'blue');
  const cleared = await clearExistingCars();
  if (!cleared) {
    log('❌ Failed to clear existing data', 'red');
    process.exit(1);
  }
  
  // Step 3: Generate mock data
  log(`\n🎲 Generating ${TARGET_COUNT} mock car records...`, 'blue');
  const startTime = Date.now();
  
  const cars = generateMockCarsWithProgress(TARGET_COUNT, (current, total) => {
    displayProgressBar(current, total, 'Generating');
  });
  
  const generateTime = Date.now() - startTime;
  log(`✅ Generated ${cars.length} cars in ${generateTime}ms`, 'green');
  
  // Step 4: Validate generated data
  log('\n🔍 Validating generated data...', 'blue');
  const stats = analyzeGeneratedCars(cars);
  log(`   📊 Total cars: ${stats.total}`, 'cyan');
  log(`   🔗 Unique plates: ${stats.uniquePlateNumbers}`, 'cyan');
  log(`   👥 Unique drivers: ${stats.uniqueDriverNames}`, 'cyan');
  
  // Quick validation check
  const invalidCars = cars.filter(car => validateMockCar(car).length > 0);
  if (invalidCars.length > 0) {
    log(`⚠️  Found ${invalidCars.length} invalid car records`, 'yellow');
  } else {
    log('✅ All generated cars are valid', 'green');
  }
  
  // Step 5: Insert into database
  log('\n💾 Inserting cars into database...', 'blue');
  const insertStartTime = Date.now();
  
  const success = await insertCarsInBatches(cars);
  const insertTime = Date.now() - insertStartTime;
  
  if (!success) {
    log('❌ Database seeding failed', 'red');
    process.exit(1);
  }
  
  log(`✅ Database insertion completed in ${insertTime}ms`, 'green');
  
  // Step 6: Verify insertion
  const verified = await verifyInsertion(TARGET_COUNT);
  
  // Step 7: Display final statistics
  await displayStatistics();
  
  // Summary
  const totalTime = Date.now() - startTime;
  log('\n🎉 Database Seeding Complete!', 'bright');
  log('==============================', 'bright');
  log(`   ⏱️  Total time: ${totalTime}ms`, 'cyan');
  log(`   🎯 Target count: ${TARGET_COUNT}`, 'cyan');
  log(`   📊 Final count: ${await getCurrentCarCount()}`, 'cyan');
  log(`   ✅ Success: ${verified ? 'Yes' : 'Partial'}`, verified ? 'green' : 'yellow');
  
  if (verified) {
    log('\n🚗 Your TaxiTub database is now ready with 2,000 mock cars!', 'green');
  } else {
    log('\n⚠️  Seeding completed with some issues. Check the logs above.', 'yellow');
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled Rejection at: ${promise}, reason: ${reason}`, 'red');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`❌ Uncaught Exception: ${error.message}`, 'red');
  process.exit(1);
});

// Run the seeding script
if (require.main === module) {
  seedDatabase().catch((error) => {
    log(`❌ Seeding script failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

export { seedDatabase };
