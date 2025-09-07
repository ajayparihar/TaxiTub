# TaxiTub - Data Seeding Guide

## Car Info Seeding
- Total cars: ~2000
- Plate numbers: Format `DL01AB1234`
- Models: Maruti Suzuki, Hyundai, Tata, Toyota Innova, etc.
- Seaters: 4, 6, 7

### SQL Snippet (Supabase)
INSERT INTO carinfo (plateno, drivername, driverphone, carmodel, seater)
VALUES
('DL01AB1234', 'Ramesh Kumar', '9876543210', 'Toyota Innova', 7),
('DL01AB5678', 'Suresh Singh', '9876501234', 'Hyundai Xcent', 4);

*(Repeat via script for ~2000 entries)*

## Queue Seeding
- Start with EMPTY queues on fresh deploy.
- Cars get added dynamically by QueuePal.

## Passenger Seeding
- Optional for load testing (fake names + destinations).
