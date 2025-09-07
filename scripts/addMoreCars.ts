#!/usr/bin/env tsx
// TaxiTub Module: Add More Cars Script
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Script to add more mock cars to existing database

import { createClient } from '@supabase/supabase-js';
import { generateMockCarsWithProgress } from '../src/utils/mockDataGenerator';
import type { CarInfo } from '../src/types';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BATCH_SIZE = 100;
const TARGET_COUNT = 1000; // Add 1000 more cars to reach ~2000 total

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Environment variables not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
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

function convertToDbFormat(car: Omit<CarInfo, 'carId'>): any {
  return {
    plateno: car.plateNo,
    drivername: car.driverName,
    driverphone: car.driverPhone,
    carmodel: car.carModel,
    seater: car.seater,
  };
}

async function addMoreCars(): Promise<void> {
  log('🚗 Adding More Cars to TaxiTub Database', 'blue');
  log('======================================', 'blue');
  
  // Check current count
  const currentCount = await getCurrentCarCount();
  log(`📊 Current cars in database: ${currentCount}`, 'cyan');
  
  // Generate new cars
  log(`\n🎲 Generating ${TARGET_COUNT} additional mock car records...`, 'blue');
  const cars = generateMockCarsWithProgress(TARGET_COUNT, (current, total) => {
    displayProgressBar(current, total, 'Generating');
  });
  log(`✅ Generated ${cars.length} cars`, 'green');
  
  // Insert in batches
  log(`\n💾 Inserting ${cars.length} cars in batches of ${BATCH_SIZE}...`, 'blue');
  
  const batches = [];
  for (let i = 0; i < cars.length; i += BATCH_SIZE) {
    batches.push(cars.slice(i, i + BATCH_SIZE));
  }
  
  let totalInserted = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const dbBatch = batch.map(convertToDbFormat);
    
    try {
      const { data, error } = await supabase.from('carinfo').insert(dbBatch).select('carid');
      
      if (error) {
        // Handle duplicate plate numbers
        if (error.code === '23505') {
          log(`🔄 Batch ${i + 1} has duplicates, retrying with new data...`, 'cyan');
          const retryBatch = batch.map(() => generateMockCarsWithProgress(1)[0]).map(convertToDbFormat);
          const { data: retryData, error: retryError } = await supabase
            .from('carinfo')
            .insert(retryBatch)
            .select('carid');
          
          if (!retryError && retryData) {
            totalInserted += retryData.length;
            displayProgressBar(totalInserted, cars.length, 'Inserting');
          }
        } else {
          log(`❌ Batch ${i + 1} failed: ${error.message}`, 'reset');
        }
      } else if (data) {
        totalInserted += data.length;
        displayProgressBar(totalInserted, cars.length, 'Inserting');
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      log(`❌ Batch ${i + 1} failed: ${error}`, 'reset');
    }
  }
  
  const finalCount = await getCurrentCarCount();
  
  log(`\n🎉 Addition Complete!`, 'green');
  log(`   📊 Added: ${totalInserted} cars`, 'green');
  log(`   🎯 Total in DB: ${finalCount} cars`, 'green');
  log(`   📈 Increase: ${finalCount - currentCount} cars`, 'green');
}

addMoreCars().catch(console.error);
