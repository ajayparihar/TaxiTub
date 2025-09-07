-- TaxiTub Database Setup Script for Supabase
-- Version: v0.1.0
-- Execute this in Supabase SQL Editor after creating your project

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
CREATE INDEX idx_queue_composite ON queue(seater, position, timestampAdded);
CREATE INDEX idx_trip_composite ON trip(status, timestamp);

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

-- Public write access policies
CREATE POLICY "Allow public insert on carinfo" ON carinfo FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on queue" ON queue FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on trip" ON trip FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on queuepal" ON queuepal FOR INSERT WITH CHECK (true);

-- Update and delete policies
CREATE POLICY "Allow public update on carinfo" ON carinfo FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on carinfo" ON carinfo FOR DELETE USING (true);
CREATE POLICY "Allow public delete on queue" ON queue FOR DELETE USING (true);
CREATE POLICY "Allow public update on trip" ON trip FOR UPDATE USING (true);

-- Insert some sample data for testing
INSERT INTO carinfo (plateNo, driverName, driverPhone, carModel, seater) VALUES
('DL-01-AA-1234', 'Rajesh Kumar', '+91-9876543210', 'Maruti Suzuki Ertiga', 7),
('DL-02-BB-5678', 'Amit Singh', '+91-9876543211', 'Hyundai i20', 4),
('DL-03-CC-9012', 'Suresh Sharma', '+91-9876543212', 'Mahindra Scorpio', 7),
('DL-04-DD-3456', 'Vikash Gupta', '+91-9876543213', 'Honda City', 4),
('DL-05-EE-7890', 'Ramesh Yadav', '+91-9876543214', 'Toyota Innova', 6);

-- Insert sample QueuePal
INSERT INTO queuepal (name, contact) VALUES
('Ravi Kumar', '+91-9876543220'),
('Santosh Verma', '+91-9876543221');

-- Success message
SELECT 'Database setup completed successfully!' as status;
