# 🚖 TaxiTub MVP – Functional Blueprint

---

## 1. Actors

* **Admin**
  Manages car database, views queues & active trips.
* **QueuePal**
  Adds cars to queues, sees live queue status.
* **Passenger**
  Requests taxi → system assigns car.

---

## 2. Core Concepts

### Entities

* **Car**
  Holds permanent info about taxi (plate, driver, seater, etc.).
* **Queue**
  Temporary holding area for cars waiting for assignment.

  * Organized **per seater**.
  * Operates **FIFO**.
* **Trip**
  History of rides (for reporting, not blocking logic).

---

## 3. Data Model (simplified)

```
Car
 ├─ car_id
 ├─ plate_no
 ├─ driver_name
 ├─ driver_phone
 ├─ model
 ├─ seater
 └─ status (active/inactive)

Queue
 ├─ queue_id
 ├─ car_id
 ├─ seater
 └─ queued_at

Trip
 ├─ trip_id
 ├─ car_id
 ├─ passenger_name
 ├─ passenger_count
 ├─ destination
 ├─ started_at
 ├─ ended_at (nullable, not required in MVP)
 └─ status (active/completed – optional)
```

---

## 4. Flow Logic

### A. Adding Car to Queue (QueuePal)

1. QueuePal selects car.
2. System checks:

   * Car is not already in queue.
   * Car is active.
3. If valid → insert into queue (FIFO by `queued_at`).

```
[Car available] → [Queue check] → [Add to queue list]
```

---

### B. Passenger Requests Taxi

1. Passenger provides:

   * Name
   * Destination
   * Passenger count
2. System looks up the **queue of matching seater**.

   * Picks **first car (oldest entry)**.
   * Removes it from queue.
3. A new Trip record is created (for history).
4. Passenger sees:

   * Car model, Plate no, Driver name/phone.

```
Passenger Request
      │
      ▼
[Find matching queue]
      │
      ▼
[Pop 1st car from FIFO]
      │
      ▼
[Create Trip record + Return car details]
```

---

### C. Car Returns from Trip

* QueuePal manually adds car back to queue (same process as step A).
* No need to explicitly mark trip ended.
* Trip record is just historical.

```
Driver returns
     │
     ▼
QueuePal adds again → Car re-enters FIFO
```

---

## 5. Visual Architecture

### Queues by Seater (FIFO)

```
4-Seater Queue: [Car A] → [Car C] → [Car F]
6-Seater Queue: [Car B] → [Car D]
7-Seater Queue: [Car E]
```

### End-to-End Interaction

```
[Admin] -----------------+
                         |
                         v
                    [System State]
                         ^
[QueuePal] ---> [Add Car to Queue] 
                         ^
[Passenger] -> [Request Taxi] -> [Assign 1st Car] -> Car goes on Trip
```

---

## 6. Admin Views

* **Cars List**: Manage details, active/inactive.
* **Live Queues**: See FIFO order per seater.
* **Trips History**: Destination, car, driver, passenger info.
* **System Health**: API/db heartbeat, last activity log.

---

## 7. Error / Edge Handling

* Car already in queue → Reject add.
* No car available in requested seater → Return “No taxi available”.
* Passenger count > max seater → Return error.
* Admin deactivates car → Car cannot be queued again until activated.

---

## 8. MVP Principles

* **Simple**: Only 3 flows – Queue in, Assign out, View state.
* **Human-driven correctness**: QueuePal ensures car is re-added only when it’s back.
* **History preserved**: Trips are recorded, but don’t affect real-time queueing.
* **Debuggable**: Every action logged (Car added, Car assigned, Trip created).

---
