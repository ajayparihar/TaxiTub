#!/usr/bin/env tsx
// TaxiTub Module: Add Cars to Target Script
// Enhanced with better duplicate handling

import { createClient } from '@supabase/supabase-js';
import { generateMockCarsWithProgress } from '../src/utils/mockDataGenerator';
import type { CarInfo } from '../src/types';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BATCH_SIZE = 50; // Smaller batches for better duplicate handling
const TARGET_TOTAL = 2000; // Target total cars in database

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Environment variables not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function displayProgressBar(current: number, total: number, label: string = 'Progress') {
  const percentage = Math.round((current / total) * 100);
  const completed = Math.round((current / total) * 40);
  const remaining = 40 - completed;
  
  const progressBar = '█'.repeat(completed) + '░'.repeat(remaining);
  const progressText = `${label}: [${progressBar}] ${percentage}% (${current}/${total})`;
  
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(`${colors.cyan}${progressText}${colors.reset}`);
  
  if (current === total) {
    process.stdout.write('\n');
  }
}

async function getCurrentCarCount(): Promise<number> {
  const { data, error } = await supabase.from('carinfo').select('carid');
  if (error) {
    log(`❌ Error getting car count: ${error.message}`, 'reset');
    return 0;
  }
  return data?.length || 0;
}

async function getExistingPlateNumbers(): Promise<Set<string>> {
  const { data, error } = await supabase.from('carinfo').select('plateno');
  if (error) {
    log(`⚠️  Could not fetch existing plate numbers: ${error.message}`, 'yellow');
    return new Set();
  }
  return new Set(data.map(car => car.plateno));
}

function convertToDbFormat(car: Omit<CarInfo, 'carId'>): any {
  return {
    plateno: car.plateNo,
    drivername: car.driverName,
    driverphone: car.driverPhone,
    carmodel: car.carModel,
    seater: car.seater,
  };
}

// Enhanced plate number generation with timestamp
function generateUniqueTimeBasedPlate(): string {
  const emirates = ['AD', 'AZ', 'DU', 'FU', 'RK', 'SH', 'UQ'];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const timestamp = Date.now();
  
  const emirate = emirates[Math.floor(Math.random() * emirates.length)];
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const timeComponent = timestamp % 100000; // Last 5 digits of timestamp
  const randomComponent = Math.floor(Math.random() * 100000);
  const number = ((timeComponent + randomComponent) % 100000).toString().padStart(5, '0');
  
  return `${emirate} ${letter} ${number}`;
}

async function addCarsToTarget(): Promise<void> {
  log('🚗 TaxiTub: Add Cars to Target', 'bright');
  log('=============================', 'bright');
  
  const currentCount = await getCurrentCarCount();
  log(`📊 Current cars in database: ${currentCount}`, 'cyan');
  
  if (currentCount >= TARGET_TOTAL) {
    log(`✅ Target already reached! (${currentCount}/${TARGET_TOTAL})`, 'green');
    return;
  }
  
  const needed = TARGET_TOTAL - currentCount;
  log(`🎯 Need to add: ${needed} cars`, 'blue');
  
  // Get existing plate numbers to avoid duplicates
  log('🔍 Fetching existing plate numbers...', 'blue');
  const existingPlates = await getExistingPlateNumbers();
  log(`📋 Found ${existingPlates.size} existing plate numbers`, 'cyan');
  
  // Generate cars with enhanced duplicate avoidance
  log(`\n🎲 Generating ${needed} unique mock car records...`, 'blue');
  
  const cars: Array<Omit<CarInfo, 'carId'>> = [];
  let attempts = 0;
  const maxAttempts = needed * 5;
  
  while (cars.length < needed && attempts < maxAttempts) {
    attempts++;
    const car = generateMockCarsWithProgress(1)[0];
    
    // Use time-based plate for better uniqueness
    if (Math.random() < 0.3) { // 30% chance for time-based plate
      car.plateNo = generateUniqueTimeBasedPlate();
    }
    
    // Check against existing plates and already generated plates
    const allUsedPlates = new Set([...existingPlates, ...cars.map(c => c.plateNo)]);
    
    if (!allUsedPlates.has(car.plateNo)) {
      cars.push(car);
      
      if (cars.length % Math.max(1, Math.floor(needed / 50)) === 0) {
        displayProgressBar(cars.length, needed, 'Generating');
      }
    }
  }
  
  if (cars.length < needed) {
    log(`\n⚠️  Generated ${cars.length} cars instead of ${needed} due to uniqueness constraints`, 'yellow');
  } else {
    log(`\n✅ Generated ${cars.length} unique cars`, 'green');
  }
  
  // Insert in smaller batches with retry logic
  log(`\n💾 Inserting ${cars.length} cars in batches of ${BATCH_SIZE}...`, 'blue');
  
  const batches = [];
  for (let i = 0; i < cars.length; i += BATCH_SIZE) {
    batches.push(cars.slice(i, i + BATCH_SIZE));
  }
  
  let totalInserted = 0;
  let failedInsertions = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    let success = false;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (!success && retryCount < maxRetries) {
      const dbBatch = batch.map(convertToDbFormat);
      
      try {
        const { data, error } = await supabase.from('carinfo').insert(dbBatch).select('carid');
        
        if (error) {
          if (error.code === '23505' && retryCount < maxRetries - 1) {
            // Duplicate key, regenerate batch with time-based plates
            batch.forEach(car => {
              car.plateNo = generateUniqueTimeBasedPlate();
            });
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay before retry
          } else {
            log(`❌ Batch ${i + 1} failed after retries: ${error.message}`, 'reset');
            failedInsertions += batch.length;
            break;
          }
        } else if (data) {
          totalInserted += data.length;
          displayProgressBar(totalInserted, cars.length, 'Inserting');
          success = true;
        }
      } catch (error) {
        log(`❌ Batch ${i + 1} failed: ${error}`, 'reset');
        failedInsertions += batch.length;
        break;
      }
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  
  const finalCount = await getCurrentCarCount();
  
  log(`\n🎉 Operation Complete!`, 'bright');
  log('====================', 'bright');
  log(`   📊 Successfully added: ${totalInserted} cars`, 'green');
  log(`   ❌ Failed to add: ${failedInsertions} cars`, failedInsertions > 0 ? 'yellow' : 'green');
  log(`   🎯 Total in database: ${finalCount} cars`, 'cyan');
  log(`   📈 Progress: ${finalCount}/${TARGET_TOTAL} (${((finalCount/TARGET_TOTAL)*100).toFixed(1)}%)`, 'cyan');
  
  if (finalCount >= TARGET_TOTAL) {
    log(`\n🎊 Congratulations! Target of ${TARGET_TOTAL} cars reached!`, 'green');
  } else if (finalCount >= TARGET_TOTAL * 0.95) {
    log(`\n✅ Very close! ${TARGET_TOTAL - finalCount} cars away from target.`, 'green');
  } else {
    log(`\n📌 Progress made. Run again to add more cars if needed.`, 'blue');
  }
}

addCarsToTarget().catch(console.error);
