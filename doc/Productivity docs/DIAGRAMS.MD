# TaxiTub - Reusable ASCII Diagrams

## 1. High-Level System Architecture
+-------------------+
|   Passenger App   |
+---------+---------+
          |
          v
+---------+---------+
|   Backend (API)   |
|  Supabase/Postgres|
+---------+---------+
          |
          v
+---------+---------+
|  Admin Dashboard  |
+-------------------+
          |
          v
+---------+---------+
| QueuePal Terminal |
+-------------------+

---

## 2. Queue Workflow (FIFO)
[Car Arrives] → [Queue Entry] → [Wait] → [Assigned to Passenger] → [Removed from Queue] → [Completes Trip] → [Re-added to Queue]

---

## 3. Data Flow (Passenger Booking)
Passenger → (Request: destination + seats)  
→ System checks queue by seater  
→ Assigns FIRST car in that queue  
→ Updates status = TRIP  
→ Car removed from queue  
→ Confirmation shown to Passenger + QueuePal  
