# TaxiTub - Airport Taxi Queue Management System

## Overview

TaxiTub is a **FIFO-based airport taxi queue management system** designed to streamline taxi assignments with fairness and efficiency.

### Key Features

- **FIFO Queue Management** - First In, First Out fairness
- **Multi-Role Interface** - Admin, QueuePal, and Passenger dashboards
- **Real-time Updates** - Live queue status and trip tracking
- **Seater-based Queuing** - Separate queues for 4, 6, and 7-seater vehicles
- **Error Handling** - Robust error management and duplicate prevention
- **Responsive Design** - Works on desktop and mobile devices

## Architecture

- **Frontend**: React 18 with TypeScript
- **Backend**: Supabase (PostgreSQL + Auto REST APIs)
- **Hosting**: GitHub Pages (Frontend) + Supabase (Backend)
- **Cost**: $0 (Free tier)

## User Roles

### 👤 Admin
- Manage car database (CRUD operations)
- Manage QueuePal accounts
- View live queues and trip history
- Monitor system health

### 🚦 QueuePal
- Add cars to appropriate queues
- View queue status by seater type
- Monitor car availability

### 👥 Passenger
- Book taxis with destination and passenger count
- Get assigned car details instantly
- View availability and wait times

## Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd TaxiTub
npm install
```

### 2. Setup Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL setup (see `/docs/database-setup.sql`)
3. Get your project URL and anon key

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Database Schema

### CarInfo Table
```sql
CREATE TABLE carinfo (
  carId UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plateNo TEXT UNIQUE NOT NULL,
  driverName TEXT NOT NULL,
  driverPhone TEXT NOT NULL,
  carModel TEXT NOT NULL,
  seater INTEGER NOT NULL CHECK (seater IN (4, 6, 7))
);
```

### Queue Table
```sql
CREATE TABLE queue (
  queueId UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carId UUID REFERENCES carinfo(carId) ON DELETE CASCADE,
  seater INTEGER NOT NULL,
  position INTEGER NOT NULL,
  timestampAdded TIMESTAMP DEFAULT NOW()
);
```

### Trip Table
```sql
CREATE TABLE trip (
  tripId UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carId UUID REFERENCES carinfo(carId),
  passengerName TEXT NOT NULL,
  destination TEXT NOT NULL,
  passengerCount INTEGER NOT NULL,
  status TEXT DEFAULT 'Assigned' CHECK (status IN ('Assigned', 'Completed')),
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### QueuePal Table
```sql
CREATE TABLE queuepal (
  queuePalId UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  assignedBy TEXT DEFAULT 'Admin'
);
```

## Core Workflows

### 1. Adding Car to Queue (QueuePal)
1. QueuePal selects available car
2. System validates car is not in queue
3. Car added to end of appropriate seater queue
4. Position assigned based on FIFO order

### 2. Passenger Taxi Request
1. Passenger enters details (name, destination, passenger count)
2. System finds smallest suitable seater queue
3. First car in queue is assigned
4. Trip record created and car removed from queue
5. Passenger receives car and driver details

### 3. Car Returns to Service
1. Driver completes trip
2. QueuePal manually re-adds car to queue
3. Car enters at the end of queue (FIFO maintained)

## API Endpoints

The application uses Supabase's auto-generated REST API:

- `GET /rest/v1/carinfo` - List all cars
- `POST /rest/v1/carinfo` - Add new car
- `GET /rest/v1/queue` - View queues
- `POST /rest/v1/queue` - Add car to queue
- `POST /rest/v1/trip` - Create trip record
- `GET /rest/v1/trip` - View trips

## Deployment

### Frontend (GitHub Pages)
1. Build the application: `npm run build`
2. Deploy `dist/` folder to GitHub Pages
3. Configure custom domain if needed

### Backend (Supabase)
1. Database and APIs are auto-managed
2. Configure Row Level Security if needed
3. Set up monitoring and backups

## Error Handling

The system handles common edge cases:

- **CAR_ALREADY_IN_QUEUE**: Car cannot be added twice
- **CAR_NOT_FOUND**: Invalid car ID rejection
- **NO_AVAILABLE_CAR**: Queue empty for passenger count
- **INVALID_SEATER_INPUT**: Passenger count validation
- **DB_CONNECTION_ERROR**: Database connectivity issues

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run all tests
npm run test:all
```

## Development Guidelines

### Code Standards
- All files include version headers (see `CODE_VERSIONING_TEMPLATE.MD`)
- Follow documented error handling patterns
- Maintain FIFO queue integrity
- Update `CHANGELOG.MD` for all changes

### Testing Requirements
- Test FIFO order preservation
- Test parallel request handling
- Test error conditions
- Test boundary cases (empty queues, max capacity)

## Contributing

1. Read the documentation in `/Docs` folder
2. Follow the workflow in `WORKFLOW_GUIDE.MD`
3. Update `CHANGELOG.MD` with changes
4. Ensure all tests pass
5. Submit pull request with clear description

## Support

For questions or issues:
1. Check the documentation in `/Docs`
2. Review test cases in `TEST-TaxiTub-1.MD`
3. Follow error handling guidelines
4. Contact system administrator

## License

MIT License - See LICENSE file for details

---

**Version**: v0.1.0  
**Last Updated**: 2025-09-06  
**Author**: Bheb Developer  

Built with ❤️ for efficient airport taxi management
