# TaxiTub - AI Agent Workflow Guide

## Step 1 - Input Context
- Always read all `.MD` files inside `/Docs` before generating output.
- If information is missing, explicitly say: "Not defined in Docs."

## Step 2 - Module Confirmation
- State which module is being updated:
  - Admin
  - QueuePal
  - Passenger
  - Shared Utilities

## Step 3 - Changes Summary
- Provide a brief summary of what’s new and why.
- Mention if it affects database schema, APIs, or only frontend.

## Step 4 - Code Delivery
- Deliver code with version header.
- Ensure no overlap with other modules.
- Add inline comments for clarity.

## Step 5 - Documentation Update
- Add a new entry in `CHANGELOG.MD`.
- If needed, update architecture diagrams in Docs.

## Step 6 - Testing
- Suggest at least 1–2 test cases per function.
- Use clear function-based naming (e.g., `test_queue_fifologic()`).

---

✅ Following this ensures:
- No hallucinations (always Doc-driven).
- Clean versioning and modularity.
- Easy debugging and traceability.
