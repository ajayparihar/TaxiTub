-- TaxiTub Database Schema
-- Complete schema for TaxiTub taxi queue management system
-- Run this in your Supabase SQL Editor after setting up your .env file

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Car Information Table
CREATE TABLE IF NOT EXISTS carinfo (
    carid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plateno VARCHAR(20) NOT NULL UNIQUE,
    drivername VARCHAR(100) NOT NULL,
    driverphone VARCHAR(20) NOT NULL,
    carmodel VARCHAR(100) NOT NULL,
    seater INTEGER NOT NULL CHECK (seater IN (4,5,6,7,8)),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Individual Queue Tables for Each Seater Type
-- 4-Seater Queue
CREATE TABLE IF NOT EXISTS queue_4seater (
    queueid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carid UUID NOT NULL REFERENCES carinfo(carid) ON DELETE CASCADE,
    position INTEGER NOT NULL UNIQUE,
    timestampadded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5-Seater Queue
CREATE TABLE IF NOT EXISTS queue_5seater (
    queueid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carid UUID NOT NULL REFERENCES carinfo(carid) ON DELETE CASCADE,
    position INTEGER NOT NULL UNIQUE,
    timestampadded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6-Seater Queue
CREATE TABLE IF NOT EXISTS queue_6seater (
    queueid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carid UUID NOT NULL REFERENCES carinfo(carid) ON DELETE CASCADE,
    position INTEGER NOT NULL UNIQUE,
    timestampadded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7-Seater Queue
CREATE TABLE IF NOT EXISTS queue_7seater (
    queueid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carid UUID NOT NULL REFERENCES carinfo(carid) ON DELETE CASCADE,
    position INTEGER NOT NULL UNIQUE,
    timestampadded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8-Seater Queue
CREATE TABLE IF NOT EXISTS queue_8seater (
    queueid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carid UUID NOT NULL REFERENCES carinfo(carid) ON DELETE CASCADE,
    position INTEGER NOT NULL UNIQUE,
    timestampadded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Admin Authentication Table
CREATE TABLE IF NOT EXISTS admin (
    admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. QueuePal Staff Table
CREATE TABLE IF NOT EXISTS queuepal (
    queuepalid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(20),
    assignedby VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_carinfo_plateno ON carinfo(plateno);
CREATE INDEX IF NOT EXISTS idx_carinfo_seater ON carinfo(seater);
CREATE INDEX IF NOT EXISTS idx_carinfo_is_active ON carinfo(is_active);

CREATE INDEX IF NOT EXISTS idx_queue_4seater_position ON queue_4seater(position);
CREATE INDEX IF NOT EXISTS idx_queue_5seater_position ON queue_5seater(position);
CREATE INDEX IF NOT EXISTS idx_queue_6seater_position ON queue_6seater(position);
CREATE INDEX IF NOT EXISTS idx_queue_7seater_position ON queue_7seater(position);
CREATE INDEX IF NOT EXISTS idx_queue_8seater_position ON queue_8seater(position);

CREATE INDEX IF NOT EXISTS idx_admin_username ON admin(username);
CREATE INDEX IF NOT EXISTS idx_admin_is_active ON admin(is_active);

-- Insert sample data for testing (optional)
-- Sample Cars
INSERT INTO carinfo (plateno, drivername, driverphone, carmodel, seater) VALUES
('DL01AB1234', 'John Doe', '+91-9876543210', 'Toyota Innova', 6),
('DL02CD5678', 'Jane Smith', '+91-9876543211', 'Maruti Swift', 4),
('DL03EF9012', 'Mike Johnson', '+91-9876543212', 'Mahindra Scorpio', 8),
('DL04GH3456', 'Sarah Wilson', '+91-9876543213', 'Hyundai i20', 5),
('DL05IJ7890', 'David Brown', '+91-9876543214', 'Toyota Fortuner', 7)
ON CONFLICT (plateno) DO NOTHING;

-- Sample Admin User (username: admin, password: admin@123)
-- Note: This is a bcrypt hash of "admin@123"
INSERT INTO admin (username, password, full_name, is_active) VALUES
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqyMpkwBLzpdfEcWYCM3XVO', 'System Administrator', true)
ON CONFLICT (username) DO NOTHING;

-- Sample QueuePal Staff
INSERT INTO queuepal (name, contact, assignedby) VALUES
('Queue Manager 1', '+91-9876543220', 'Admin'),
('Queue Manager 2', '+91-9876543221', 'Admin')
ON CONFLICT DO NOTHING;

-- Add some cars to queues for testing
INSERT INTO queue_4seater (carid, position) 
SELECT carid, 1 FROM carinfo WHERE seater = 4 AND plateno = 'DL02CD5678'
ON CONFLICT (position) DO NOTHING;

INSERT INTO queue_6seater (carid, position) 
SELECT carid, 1 FROM carinfo WHERE seater = 6 AND plateno = 'DL01AB1234'
ON CONFLICT (position) DO NOTHING;

INSERT INTO queue_8seater (carid, position) 
SELECT carid, 1 FROM carinfo WHERE seater = 8 AND plateno = 'DL03EF9012'
ON CONFLICT (position) DO NOTHING;

-- Success message
SELECT 'TaxiTub database schema created successfully!' as message;
