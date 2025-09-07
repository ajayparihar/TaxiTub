# 🚖 TaxiTub – Final MVP Documentation

---

## 1. System Overview

TaxiTub is a **Queue-Based Airport Taxi Management System**.

* Cars line up in FIFO queues (per seater capacity).
* Passengers request taxis → system assigns the first available car.
* QueuePals manage the queue.
* Admin oversees cars, QueuePals, and live trips.

**Key Principles**

* **FIFO fairness**
* **No duplicates in queue**
* **Parallel safety** (atomic queue ops)
* **Simple error handling**

---

## 2. Core Entities

### Cars (`CarInfo`)

* `carId` (PK)
* `plateNo` (unique)
* `driverName`
* `driverPhone`
* `carModel`
* `seater`

### Trips (`Trip`)

* `tripId` (PK)
* `carId` (FK → CarInfo)
* `passengerName`
* `destination`
* `passengerCount`
* `status` (e.g., *Assigned*, *Completed*)
* `timestamp`

### Queue (`Queue`)

* `queueId` (PK)
* `carId` (FK → CarInfo, unique)
* `seater`
* `position` (FIFO ordering)
* `timestampAdded`

### QueuePals (`QueuePal`)

* `queuePalId` (PK)
* `name`
* `contact`
* `assignedBy` (AdminId)

---

## 3. Roles

### 👤 Admin

* CRUD Cars
* CRUD QueuePals
* View live queues (per seater)
* View live trips
* Monitor system/API health

### 👤 QueuePal

* Add cars to queue (only if not already queued)
* View queues
* Cannot assign taxis manually

### 👤 Passenger

* Request taxi (name, destination, passenger count)
* System assigns car + driver details
* No direct queue manipulation

---

## 4. Flows

### 4.1 Add Car to Queue

```
QueuePal         System        Queue
   |               |             |
   |-- Add Car --> |             |
   |               |-- Check --> |
   |               |<- Exists? --|
   |               |-- Insert -->|
   |<- Success ----|             |
```

✅ **Error Handling:**

* If car already in queue → return `Error: Already in queue`.
* If car doesn’t exist in CarInfo → return `Error: Car not registered`.

---

### 4.2 Passenger Requests Taxi

```
Passenger        System         Queue         Trip
   |               |             |             |
   |-- Request --> |             |             |
   | (dest, pax)   |             |             |
   |               |-- Lock -->  |             |
   |               |-- Find -->  |             |
   |               |<- Oldest ---|             |
   |               |-- Remove -->|             |
   |               |-- Create ---------------->|
   |<- Car Info ---|             |             |
```

✅ **Error Handling:**

* If no car available in requested seater → `Error: No car available`.
* If parallel requests hit same queue:

  * Use **transaction + row lock** to ensure only one request removes a car at a time.
  * Others wait and retry.

---

### 4.3 Car Returns & Re-Added

```
Driver Returns    QueuePal        System        Queue
     |               |              |             |
     |               |-- Add Car -->|             |
     |               |-- Check ---->|             |
     |               |<- Exists? ---|             |
     |               |-- Insert --> |             |
     |               |<- Success ---|             |
```

✅ **Error Handling:**

* If already in queue → reject with `Error: Duplicate entry`.
* If car is unregistered → reject with `Error: Car not found`.

---

## 5. Consolidated Swimlane

```
Admin         QueuePal           Passenger          System
 |               |                  |                 |
 |-- CRUD Cars ->|                  |                 |
 |-- CRUD QPals->|                  |                 |
 |               |-- Add Car ------>|                 |
 |               |   to Queue       |                 |
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

## 6. Error Handling Rules

* **Invalid Car Add:** reject with clear error.
* **Duplicate Queue Add:** reject.
* **Passenger Request Fail:** return `No car available` if empty.
* **System Crash:** queue remains intact (transactions prevent corruption).
* **Validation:** input checks for passenger count ≤ car seater.

---

## 7. Parallel Request Safety

* **Atomic Queue Operations:**

  * Use transactions (`BEGIN → SELECT oldest → DELETE → COMMIT`).
  * Ensure only one passenger request assigns a car at a time.
* **Row Locking:** database locks on `Queue` row during assignment.
* **Retry Logic:** if two passengers request same seater simultaneously, one succeeds, other retries.
* **QueuePal Adds:** check+insert wrapped in single transaction.

---

## 8. Scalability Notes

* Current load: **low** (1–2 QueuePals, limited passengers).
* Database-first architecture, easily extendable.
* Could scale to multiple airports by adding **`airportId`** field in all tables.
* Can later add features: digital payments, driver tracking, passenger receipts.

---

## 9. Text ERD

```
+-----------+          +---------+         +-------+
| CarInfo   |          | Queue   |         | Trip  |
+-----------+          +---------+         +-------+
| carId PK  |<-----+   | queueId PK |      | tripId PK |
| plateNo   |      |   | carId FK  |-----> | carId FK  |
| driverName|      |   | seater    |       | passengerName |
| driverPh  |      |   | position  |       | destination   |
| carModel  |      |   | tsAdded   |       | passengerCnt  |
| seater    |      |                  | status       |
+-----------+                          | timestamp    |
                                       +-------------+
+-------------+
| QueuePal    |
+-------------+
| queuePalId PK |
| name          |
| contact       |
| assignedBy FK |
+---------------+
```

---

✅ This **final MVP doc** is:

* Modular
* Handles errors gracefully
* Safe against parallel race conditions
* Clear DB schema & flows
* Debug-friendly
