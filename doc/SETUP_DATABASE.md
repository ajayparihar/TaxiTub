# 🗄️ Database Setup Instructions

## ⚠️ **URGENT: Database Table Missing**

The console errors show that the `queuepal_staff` table doesn't exist in your Supabase database. You need to create it to use the staff management features.

## 🚀 **Quick Setup Steps:**

### Method 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query" 
4. Copy and paste the content from `create-staff-table.sql`
5. Click "Run" to execute the SQL

### Method 2: Copy-Paste SQL (Quick Fix)
Run this SQL in your Supabase SQL Editor:

```sql
-- Create QueuePal Staff table for authentication
CREATE TABLE IF NOT EXISTS queuepal_staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100), -- Optional: Full name of staff member  
    contact VARCHAR(20), -- Optional: Phone number or contact info
    password VARCHAR(255) NOT NULL, -- In production, use proper hashing
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(50) DEFAULT 'admin'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_queuepal_staff_username ON queuepal_staff(username);
CREATE INDEX IF NOT EXISTS idx_queuepal_staff_active ON queuepal_staff(is_active);

-- NOTE: Do not insert users with hardcoded passwords
-- Use the secure-setup.js script instead:
-- node scripts/secure-setup.js --run-secure-setup
-- 
-- This will create users with properly hashed passwords
```

## 🧪 **Test After Setup:**
1. **Refresh your app** after running the SQL
2. **Login as admin** (use secure-setup.js to create admin credentials)
3. **Go to Staff tab** - should load without errors
4. **Try adding a new staff member**
5. **Test staff login** with the sample credentials

## 🔧 **Troubleshooting:**

### If you get permission errors:
- Make sure you're the owner of the Supabase project
- Check if Row Level Security (RLS) policies are blocking access
- Temporarily disable RLS for testing: `ALTER TABLE queuepal_staff DISABLE ROW LEVEL SECURITY;`

### If table still doesn't work:
- Check the table exists: `SELECT * FROM queuepal_staff LIMIT 1;`
- Verify column names match the code expectations
- Check Supabase logs for detailed error messages

## ✅ **Once Complete:**
- ❌ Console errors should disappear
- ✅ Staff management should work perfectly
- ✅ Login system will be fully functional
- ✅ You can add/edit/delete staff members

**This is the main blocker preventing the authentication system from working properly!**
