# 🚀 TaxiTub Deployment Guide

**Version**: v0.1.0  
**Author**: Bheb Developer  
**Last Updated**: 2025-09-07

## Overview

This guide provides step-by-step instructions for deploying TaxiTub in various environments, from development to production. The application uses a modern stack with Supabase backend and static frontend hosting.

## Architecture Summary

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + REST API + Real-time)
- **Hosting**: Static hosting (Vercel/Netlify/GitHub Pages)
- **Database**: PostgreSQL (managed by Supabase)
- **CDN**: Automatic via hosting provider

## Prerequisites

### Development Requirements
- Node.js 18+ and npm 8+
- Git for version control
- Modern web browser for testing
- Text editor/IDE (VS Code recommended)

### Production Requirements
- Supabase account (free tier available)
- Hosting provider account (Vercel/Netlify/GitHub Pages)
- Domain name (optional, for custom domains)
- SSL certificate (auto-managed by hosting providers)

## Environment Setup

### 1. Local Development

#### Clone and Install
```bash
# Clone the repository
git clone <your-repository-url>
cd TaxiTub

# Install dependencies
npm install

# Verify installation
npm run type-check
```

#### Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: Custom API endpoints
VITE_API_BASE_URL=https://your-project.supabase.co/rest/v1

# Optional: Environment identification
VITE_ENVIRONMENT=development
```

#### Development Server
```bash
# Start development server
npm run dev

# Access application
# http://localhost:5173
```

### 2. Supabase Backend Setup

#### Create Project
1. Visit [supabase.com](https://supabase.com)
2. Sign up/sign in
3. Create new project
4. Choose region (closest to users)
5. Set database password
6. Wait for provisioning (2-3 minutes)

#### Database Schema Setup
```sql
-- Run this SQL in Supabase SQL Editor

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

-- Indexes for Performance
CREATE INDEX idx_queue_seater_position ON queue(seater, position);
CREATE INDEX idx_carinfo_seater ON carinfo(seater);
CREATE INDEX idx_trip_status ON trip(status);
CREATE INDEX idx_trip_timestamp ON trip(timestamp);

-- Row Level Security (RLS)
ALTER TABLE carinfo ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip ENABLE ROW LEVEL SECURITY;
ALTER TABLE queuepal ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Allow public read on carinfo" ON carinfo FOR SELECT USING (true);
CREATE POLICY "Allow public read on queue" ON queue FOR SELECT USING (true);
CREATE POLICY "Allow public read on trip" ON trip FOR SELECT USING (true);
CREATE POLICY "Allow public read on queuepal" ON queuepal FOR SELECT USING (true);

-- Public write access policies (adjust as needed for security)
CREATE POLICY "Allow public insert on carinfo" ON carinfo FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on queue" ON queue FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on trip" ON trip FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on queuepal" ON queuepal FOR INSERT WITH CHECK (true);

-- Update and delete policies
CREATE POLICY "Allow public update on carinfo" ON carinfo FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on carinfo" ON carinfo FOR DELETE USING (true);
CREATE POLICY "Allow public delete on queue" ON queue FOR DELETE USING (true);
CREATE POLICY "Allow public update on trip" ON trip FOR UPDATE USING (true);
```

#### API Keys Setup
1. Go to Settings → API in Supabase dashboard
2. Copy `URL` and `anon` key
3. Add to your `.env` file
4. For production, consider using service role key with restricted permissions

### 3. Production Deployment

#### Option A: Vercel Deployment (Recommended)

1. **Prepare for Deployment**
   ```bash
   # Build and test locally
   npm run build
   npm run preview
   ```

2. **Deploy via CLI**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login and deploy
   vercel login
   vercel

   # Follow prompts for configuration
   ```

3. **Deploy via Git Integration**
   - Push code to GitHub/GitLab
   - Connect repository to Vercel
   - Configure environment variables in Vercel dashboard
   - Auto-deploy on git push

4. **Environment Variables in Vercel**
   - Go to Vercel project settings
   - Add environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_ENVIRONMENT=production`

#### Option B: Netlify Deployment

1. **Build Configuration**
   ```toml
   # netlify.toml
   [build]
     publish = "dist"
     command = "npm run build"

   [build.environment]
     NODE_VERSION = "18"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy Process**
   - Connect GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Configure environment variables
   - Deploy

#### Option C: GitHub Pages

1. **GitHub Actions Workflow**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [ main ]

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
             cache: 'npm'
         
         - name: Install dependencies
           run: npm ci
         
         - name: Build
           run: npm run build
           env:
             VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
             VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
         
         - name: Deploy
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

2. **Repository Setup**
   - Enable GitHub Pages in repository settings
   - Set source to gh-pages branch
   - Add secrets to repository settings

## Configuration Management

### Environment Variables

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `VITE_SUPABASE_URL` | Required | Required | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Required | Required | Supabase anonymous key |
| `VITE_ENVIRONMENT` | development | production | Environment identifier |
| `VITE_API_BASE_URL` | Optional | Optional | Custom API base URL |

### Build Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
})
```

## Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm run analyze

# Optimize build
npm run build -- --minify --sourcemap
```

### CDN and Caching
- Static assets are automatically cached by hosting providers
- Configure cache headers for optimal performance
- Use Supabase Edge Caching for API responses

### Database Optimization
```sql
-- Add indexes for better query performance
CREATE INDEX CONCURRENTLY idx_queue_composite ON queue(seater, position, timestampAdded);
CREATE INDEX CONCURRENTLY idx_trip_composite ON trip(status, timestamp);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM queue WHERE seater = 4 ORDER BY position;
```

## Monitoring and Logging

### Application Monitoring
- Use Vercel Analytics or similar for user metrics
- Implement error tracking (Sentry/LogRocket)
- Monitor Core Web Vitals

### Database Monitoring
- Supabase provides built-in monitoring
- Set up alerts for high CPU/memory usage
- Monitor connection pool usage

### Custom Logging
```typescript
// src/utils/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    if (import.meta.env.PROD) {
      // Send to logging service
      console.log(message, data);
    } else {
      console.log(message, data);
    }
  },
  error: (error: Error, context?: string) => {
    if (import.meta.env.PROD) {
      // Send to error tracking service
    }
    console.error(error, context);
  }
};
```

## Security Configuration

### Content Security Policy
```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.supabase.co;
  img-src 'self' data: https:;
">
```

### Supabase Security
- Enable Row Level Security (RLS)
- Use service role key for server-side operations only
- Regularly rotate API keys
- Monitor API usage and set up alerts

## Backup and Recovery

### Database Backup
- Supabase provides automatic daily backups
- Point-in-time recovery available (paid plans)
- Export data regularly for additional backup

### Application Backup
- Source code is version controlled
- Environment variables documented
- Deployment configurations stored in repository

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Environment Variable Issues**
   ```bash
   # Verify variables are loaded
   npm run dev -- --debug
   ```

3. **Supabase Connection Issues**
   ```bash
   # Test connection
   curl -X GET "https://your-project.supabase.co/rest/v1/carinfo" \
     -H "apikey: your-anon-key"
   ```

### Health Checks
```typescript
// Health check endpoint simulation
const healthCheck = async () => {
  try {
    const { data, error } = await supabase.from('carinfo').select('count').limit(1);
    return { status: 'healthy', database: !error };
  } catch (err) {
    return { status: 'unhealthy', error: err.message };
  }
};
```

## Scaling Considerations

### Horizontal Scaling
- Frontend: Automatic via CDN
- Database: Supabase handles scaling
- API: Consider caching layer for high traffic

### Vertical Scaling
- Upgrade Supabase plan for more resources
- Optimize queries and indexes
- Implement connection pooling

## Support and Maintenance

### Regular Maintenance Tasks
- Update dependencies monthly
- Review and rotate API keys quarterly
- Monitor database performance weekly
- Test backup and recovery procedures monthly

### Update Process
```bash
# Update dependencies
npm update
npm audit fix

# Test updates
npm run test
npm run build

# Deploy updates
git add .
git commit -m "Update dependencies"
git push origin main
```

---

For additional support, refer to the documentation in the `/doc` folder or contact the development team.
