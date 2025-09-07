// TaxiTub Module: Mock Data Generator
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Mock data generation utility for seeding database with realistic car information

import type { CarInfo } from '../types';

/**
 * Generate realistic mock data for taxi cars
 */

// Common car models used for taxis
const TAXI_CAR_MODELS = [
  'Toyota Corolla', 'Honda Civic', 'Nissan Sentra', 'Hyundai Elantra',
  'Toyota Camry', 'Honda Accord', 'Nissan Altima', 'Chevrolet Malibu',
  'Ford Fusion', 'Volkswagen Jetta', 'Mazda3', 'Kia Forte',
  'Toyota Prius', 'Honda City', 'Nissan Versa', 'Hyundai Accent',
  'Toyota Vitz', 'Honda Fit', 'Suzuki Swift', 'Mitsubishi Lancer',
  'Toyota Innova', 'Honda Odyssey', 'Nissan NV200', 'Toyota Hiace',
  'Ford Transit', 'Chevrolet Suburban', 'GMC Yukon', 'Mercedes Sprinter'
];

// Common first names for drivers
const FIRST_NAMES = [
  'Ahmed', 'Mohammed', 'Ali', 'Hassan', 'Omar', 'Khalid', 'Saeed', 'Abdullah',
  'Rashid', 'Hamad', 'Sultan', 'Majid', 'Fahad', 'Nasser', 'Yousef', 'Mansoor',
  'Ibrahim', 'Tariq', 'Faisal', 'Waleed', 'Mahmoud', 'Adnan', 'Jamal', 'Karim',
  'Sami', 'Amjad', 'Basel', 'Osama', 'Rami', 'Ziad', 'Marwan', 'Salim',
  'John', 'Michael', 'David', 'James', 'Robert', 'William', 'Richard', 'Joseph',
  'Thomas', 'Christopher', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald',
  'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George',
  'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary'
];

// Common last names
const LAST_NAMES = [
  'Al-Ahmad', 'Al-Mohammed', 'Al-Ali', 'Al-Hassan', 'Al-Omar', 'Al-Khalid',
  'Al-Saeed', 'Al-Abdullah', 'Al-Rashid', 'Al-Hamad', 'Al-Sultan', 'Al-Majid',
  'Khan', 'Patel', 'Singh', 'Sharma', 'Kumar', 'Gupta', 'Agarwal', 'Shah',
  'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez',
  'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
  'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris',
  'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen'
];

// UAE-style phone number prefixes
const PHONE_PREFIXES = ['050', '052', '054', '055', '056', '058'];

// UAE-style license plate patterns
const PLATE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const EMIRATES = ['AD', 'AZ', 'DU', 'FU', 'RK', 'SH', 'UQ']; // Abu Dhabi, Ajman, Dubai, Fujairah, Ras Al Khaimah, Sharjah, Umm Al Quwain

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random element from an array
 */
function randomElement<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)] as T;
}

/**
 * Generate a UAE-style license plate number
 */
function generatePlateNumber(): string {
  const emirate = randomElement(EMIRATES);
  const letter = randomElement(PLATE_LETTERS);
  const numbers = randomInt(1, 99999).toString().padStart(5, '0');
  
  // Format: AD A 12345 or similar
  return `${emirate} ${letter} ${numbers}`;
}

/**
 * Generate a driver name
 */
function generateDriverName(): string {
  const firstName = randomElement(FIRST_NAMES);
  const lastName = randomElement(LAST_NAMES);
  return `${firstName} ${lastName}`;
}

/**
 * Generate a UAE phone number
 */
function generatePhoneNumber(): string {
  const prefix = randomElement(PHONE_PREFIXES);
  const number = randomInt(1000000, 9999999);
  return `+971-${prefix}-${number}`;
}

/**
 * Generate a car model
 */
function generateCarModel(): string {
  return randomElement(TAXI_CAR_MODELS);
}

/**
 * Generate seater count with realistic distribution
 * 4-seater: 50%, 6-seater: 30%, 7-seater: 15%, 8-seater: 5%
 */
function generateSeaterCount(): 4 | 6 | 7 | 8 {
  const rand = Math.random();
  if (rand < 0.5) return 4;
  if (rand < 0.8) return 6;
  if (rand < 0.95) return 7;
  return 8;
}

/**
 * Generate a single car record with mock data
 */
export function generateMockCar(): Omit<CarInfo, 'carId'> {
  return {
    plateNo: generatePlateNumber(),
    driverName: generateDriverName(),
    driverPhone: generatePhoneNumber(),
    carModel: generateCarModel(),
    seater: generateSeaterCount()
  };
}

/**
 * Generate multiple car records
 */
export function generateMockCars(count: number): Array<Omit<CarInfo, 'carId'>> {
  const cars: Array<Omit<CarInfo, 'carId'>> = [];
  const usedPlateNumbers = new Set<string>();
  
  let attempts = 0;
  const maxAttempts = count * 3; // Allow some room for duplicate plate handling
  
  while (cars.length < count && attempts < maxAttempts) {
    attempts++;
    const car = generateMockCar();
    
    // Ensure unique plate numbers
    if (!usedPlateNumbers.has(car.plateNo)) {
      usedPlateNumbers.add(car.plateNo);
      cars.push(car);
    }
  }
  
  if (cars.length < count) {
    console.warn(`Generated ${cars.length} cars instead of ${count} due to uniqueness constraints`);
  }
  
  return cars;
}

/**
 * Generate cars with progress callback for large datasets
 */
export function generateMockCarsWithProgress(
  count: number,
  onProgress?: (current: number, total: number) => void
): Array<Omit<CarInfo, 'carId'>> {
  const cars: Array<Omit<CarInfo, 'carId'>> = [];
  const usedPlateNumbers = new Set<string>();
  
  let attempts = 0;
  const maxAttempts = count * 3;
  const progressInterval = Math.max(1, Math.floor(count / 100)); // Report progress every 1%
  
  while (cars.length < count && attempts < maxAttempts) {
    attempts++;
    const car = generateMockCar();
    
    if (!usedPlateNumbers.has(car.plateNo)) {
      usedPlateNumbers.add(car.plateNo);
      cars.push(car);
      
      // Report progress
      if (onProgress && cars.length % progressInterval === 0) {
        onProgress(cars.length, count);
      }
    }
  }
  
  // Final progress update
  if (onProgress) {
    onProgress(cars.length, count);
  }
  
  return cars;
}

/**
 * Validate generated car data
 */
export function validateMockCar(car: Omit<CarInfo, 'carId'>): string[] {
  const errors: string[] = [];
  
  if (!car.plateNo || car.plateNo.trim().length === 0) {
    errors.push('Plate number is required');
  }
  
  if (!car.driverName || car.driverName.trim().length === 0) {
    errors.push('Driver name is required');
  }
  
  if (!car.driverPhone || car.driverPhone.trim().length === 0) {
    errors.push('Driver phone is required');
  }
  
  if (!car.carModel || car.carModel.trim().length === 0) {
    errors.push('Car model is required');
  }
  
  if (![4, 6, 7, 8].includes(car.seater)) {
    errors.push('Seater must be 4, 6, 7, or 8');
  }
  
  return errors;
}

/**
 * Statistics for generated data
 */
export function analyzeGeneratedCars(cars: Array<Omit<CarInfo, 'carId'>>): {
  total: number;
  seaterDistribution: Record<number, number>;
  uniquePlateNumbers: number;
  uniqueDriverNames: number;
  mostCommonModels: Array<{ model: string; count: number }>;
} {
  const seaterDistribution: Record<number, number> = { 4: 0, 6: 0, 7: 0, 8: 0 };
  const plateNumbers = new Set<string>();
  const driverNames = new Set<string>();
  const modelCounts: Record<string, number> = {};
  
  cars.forEach(car => {
    if (car.seater in seaterDistribution) {
      seaterDistribution[car.seater] = (seaterDistribution[car.seater] ?? 0) + 1;
    }
    plateNumbers.add(car.plateNo);
    driverNames.add(car.driverName);
    modelCounts[car.carModel] = (modelCounts[car.carModel] || 0) + 1;
  });
  
  const mostCommonModels = Object.entries(modelCounts)
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    total: cars.length,
    seaterDistribution,
    uniquePlateNumbers: plateNumbers.size,
    uniqueDriverNames: driverNames.size,
    mostCommonModels
  };
}
