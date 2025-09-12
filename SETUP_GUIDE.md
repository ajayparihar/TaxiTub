# 🚕 TaxiTub Setup Guide

This guide will help you set up your TaxiTub application with a real Supabase database to resolve the network connection errors.

## 📋 Current Status

❌ **Issue**: Your application is trying to connect to `https://placeholder.supabase.co` (which doesn't exist)  
✅ **Solution**: Set up a real Supabase database with proper credentials

## 🛠️ Setup Steps

### Step 1: Create Supabase Project

1. **Go to Supabase**: Visit [supabase.com](https://supabase.com)
2. **Sign up/Login**: Create an account or sign in
3. **Create Project**: 
   - Click "New Project"
   - Choose your organization
   - Project name: `TaxiTub` (or any name you prefer)
   - Set a strong database password
   - Select a region close to you
   - Click "Create new project"
4. **Wait**: Project creation takes 1-2 minutes

### Step 2: Get Your Credentials

1. **Navigate to Settings**: In your project dashboard, click "Settings" in the left sidebar
2. **Go to API**: Click "API" in the settings menu
3. **Copy Credentials**:
   - **Project URL**: Copy the URL (looks like `https://abcdefghijk.supabase.co`)
   - **Anon public key**: Copy the anon key (long string starting with `eyJ...`)

### Step 3: Update Environment File

1. **Open `.env` file**: In your TaxiTub project folder, open the `.env` file
2. **Replace values**:
   ```env
   # Replace these with your actual values
   VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-actual-key
   
   # Keep these as they are
   VITE_APP_NAME=TaxiTub
   VITE_APP_VERSION=0.1.0
   ```

### Step 4: Create Database Schema

1. **Go to SQL Editor**: In your Supabase dashboard, click "SQL Editor" in the left sidebar
2. **Open the SQL file**: In your TaxiTub folder, open `database-schema.sql`
3. **Copy all content**: Select all content (Ctrl+A) and copy (Ctrl+C)
4. **Paste and run**: 
   - Paste the SQL into the Supabase SQL Editor
   - Click "RUN" button
   - Wait for success message

### Step 5: Test Database Connection

Run the connection test script to verify everything is working:

```powershell
node test-connection.js
```

**Expected Output**:
```
🚀 TaxiTub Database Connection Test
====================================

📋 Step 1: Checking environment variables...
✅ Environment variables found
   URL: https://abcdefghijk.supabase.co...
   Key: eyJhbGciOiJIUzI1NiIs...

🔌 Step 2: Initializing Supabase client...
✅ Supabase client initialized

📡 Step 3: Testing database connection...
✅ Database connection successful!

📊 Step 4: Checking required tables...
   ✅ carinfo: accessible (5 sample records)
   ✅ queue_4seater: accessible (1 sample record)
   ✅ queue_5seater: accessible (0 sample records)
   ✅ queue_6seater: accessible (1 sample record)
   ✅ queue_7seater: accessible (0 sample records)
   ✅ queue_8seater: accessible (1 sample record)
   ✅ admin: accessible (1 sample record)
   ✅ queuepal: accessible (2 sample records)

🔍 Step 5: Checking sample data...
   🚗 Cars: 5 registered
      DL01AB1234 - John Doe (6-seater)
      DL02CD5678 - Jane Smith (4-seater)
      DL03EF9012 - Mike Johnson (8-seater)
      DL04GH3456 - Sarah Wilson (5-seater)
      DL05IJ7890 - David Brown (7-seater)
   👤 Admin users: 1
      admin - System Administrator (active)
   📋 4-seater queue: 1 cars
   📋 5-seater queue: 0 cars
   📋 6-seater queue: 1 cars
   📋 7-seater queue: 0 cars
   📋 8-seater queue: 1 cars

🎉 Database Connection Test Complete!
=====================================
✅ All systems ready!

📝 Next steps:
1. Start your development server: npm run dev
2. Open http://localhost:5173 in your browser
3. The network errors should be resolved!

🔐 Admin credentials:
   Username: admin
   Password: admin@123
```

### Step 6: Start Your Application

1. **Restart dev server**: If it's running, stop it (Ctrl+C) and restart:
   ```powershell
   npm run dev
   ```
   or
   ```powershell
   yarn dev
   ```

2. **Open browser**: Go to `http://localhost:5173`

3. **Verify**: The network errors should be gone, and data should load properly

## 🎯 What You Get

After setup, your TaxiTub application will have:

### 🚗 Sample Cars (5 vehicles):
- **DL01AB1234** - John Doe (6-seater Toyota Innova)
- **DL02CD5678** - Jane Smith (4-seater Maruti Swift) - *In 4-seater queue*
- **DL03EF9012** - Mike Johnson (8-seater Mahindra Scorpio) - *In 8-seater queue*
- **DL04GH3456** - Sarah Wilson (5-seater Hyundai i20)
- **DL05IJ7890** - David Brown (7-seater Toyota Fortuner)

### 👤 Admin Access:
- **Username**: `admin`
- **Password**: `admin@123`

### 📋 Queue Managers (2 staff):
- Queue Manager 1
- Queue Manager 2

### 🎯 Active Queues:
- **4-seater queue**: 1 car ready
- **6-seater queue**: 1 car ready  
- **8-seater queue**: 1 car ready

## 🔧 Troubleshooting

### ❌ Still seeing placeholder errors?
- Double-check your `.env` file has real values (not placeholder text)
- Restart your development server after updating `.env`

### ❌ "relation does not exist" errors?
- Make sure you ran the `database-schema.sql` script in Supabase SQL Editor
- Check that all tables were created successfully

### ❌ Connection test fails?
- Verify your Supabase project URL and anon key are correct
- Make sure your Supabase project is active (not paused)
- Check your internet connection

### ❌ Need help?
Run the connection test script for detailed diagnostics:
```powershell
node test-connection.js
```

## 🎉 Success!

Once everything is set up, your TaxiTub application will:
- ✅ Connect to a real database
- ✅ Load car and queue data
- ✅ Allow admin login
- ✅ Support taxi queue management
- ✅ Handle passenger assignments

The network errors in your browser console will be completely resolved!

---

**Need more sample data?** You can also run the database seeding script to add 2,000 sample cars:
```powershell
npm run seed-db
```
