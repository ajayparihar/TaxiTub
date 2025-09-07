// TaxiTub Module: Database Cleanup Utility
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Utility to manage database size and remove excess cars

import { supabase, TABLES } from "../config/supabase";

/**
 * SECURITY NOTE:
 * These utilities are intended for development/testing environments to manage data volume.
 * Ensure UI gates calls to Admin-only flows and add an explicit confirmation step before executing.
 * No runtime behavior is changed by these comments.
 */

/**
 * Get current database statistics
 */
/**
 * Retrieves aggregate counts for cars and queued cars.
 * Used to inform cleanup/reset operations and admin dashboards.
 * @returns Object with totalCars, carsInQueue, availableCars
 */
export async function getDatabaseStats() {
  try {
    // Get total car count
    const { count: totalCars, error: carError } = await supabase
      .from(TABLES.CAR_INFO)
      .select("*", { count: "exact", head: true });

    if (carError) throw carError;

    // Get cars in queue - check all seater queues
    let carsInQueue = 0;
    const seaterTables = ['queue_4seater', 'queue_5seater', 'queue_6seater', 'queue_7seater', 'queue_8seater'];
    
    for (const tableName of seaterTables) {
      try {
        const { count } = await supabase
          .from(tableName)
          .select("*", { count: "exact", head: true });
        carsInQueue += count || 0;
      } catch (err) {
        // Table might not exist yet, skip it
        console.warn(`Table ${tableName} not accessible, skipping`);
      }
    }


    return {
      totalCars: totalCars || 0,
      carsInQueue: carsInQueue || 0,
      availableCars: (totalCars || 0) - (carsInQueue || 0),
    };
  } catch (error) {
    console.error("Failed to get database stats:", error);
    throw error;
  }
}

/**
 * Safely remove excess cars from database
 * Only removes cars that are NOT in queue
 */
/**
 * Danger: Removes up to maxRemoveCount cars that are NOT in any queue.
 * Intended for database housekeeping in development/testing environments.
 * SECURITY: Gate calls to Admin-only UI; confirm intent before execution.
 * @param maxRemoveCount - Max number of cars to delete
 * @returns Removal summary and remaining counts
 */
export async function cleanupExcessCars(maxRemoveCount: number = 3000) {
  try {
    console.log("🔍 Analyzing current database state...");
    const stats = await getDatabaseStats();
    
    console.log("📊 Current Statistics:");
    console.log(`  Total Cars: ${stats.totalCars}`);
    console.log(`  Cars in Queue: ${stats.carsInQueue}`);
    console.log(`  Available Cars: ${stats.availableCars}`);

    if (stats.availableCars === 0) {
      console.log(`✅ No cars available for removal. All cars are in use.`);
      return { removed: 0, remaining: stats.totalCars };
    }

    const toRemoveCount = Math.min(maxRemoveCount, stats.availableCars);
    console.log(`🎯 Planning to remove up to ${toRemoveCount} available cars.`);

    // Get cars that are NOT in queue from all seater tables
    const seaterTables = ['queue_4seater', 'queue_5seater', 'queue_6seater', 'queue_7seater', 'queue_8seater'];
    const carsInQueueIds: string[] = [];
    for (const tableName of seaterTables) {
      try {
        const { data } = await supabase
          .from(tableName)
          .select("carid");
        if (data) {
          carsInQueueIds.push(...data.map((row: any) => row.carid));
        }
      } catch (err) {
        // Table might not exist, continue
        console.warn(`Cannot access ${tableName}, continuing...`);
      }
    }
    const carsInQueue = carsInQueueIds.map(id => ({ carid: id }));

    const protectedCarIds = new Set([
      ...(carsInQueue || []).map(q => q.carid)
    ]);

    console.log(`🛡️  Protected cars (in queue): ${protectedCarIds.size}`);

    // Get cars that can be safely removed
    const { data: allCars } = await supabase
      .from(TABLES.CAR_INFO)
      .select("carid")
      .order("carid");

    if (!allCars) {
      throw new Error("Failed to fetch cars for cleanup");
    }

    const removableCars = allCars.filter(car => !protectedCarIds.has(car.carid));
    console.log(`🗑️  Cars available for removal: ${removableCars.length}`);

    if (removableCars.length < toRemoveCount) {
      console.log(`⚠️  Warning: Can only remove ${removableCars.length} cars, but wanted to remove ${toRemoveCount}.`);
      console.log(`   This is because ${protectedCarIds.size} cars are currently in queue.`);
    }

    const actualRemoveCount = Math.min(toRemoveCount, removableCars.length);
    const carsToRemove = removableCars.slice(0, actualRemoveCount);

    if (actualRemoveCount === 0) {
      console.log("✅ No cars can be safely removed at this time.");
      return { removed: 0, remaining: stats.totalCars };
    }

    console.log(`🗑️  Removing ${actualRemoveCount} cars...`);
    
    // Remove cars in batches to avoid timeout
    const batchSize = 100;
    let removedCount = 0;

    for (let i = 0; i < carsToRemove.length; i += batchSize) {
      const batch = carsToRemove.slice(i, i + batchSize);
      const carIds = batch.map(car => car.carid);

      const { error } = await supabase
        .from(TABLES.CAR_INFO)
        .delete()
        .in("carid", carIds);

      if (error) {
        console.error(`❌ Failed to remove batch starting at ${i}:`, error);
        break;
      }

      removedCount += batch.length;
      console.log(`✅ Removed batch ${Math.ceil((i + batch.length) / batchSize)} - Total removed: ${removedCount}`);
    }

    const finalStats = await getDatabaseStats();
    
    console.log("🎉 Cleanup completed!");
    console.log(`📊 Final Statistics:`);
    console.log(`  Cars Removed: ${removedCount}`);
    console.log(`  Cars Remaining: ${finalStats.totalCars}`);
    console.log(`  Cars in Queue: ${finalStats.carsInQueue}`);

    return { 
      removed: removedCount, 
      remaining: finalStats.totalCars,
      stats: finalStats
    };

  } catch (error) {
    console.error("❌ Failed to cleanup excess cars:", error);
    throw error;
  }
}

/**
 * Reset database to specific car count with fresh mock data
 * WARNING: This will remove ALL cars and regenerate
 */
/**
 * DANGER: Wipes all cars and queues, then seeds fresh mock data.
 * For local development/testing ONLY. Ensure user confirms before proceeding.
 * @param targetCount - Number of mock cars to generate
 */
export async function resetDatabaseWithMockData(targetCount: number = 1000) {
  try {
    console.log("⚠️  WARNING: This will remove ALL cars and regenerate with mock data!");
    
    // First, clear all related data from seater queues
    console.log("🗑️  Clearing all seater queues...");
    const seaterTables = ['queue_4seater', 'queue_5seater', 'queue_6seater', 'queue_7seater', 'queue_8seater'];
    for (const tableName of seaterTables) {
      try {
        await supabase.from(tableName).delete().neq("queueid", "");
        console.log(`✅ Cleared ${tableName}`);
      } catch (err) {
        console.warn(`Could not clear ${tableName}, continuing...`);
      }
    }

    console.log("🗑️  Clearing cars...");
    await supabase.from(TABLES.CAR_INFO).delete().neq("carid", "");

    // Generate and insert new mock data
    console.log(`🏗️  Generating ${targetCount} new mock cars...`);
    const { generateMockCarsWithProgress } = await import("./mockDataGenerator");
    
    const mockCars = generateMockCarsWithProgress(targetCount, (current, total) => {
      if (current % 100 === 0 || current === total) {
        console.log(`  Progress: ${current}/${total} (${Math.round(current/total*100)}%)`);
      }
    });

    console.log("💾 Inserting cars into database...");
    
    // Insert in batches
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < mockCars.length; i += batchSize) {
      const batch = mockCars.slice(i, i + batchSize);
      const dbBatch = batch.map(car => ({
        plateno: car.plateNo,
        drivername: car.driverName,
        driverphone: car.driverPhone,
        carmodel: car.carModel,
        seater: car.seater,
      }));

      const { error } = await supabase
        .from(TABLES.CAR_INFO)
        .insert(dbBatch);

      if (error) {
        console.error(`❌ Failed to insert batch starting at ${i}:`, error);
        break;
      }

      insertedCount += batch.length;
      console.log(`✅ Inserted batch ${Math.ceil((i + batch.length) / batchSize)} - Total: ${insertedCount}`);
    }

    const finalStats = await getDatabaseStats();
    
    console.log("🎉 Database reset completed!");
    console.log(`📊 Final Statistics:`);
    console.log(`  Total Cars: ${finalStats.totalCars}`);
    console.log(`  Cars in Queue: ${finalStats.carsInQueue}`);

    return { 
      inserted: insertedCount, 
      total: finalStats.totalCars,
      stats: finalStats
    };

  } catch (error) {
    console.error("❌ Failed to reset database:", error);
    throw error;
  }
}

/**
 * Quick function to check if cleanup is needed
 */
/**
 * Quick heuristic to decide if cleanup may be helpful.
 * @param unusedCarThreshold - Threshold for available (non-queued) cars
 * @returns true if available cars exceed the threshold
 */
export async function checkIfCleanupNeeded(unusedCarThreshold: number = 500): Promise<boolean> {
  try {
    const stats = await getDatabaseStats();
    return stats.availableCars > unusedCarThreshold;
  } catch (error) {
    console.error("Failed to check cleanup status:", error);
    return false;
  }
}
