# 🚖 TaxiTub – MVP Documentation

---

## 1. System Overview

TaxiTub is an **Airport Taxi Queue Management System** that streamlines vehicle assignment:

* **Admin** manages cars and QueuePals.
* **QueuePal** adds cars to the queue.
* **Passenger** books taxis based on seat availability.
* **System** ensures FIFO assignment.

---

## 2. Core Entities

### Cars

* `carId`
* `plateNo`
* `driverName`
* `driverPhone`
* `carModel`
* `seater`

### Trips

* `tripId`
* `carId`
* `passengerName`
* `destination`
* `passengerCount`
* `status` (completed by default once car leaves queue)
* `timestamp`

### Queue

* FIFO ordered list by `seater`
* Contains only `carId`

### QueuePals

* `queuePalId`
* `name`
* `contact`
* `assignedBy (Admin)`
* Role: can only manage the queue

---

## 3. Roles & Responsibilities

### 👤 Admin

* Manage Cars (CRUD).
* Manage QueuePals (CRUD).
* View:

  * Active Queue (by seater).
  * Live Trips (who booked, car assigned, etc.).
* Ensure system health (basic API check).

### 👤 QueuePal

* Add a car to queue (only if not already queued).
* View queues (grouped by seater).
* Cannot assign trips manually (system does it).

### 👤 Passenger

* Request taxi → (destination, no. of passengers, name).
* Gets first car from the correct queue (FIFO).
* Receives car + driver details.

---

## 4. Flows

### 4.1 Add Car to Queue (QueuePal)

```
QueuePal         System        Queue
   |               |             |
   |-- Add Car --> |             |
   |               |-- Check --> |
   |               |<- Exists? --|
   |               |-- Insert -->|
   |<- Success ----|             |
```

---

### 4.2 Passenger Requests Taxi

```
Passenger        System         Queue         Trip
   |               |             |             |
   |-- Request --> |             |             |
   | (dest, pax)   |             |             |
   |               |-- Find -->  |             |
   |               |<- Oldest ---|             |
   |               |-- Remove -->|             |
   |               |-- Create ---------------->|
   |<- Car Info ---|             |             |
```

---

### 4.3 Car Returns & Re-Added

```
Driver Returns    QueuePal        System        Queue
     |               |              |             |
     |               |-- Add Car -->|             |
     |               |              |-- Insert -->|
     |               |<- Success ---|             |
```

---

## 5. Consolidated Swimlane (High-Level)

```
Admin         QueuePal           Passenger          System
 |               |                  |                 |
 |-- Add Car --> |                  |                 |
 |               |-- Add Car to ---->                 |
 |               |   Queue          |                 |
 |               |                  |                 |
 |                                Request --------->  |
 |                                (dest, pax)        |
 |                                   |               |
 |                                   |<-- Assign Car |
 |                                   |   (FIFO)      |
 |                                   |               |
 |                                <-- Car Details ---|
 |                                                   |
 |<------------- View Queues & Trips ----------------|
```

---

## 6. Key Logic Rules

1. **No duplicate cars in queue.**
2. **Queue is FIFO** → oldest waiting car is assigned first.
3. **Trips auto-close** once car is assigned; no “end trip” button needed.
4. **Returning cars** → QueuePal re-adds them.
5. **Admin-only** can create/remove QueuePals & Cars.

---

## 7. Scalability Notes

* Queues can be stored **per seater type**.
* FIFO ensures fairness.
* System is **low-load** (1–2 QueuePals, limited passengers).
* Easily extendable (e.g., online pre-booking, payments).

---

✅ This doc now covers:

* All entities, roles, flows
* QueuePal CRUD under Admin
* System diagrams & consolidated swimlane
