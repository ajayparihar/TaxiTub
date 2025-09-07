# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

TaxiTub is a FIFO-based airport taxi queue management system built with React 18 + TypeScript frontend and Supabase backend. It manages three user roles (Admin, QueuePal, Passenger) with real-time queue management and seater-based vehicle allocation.

## Development Commands

### Core Development
```bash
# Start development server (Vite on port 3000)
npm run dev

# Build production bundle
npm run build

# Preview production build locally
npm run preview

# Type checking without compilation
npm run type-check
```

### Testing
```bash
# Run unit tests (Jest)
npm test

# Run specific test file
npm test -- queueService.test.ts
```

### Database Management
```bash
# Seed database with mock data
npm run seed:db

# Add more cars to existing database
npm run seed:more

# Verify database integrity and connections
npm run verify:db

# Reset database (destructive operation)
npm run db:reset

# Database health check
npm run health:check

# Show available database commands
npm run seed:db:help
```

### Code Quality
```bash
# Format code with Prettier
npm run format

# Check formatting without fixing
npm run format:check

# Fix ESLint issues (limited usage - TypeScript provides type checking)
npm run lint:fix

# Clean build artifacts and cache
npm run clean

# Bundle analysis
npm run analyze
```

## Architecture Overview

### Core Service Architecture
The application follows a service-oriented architecture with these key layers:

**Services Layer (`src/services/`)**:
- `CarService`: CRUD operations for vehicle management (Admin)
- `QueueService`: FIFO queue operations with seater-specific tables
- `BookingService`: Optimized taxi assignment with move-up allocation logic
- `QueuePalService`: Queue manager account management

**Database Architecture**:
- Individual queue tables per seater type (`queue_4seater`, `queue_5seater`, etc.)
- FIFO integrity maintained within each table
- Optimized allocation: try optimal seater first, move up if unavailable

**Component Architecture (`src/components/`)**:
- Role-based protected routes with lazy loading
- Error boundaries at feature and application level
- Context providers for global state (Toast, Dialog, Notifications)
- Accessibility features with WCAG compliance

### Key Business Logic Patterns

**FIFO Queue Management**:
- Each seater type has dedicated database table
- Position numbering is consecutive starting from 1
- `QueueService.fixQueuePositions()` maintains integrity after assignments

**Optimized Taxi Allocation**:
```typescript
// Allocation priority: optimal seater → move up to larger
// 1-4 passengers: 4→5→6→7→8 seater
// 5 passengers: 5→6→7→8 seater  
// 6 passengers: 6→7→8 seater
```

**Error Handling**:
- Standardized error codes: `CAR_ALREADY_IN_QUEUE`, `NO_AVAILABLE_CAR`, etc.
- Type-safe ApiResponse pattern with success/error discrimination
- Consistent error messaging across all services

### Route Structure
- `/passenger` - Public booking interface (default)
- `/admin` - Protected dashboard for car/QueuePal management
- `/queuepal` - Protected queue operations interface
- Authentication via role-based ProtectedRoute component

## Code Standards

### File Headers
All files must include version headers following this template:
```typescript
// TaxiTub Module: [Module Name]
// Version: v0.1.0
// Last Updated: YYYY-MM-DD
// Author: [Author Name]
// Changelog: [Brief description of changes]
```

### Error Handling
Always use standardized error response format:
```typescript
{
  success: false,
  error_code: ERROR_CODES.CAR_ALREADY_IN_QUEUE,
  message: "User-friendly message"
}
```

### API Patterns
- Use service classes with static methods for database operations
- Implement proper fallback handling for missing database columns
- Maintain FIFO queue integrity in all operations
- Log detailed information for queue operations and assignments

## Database Schema Key Points

### Core Tables
- `carinfo`: Vehicle registry with optional `is_active` status
- `queue_*seater`: Separate FIFO queues per seater capacity
- `queuepal`: Queue manager accounts
- `trip`: Assignment history and status tracking

### Critical Constraints
- Plate numbers must be unique across system
- Queue positions must be consecutive within seater type
- Cars cannot appear in multiple queues simultaneously
- Passenger count determines allocation priority order

## Environment Setup

### Required Environment Variables
```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Development Setup
1. Copy `.env.example` to `.env` and configure Supabase credentials
2. Install dependencies: `npm install`
3. Run database setup scripts from `doc/SETUP_DATABASE.md`
4. Start development server: `npm run dev`

## Testing Strategy

### Key Test Areas
- FIFO order preservation in queue operations
- Concurrent request handling for queue additions
- Boundary conditions (empty queues, maximum capacity)
- Error code standardization and message consistency

### Test Files Location
- `tests/queueService.*.test.ts` - Queue operation tests
- Focus on parallel request scenarios and queue integrity

## Performance Considerations

### Build Optimization
- Lazy loading for all route components with React.Suspense
- Manual chunk splitting in Vite config for optimal caching
- Terser minification with console.log removal in production

### Database Performance
- Individual seater tables prevent cross-queue dependencies
- Position-based indexing for FIFO operations
- Connection pooling handled by Supabase

### Component Optimization
- Virtual scrolling for large car datasets
- Client-side filtering to reduce API calls
- Error boundaries prevent cascade failures

## Common Workflows

### Adding New Seater Type
1. Update `SEATER_QUEUE_TABLES` mapping in config
2. Create corresponding database table
3. Update `SEATER_TYPES` constant
4. Test allocation logic with new seater type

### Queue Maintenance
```bash
# Fix position gaps after concurrent operations
QueueService.fixQueuePositions()

# Clear specific seater queue
QueueService.clearQueueBySeater(4)
```

### Debugging Queue Issues
1. Check queue position integrity: `npm run verify:db`
2. Review allocation logs in browser console
3. Verify FIFO order with `QueueService.getQueueBySeater()`
4. Use `QueueService.fixQueuePositions()` to resolve gaps
