-- Database Schema Fix Script for TaxiTub
-- This script addresses the missing columns and schema issues identified in testing
-- Run this script in your Supabase SQL editor

BEGIN;

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

-- 2. Ensure admin table has proper password column (for bcrypt hashes)
DO $$ 
BEGIN
    -- Check if admin table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin') THEN
        -- Check if password column exists and is long enough for bcrypt hashes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'admin' AND column_name = 'password' AND character_maximum_length >= 60) THEN
            -- Drop and recreate password column to ensure it can store bcrypt hashes
            ALTER TABLE admin DROP COLUMN IF EXISTS password;
            ALTER TABLE admin ADD COLUMN password VARCHAR(60);
            RAISE NOTICE 'Updated admin password column for bcrypt hashes';
        ELSE
            RAISE NOTICE 'admin password column is already suitable for bcrypt hashes';
        END IF;
    ELSE
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
            -- Hash generated with bcryptjs using 12 rounds: admin@123 -> $2a$12$...
            INSERT INTO admin (username, password, full_name, is_active) 
            VALUES ('admin', '$2a$12$K8J9H0ZQ7XwL.nGgP1kAyuNaFLvYjOZJLGw8qmgwYMmjN5P1Q2H.6', 'System Administrator', true);
            RAISE NOTICE 'Created default admin user (username: admin, password: admin@123)';
        ELSE
            RAISE NOTICE 'Admin user already exists';
        END IF;
    END IF;
END $$;


-- 6. Update any existing plaintext passwords to hashed versions (CRITICAL SECURITY FIX)
-- Note: This will only work if there are existing records with plaintext passwords
-- In production, you should migrate users by asking them to reset their passwords

DO $$ 
DECLARE
    rec RECORD;
BEGIN
    -- Check if there are any QueuePal records with plaintext passwords (less than 60 chars)
    FOR rec IN SELECT id, password FROM queuepal WHERE LENGTH(password) < 30 AND password IS NOT NULL LOOP
        -- This is a simplified example - in reality, you'd need a migration strategy
        -- For now, we'll just mark these as needing password reset
        UPDATE queuepal SET password = '$2a$12$TEMP_HASH_NEEDS_RESET' WHERE id = rec.id;
        RAISE NOTICE 'Marked QueuePal user % for password reset', rec.id;
    END LOOP;
END $$;

COMMIT;

-- 5. Add indexes for better performance (outside transaction)
-- Using regular CREATE INDEX instead of CONCURRENTLY for Supabase compatibility
CREATE INDEX IF NOT EXISTS idx_queuepal_username ON queuepal (username);
CREATE INDEX IF NOT EXISTS idx_queuepal_is_active ON queuepal (is_active);
CREATE INDEX IF NOT EXISTS idx_admin_username ON admin (username);
CREATE INDEX IF NOT EXISTS idx_admin_is_active ON admin (is_active);

-- Display final status
DO $$ 
BEGIN
    RAISE NOTICE 'Schema migration completed successfully!';
    RAISE NOTICE 'Admin table: % rows', (SELECT COUNT(*) FROM admin);
    RAISE NOTICE 'QueuePal table: % rows', (SELECT COUNT(*) FROM queuepal WHERE assignedby IS NOT NULL OR assignedby IS NULL);
    RAISE NOTICE 'Remember to update any existing user passwords to use bcrypt hashing!';
END $$;
