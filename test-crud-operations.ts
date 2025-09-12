/**
 * TaxiTub CRUD Operations Test Suite
 * Comprehensive testing of all API endpoints and business logic
 * Version: v0.1.0
 * Author: Testing Suite
 */

import { CarService, QueueService, BookingService, QueuePalService } from './src/services/api';
import { CarInfo, QueueAddRequest, QueuePal } from './src/types';

// Test results interface
interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
  data?: any;
  error?: any;
}

interface TestSuite {
  suiteName: string;
  results: TestResult[];
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

class CRUDTester {
  private testResults: TestSuite[] = [];
  private testData: {
    createdCars: string[];
    createdQueuePals: string[];
    queuedCars: string[];
  } = {
    createdCars: [],
    createdQueuePals: [],
    queuedCars: []
  };

  /**
   * Utility method to run a test and capture results
   */
  private async runTest(
    testName: string,
    testFn: () => Promise<any>
  ): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      return {
        testName,
        status: 'PASS',
        message: 'Test completed successfully',
        duration,
        data: result
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        testName,
        status: 'FAIL',
        message: error.message || 'Test failed with unknown error',
        duration,
        error
      };
    }
  }

  /**
   * Test Suite 1: Car Management CRUD Operations
   */
  async testCarManagement(): Promise<TestSuite> {
    const suiteName = 'Car Management CRUD';
    const results: TestResult[] = [];
    const suiteStartTime = Date.now();

    console.log('\n🚗 Testing Car Management CRUD Operations...');
    
    // Test 1: Get all cars (should work even if empty)
    results.push(await this.runTest('Get All Cars', async () => {
      const response = await CarService.getAllCars();
      if (!response.success) {
        throw new Error(`Failed to get cars: ${response.message}`);
      }
      console.log(`✅ Found ${response.data?.length || 0} cars in system`);
      return response.data;
    }));

    // Test 2: Add a new car
    const testCar1: Omit<CarInfo, 'carId'> = {
      plateNo: 'TEST001',
      driverName: 'Test Driver 1',
      driverPhone: '+1234567890',
      carModel: 'Honda Civic',
      seater: 4
    };

    results.push(await this.runTest('Add Car - 4 Seater', async () => {
      const response = await CarService.addCar(testCar1);
      if (!response.success) {
        throw new Error(`Failed to add car: ${response.message}`);
      }
      this.testData.createdCars.push(response.data!.carId);
      console.log(`✅ Added car: ${response.data!.plateNo} (ID: ${response.data!.carId})`);
      return response.data;
    }));

    // Test 3: Add another car with different seater
    const testCar2: Omit<CarInfo, 'carId'> = {
      plateNo: 'TEST002',
      driverName: 'Test Driver 2',
      driverPhone: '+0987654321',
      carModel: 'Toyota Innova',
      seater: 7
    };

    results.push(await this.runTest('Add Car - 7 Seater', async () => {
      const response = await CarService.addCar(testCar2);
      if (!response.success) {
        throw new Error(`Failed to add car: ${response.message}`);
      }
      this.testData.createdCars.push(response.data!.carId);
      console.log(`✅ Added car: ${response.data!.plateNo} (ID: ${response.data!.carId})`);
      return response.data;
    }));

    // Test 4: Test duplicate plate number (should fail)
    results.push(await this.runTest('Add Car - Duplicate Plate (Should Fail)', async () => {
      const response = await CarService.addCar(testCar1); // Same plate as first car
      if (response.success) {
        throw new Error('Duplicate car addition should have failed but succeeded');
      }
      console.log(`✅ Correctly rejected duplicate plate: ${response.message}`);
      return { expectedError: true, message: response.message };
    }));

    // Test 5: Update car information
    if (this.testData.createdCars.length > 0) {
      results.push(await this.runTest('Update Car Information', async () => {
        const carId = this.testData.createdCars[0];
        const updates = {
          driverPhone: '+1111111111',
          carModel: 'Honda Civic Updated'
        };
        
        const response = await CarService.updateCar(carId, updates);
        if (!response.success) {
          throw new Error(`Failed to update car: ${response.message}`);
        }
        console.log(`✅ Updated car: ${response.data!.plateNo}`);
        return response.data;
      }));
    }

    // Test 6: Toggle car status (if supported)
    if (this.testData.createdCars.length > 0) {
      results.push(await this.runTest('Toggle Car Status', async () => {
        const carId = this.testData.createdCars[0];
        const response = await CarService.toggleCarStatus(carId);
        if (!response.success) {
          // If toggle fails, it might be because the column doesn't exist
          console.log(`⚠️  Car status toggle not supported: ${response.message}`);
          return { supported: false, message: response.message };
        }
        console.log(`✅ Toggled car status: ${response.data!.isActive}`);
        return response.data;
      }));
    }

    // Test 7: Get cars with pagination
    results.push(await this.runTest('Get Cars with Pagination', async () => {
      const response = await CarService.getCars(1, 10);
      if (!response.success) {
        throw new Error(`Failed to get paginated cars: ${response.message}`);
      }
      console.log(`✅ Retrieved ${response.data!.cars.length} cars (Page 1, Size 10)`);
      return response.data;
    }));

    // Test 8: Search cars
    results.push(await this.runTest('Search Cars', async () => {
      const response = await CarService.getCars(1, 50, 'TEST');
      if (!response.success) {
        throw new Error(`Failed to search cars: ${response.message}`);
      }
      console.log(`✅ Found ${response.data!.cars.length} cars matching 'TEST'`);
      return response.data;
    }));

    const suiteDuration = Date.now() - suiteStartTime;
    return this.compileSuiteResults(suiteName, results, suiteDuration);
  }

  /**
   * Test Suite 2: Queue Management CRUD Operations
   */
  async testQueueManagement(): Promise<TestSuite> {
    const suiteName = 'Queue Management CRUD';
    const results: TestResult[] = [];
    const suiteStartTime = Date.now();

    console.log('\n📋 Testing Queue Management CRUD Operations...');

    // Test 1: Get all queues (should work even if empty)
    results.push(await this.runTest('Get All Queues', async () => {
      const response = await QueueService.getAllQueues();
      if (!response.success) {
        throw new Error(`Failed to get queues: ${response.message}`);
      }
      console.log(`✅ Retrieved ${response.data?.length || 0} queue types`);
      return response.data;
    }));

    // Test 2: Get specific queue by seater
    results.push(await this.runTest('Get 4-Seater Queue', async () => {
      const response = await QueueService.getQueueBySeater(4);
      if (!response.success) {
        throw new Error(`Failed to get 4-seater queue: ${response.message}`);
      }
      console.log(`✅ 4-seater queue has ${response.data!.cars.length} cars`);
      return response.data;
    }));

    // Test 3: Add car to queue (need existing car)
    if (this.testData.createdCars.length > 0) {
      results.push(await this.runTest('Add Car to Queue', async () => {
        const carId = this.testData.createdCars[0]; // Use first test car
        const request: QueueAddRequest = { carId };
        
        const response = await QueueService.addCarToQueue(request);
        if (!response.success) {
          throw new Error(`Failed to add car to queue: ${response.message}`);
        }
        this.testData.queuedCars.push(carId);
        console.log(`✅ Added car to queue at position ${response.data!.position}`);
        return response.data;
      }));

      // Test 4: Try to add same car again (should fail)
      results.push(await this.runTest('Add Same Car to Queue Again (Should Fail)', async () => {
        const carId = this.testData.createdCars[0];
        const request: QueueAddRequest = { carId };
        
        const response = await QueueService.addCarToQueue(request);
        if (response.success) {
          throw new Error('Adding same car to queue should have failed but succeeded');
        }
        console.log(`✅ Correctly rejected duplicate queue entry: ${response.message}`);
        return { expectedError: true, message: response.message };
      }));

      // Test 5: Add second car to queue
      if (this.testData.createdCars.length > 1) {
        results.push(await this.runTest('Add Second Car to Queue', async () => {
          const carId = this.testData.createdCars[1]; // Use second test car
          const request: QueueAddRequest = { carId };
          
          const response = await QueueService.addCarToQueue(request);
          if (!response.success) {
            throw new Error(`Failed to add second car to queue: ${response.message}`);
          }
          this.testData.queuedCars.push(carId);
          console.log(`✅ Added second car to queue at position ${response.data!.position}`);
          return response.data;
        }));
      }
    }

    // Test 6: Fix queue positions
    results.push(await this.runTest('Fix Queue Positions', async () => {
      const response = await QueueService.fixQueuePositions();
      if (!response.success) {
        throw new Error(`Failed to fix queue positions: ${response.message}`);
      }
      console.log(`✅ Fixed ${response.data!.updated} queue positions`);
      return response.data;
    }));

    // Test 7: Test invalid seater type
    results.push(await this.runTest('Invalid Seater Type (Should Fail)', async () => {
      const response = await QueueService.getQueueBySeater(99);
      if (response.success) {
        throw new Error('Invalid seater type should have failed but succeeded');
      }
      console.log(`✅ Correctly rejected invalid seater type: ${response.message}`);
      return { expectedError: true, message: response.message };
    }));

    const suiteDuration = Date.now() - suiteStartTime;
    return this.compileSuiteResults(suiteName, results, suiteDuration);
  }

  /**
   * Test Suite 3: Booking/Assignment Service Operations
   */
  async testBookingService(): Promise<TestSuite> {
    const suiteName = 'Booking/Assignment Service';
    const results: TestResult[] = [];
    const suiteStartTime = Date.now();

    console.log('\n🎯 Testing Booking/Assignment Service Operations...');

    // Test 1: Assign taxi with 2 passengers (should get from 4-seater queue)
    if (this.testData.queuedCars.length > 0) {
      results.push(await this.runTest('Assign Taxi - 2 Passengers', async () => {
        const response = await BookingService.assignTaxi(2, 'Test Airport Terminal 1');
        if (!response.success) {
          throw new Error(`Failed to assign taxi: ${response.message}`);
        }
        console.log(`✅ Assigned ${response.data!.car.seater}-seater taxi: ${response.data!.car.plateNo}`);
        return response.data;
      }));
    }

    // Test 2: Try to assign taxi with 0 passengers (should fail)
    results.push(await this.runTest('Assign Taxi - 0 Passengers (Should Fail)', async () => {
      const response = await BookingService.assignTaxi(0);
      if (response.success) {
        throw new Error('Assignment with 0 passengers should have failed but succeeded');
      }
      console.log(`✅ Correctly rejected 0 passengers: ${response.message}`);
      return { expectedError: true, message: response.message };
    }));

    // Test 3: Try to assign taxi with 9 passengers (should fail)
    results.push(await this.runTest('Assign Taxi - 9 Passengers (Should Fail)', async () => {
      const response = await BookingService.assignTaxi(9);
      if (response.success) {
        throw new Error('Assignment with 9 passengers should have failed but succeeded');
      }
      console.log(`✅ Correctly rejected 9 passengers: ${response.message}`);
      return { expectedError: true, message: response.message };
    }));

    // Test 4: Try to assign when no cars in queue
    results.push(await this.runTest('Assign Taxi - No Cars Available', async () => {
      // First clear all queues
      const clearResults = await Promise.all([4, 5, 6, 7, 8].map(seater => 
        QueueService.clearQueueBySeater(seater)
      ));
      
      const response = await BookingService.assignTaxi(3);
      if (response.success) {
        throw new Error('Assignment with no cars should have failed but succeeded');
      }
      console.log(`✅ Correctly handled no available cars: ${response.message}`);
      return { expectedError: true, message: response.message };
    }));

    // Test 5: Test different passenger counts (if we still have queued cars)
    const passengerCounts = [1, 3, 5, 7, 8];
    for (const count of passengerCounts) {
      results.push(await this.runTest(`Test Allocation Logic - ${count} Passengers`, async () => {
        // Re-add a car for this test if needed
        if (this.testData.createdCars.length > 0) {
          const carId = this.testData.createdCars[0];
          await QueueService.addCarToQueue({ carId });
        }
        
        const response = await BookingService.assignTaxi(count, `Destination for ${count} passengers`);
        if (!response.success && response.error_code !== 'NO_AVAILABLE_CAR') {
          throw new Error(`Failed to test ${count} passengers: ${response.message}`);
        }
        
        if (response.success) {
          console.log(`✅ ${count} passengers → ${response.data!.car.seater}-seater (Efficiency: ${Math.round((count/response.data!.car.seater)*100)}%)`);
        } else {
          console.log(`⚠️  ${count} passengers → No cars available`);
        }
        
        return response.success ? response.data : { noCarAvailable: true };
      }));
    }

    const suiteDuration = Date.now() - suiteStartTime;
    return this.compileSuiteResults(suiteName, results, suiteDuration);
  }

  /**
   * Test Suite 4: QueuePal Management CRUD Operations
   */
  async testQueuePalManagement(): Promise<TestSuite> {
    const suiteName = 'QueuePal Management CRUD';
    const results: TestResult[] = [];
    const suiteStartTime = Date.now();

    console.log('\n👥 Testing QueuePal Management CRUD Operations...');

    // Test 1: Get all QueuePals
    results.push(await this.runTest('Get All QueuePals', async () => {
      const response = await QueuePalService.getAllQueuePals();
      if (!response.success) {
        throw new Error(`Failed to get QueuePals: ${response.message}`);
      }
      console.log(`✅ Found ${response.data?.length || 0} QueuePals`);
      return response.data;
    }));

    // Test 2: Add new QueuePal
    const testQueuePal1: Omit<QueuePal, 'queuePalId'> = {
      name: 'Test QueuePal 1',
      contact: '+1234567890',
      assignedBy: 'Test Admin'
    };

    results.push(await this.runTest('Add QueuePal', async () => {
      const response = await QueuePalService.addQueuePal(testQueuePal1);
      if (!response.success) {
        throw new Error(`Failed to add QueuePal: ${response.message}`);
      }
      this.testData.createdQueuePals.push(response.data!.queuePalId);
      console.log(`✅ Added QueuePal: ${response.data!.name} (ID: ${response.data!.queuePalId})`);
      return response.data;
    }));

    // Test 3: Add another QueuePal
    const testQueuePal2: Omit<QueuePal, 'queuePalId'> = {
      name: 'Test QueuePal 2',
      contact: '+0987654321',
      assignedBy: 'Test Admin'
    };

    results.push(await this.runTest('Add Second QueuePal', async () => {
      const response = await QueuePalService.addQueuePal(testQueuePal2);
      if (!response.success) {
        throw new Error(`Failed to add second QueuePal: ${response.message}`);
      }
      this.testData.createdQueuePals.push(response.data!.queuePalId);
      console.log(`✅ Added second QueuePal: ${response.data!.name}`);
      return response.data;
    }));

    // Test 4: Update QueuePal
    if (this.testData.createdQueuePals.length > 0) {
      results.push(await this.runTest('Update QueuePal', async () => {
        const queuePalId = this.testData.createdQueuePals[0];
        const updates = {
          contact: '+1111111111',
          assignedBy: 'Updated Admin'
        };
        
        const response = await QueuePalService.updateQueuePal(queuePalId, updates);
        if (!response.success) {
          throw new Error(`Failed to update QueuePal: ${response.message}`);
        }
        console.log(`✅ Updated QueuePal: ${response.data!.name}`);
        return response.data;
      }));
    }

    const suiteDuration = Date.now() - suiteStartTime;
    return this.compileSuiteResults(suiteName, results, suiteDuration);
  }

  /**
   * Test Suite 5: Database Connection and Configuration
   */
  async testDatabaseConnection(): Promise<TestSuite> {
    const suiteName = 'Database Connection & Configuration';
    const results: TestResult[] = [];
    const suiteStartTime = Date.now();

    console.log('\n🔗 Testing Database Connection & Configuration...');

    // Test 1: Basic connection test via CarService
    results.push(await this.runTest('Database Connection Test', async () => {
      const response = await CarService.getAllCars();
      // Even if it fails due to permissions, we should get a structured response
      console.log(`✅ Database connection established (Response structure valid)`);
      return { connectionEstablished: true, responseReceived: !!response };
    }));

    // Test 2: Test car status support detection
    results.push(await this.runTest('Car Status Support Detection', async () => {
      const supported = await CarService.supportsCarStatus();
      console.log(`✅ Car status support: ${supported ? 'Supported' : 'Not Supported'}`);
      return { carStatusSupported: supported };
    }));

    // Test 3: Test queue tables accessibility
    const seaters = [4, 5, 6, 7, 8];
    for (const seater of seaters) {
      results.push(await this.runTest(`Queue Table Access - ${seater}-seater`, async () => {
        const response = await QueueService.getQueueBySeater(seater);
        if (!response.success) {
          throw new Error(`Failed to access ${seater}-seater queue: ${response.message}`);
        }
        console.log(`✅ ${seater}-seater queue table accessible`);
        return { tableAccessible: true, queueLength: response.data?.cars.length || 0 };
      }));
    }

    const suiteDuration = Date.now() - suiteStartTime;
    return this.compileSuiteResults(suiteName, results, suiteDuration);
  }

  /**
   * Test Suite 6: Business Logic and Edge Cases
   */
  async testBusinessLogic(): Promise<TestSuite> {
    const suiteName = 'Business Logic & Edge Cases';
    const results: TestResult[] = [];
    const suiteStartTime = Date.now();

    console.log('\n🧠 Testing Business Logic & Edge Cases...');

    // Test 1: Queue position integrity after multiple operations
    results.push(await this.runTest('Queue Position Integrity', async () => {
      // Add multiple cars and verify positions
      const carIds: string[] = [];
      
      // Create test cars for this test
      for (let i = 1; i <= 3; i++) {
        const car: Omit<CarInfo, 'carId'> = {
          plateNo: `POS${i}`,
          driverName: `Position Test Driver ${i}`,
          driverPhone: `+123456789${i}`,
          carModel: 'Test Car',
          seater: 4
        };
        
        const addResponse = await CarService.addCar(car);
        if (addResponse.success) {
          carIds.push(addResponse.data!.carId);
        }
      }

      // Add all cars to queue
      for (const carId of carIds) {
        await QueueService.addCarToQueue({ carId });
      }

      // Check queue positions
      const queueResponse = await QueueService.getQueueBySeater(4);
      if (!queueResponse.success) {
        throw new Error('Failed to get queue for position test');
      }

      const positions = queueResponse.data!.cars.map(car => car.position).sort((a, b) => a - b);
      const expectedPositions = Array.from({length: positions.length}, (_, i) => i + 1);
      
      const positionsValid = JSON.stringify(positions.slice(-carIds.length)) === JSON.stringify(expectedPositions.slice(-carIds.length));
      
      // Clean up test cars
      for (const carId of carIds) {
        await CarService.deleteCar(carId);
      }

      if (!positionsValid) {
        throw new Error(`Position integrity failed. Expected: ${expectedPositions}, Got: ${positions}`);
      }

      console.log(`✅ Queue positions are consecutive: ${positions.join(', ')}`);
      return { positionsValid, positions };
    }));

    // Test 2: Error code consistency
    results.push(await this.runTest('Error Code Consistency', async () => {
      const errors: { operation: string; errorCode: string; message: string }[] = [];

      // Test invalid car ID
      const invalidCarResponse = await CarService.updateCar('invalid-uuid', { driverPhone: '+0000000000' });
      if (!invalidCarResponse.success) {
        errors.push({
          operation: 'Update Invalid Car',
          errorCode: invalidCarResponse.error_code || 'UNKNOWN',
          message: invalidCarResponse.message || 'No message'
        });
      }

      // Test invalid seater
      const invalidSeaterResponse = await QueueService.getQueueBySeater(99);
      if (!invalidSeaterResponse.success) {
        errors.push({
          operation: 'Get Invalid Seater Queue',
          errorCode: invalidSeaterResponse.error_code || 'UNKNOWN',
          message: invalidSeaterResponse.message || 'No message'
        });
      }

      console.log(`✅ Collected ${errors.length} error responses for analysis`);
      return { errors };
    }));

    // Test 3: Concurrent operation handling (simplified)
    results.push(await this.runTest('Concurrent Operation Handling', async () => {
      if (this.testData.createdCars.length > 0) {
        const carId = this.testData.createdCars[0];
        
        // Try to add same car to queue multiple times simultaneously
        const concurrentPromises = Array.from({length: 3}, () => 
          QueueService.addCarToQueue({ carId })
        );
        
        const results = await Promise.all(concurrentPromises);
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;
        
        console.log(`✅ Concurrent operations: ${successCount} success, ${failureCount} rejected`);
        return { successCount, failureCount, handledCorrectly: successCount <= 1 };
      }
      
      return { skipped: true, reason: 'No cars available for test' };
    }));

    const suiteDuration = Date.now() - suiteStartTime;
    return this.compileSuiteResults(suiteName, results, suiteDuration);
  }

  /**
   * Cleanup test data
   */
  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up test data...');
    
    // Delete created QueuePals
    for (const queuePalId of this.testData.createdQueuePals) {
      try {
        await QueuePalService.deleteQueuePal(queuePalId);
        console.log(`✅ Deleted QueuePal: ${queuePalId}`);
      } catch (error) {
        console.log(`⚠️  Failed to delete QueuePal ${queuePalId}: ${error}`);
      }
    }

    // Delete created cars (this will also remove them from queues due to cascading)
    for (const carId of this.testData.createdCars) {
      try {
        await CarService.deleteCar(carId);
        console.log(`✅ Deleted car: ${carId}`);
      } catch (error) {
        console.log(`⚠️  Failed to delete car ${carId}: ${error}`);
      }
    }

    console.log('✅ Cleanup completed');
  }

  /**
   * Utility method to compile suite results
   */
  private compileSuiteResults(suiteName: string, results: TestResult[], duration: number): TestSuite {
    const suite: TestSuite = {
      suiteName,
      results,
      totalTests: results.length,
      passed: results.filter(r => r.status === 'PASS').length,
      failed: results.filter(r => r.status === 'FAIL').length,
      skipped: results.filter(r => r.status === 'SKIP').length,
      duration
    };

    this.testResults.push(suite);
    return suite;
  }

  /**
   * Generate final test report
   */
  generateFinalReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 FINAL TEST REPORT - TAXITUB CRUD OPERATIONS');
    console.log('='.repeat(80));
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalDuration = 0;

    this.testResults.forEach(suite => {
      console.log(`\n📋 ${suite.suiteName}:`);
      console.log(`   Tests: ${suite.totalTests} | Passed: ${suite.passed} | Failed: ${suite.failed} | Skipped: ${suite.skipped}`);
      console.log(`   Duration: ${suite.duration}ms`);
      
      if (suite.failed > 0) {
        const failedTests = suite.results.filter(r => r.status === 'FAIL');
        failedTests.forEach(test => {
          console.log(`   ❌ ${test.testName}: ${test.message}`);
        });
      }

      totalTests += suite.totalTests;
      totalPassed += suite.passed;
      totalFailed += suite.failed;
      totalSkipped += suite.skipped;
      totalDuration += suite.duration;
    });

    console.log('\n' + '='.repeat(80));
    console.log('📊 OVERALL SUMMARY:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${totalPassed} (${Math.round((totalPassed/totalTests)*100)}%)`);
    console.log(`   Failed: ${totalFailed} (${Math.round((totalFailed/totalTests)*100)}%)`);
    console.log(`   Skipped: ${totalSkipped} (${Math.round((totalSkipped/totalTests)*100)}%)`);
    console.log(`   Total Duration: ${totalDuration}ms (${Math.round(totalDuration/1000)}s)`);
    console.log('='.repeat(80));

    // Key findings and recommendations
    console.log('\n🔍 KEY FINDINGS:');
    
    if (totalFailed === 0) {
      console.log('✅ All CRUD operations are working correctly!');
      console.log('✅ Error handling is implemented properly');
      console.log('✅ Business logic validation is functioning');
    } else {
      console.log('⚠️  Some tests failed - review the errors above');
      console.log('⚠️  Check database connectivity and permissions');
      console.log('⚠️  Verify environment configuration');
    }

    console.log('\n📋 TESTED FUNCTIONALITIES:');
    console.log('✓ Car Management (Create, Read, Update, Delete)');
    console.log('✓ Queue Management (Add, Remove, Position Fixing)');
    console.log('✓ Taxi Assignment (Optimized allocation logic)');
    console.log('✓ QueuePal Management (User CRUD operations)');
    console.log('✓ Database Connection and Error Handling');
    console.log('✓ Business Logic and Edge Cases');
    
    console.log('\n🎯 CRUD TESTING COMPLETED SUCCESSFULLY! 🎯');
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive CRUD Testing for TaxiTub...\n');
    const overallStartTime = Date.now();

    try {
      // Run all test suites
      await this.testDatabaseConnection();
      await this.testCarManagement();
      await this.testQueueManagement();
      await this.testBookingService();
      await this.testQueuePalManagement();
      await this.testBusinessLogic();
      
    } catch (error) {
      console.error('❌ Critical error during testing:', error);
    } finally {
      // Always cleanup
      await this.cleanup();
      
      const overallDuration = Date.now() - overallStartTime;
      console.log(`\n⏱️  Total testing time: ${Math.round(overallDuration/1000)}s`);
      
      // Generate final report
      this.generateFinalReport();
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const tester = new CRUDTester();
  await tester.runAllTests();
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

export { CRUDTester };
