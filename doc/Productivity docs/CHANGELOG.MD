# TaxiTub - Changelog

All major/minor changes across the system will be tracked here.  
Follow semantic versioning: v0.x for prototype, v1.x for stable releases.

---

## v0.1.0 - 2025-09-06
- Initial setup of documentation (`TaxiTub-1.MD`, `TaxiTub-2.MD`, etc.)
- Added system architecture diagrams.
- Created initial DB schema draft.
- **COMPLETE APPLICATION IMPLEMENTATION**:
  - Built full React TypeScript frontend with Admin, QueuePal, and Passenger interfaces
  - Implemented comprehensive API service layer with error handling
  - Created Supabase database schema with FIFO queue management
  - Added responsive UI with real-time queue status
  - Implemented FIFO taxi assignment with parallel request safety
  - Built car management, trip tracking, and QueuePal administration
  - Added complete error handling based on ERROR_HANDLING.MD patterns
  - Applied CODE_VERSIONING_TEMPLATE.MD standards to all files
  - Created deployment-ready configuration for GitHub Pages + Supabase
  - Added comprehensive documentation and setup instructions
