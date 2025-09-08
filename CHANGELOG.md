# Changelog

All notable changes to TaxiTub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Real-time notifications system (planned)
- Advanced analytics dashboard (planned)
- Mobile app development (planned)
- Multi-language support (planned)
- Enhanced security features (planned)

## [0.1.0] - 2025-01-08

### Added
- **Core System Architecture**
  - React 18 with TypeScript and Vite build system
  - Material-UI v5 with custom theme support
  - Supabase backend with PostgreSQL database
  - Role-based authentication (Admin, QueuePal, Passenger)

- **Optimized Queue Management**
  - Individual database tables for each seater type (4, 5, 6, 7, 8-seater)
  - FIFO (First In, First Out) queue integrity with automatic position fixing
  - Smart allocation algorithm for optimal passenger-to-vehicle matching
  - Concurrent request handling with retry logic

- **User Interfaces**
  - **Admin Dashboard**: Complete fleet and user management
  - **QueuePal Interface**: Queue operations and monitoring
  - **Passenger Booking**: Smart taxi assignment with sharing options

- **Advanced Features**
  - Accessibility support (WCAG 2.1 compliant)
  - Responsive design for all device sizes
  - Error boundaries and comprehensive error handling
  - Dark/light theme support
  - Loading screens and performance optimizations

- **Database Schema**
  - CarInfo table with vehicle details and status tracking
  - Individual queue tables (queue_4seater, queue_5seater, etc.)
  - Trip tracking with passenger and destination information
  - QueuePal management table
  - Performance indexes for optimized queries

- **Business Logic Services**
  - **CarService**: Fleet management (CRUD operations)
  - **QueueService**: Queue operations with FIFO integrity
  - **BookingService**: Optimized taxi assignment algorithm
  - **QueuePalService**: Queue manager account management

- **Developer Tools**
  - Comprehensive TypeScript type definitions
  - ESLint and Prettier configuration
  - Jest testing framework setup
  - Database seeding and verification scripts
  - Development server with hot reload

- **Documentation**
  - Complete README with setup instructions
  - API documentation with endpoint details
  - Installation guide for all platforms
  - Database schema documentation
  - Contributing guidelines
  - Deployment instructions

### Technical Details
- **Frontend Stack**: React 18, TypeScript 5.0, Vite 5.0, Material-UI 5.15
- **Backend Stack**: Supabase (PostgreSQL, Auto REST APIs, Authentication)
- **Development Tools**: ESLint, Prettier, Jest, Husky (optional)
- **Build System**: Vite with optimized production builds and code splitting
- **Performance**: Lazy loading, virtual scrolling, optimized bundle size

### Database Optimizations
- Separate queue tables for each seater type for better performance
- Unique position constraints within each queue table
- Comprehensive indexing for fast queries
- Row Level Security (RLS) policies for data protection
- Automatic timestamp management for audit trails

### User Experience Enhancements
- **Smart Allocation**: 
  - 1-4 passengers: Try 4→5→6→7→8-seater
  - 5 passengers: Try 5→6→7→8-seater
  - 6 passengers: Try 6→7→8-seater
  - 7 passengers: Try 7→8-seater
  - 8 passengers: Only 8-seater
- **Instant Feedback**: Real-time assignment with car and driver details
- **Multiple Sharing Options**: WhatsApp, SMS, Email, Copy to clipboard
- **Accessibility**: Screen reader support, keyboard navigation, ARIA labels
- **Error Recovery**: Automatic queue position fixing and user-friendly error messages

### Security Features
- Role-based access control with protected routes
- Input validation and sanitization
- HTTPS-only communication
- Environment variable protection
- Row Level Security policies in database

## Version History

### Pre-release Versions
- **v0.0.1 - v0.0.9**: Initial development and prototyping
  - Basic queue management functionality
  - Simple React UI
  - Initial database schema
  - Basic FIFO implementation

## Migration Notes

### From Pre-release to v0.1.0
- **Database Migration Required**: 
  - Add new seater types (5 and 8-seater support)
  - Create individual queue tables for each seater type
  - Add performance indexes
  - Update passenger count validation (1-8 instead of 1-7)

- **Environment Variables**: 
  - Update to use VITE_ prefixed environment variables
  - Add new configuration options for theme and debugging

- **Dependencies**: 
  - Major update to React 18 and Material-UI v5
  - Switch from Create React App to Vite
  - Update all TypeScript definitions

## Breaking Changes

### v0.1.0
- **Queue Table Structure**: Changed from single queue table to individual seater-specific tables
- **API Endpoints**: Updated to use individual queue table endpoints
- **Type Definitions**: Updated seater types to include 5 and 8-seater vehicles
- **Build System**: Switched from Create React App to Vite (affects build scripts)

## Known Issues

### v0.1.0
- ESLint is currently disabled during development cleanup phase
- Some legacy environment configurations may need manual updates
- Mobile sharing features may require HTTPS for full functionality

## Acknowledgments

- **Development Team**: For comprehensive system architecture and implementation
- **Contributors**: All community members who provided feedback and suggestions
- **Libraries**: React, Material-UI, Supabase, TypeScript, and Vite teams

---

**Note**: This changelog follows [Keep a Changelog](https://keepachangelog.com/) format. Each version includes:
- **Added** for new features
- **Changed** for changes in existing functionality  
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes
