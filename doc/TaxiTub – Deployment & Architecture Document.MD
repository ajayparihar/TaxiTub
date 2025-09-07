# 🚖 TaxiTub – Deployment & Architecture Document

---

## 1. System Overview

TaxiTub is an **Airport Taxi Queue Management System** designed for \~2000 taxis.
It supports 3 roles:

* **Admin** → manage Cars & QueuePals, monitor queues & trips.
* **QueuePal** → add cars to queue, view queues.
* **Passenger** → request taxis, get assigned driver/car.

The system is **low-load**, designed to be:

* **Free / nearly free** to host.
* **Simple** to debug and maintain.
* **Scalable enough** for future extensions.

---

## 2. Tech Stack

* **Frontend** → GitHub Pages (static hosting, free).
* **Backend / API** → Supabase (Postgres DB + auto-generated REST APIs).
* **Database** → Postgres (managed by Supabase, free tier covers needs).

---

## 3. Why GitHub + Supabase?

* **No server management** → no EC2/VM headaches.
* **Free hosting** → GitHub Pages covers frontend.
* **Auto APIs** → Supabase provides CRUD endpoints for all tables.
* **Tiny dataset** (\~2000 cars) → fits in free 500MB DB easily.
* **Secure & future-ready** → can later add auth (Supabase Auth) if needed.

---

## 4. Database Schema (Supabase Tables)

### `CarInfo`

* `carId (PK)`
* `plateNo (unique)`
* `driverName`
* `driverPhone`
* `carModel`
* `seater`

### `Queue`

* `queueId (PK)`
* `carId (FK → CarInfo, unique)`
* `seater`
* `position` (FIFO ordering)
* `timestampAdded`

### `Trip`

* `tripId (PK)`
* `carId (FK → CarInfo)`
* `passengerName`
* `destination`
* `passengerCount`
* `status` (Assigned / Completed)
* `timestamp`

### `QueuePal`

* `queuePalId (PK)`
* `name`
* `contact`
* `assignedBy (AdminId)`

---

## 5. Deployment Diagram

```
   [Admin UI]     [QueuePal UI]     [Passenger UI]
         |               |                 |
         +---------------+-----------------+
                         |
                   (HTTPS / REST APIs)
                         |
                 +---------------------+
                 |     Supabase API    |
                 |  (Auth + Postgres)  |
                 +---------------------+
                         |
                 +---------------------+
                 |    Postgres DB      |
                 +---------------------+
```

---

## 6. Role-Based Flows

### 👤 Admin

* Uses GitHub Pages UI → Supabase APIs.
* Can CRUD Cars & QueuePals.
* Can view live Queue + Trip tables.

### 👤 QueuePal

* Logs into GitHub Pages UI.
* Can add cars to Queue table (validated via Supabase).
* Can view queue by seater (FIFO order).

### 👤 Passenger

* Opens GitHub Pages booking form.
* Submits destination, passenger count.
* Supabase API:

  1. Finds first available car in matching queue.
  2. Removes from Queue table.
  3. Creates new Trip record.
* Passenger gets car + driver details.

---

## 7. Error Handling

* **Duplicate car in queue** → reject with `409 Conflict`.
* **Passenger count > seater** → reject with `400 Bad Request`.
* **Queue empty** → reject with `404 Not Found`.
* **Car not registered** → reject with `404 Not Found`.
* **Parallel passenger requests** → Supabase transactions ensure only one car is assigned.

---

## 8. Parallel Request Safety

* Supabase supports **Row-Level Security + Transactions**.
* When a passenger requests:

  1. Lock queue row.
  2. Assign oldest car.
  3. Remove it.
* Ensures **FIFO correctness** and no duplicates.

---

## 9. API Endpoints (Supabase auto-generated)

| Operation              | Endpoint (example)                                | Notes                    |
| ---------------------- | ------------------------------------------------- | ------------------------ |
| List cars              | `/rest/v1/CarInfo`                                | Admin fetch              |
| Add car                | `/rest/v1/CarInfo` (POST)                         | Admin only               |
| Add to queue           | `/rest/v1/Queue` (POST)                           | QueuePal only            |
| Get queue by seater    | `/rest/v1/Queue?seater=eq.4&order=timestampAdded` | FIFO view                |
| Passenger request taxi | (Custom RPC or transaction)                       | Assign car + create trip |
| List trips             | `/rest/v1/Trip`                                   | Admin view               |
| Add QueuePal           | `/rest/v1/QueuePal` (POST)                        | Admin only               |

---

## 10. Cost Estimate

* **GitHub Pages** → Free.
* **Supabase** → Free tier:

  * 500 MB Postgres DB
  * 50k monthly API calls
  * 1 GB bandwidth
* Usage is well below these limits → **\$0 cost MVP**.

---

## 11. Future Extensions

* Add Supabase Auth for login roles (Admin, QueuePal, Passenger).
* Add Driver App (for location updates).
* Add Payments (Stripe / Razorpay integration).
* Multi-airport support → add `airportId` field to all tables.

---

✅ With this setup:

* **Frontend:** GitHub (free)
* **Backend + DB:** Supabase (free tier, Postgres + APIs)
* **Ops cost:** \$0 for MVP
* **Complexity:** very low, easy to debug