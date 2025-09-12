-- Database Schema Fix Script for TaxiTub (Supabase Compatible)
-- This script addresses the missing columns and schema issues identified in testing
-- Run this script in your Supabase SQL editor

-- 1. Add missing 'assignedby' column to queuepal table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'queuepal' AND column_name = 'assignedby') THEN
        ALTER TABLE queuepal ADD COLUMN assignedby VARCHAR(255);
        RAISE NOTICE 'Added assignedby column to queuepal table';
    ELSE
        RAISE NOTICE 'assignedby column already exists in queuepal table';
    END IF;
END $$;

-- 2. Ensure admin table exists with proper password column (for bcrypt hashes)
DO $$ 
BEGIN
    -- Check if admin table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin') THEN
        RAISE NOTICE 'admin table does not exist - creating it now';
        CREATE TABLE admin (
            admin_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(60) NOT NULL, -- bcrypt hashes are 60 characters
            full_name VARCHAR(100),
            email VARCHAR(100),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_login TIMESTAMP WITH TIME ZONE
        );
        RAISE NOTICE 'Created admin table with bcrypt-compatible password column';
    ELSE
        -- Check if password column exists and is long enough for bcrypt hashes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'admin' AND column_name = 'password' AND character_maximum_length >= 60) THEN
            -- Update password column to store bcrypt hashes
            ALTER TABLE admin ALTER COLUMN password TYPE VARCHAR(60);
            RAISE NOTICE 'Updated admin password column for bcrypt hashes';
        ELSE
            RAISE NOTICE 'admin password column is already suitable for bcrypt hashes';
        END IF;
    END IF;
END $$;

-- 3. Update queuepal table password column for bcrypt hashes
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'queuepal') THEN
        -- Check if password column can store bcrypt hashes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'queuepal' AND column_name = 'password' AND character_maximum_length >= 60) THEN
            -- Update password column to store bcrypt hashes
            ALTER TABLE queuepal ALTER COLUMN password TYPE VARCHAR(60);
            RAISE NOTICE 'Updated queuepal password column for bcrypt hashes';
        ELSE
            RAISE NOTICE 'queuepal password column is already suitable for bcrypt hashes';
        END IF;
    END IF;
END $$;

-- 4. Create a secure admin user with hashed password (if admin table is empty)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin') THEN
        IF NOT EXISTS (SELECT 1 FROM admin WHERE username = 'admin') THEN
            -- Insert admin user with bcrypt hashed password for 'admin@123'
            -- This is a pre-generated bcrypt hash for the password 'admin@123'
            INSERT INTO admin (username, password, full_name, is_active) 
            VALUES ('admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewgSxkv0HrEsUStW', 'System Administrator', true);
            RAISE NOTICE 'Created default admin user (username: admin, password: admin@123)';
            RAISE NOTICE 'IMPORTANT: Change this password immediately after first login!';
        ELSE
            RAISE NOTICE 'Admin user already exists';
        END IF;
    END IF;
END $$;

-- 5. Add helpful indexes (using regular CREATE INDEX for Supabase compatibility)
CREATE INDEX IF NOT EXISTS idx_queuepal_username ON queuepal (username);
CREATE INDEX IF NOT EXISTS idx_queuepal_is_active ON queuepal (is_active);
CREATE INDEX IF NOT EXISTS idx_admin_username ON admin (username);
CREATE INDEX IF NOT EXISTS idx_admin_is_active ON admin (is_active);

-- 6. Update any existing plaintext passwords to require reset (SECURITY FIX)
DO $$ 
DECLARE
    rec RECORD;
    updated_count INTEGER := 0;
BEGIN
    -- Check if there are any QueuePal records with plaintext passwords (less than 30 chars)
    FOR rec IN SELECT id, username, password FROM queuepal 
               WHERE LENGTH(password) < 30 AND password IS NOT NULL AND password != '' LOOP
        -- Mark these as needing password reset with a special hash
        UPDATE queuepal SET password = '$2a$12$TEMP_HASH_NEEDS_PASSWORD_RESET_BY_ADMIN' 
        WHERE id = rec.id;
        updated_count := updated_count + 1;
        RAISE NOTICE 'Marked QueuePal user "%" for password reset (had plaintext password)', rec.username;
    END LOOP;
    
    IF updated_count > 0 THEN
        RAISE NOTICE 'Updated % QueuePal accounts that had plaintext passwords', updated_count;
        RAISE NOTICE 'These users will need their passwords reset by an administrator';
    ELSE
        RAISE NOTICE 'No plaintext passwords found in QueuePal table';
    END IF;
END $$;

-- Display final status
DO $$ 
DECLARE
    admin_count INTEGER;
    queuepal_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM admin;
    SELECT COUNT(*) INTO queuepal_count FROM queuepal;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Schema migration completed successfully!';
    RAISE NOTICE 'Admin table: % rows', admin_count;
    RAISE NOTICE 'QueuePal table: % rows', queuepal_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Test admin login with username: admin, password: admin@123';
    RAISE NOTICE '2. IMMEDIATELY change the default admin password';
    RAISE NOTICE '3. Reset passwords for any QueuePal users if needed';
    RAISE NOTICE '4. Run the verification script: npx tsx scripts/verify-all-fixes.ts';
    RAISE NOTICE '========================================';
END $$;
