# TaxiTub - Airport Taxi Queue Management System

## Overview

TaxiTub is a **comprehensive FIFO-based taxi queue management system** designed for efficient taxi dispatch at airports and transport hubs. The system ensures fairness through First In, First Out (FIFO) queue management while optimizing passenger-to-vehicle matching based on seater capacity.

### Key Features

- **🚖 Optimized Vehicle Assignment** - Smart allocation based on passenger count (1-8 passengers)
- **📊 Individual Seater Queues** - Separate queues for 4, 5, 6, 7, and 8-seater vehicles
- **👥 Multi-Role Interface** - Admin, QueuePal, and Passenger dashboards with role-based access
- **⚡ Real-time Updates** - Live queue status and instant assignment feedback
- **🔒 Comprehensive Security** - Role-based authentication and data protection
- **📱 Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **♿ Accessibility** - WCAG compliant with screen reader support
- **🎨 Modern UI** - Premium Material-UI design with dark/light theme support
- **🔄 Error Recovery** - Robust error handling with automatic queue position fixing

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Material-UI (MUI) v5 with Emotion styling
- **Backend**: Supabase (PostgreSQL + Auto REST APIs + Real-time subscriptions)
- **Authentication**: Supabase Auth with role-based access control
- **Database**: PostgreSQL with separate queue tables for each seater type
- **Build Tool**: Vite with optimized production builds
- **Hosting**: Configurable (GitHub Pages, Netlify, Vercel, etc.)
- **Cost**: $0 (Free tier available on Supabase)

## User Roles

### 👨‍💼 Admin
- **Car Management**: Complete CRUD operations for vehicle fleet
- **QueuePal Management**: Create and manage queue manager accounts
- **System Monitoring**: Real-time dashboard with queue analytics
- **Data Maintenance**: Database cleanup and queue position fixing
- **Trip History**: Complete audit trail of all assignments
- **Security**: Manage user roles and access permissions

### 🚦 QueuePal
- **Queue Operations**: Add cars to appropriate seater-specific queues
- **Live Monitoring**: Real-time view of all queue statuses
- **Car Validation**: Verify vehicle availability before queuing
- **Position Tracking**: Monitor FIFO order maintenance
- **Quick Actions**: Bulk operations and queue management tools

### 👥 Passenger
- **Smart Booking**: Request taxis for 1-8 passengers with optimal matching
- **Instant Assignment**: Get assigned car and driver details immediately
- **Share Options**: Multiple sharing methods (WhatsApp, SMS, Email, etc.)
- **Live Updates**: Real-time queue availability information
- **Accessibility**: Screen reader support and keyboard navigation

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Git**: For version control
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### 2. Clone and Install
```bash
# Clone the repository
git clone https://github.com/your-username/Delhi-Cabs.git
cd Delhi-Cabs

# Install dependencies
npm install

# Verify installation
node --version  # Should show v18.0.0+
npm --version   # Should show v8.0.0+
```

### 3. Setup Supabase Backend
1. **Create Account**: Visit [supabase.com](https://supabase.com) and sign up
2. **New Project**: Create a new project with these settings:
   - Name: TaxiTub
   - Strong password for database
   - Select closest region to your users
3. **Database Setup**: Use the secure setup script to create your database structure
4. **Get API Keys**: Navigate to Settings → API and copy:
   - Project URL
   - Public anon key

### 4. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your Supabase credentials:
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_APP_NAME=TaxiTub
VITE_APP_VERSION=0.1.0
```

### 5. Development Server
```bash
# Start development server
npm run dev

# Server will start on http://localhost:3000
# Hot reload enabled - changes update automatically
```

### 6. Optional: Seed Sample Data
```bash
# Add sample cars for testing
npm run seed:db

# Add more sample data if needed
npm run seed:more

# Verify database setup
npm run verify:db
```

**🎉 You're Ready!** Visit `http://localhost:3000` and start exploring TaxiTub!

## 📊 Database Schema

TaxiTub uses a PostgreSQL database with optimized table structure for high-performance queue operations.

### Core Tables

#### CarInfo Table
```sql
CREATE TABLE carinfo (
  carId UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plateNo TEXT UNIQUE NOT NULL,
  driverName TEXT NOT NULL,
  driverPhone TEXT NOT NULL,
  carModel TEXT NOT NULL,
  seater INTEGER NOT NULL CHECK (seater IN (4, 5, 6, 7, 8)),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Individual Queue Tables (Optimized Architecture)
```sql
-- Separate tables for each seater type for optimal performance
CREATE TABLE queue_4seater (
  queueId UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carId UUID REFERENCES carinfo(carId) ON DELETE CASCADE,
  position INTEGER NOT NULL UNIQUE,
  timestampAdded TIMESTAMP DEFAULT NOW()
);

CREATE TABLE queue_5seater (
  queueId UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carId UUID REFERENCES carinfo(carId) ON DELETE CASCADE,
  position INTEGER NOT NULL UNIQUE,
  timestampAdded TIMESTAMP DEFAULT NOW()
);

-- Similar tables for queue_6seater, queue_7seater, queue_8seater
```

#### Trip Table
```sql
CREATE TABLE trip (
  tripId UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carId UUID REFERENCES carinfo(carId),
  passengerName TEXT NOT NULL,
  destination TEXT NOT NULL,
  passengerCount INTEGER NOT NULL CHECK (passengerCount BETWEEN 1 AND 8),
  status TEXT DEFAULT 'Assigned' CHECK (status IN ('Assigned', 'Completed')),
  timestamp TIMESTAMP DEFAULT NOW()
);
```

#### QueuePal Table
```sql
CREATE TABLE queuepal (
  queuePalId UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  assignedBy TEXT DEFAULT 'Admin',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Performance Indexes
```sql
CREATE INDEX idx_carinfo_seater ON carinfo(seater);
CREATE INDEX idx_carinfo_active ON carinfo(is_active);
CREATE INDEX idx_queue_position ON queue_4seater(position);
-- Similar indexes for all queue tables
```

## 🔄 Core Workflows

### 1. 🚦 Adding Car to Queue (QueuePal)
1. **Car Selection**: QueuePal selects an available car from the fleet
2. **Validation**: System checks:
   - Car exists and is registered
   - Car is not already in any queue
   - Car is active (not suspended)
3. **Queue Assignment**: Car added to appropriate seater-specific queue table
4. **Position Calculation**: FIFO position assigned automatically
5. **Confirmation**: QueuePal receives confirmation with queue position

### 2. 👥 Passenger Taxi Request (Optimized Allocation)
1. **Booking Details**: Passenger enters:
   - Full name
   - Destination
   - Number of passengers (1-8)
2. **Optimized Matching**: System uses smart allocation:
   - 1-4 passengers: Try 4-seater → 5-seater → 6-seater → 7-seater → 8-seater
   - 5 passengers: Try 5-seater → 6-seater → 7-seater → 8-seater
   - 6 passengers: Try 6-seater → 7-seater → 8-seater
   - 7 passengers: Try 7-seater → 8-seater
   - 8 passengers: Only 8-seater
3. **FIFO Assignment**: First available car from suitable queue is assigned
4. **Queue Update**: Car removed from queue, positions automatically fixed
5. **Instant Feedback**: Passenger gets car details with sharing options

### 3. 🚗 Car Returns to Service
1. **Trip Completion**: Driver completes passenger trip
2. **Manual Re-queue**: QueuePal manually adds car back to queue
3. **FIFO Placement**: Car enters at end of appropriate queue
4. **Position Integrity**: System maintains consecutive position numbering

### 4. 🔧 System Maintenance
1. **Auto-Recovery**: Automatic queue position fixing on errors
2. **Admin Tools**: Database cleanup and maintenance utilities
3. **Analytics**: Real-time monitoring and performance metrics
4. **Error Handling**: Comprehensive error recovery with user feedback

## 🔌 API Architecture

TaxiTub leverages Supabase's auto-generated REST API with custom TypeScript services for business logic.

### Core Services
- **CarService**: Fleet management (CRUD operations)
- **QueueService**: FIFO queue operations with position management
- **BookingService**: Optimized taxi assignment with smart allocation
- **QueuePalService**: Queue manager account management

### Key Endpoints
```typescript
// Car Management
GET    /rest/v1/carinfo              // List cars with pagination
POST   /rest/v1/carinfo              // Add new car
PATCH  /rest/v1/carinfo?carid=eq.{id} // Update car details
DELETE /rest/v1/carinfo?carid=eq.{id} // Remove car

// Queue Operations (Individual Tables)
GET    /rest/v1/queue_4seater        // 4-seater queue
GET    /rest/v1/queue_5seater        // 5-seater queue
// ... similar for 6, 7, 8-seater
POST   /rest/v1/queue_{seater}seater // Add to specific queue
DELETE /rest/v1/queue_{seater}seater // Remove from queue

// Trip Management
GET    /rest/v1/trip                 // Trip history
POST   /rest/v1/trip                 // Create trip record
PATCH  /rest/v1/trip                 // Update trip status
```

### Business Logic Features
- **Smart Allocation**: Optimized passenger-to-vehicle matching
- **FIFO Integrity**: Automatic position fixing and validation
- **Error Recovery**: Comprehensive error handling with retry logic
- **Real-time Updates**: Supabase subscriptions for live data

## 🚀 Deployment

### Production Build
```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview

# Test build output
ls dist/  # Should contain index.html, assets/, js/
```

### Frontend Deployment Options

#### Option 1: GitHub Pages
```bash
# Build with correct base path
npm run build  # Uses /TaxiTub/ base path in production

# Deploy dist/ folder to gh-pages branch
# Access at: https://username.github.io/TaxiTub/
```

#### Option 2: Netlify
```bash
# Build command: npm run build
# Publish directory: dist
# Environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

#### Option 3: Vercel
```bash
# Auto-deployment from Git repository
# Framework preset: Vite
# Environment variables configured in dashboard
```

#### Option 4: Raspberry Pi (Self-Hosted)
```bash
# Cost-effective local hosting solution
# Complete guide: ./doc/RASPBERRY_PI_DEPLOYMENT.md
# Hardware cost: ~$110 one-time
# Operational cost: ~$3/month electricity
```

**Perfect for**: Small taxi companies, airport shuttles, development environments

### Backend (Supabase)
- **Auto-managed**: Database, APIs, and authentication
- **Scaling**: Automatic scaling based on usage
- **Backups**: Daily automated backups
- **Monitoring**: Built-in performance metrics
- **Security**: Row Level Security (RLS) policies configured

## ⚡ Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Create production build
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint (currently disabled)
npm run lint:fix     # Fix auto-fixable ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run type-check   # Run TypeScript type checking

# Database Management
npm run seed:db      # Populate with sample cars
npm run seed:more    # Add additional sample data
npm run verify:db    # Verify database integrity
npm run db:reset     # Reset database (if available)

# Testing
npm test             # Run Jest unit tests

# Utilities
npm run clean        # Clean build artifacts
npm run analyze      # Bundle size analysis
npm run health:check # System health check
```

## 🛡️ Error Handling

TaxiTub implements comprehensive error handling with standardized error codes:

### System Error Codes
- **CAR_ALREADY_IN_QUEUE**: Prevents duplicate queue entries
- **CAR_NOT_FOUND**: Invalid car ID validation
- **NO_AVAILABLE_CAR**: No suitable cars for passenger count
- **INVALID_SEATER_INPUT**: Passenger count out of range (1-8)
- **DB_CONNECTION_ERROR**: Database connectivity issues
- **UNAUTHORIZED_ACCESS**: Insufficient permissions or suspended car

### Error Recovery Features
- **Auto Queue Fixing**: Automatic position renumbering
- **Retry Logic**: Multiple attempts for queue operations
- **Graceful Degradation**: Fallback options for missing features
- **User Feedback**: Clear error messages with actionable guidance

## 📝 Development Guidelines

### Code Standards
- **TypeScript**: Strict type checking enabled
- **Version Headers**: All files include version and author information
- **Error Patterns**: Consistent error handling across services
- **FIFO Integrity**: Queue operations maintain order consistency
- **Documentation**: Update README and API docs with changes

### Component Architecture
- **Service Layer**: Business logic separated from UI components
- **Type Safety**: Comprehensive TypeScript interfaces
- **Error Boundaries**: React error boundaries for graceful failures
- **Accessibility**: WCAG compliance with ARIA labels
- **Responsive Design**: Mobile-first approach with Material-UI

### Testing Strategy
- **Queue Operations**: FIFO order preservation testing
- **Concurrent Access**: Parallel request handling validation
- **Edge Cases**: Empty queues, maximum capacity scenarios
- **Error Conditions**: Comprehensive error path testing
- **User Workflows**: End-to-end user journey validation

## 🤝 Contributing

We welcome contributions to TaxiTub! Here's how to get involved:

### Development Setup
1. **Fork & Clone**: Fork the repository and clone your fork
2. **Setup**: Follow the Quick Start guide above
3. **Branch**: Create a feature branch (`git checkout -b feature/amazing-feature`)
4. **Code**: Make your changes following our development guidelines
5. **Test**: Ensure all tests pass and add new tests for features
6. **Submit**: Create a pull request with a clear description

### Contribution Guidelines
- **Code Style**: Follow TypeScript and ESLint configurations
- **Documentation**: Update relevant documentation for changes
- **Testing**: Add or update tests for new functionality
- **Commit Messages**: Use clear, descriptive commit messages
- **PR Description**: Explain what changes were made and why

### Areas for Contribution
- 🐛 Bug fixes and error handling improvements
- ✨ New features and enhancements
- 📝 Documentation improvements
- 🎨 UI/UX enhancements and accessibility
- ⚡ Performance optimizations
- 🔧 Testing and quality assurance

## 📞 Support

### Getting Help
- **Documentation**: Check `/doc` folder for comprehensive guides
- **Issues**: Search existing GitHub issues for solutions
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact development team for urgent issues

### Reporting Issues
When reporting bugs, please include:
- Operating system and browser version
- Node.js and npm versions
- Steps to reproduce the issue
- Expected vs actual behavior
- Console error messages (if any)
- Screenshots or screen recordings (if helpful)

### Resources
- 📚 [Installation Guide](./doc/INSTALLATION_GUIDE.md)
- 🔌 [API Documentation](./doc/API_DOCUMENTATION.md)
- 📊 [Database Schema](./doc/DATABASE_TABLES_DOCUMENTATION.md)
- 🎨 [Design Guide](./doc/DESIGN_GUIDE.md)
- 🚀 [Deployment Guide](./doc/DEPLOYMENT_GUIDE.md)
- 🍓 [Raspberry Pi Hosting](./doc/RASPBERRY_PI_DEPLOYMENT.md)

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### MIT License Summary
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ⚠️ License and copyright notice required

---

## 📊 Project Status

**Version**: v0.1.0  
**Status**: Active Development  
**Last Updated**: January 2025  
**Maintainer**: Development Team  

### Recent Updates
- ✅ Optimized queue allocation system
- ✅ Enhanced UI with Material-UI v5
- ✅ Improved error handling and recovery
- ✅ Added accessibility features
- ✅ Comprehensive documentation update

### Roadmap
- 🔄 Real-time notifications
- 📊 Advanced analytics dashboard
- 📱 Mobile app development
- 🌐 Multi-language support
- 🔒 Enhanced security features

---

<div align="center">

**Built with ❤️ for efficient taxi queue management**

🚖 **TaxiTub** - Making taxi dispatch fair, fast, and efficient

[Report Bug](https://github.com/your-username/Delhi-Cabs/issues) · [Request Feature](https://github.com/your-username/Delhi-Cabs/issues) · [Documentation](./doc/)

</div>
