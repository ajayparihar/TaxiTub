# TaxiTub - Parallel Request Handling

## Problem
Two passengers requesting at the same time might get assigned the same taxi.

## Solution
- Use **DB-level row locking** (`FOR UPDATE` in SQL).
- Or Supabase RLS policies with transaction guarantees.

## Example SQL Transaction
BEGIN;
  SELECT carid FROM queue
  WHERE seater = 4
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE;

  DELETE FROM queue WHERE carid = <selected_id>;
COMMIT;

## Rule
Only commit after car is successfully removed from queue.  
If transaction fails, retry with next available car.
