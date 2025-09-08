# 📖 TaxiTub API Documentation

**Version**: v0.1.0  
**Author**: Bheb Developer  
**Last Updated**: 2025-09-07

## Overview

TaxiTub uses Supabase's auto-generated REST API with custom business logic implemented in TypeScript services. This documentation covers all available endpoints, data models, and usage patterns.

## Base Configuration

- **Backend**: Supabase PostgreSQL + Auto REST API
- **Base URL**: `{your-supabase-url}/rest/v1/`
- **Authentication**: API Key (anon/service key)
- **Content-Type**: `application/json`

## Authentication

All API requests require the following headers:
```typescript
{
  'apikey': 'your-supabase-anon-key',
  'Authorization': 'Bearer your-supabase-anon-key',
  'Content-Type': 'application/json'
}
```

## Data Models

### CarInfo
```typescript
interface CarInfo {
  carId: string;           // UUID primary key
  plateNo: string;         // Unique plate number
  driverName: string;      // Driver's full name
  driverPhone: string;     // Contact number
  carModel: string;        // Vehicle model
  seater: 4 | 5 | 6 | 7 | 8;  // Passenger capacity (1-8 supported)
  isActive?: boolean;      // Active status (optional)
  created_at?: string;     // Creation timestamp
  updated_at?: string;     // Last update timestamp
}
```

### Queue (Individual Tables)
```typescript
interface Queue {
  queueId: string;         // UUID primary key
  carId: string;           // Foreign key to CarInfo
  seater: 4 | 5 | 6 | 7 | 8;  // Queue category (separate table per seater)
  position: number;        // FIFO position (unique within table)
  timestampAdded: string;  // ISO timestamp
}

// Individual queue tables:
// - queue_4seater, queue_5seater, queue_6seater, queue_7seater, queue_8seater
```

### Trip
```typescript
interface Trip {
  tripId: string;          // UUID primary key
  carId: string;           // Foreign key to CarInfo
  passengerName: string;   // Passenger name
  destination: string;     // Destination address
  passengerCount: number;  // Number of passengers (1-8)
  status: 'Assigned' | 'Completed';
  timestamp: string;       // ISO timestamp
}
```

### QueuePal
```typescript
interface QueuePal {
  queuePalId: string;      // UUID primary key
  name: string;            // QueuePal name
  contact: string;         // Contact information
  assignedBy: string;      // Admin who assigned (default: 'Admin')
}
```

## Core Endpoints

### Car Management

#### GET `/carinfo`
Retrieve all cars with optional filtering.

**Parameters:**
- `select` (optional): Specify fields to return
- `is_active` (optional): Filter by active status
- `seater` (optional): Filter by seater type

**Response:**
```json
[
  {
    "carId": "uuid",
    "plateNo": "ABC123",
    "driverName": "John Doe",
    "driverPhone": "+1234567890",
    "carModel": "Honda Pilot",
    "seater": 7,
    "is_active": true
  }
]
```

#### POST `/carinfo`
Add new car to the system.

**Request:**
```json
{
  "plateNo": "ABC123",
  "driverName": "John Doe",
  "driverPhone": "+1234567890",
  "carModel": "Honda Pilot",
  "seater": 7
}
```

**Response:**
```json
{
  "carId": "uuid",
  "plateNo": "ABC123",
  "driverName": "John Doe",
  "driverPhone": "+1234567890",
  "carModel": "Honda Pilot",
  "seater": 7,
  "is_active": true
}
```

#### PATCH `/carinfo?carId=eq.{id}`
Update existing car information.

**Request:**
```json
{
  "driverPhone": "+0987654321",
  "is_active": false
}
```

#### DELETE `/carinfo?carId=eq.{id}`
Delete car from system (cascades to queue/trip records).

### Queue Management

#### GET `/queue`
Retrieve current queue status.

**Parameters:**
- `select` (optional): Join with carinfo for complete details
- `seater` (optional): Filter by seater type
- `order` (optional): Sort by position (default: position.asc)

**Response:**
```json
[
  {
    "queueId": "uuid",
    "carId": "uuid",
    "seater": 7,
    "position": 1,
    "timestampAdded": "2025-09-07T10:30:00Z"
  }
]
```

#### POST `/queue`
Add car to queue (FIFO).

**Request:**
```json
{
  "carId": "uuid",
  "seater": 7
}
```

**Business Logic:**
- Validates car is not already in queue
- Assigns next position in seater category
- Maintains FIFO order

#### DELETE `/queue?queueId=eq.{id}`
Remove car from queue (typically when assigned to trip).

### Trip Management

#### GET `/trip`
Retrieve trip history.

**Parameters:**
- `select` (optional): Join with carinfo for complete details
- `status` (optional): Filter by trip status
- `order` (optional): Sort by timestamp (default: timestamp.desc)

**Response:**
```json
[
  {
    "tripId": "uuid",
    "carId": "uuid",
    "passengerName": "Jane Smith",
    "destination": "Airport Terminal 1",
    "passengerCount": 3,
    "status": "Assigned",
    "timestamp": "2025-09-07T10:45:00Z"
  }
]
```

#### POST `/trip`
Create new trip (assigns car from queue).

**Request:**
```json
{
  "passengerName": "Jane Smith",
  "destination": "Airport Terminal 1",
  "passengerCount": 3
}
```

**Business Logic:**
- Finds smallest suitable queue (4-seater for 1-4 passengers, etc.)
- Assigns first car in queue (FIFO)
- Creates trip record
- Removes car from queue
- Returns car and driver details

#### PATCH `/trip?tripId=eq.{id}`
Update trip status.

**Request:**
```json
{
  "status": "Completed"
}
```

### QueuePal Management

#### GET `/queuepal`
Retrieve all QueuePal accounts.

#### POST `/queuepal`
Create new QueuePal account.

**Request:**
```json
{
  "name": "Mike Johnson",
  "contact": "+1122334455",
  "assignedBy": "Admin"
}
```

## Business Logic Services

### Queue Service (`/src/services/api.ts`)

#### `addCarToQueue(carId: string)`
Adds a car to the appropriate queue with FIFO positioning.

**Logic:**
1. Validates car exists and is active
2. Checks car is not already in queue
3. Determines seater type from carinfo
4. Calculates next position in queue
5. Adds car to queue table

#### `getQueueBySeater(seater: 4 | 6 | 7)`
Retrieves queue for specific seater type with car details.

#### `assignTaxi(passengerCount, destination?)`
Optimized booking logic with smart allocation algorithm.

**Optimized Allocation Logic:**
1. **Validation**: Passenger count (1-8)
2. **Priority Determination**: 
   - 1-4 passengers: Try 4→5→6→7→8-seater
   - 5 passengers: Try 5→6→7→8-seater  
   - 6 passengers: Try 6→7→8-seater
   - 7 passengers: Try 7→8-seater
   - 8 passengers: Only 8-seater
3. **FIFO Assignment**: First car from first available queue
4. **Queue Update**: Remove assigned car, fix positions
5. **Trip Tracking**: Optional trip record creation
6. **Response**: Complete car details with efficiency metrics

### Error Handling

The API implements comprehensive error handling:

```typescript
// Error Response Format
{
  "error": {
    "code": "BUSINESS_LOGIC_ERROR",
    "message": "Car is already in queue",
    "details": {
      "carId": "uuid",
      "currentQueue": "4-seater"
    }
  }
}
```

**Common Error Codes:**
- `CAR_ALREADY_IN_QUEUE`: Car cannot be added twice
- `CAR_NOT_FOUND`: Invalid car ID
- `NO_AVAILABLE_CAR`: No cars in suitable queue
- `INVALID_PASSENGER_COUNT`: Passenger count out of range
- `DB_CONNECTION_ERROR`: Database connectivity issues

## Rate Limiting

Supabase provides built-in rate limiting:
- **Free Tier**: 200 requests per minute
- **Paid Tiers**: Higher limits available

## Real-time Subscriptions

Enable real-time updates using Supabase subscriptions:

```typescript
// Subscribe to queue changes
const subscription = supabase
  .from('queue')
  .on('*', (payload) => {
    console.log('Queue updated:', payload);
  })
  .subscribe();
```

## Testing

### Example Test Scenarios

1. **FIFO Order Testing**
   ```bash
   # Add multiple cars to queue
   POST /queue {"carId": "car1", "seater": 4}
   POST /queue {"carId": "car2", "seater": 4}
   
   # Verify positions
   GET /queue?seater=eq.4&order=position.asc
   ```

2. **Passenger Assignment**
   ```bash
   # Book with 3 passengers
   POST /trip {
     "passengerName": "Test User",
     "destination": "Terminal 1",
     "passengerCount": 3
   }
   ```

## Performance Considerations

- **Indexing**: Queue positions and timestamps are indexed
- **Connection Pooling**: Supabase handles connection management
- **Caching**: Consider Redis for frequently accessed queue data
- **Concurrent Access**: Use database transactions for queue operations

## Security

- **Row Level Security**: Configure RLS policies for data protection
- **API Key Management**: Rotate keys regularly
- **Input Validation**: All inputs are sanitized and validated
- **HTTPS Only**: All API communication is encrypted

## Migration and Backup

- **Schema Changes**: Use Supabase migrations for database updates
- **Data Backup**: Automated daily backups available
- **Point-in-Time Recovery**: Available for paid plans

## Support and Monitoring

- **Logging**: All API calls are logged with timestamps
- **Monitoring**: Supabase dashboard provides metrics
- **Health Checks**: Available at `/health` endpoint
- **Documentation**: Auto-generated OpenAPI specs available

---

For implementation details, see the source code in `/src/services/api.ts` and related service files.
