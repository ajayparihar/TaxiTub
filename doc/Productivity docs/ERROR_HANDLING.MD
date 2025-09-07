# TaxiTub - Error Handling Guide

## API Error Response Format
{
  "success": false,
  "error_code": "CAR_ALREADY_IN_QUEUE",
  "message": "This car is already in the queue."
}

## Common Error Codes
- CAR_ALREADY_IN_QUEUE
- CAR_NOT_FOUND
- NO_AVAILABLE_CAR
- INVALID_SEATER_INPUT
- DB_CONNECTION_ERROR
- UNAUTHORIZED_ACCESS

## Best Practices
- Always return JSON, never raw SQL errors.
- Log full error internally, show user-friendly message externally.
- Use unique error codes for debugging across modules.
