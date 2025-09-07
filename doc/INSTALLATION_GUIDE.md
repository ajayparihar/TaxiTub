# ⚙️ TaxiTub Installation Guide

**Version**: v0.1.0  
**Author**: Bheb Developer  
**Last Updated**: 2025-09-07

## Overview

This comprehensive guide walks you through installing and setting up TaxiTub from scratch. Whether you're setting up a development environment or preparing for production deployment, this guide covers all the necessary steps.

## System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, macOS 10.15+, or Linux Ubuntu 18.04+
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space for dependencies
- **Browser**: Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Recommended Development Setup
- **RAM**: 16GB or more
- **CPU**: Multi-core processor (Intel i5/AMD Ryzen 5 or better)
- **Storage**: SSD with at least 10GB free space
- **Internet**: Stable broadband connection
- **Monitor**: 1920x1080 or higher resolution

## Prerequisites Installation

### 1. Node.js and npm

#### Windows
```bash
# Option 1: Download from official website
# Visit https://nodejs.org and download LTS version

# Option 2: Using Chocolatey
choco install nodejs

# Option 3: Using Scoop
scoop install nodejs

# Verify installation
node --version  # Should show v18.0.0 or higher
npm --version   # Should show v8.0.0 or higher
```

#### macOS
```bash
# Option 1: Download from official website
# Visit https://nodejs.org and download LTS version

# Option 2: Using Homebrew
brew install node

# Option 3: Using MacPorts
sudo port install nodejs18

# Verify installation
node --version  # Should show v18.0.0 or higher
npm --version   # Should show v8.0.0 or higher
```

#### Linux (Ubuntu/Debian)
```bash
# Option 1: Using NodeSource repository (recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Option 2: Using snap
sudo snap install node --classic

# Option 3: Using package manager (may have older versions)
sudo apt update
sudo apt install nodejs npm

# Verify installation
node --version  # Should show v18.0.0 or higher
npm --version   # Should show v8.0.0 or higher
```

### 2. Git Version Control

#### Windows
```bash
# Option 1: Download from official website
# Visit https://git-scm.com/download/win

# Option 2: Using Chocolatey
choco install git

# Option 3: Using Scoop
scoop install git

# Verify installation
git --version
```

#### macOS
```bash
# Option 1: Using Xcode Command Line Tools
xcode-select --install

# Option 2: Using Homebrew
brew install git

# Verify installation
git --version
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install git

# CentOS/RHEL/Fedora
sudo yum install git  # or dnf install git

# Verify installation
git --version
```

### 3. Code Editor (Optional but Recommended)

#### Visual Studio Code
```bash
# Windows: Download from https://code.visualstudio.com/
# macOS: Download from https://code.visualstudio.com/ or brew install --cask visual-studio-code
# Linux: sudo snap install code --classic

# Recommended extensions for TaxiTub development:
# - TypeScript and JavaScript Language Features
# - ES7+ React/Redux/React-Native snippets
# - Auto Rename Tag
# - Prettier - Code formatter
# - ESLint
# - GitLens
# - Material-UI Snippets
```

## TaxiTub Installation

### 1. Clone the Repository

```bash
# Clone from your repository (replace with actual URL)
git clone https://github.com/your-username/taxitub.git

# Navigate to project directory
cd taxitub

# Check current branch
git branch
```

### 2. Install Dependencies

```bash
# Install all project dependencies
npm install

# This will install:
# - React 18 and related packages
# - TypeScript and type definitions
# - Material-UI components and icons
# - Supabase client
# - Vite build tool
# - ESLint and Prettier
# - Testing utilities

# Verify installation completed successfully
npm list --depth=0
```

### 3. Environment Configuration

#### Create Environment File
```bash
# Copy the example environment file
cp .env.example .env

# On Windows, use:
copy .env.example .env
```

#### Configure Environment Variables
Edit the `.env` file with your specific settings:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key

# Optional: Environment identification
VITE_ENVIRONMENT=development

# Optional: Custom API base URL
VITE_API_BASE_URL=https://your-project-id.supabase.co/rest/v1

# Optional: Enable debug logging
VITE_DEBUG=true

# Optional: Custom application title
VITE_APP_TITLE=TaxiTub - Local Development
```

**Important**: Never commit the `.env` file to version control. The `.env.example` file should contain sample values only.

### 4. Supabase Setup

#### Create Supabase Account
1. Visit [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email
4. Verify your email address

#### Create New Project
1. Click "New Project"
2. Choose your organization (or create one)
3. Fill in project details:
   - **Name**: TaxiTub
   - **Database Password**: Use a strong password
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait 2-3 minutes for setup completion

#### Get API Keys
1. Go to Settings → API
2. Copy the following values:
   - **URL**: Your project URL
   - **anon public**: Your anonymous public key
3. Add these to your `.env` file

#### Setup Database Schema
1. Go to SQL Editor in Supabase dashboard
2. Copy and paste the following schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CarInfo Table
CREATE TABLE carinfo (
  carId UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plateNo TEXT UNIQUE NOT NULL,
  driverName TEXT NOT NULL,
  driverPhone TEXT NOT NULL,
  carModel TEXT NOT NULL,
  seater INTEGER NOT NULL CHECK (seater IN (4, 6, 7)),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Queue Table
CREATE TABLE queue (
  queueId UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carId UUID REFERENCES carinfo(carId) ON DELETE CASCADE,
  seater INTEGER NOT NULL CHECK (seater IN (4, 6, 7)),
  position INTEGER NOT NULL,
  timestampAdded TIMESTAMP DEFAULT NOW()
);

-- Trip Table
CREATE TABLE trip (
  tripId UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carId UUID REFERENCES carinfo(carId),
  passengerName TEXT NOT NULL,
  destination TEXT NOT NULL,
  passengerCount INTEGER NOT NULL CHECK (passengerCount >= 1 AND passengerCount <= 8),
  status TEXT DEFAULT 'Assigned' CHECK (status IN ('Assigned', 'Completed')),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- QueuePal Table
CREATE TABLE queuepal (
  queuePalId UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  assignedBy TEXT DEFAULT 'Admin',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX idx_queue_seater_position ON queue(seater, position);
CREATE INDEX idx_carinfo_seater ON carinfo(seater);
CREATE INDEX idx_carinfo_active ON carinfo(is_active);
CREATE INDEX idx_trip_status ON trip(status);
CREATE INDEX idx_trip_timestamp ON trip(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE carinfo ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip ENABLE ROW LEVEL SECURITY;
ALTER TABLE queuepal ENABLE ROW LEVEL SECURITY;

-- Basic policies (adjust for your security needs)
CREATE POLICY "Allow all operations on carinfo" ON carinfo USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on queue" ON queue USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on trip" ON trip USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on queuepal" ON queuepal USING (true) WITH CHECK (true);
```

3. Click "Run" to execute the schema

#### Verify Database Setup
1. Go to Table Editor in Supabase dashboard
2. Verify all four tables are created:
   - `carinfo`
   - `queue`
   - `trip`
   - `queuepal`

### 5. Development Server

#### Start the Application
```bash
# Start development server
npm run dev

# The server will start on http://localhost:5173
# Hot reload is enabled - changes will update automatically
```

#### Verify Installation
1. Open your browser and navigate to `http://localhost:5173`
2. You should see the TaxiTub application
3. Check the browser console for any errors
4. Try navigating between different sections:
   - Passenger Booking (default page)
   - Admin Dashboard (may require login setup)
   - QueuePal Dashboard (may require login setup)

### 6. Optional: Seed Database with Sample Data

```bash
# Add sample cars to test the system
npm run seed:db

# Add more sample data if needed
npm run seed:more

# Verify database has data
npm run verify:db
```

## Development Tools Setup

### 1. TypeScript Configuration
The project includes TypeScript configuration in `tsconfig.json`. No additional setup required, but you can customize:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 2. ESLint Configuration
```bash
# Run linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# ESLint configuration is in .eslintrc.js
```

### 3. Prettier Configuration
```bash
# Format all code
npm run format

# Check formatting without making changes
npm run format:check
```

### 4. Git Hooks (Optional)
Set up pre-commit hooks to ensure code quality:

```bash
# Install husky for git hooks
npm install --save-dev husky

# Setup pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run format:check && npm run type-check"
```

## Testing Installation

### 1. Run Type Checking
```bash
npm run type-check
```

### 2. Build Test
```bash
# Test production build
npm run build

# Serve built application
npm run preview

# Visit http://localhost:4173 to test built version
```

### 3. Unit Tests (if available)
```bash
npm test
```

## Troubleshooting Common Issues

### 1. Node.js Version Issues
```bash
# Check current Node.js version
node --version

# If version is too old, update Node.js
# Use nvm (Node Version Manager) for easier version management

# Install nvm (Linux/macOS)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install nvm (Windows - use nvm-windows)
# Download from https://github.com/coreybutler/nvm-windows

# Install and use Node.js 18
nvm install 18
nvm use 18
```

### 2. npm Installation Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# On Windows use:
rmdir /s node_modules
del package-lock.json
npm install
```

### 3. Port Already in Use
```bash
# If port 5173 is already in use, specify a different port
npm run dev -- --port 3000

# Or kill the process using the port (Linux/macOS)
lsof -ti:5173 | xargs kill -9

# On Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### 4. Supabase Connection Issues
```bash
# Test Supabase connection
curl -X GET "https://your-project.supabase.co/rest/v1/carinfo" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"

# Should return empty array [] if tables exist and connection works
```

### 5. Environment Variable Issues
```bash
# Verify environment variables are loaded
npm run dev -- --debug

# Check if .env file exists and has correct format
cat .env  # Linux/macOS
type .env  # Windows

# Ensure no extra spaces around = sign
# Ensure no trailing spaces
# Ensure file is in project root directory
```

## Next Steps

### 1. Development Workflow
- Read the `/doc/API_DOCUMENTATION.md` for API details
- Check `/doc/DESIGN_GUIDE.md` for UI components
- Review `/doc/DATABASE_TABLES_DOCUMENTATION.md` for database schema

### 2. Customization
- Modify theme in `src/theme.ts`
- Update application metadata in `package.json`
- Customize routing in `src/App.tsx`

### 3. Deployment Preparation
- Review `/doc/DEPLOYMENT_GUIDE.md`
- Set up production Supabase project
- Configure hosting provider accounts

### 4. Team Setup
- Share environment setup instructions with team members
- Set up shared development database (optional)
- Configure version control workflows

## Support

### Getting Help
- Check documentation in `/doc` folder
- Review error messages in browser console
- Check Supabase logs in dashboard
- Verify environment configuration

### Reporting Issues
When reporting issues, include:
- Operating system and version
- Node.js and npm versions
- Error messages (full stack trace)
- Steps to reproduce the issue
- Environment configuration (without sensitive data)

### Additional Resources
- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)

---

**Installation Complete!** 🎉

You now have TaxiTub running locally. Start exploring the codebase and building amazing features for taxi queue management!
