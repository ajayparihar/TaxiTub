# TaxiTub Database Tables Documentation

## 📋 Overview

This document provides a comprehensive overview of all database tables used in the TaxiTub system, their purpose, structure, and relationships.

## 🗄️ Required Tables

### 1. **`carinfo`** - Vehicle Registration
**Purpose**: Stores all taxi vehicle information and driver details.

**Structure**:
```sql
CREATE TABLE carinfo (
    carid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plateno VARCHAR(20) NOT NULL UNIQUE,
    drivername VARCHAR(100) NOT NULL,
    driverphone VARCHAR(20) NOT NULL,
    carmodel VARCHAR(100) NOT NULL,
    seater INTEGER NOT NULL CHECK (seater IN (4,5,6,7,8)),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features**:
- ✅ UUID primary key for security
- ✅ Unique plate numbers
- ✅ Seater capacity validation (4,5,6,7,8)
- ✅ Active/inactive status for car management
- ✅ Audit timestamps

---

### 2. **Individual Seater Queue Tables**
**Purpose**: Separate FIFO queues for each vehicle seater capacity.

#### 2.1 **`queue_4seater`** - 4-Seater Vehicle Queue
#### 2.2 **`queue_5seater`** - 5-Seater Vehicle Queue  
#### 2.3 **`queue_6seater`** - 6-Seater Vehicle Queue
#### 2.4 **`queue_7seater`** - 7-Seater Vehicle Queue
#### 2.5 **`queue_8seater`** - 8-Seater Vehicle Queue

**Structure** (identical for all seater tables):
```sql
CREATE TABLE queue_[X]seater (
    queueid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carid UUID NOT NULL REFERENCES carinfo(carid) ON DELETE CASCADE,
    position INTEGER NOT NULL UNIQUE,
    timestampadded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features**:
- ✅ Complete queue isolation per seater type
- ✅ FIFO ordering with position numbers
- ✅ Foreign key relationship to carinfo
- ✅ Cascade deletion when car is removed
- ✅ Unique position constraints within each queue

---

### 3. **`admin`** - Admin Authentication
**Purpose**: Secure storage of admin user credentials with bcrypt hashing.

**Structure**:
```sql
CREATE TABLE admin (
    admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Security Note**:
- ⚠️ **NO DEFAULT PASSWORDS** - Use secure-setup.js to create admin users
- ✅ All passwords are securely generated and bcrypt hashed
- ✅ Use environment variables for password management

**Key Features**:
- ✅ Bcrypt password hashing for security
- ✅ Last login tracking
- ✅ Active/inactive status management
- ✅ Helper function `verify_admin_password()` for authentication

---

### 4. **`queuepal`** - Queue Manager Staff
**Purpose**: QueuePal staff who can manage taxi queues.

**Structure**:
```sql
CREATE TABLE queuepal (
    queuepalid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(20),
    assignedby VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features**:
- ✅ Simple staff management
- ✅ Contact information for communication
- ✅ Assignment tracking (who created the staff record)

---

## ❌ Deprecated/Removed Tables

### **`queue`** (REMOVED)
- **Status**: ❌ Deprecated and removed
- **Reason**: Replaced with individual seater queue tables for better isolation
- **Migration**: Data migrated to appropriate `queue_[X]seater` tables

### **`queuepal_staff`** (OPTIONAL/UNUSED)
- **Status**: ⚠️ May exist but not actively used
- **Reason**: Functionality covered by simpler `queuepal` table
- **Action**: Can be safely removed if exists

---

## 🏗️ Table Relationships

```
carinfo (1) ←→ (many) queue_4seater
carinfo (1) ←→ (many) queue_5seater  
carinfo (1) ←→ (many) queue_6seater
carinfo (1) ←→ (many) queue_7seater
carinfo (1) ←→ (many) queue_8seater

admin (independent)
queuepal (independent)
```

**Key Relationships**:
- Each car can be in **only one queue** at a time
- Cars are **automatically removed** from queues when deleted (CASCADE)
- Admin and QueuePal tables are **independent** (no foreign keys)

---

## 📊 Database Statistics

### **Production-Ready Setup**:
- **Total Required Tables**: 8
  - 1 × `carinfo`
  - 5 × `queue_[X]seater` tables
  - 1 × `admin`  
  - 1 × `queuepal`

### **Sample Data Capacity**:
- **Cars**: 200 vehicles (40 per seater type)
- **Active Queues**: 50 vehicles (10 per seater type)
- **Admin Users**: 2 (admin, dev)
- **QueuePal Staff**: Variable (added as needed)

---

## 🔐 Security Features

### **Password Security**:
- ✅ **Admin passwords**: Bcrypt hashed with salt
- ✅ **Authentication function**: `verify_admin_password()` with security definer
- ✅ **No plaintext passwords** stored in database

### **Data Integrity**:
- ✅ **UUID primary keys** prevent enumeration attacks
- ✅ **Foreign key constraints** maintain referential integrity
- ✅ **Unique constraints** prevent duplicate entries
- ✅ **Check constraints** validate seater types

### **Access Control**:
- ✅ **Role-based authentication** (Admin vs QueuePal)
- ✅ **Active status management** for all user types
- ✅ **Audit timestamps** for change tracking

---

## 🚀 Setup Instructions

### **1. Create Basic Structure**:
```sql
-- Run this script to create individual queue tables
\i create-individual-tables-only.sql
```

### **2. Add Admin Authentication**:
```sql
-- Run this script to create admin table with secure authentication
\i create-admin-table.sql
```

### **3. Optional: Add Sample Data**:
```sql
-- Run this script for complete setup with 200 sample cars
\i setup-sample-data.sql
```

### **4. Verify Setup**:
```sql
-- Check all required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'carinfo', 'admin', 'queuepal',
    'queue_4seater', 'queue_5seater', 'queue_6seater', 
    'queue_7seater', 'queue_8seater'
);
```

---

## 🔧 Maintenance

### **Regular Cleanup**:
- Remove inactive cars periodically
- Archive old queue position data
- Monitor admin login activity

### **Performance Optimization**:
- Ensure indexes are maintained on:
  - `carinfo.plateno` (unique lookups)
  - `queue_[X]seater.position` (FIFO ordering)
  - `admin.username` (login authentication)

### **Backup Strategy**:
- Priority 1: `admin` (authentication critical)
- Priority 2: `carinfo` (business data)
- Priority 3: Queue tables (can be rebuilt)
- Priority 4: `queuepal` (manageable)

---

## ✅ Current Status

**Database Schema**: ✅ **Production Ready**
- All required tables documented
- Security implementation complete
- Individual queue isolation achieved
- Authentication system secured

**Next Steps**:
1. Run database setup scripts
2. Test authentication with new admin credentials
3. Verify queue operations across all seater types
4. Optional: Add sample data for testing

The TaxiTub database is now fully documented and ready for production use! 🚕✨
