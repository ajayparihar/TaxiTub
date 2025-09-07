# 🚖 TaxiTub – Test Case Suite

---

## 1. Car Management (Admin)

### ✅ Positive Cases

1. **Add new car**

   * Input: valid plateNo, driver, seater.
   * Expected: car created successfully, visible in CarInfo.

2. **Update car details**

   * Input: update driverPhone.
   * Expected: updated field only, no duplicate entry.

3. **Delete car**

   * Input: valid carId.
   * Expected: car removed, not assignable, not queueable.

---

### ❌ Negative Cases

4. **Duplicate plateNo**

   * Input: Add car with existing plateNo.
   * Expected: `409 Conflict – Duplicate car`.

5. **Invalid carId on update/delete**

   * Input: Nonexistent carId.
   * Expected: `404 Not Found – Car not registered`.

---

## 2. QueuePal – Add Car to Queue

### ✅ Positive Cases

6. **Add car not in queue**

   * Input: carId valid & not in queue.
   * Expected: car added with position = last.

7. **View queues**

   * Input: request all queues.
   * Expected: cars listed FIFO by seater.

---

### ❌ Negative Cases

8. **Car already in queue**

   * Input: add carId that exists in queue.
   * Expected: `409 Conflict – Already in queue`.

9. **Unregistered car**

   * Input: add invalid carId.
   * Expected: `404 Not Found – Car not registered`.

---

## 3. Passenger – Request Taxi

### ✅ Positive Cases

10. **Passenger requests valid taxi (match found)**

    * Input: passengerCount ≤ seater, destination valid.
    * Expected: oldest car removed from queue, trip created, car details returned.

11. **Passenger requests when multiple cars available**

    * Input: seater = 4, cars \[C1, C2, C3] in queue.
    * Expected: C1 assigned, FIFO preserved.

---

### ❌ Negative Cases

12. **Passenger requests taxi – no car available**

    * Input: seater queue empty.
    * Expected: `404 Not Found – No car available`.

13. **Passenger count > seater**

    * Input: passengerCount = 5, seater queue = 4.
    * Expected: `400 Bad Request – Too many passengers`.

---

## 4. Trip Lifecycle

14. **Trip auto-close after assignment**

    * Input: Passenger assigned C1.
    * Expected: C1 removed from queue, trip record created with `Assigned`.

15. **Re-add car after return**

    * Input: QueuePal re-adds same car.
    * Expected: allowed, new position = end of queue.

---

## 5. Queue Integrity

16. **FIFO enforcement**

    * Setup: Add C1, then C2, then C3.
    * Passenger requests → should always get C1 first.

17. **No duplicate car in queue**

    * Setup: Add C1 twice.
    * Expected: system rejects second insert.

---

## 6. Parallel Request Handling

18. **Two passengers request same seater simultaneously**

    * Setup: Queue = \[C1].
    * Action: P1 & P2 request at same time.
    * Expected: P1 → C1 assigned, P2 → `No car available`.
    * Verify: No duplicate trips created.

19. **Two QueuePals add same car simultaneously**

    * Setup: Car C1 not in queue.
    * Action: QueuePal1 & QueuePal2 both try Add C1.
    * Expected: One succeeds, one gets `409 Conflict`.

---

## 7. Admin – QueuePal Management

### ✅ Positive Cases

20. **Add QueuePal**

    * Input: name, contact.
    * Expected: QueuePal created, assignedBy stored.

21. **Update QueuePal details**

    * Input: update contact.
    * Expected: record updated.

22. **Delete QueuePal**

    * Input: valid queuePalId.
    * Expected: QueuePal removed, no access to queue ops.

---

### ❌ Negative Cases

23. **Add QueuePal duplicate**

    * Input: QueuePal with same contact.
    * Expected: `409 Conflict – Duplicate QueuePal`.

24. **Unauthorized QueuePal action**

    * Input: Passenger tries to add car.
    * Expected: `403 Forbidden – Not allowed`.

---

## 8. Error Handling Tests

25. **Invalid passenger request input**

    * Input: missing destination.
    * Expected: `400 Bad Request – Invalid input`.

26. **System crash simulation (kill DB mid-transaction)**

    * Expected: no car should be half-assigned (rollback works).

27. **API Health Check**

    * Input: Admin pings system.
    * Expected: return `200 OK – All services healthy`.

---

## 9. Boundary Tests

28. **Max queue size**

    * Setup: Add 500 cars.
    * Expected: all cars preserved in FIFO order, no corruption.

29. **Long passenger name or destination**

    * Input: name length = 255 chars.
    * Expected: handled, not truncated incorrectly.

30. **Empty queue for all seaters**

    * Input: Passenger requests.
    * Expected: `404 Not Found – No cars available`.

---

# ✅ Summary

* Covers **positive/negative/parallel/boundary** cases.
* Tests **Admin, QueuePal, Passenger** roles separately.
* Ensures **FIFO + atomic queue safety**.
* Error handling is fully tested (`400 / 403 / 404 / 409`).
* Ready for **functional, integration, and stress tests**.
