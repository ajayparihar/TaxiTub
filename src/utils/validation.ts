// TaxiTub Module: Validation Utilities
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Comprehensive validation utilities for form inputs

import { VALIDATION, ERROR_MESSAGES } from "../constants";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Sanitize input by trimming and removing potential XSS characters
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>\"'&]/g, (match) => {
      const htmlEntities: Record<string, string> = {
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#x27;",
        "&": "&amp;",
      };
      return htmlEntities[match] || match;
    });
};

/**
 * Validate plate number format
 */
export const validatePlateNumber = (plateNo: string): ValidationResult => {
  const sanitized = sanitizeInput(plateNo).toUpperCase();
  
  if (!sanitized) {
    return { isValid: false, error: "Plate number is required" };
  }
  
  if (!VALIDATION.PLATE_NO_REGEX.test(sanitized)) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_PLATE_FORMAT };
  }
  
  return { isValid: true };
};

/**
 * Validate phone number format
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
  const sanitized = sanitizeInput(phone).replace(/\s+/g, "");
  
  if (!sanitized) {
    return { isValid: false, error: "Phone number is required" };
  }
  
  if (!VALIDATION.PHONE_REGEX.test(sanitized)) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_PHONE_FORMAT };
  }
  
  return { isValid: true };
};

/**
 * Validate name (driver name, passenger name, etc.)
 */
export const validateName = (name: string, fieldName = "Name"): ValidationResult => {
  const sanitized = sanitizeInput(name);
  
  if (!sanitized) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  if (sanitized.length < VALIDATION.MIN_NAME_LENGTH) {
    return { isValid: false, error: `${fieldName} must be at least ${VALIDATION.MIN_NAME_LENGTH} characters` };
  }
  
  if (sanitized.length > VALIDATION.MAX_NAME_LENGTH) {
    return { isValid: false, error: `${fieldName} must be less than ${VALIDATION.MAX_NAME_LENGTH} characters` };
  }
  
  // Only allow letters, spaces, and common name characters
  if (!/^[a-zA-Z\s\-\.\']+$/.test(sanitized)) {
    return { isValid: false, error: `${fieldName} contains invalid characters` };
  }
  
  return { isValid: true };
};

/**
 * Validate destination
 */
export const validateDestination = (destination: string): ValidationResult => {
  const sanitized = sanitizeInput(destination);
  
  if (!sanitized) {
    return { isValid: false, error: "Destination is required" };
  }
  
  if (sanitized.length < VALIDATION.MIN_DESTINATION_LENGTH) {
    return { isValid: false, error: `Destination must be at least ${VALIDATION.MIN_DESTINATION_LENGTH} characters` };
  }
  
  if (sanitized.length > VALIDATION.MAX_DESTINATION_LENGTH) {
    return { isValid: false, error: `Destination must be less than ${VALIDATION.MAX_DESTINATION_LENGTH} characters` };
  }
  
  return { isValid: true };
};

/**
 * Validate passenger count
 */
export const validatePassengerCount = (count: number): ValidationResult => {
  if (!count || count < VALIDATION.MIN_PASSENGER_COUNT) {
    return { isValid: false, error: `Minimum ${VALIDATION.MIN_PASSENGER_COUNT} passenger required` };
  }
  
  if (count > VALIDATION.MAX_PASSENGER_COUNT) {
    return { isValid: false, error: `Maximum ${VALIDATION.MAX_PASSENGER_COUNT} passengers allowed` };
  }
  
  return { isValid: true };
};

/**
 * Validate car model
 */
export const validateCarModel = (model: string): ValidationResult => {
  const sanitized = sanitizeInput(model);
  
  if (!sanitized) {
    return { isValid: false, error: "Car model is required" };
  }
  
  if (sanitized.length < 2) {
    return { isValid: false, error: "Car model must be at least 2 characters" };
  }
  
  if (sanitized.length > 30) {
    return { isValid: false, error: "Car model must be less than 30 characters" };
  }
  
  return { isValid: true };
};

/**
 * Validate seater count
 */
export const validateSeater = (seater: number): ValidationResult => {
  const validSeaters = [4, 6, 7];
  
  if (!validSeaters.includes(seater)) {
    return { isValid: false, error: "Please select a valid seater type" };
  }
  
  return { isValid: true };
};

/**
 * Validate entire car form
 */
export interface CarFormData {
  plateNo: string;
  driverName: string;
  driverPhone: string;
  carModel: string;
  seater: number;
}

export interface CarFormErrors {
  plateNo?: string;
  driverName?: string;
  driverPhone?: string;
  carModel?: string;
  seater?: string;
}

export const validateCarForm = (data: CarFormData): { isValid: boolean; errors: CarFormErrors } => {
  const errors: CarFormErrors = {};
  
  const plateValidation = validatePlateNumber(data.plateNo);
  if (!plateValidation.isValid && plateValidation.error) errors.plateNo = plateValidation.error;
  
  const nameValidation = validateName(data.driverName, "Driver name");
  if (!nameValidation.isValid && nameValidation.error) errors.driverName = nameValidation.error;
  
  const phoneValidation = validatePhoneNumber(data.driverPhone);
  if (!phoneValidation.isValid && phoneValidation.error) errors.driverPhone = phoneValidation.error;
  
  const modelValidation = validateCarModel(data.carModel);
  if (!modelValidation.isValid && modelValidation.error) errors.carModel = modelValidation.error;
  
  const seaterValidation = validateSeater(data.seater);
  if (!seaterValidation.isValid && seaterValidation.error) errors.seater = seaterValidation.error;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate passenger booking form
 */
export interface PassengerFormData {
  passengerName: string;
  destination: string;
  passengerCount: number;
}

export interface PassengerFormErrors {
  passengerName?: string;
  destination?: string;
  passengerCount?: string;
}

export const validatePassengerForm = (data: PassengerFormData): { isValid: boolean; errors: PassengerFormErrors } => {
  const errors: PassengerFormErrors = {};
  
  const nameValidation = validateName(data.passengerName, "Passenger name");
  if (!nameValidation.isValid && nameValidation.error) errors.passengerName = nameValidation.error;
  
  const destinationValidation = validateDestination(data.destination);
  if (!destinationValidation.isValid && destinationValidation.error) errors.destination = destinationValidation.error;
  
  const countValidation = validatePassengerCount(data.passengerCount);
  if (!countValidation.isValid && countValidation.error) errors.passengerCount = countValidation.error;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
