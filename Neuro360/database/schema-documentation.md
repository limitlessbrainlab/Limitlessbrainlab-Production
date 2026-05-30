# Database Schema Documentation
## Points 16-18: Schema, Constraints, Migrations

---

## Core Tables & Constraints

### 1. patients Table
**Purpose:** Store patient information  
**Access:** Patients can only see own records (RLS)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY | Auto-generated |
| email | VARCHAR | UNIQUE, NOT NULL | Unique per patient |
| password | VARCHAR | NOT NULL | Hashed password |
| full_name | VARCHAR | NOT NULL | Patient full name |
| phone | VARCHAR | UNIQUE | Contact number |
| date_of_birth | DATE | | For age calculation |
| gender | ENUM | | M/F/Other |
| address | TEXT | | Patient address |
| clinic_id | UUID | FOREIGN KEY → clinics | Patient's clinic |
| created_at | TIMESTAMP | DEFAULT NOW() | Record created |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |
| is_active | BOOLEAN | DEFAULT true | Account status |

**Indexes:**
```sql
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX idx_patients_created_at ON patients(created_at DESC);
```

**Constraints:**
```sql
ALTER TABLE patients ADD CONSTRAINT check_email_format 
  CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

ALTER TABLE patients ADD CONSTRAINT check_phone_format 
  CHECK (phone ~ '^[0-9\-\+\(\)\s]+$' OR phone IS NULL);

ALTER TABLE patients ADD CONSTRAINT check_age_valid 
  CHECK (EXTRACT(YEAR FROM AGE(date_of_birth)) >= 0);
```

---

### 2. clinics Table
**Purpose:** Store clinic/organization information

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY | Auto-generated |
| clinic_name | VARCHAR | NOT NULL, UNIQUE | Clinic name |
| email | VARCHAR | UNIQUE, NOT NULL | Contact email |
| password | VARCHAR | NOT NULL | Hashed password |
| contact_person | VARCHAR | NOT NULL | Main contact |
| phone | VARCHAR | UNIQUE | Contact phone |
| address | TEXT | | Clinic address |
| city | VARCHAR | | City |
| state | VARCHAR | | State/Province |
| zip_code | VARCHAR | | Postal code |
| website | VARCHAR | | Clinic website |
| logo_url | VARCHAR | | Logo image URL |
| subscription_status | ENUM | DEFAULT 'pending_approval' | pending_approval/active/expired |
| is_active | BOOLEAN | DEFAULT false | Activation status |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

**Indexes:**
```sql
CREATE INDEX idx_clinics_email ON clinics(email);
CREATE INDEX idx_clinics_status ON clinics(subscription_status);
CREATE INDEX idx_clinics_created_at ON clinics(created_at DESC);
```

**Constraints:**
```sql
ALTER TABLE clinics ADD CONSTRAINT check_clinic_email_format 
  CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

ALTER TABLE clinics ADD CONSTRAINT check_subscription_status 
  CHECK (subscription_status IN ('pending_approval', 'active', 'expired'));

ALTER TABLE clinics ADD CONSTRAINT check_clinic_name_length 
  CHECK (LENGTH(clinic_name) >= 2 AND LENGTH(clinic_name) <= 200);
```

---

### 3. qeeg_files Table
**Purpose:** Store uploaded QEEG files

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY | Auto-generated |
| patient_id | UUID | FOREIGN KEY → patients | Patient reference |
| clinic_id | UUID | FOREIGN KEY → clinics | Clinic reference |
| file_name | VARCHAR | NOT NULL | Original filename |
| file_path | VARCHAR | NOT NULL | Storage path |
| file_size | BIGINT | NOT NULL | File size in bytes |
| file_type | VARCHAR | NOT NULL | MIME type |
| upload_date | TIMESTAMP | DEFAULT NOW() | Upload time |
| processing_status | ENUM | DEFAULT 'pending' | pending/processing/completed/failed |
| processing_error | TEXT | | Error message if failed |
| test_date | DATE | | Date test was conducted |
| notes | TEXT | | Additional notes |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**Indexes:**
```sql
CREATE INDEX idx_qeeg_patient_id ON qeeg_files(patient_id);
CREATE INDEX idx_qeeg_clinic_id ON qeeg_files(clinic_id);
CREATE INDEX idx_qeeg_status ON qeeg_files(processing_status);
CREATE INDEX idx_qeeg_upload_date ON qeeg_files(upload_date DESC);
CREATE INDEX idx_qeeg_patient_clinic ON qeeg_files(patient_id, clinic_id);
```

**Constraints:**
```sql
ALTER TABLE qeeg_files ADD CONSTRAINT check_file_size_limit 
  CHECK (file_size <= 104857600); -- 100MB limit

ALTER TABLE qeeg_files ADD CONSTRAINT check_processing_status 
  CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));

ALTER TABLE qeeg_files ADD CONSTRAINT check_file_type 
  CHECK (file_type IN ('application/pdf', 'text/csv', 'application/vnd.ms-excel'));
```

---

### 4. qeeg_reports Table
**Purpose:** Store generated QEEG reports

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY | Auto-generated |
| patient_id | UUID | NOT NULL, FOREIGN KEY | Patient reference |
| file_id | UUID | FOREIGN KEY → qeeg_files | Source file |
| report_type | ENUM | NOT NULL | summary/detailed/pdf |
| overall_score | DECIMAL | | Score 0-21 |
| report_data | JSONB | | Full report JSON |
| pdf_url | VARCHAR | | Generated PDF URL |
| generation_status | ENUM | DEFAULT 'pending' | pending/completed/failed |
| generated_at | TIMESTAMP | | Generation time |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**Indexes:**
```sql
CREATE INDEX idx_reports_patient_id ON qeeg_reports(patient_id);
CREATE INDEX idx_reports_file_id ON qeeg_reports(file_id);
CREATE INDEX idx_reports_type ON qeeg_reports(report_type);
CREATE INDEX idx_reports_status ON qeeg_reports(generation_status);
CREATE INDEX idx_reports_created_at ON qeeg_reports(created_at DESC);
```

---

## Row-Level Security (RLS) Policies

### Patient RLS Policy
```sql
-- Patients can only see their own data
CREATE POLICY patient_can_only_see_own_data ON patients
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY patient_can_update_own_data ON patients
  FOR UPDATE USING (auth.uid() = id);
```

### Clinic RLS Policy
```sql
-- Clinics can see their own data and their patients
CREATE POLICY clinic_can_see_own_patients ON patients
  FOR SELECT USING (
    clinic_id IN (
      SELECT id FROM clinics WHERE auth.uid() = id
    )
  );

CREATE POLICY clinic_can_see_own_qeeg ON qeeg_files
  FOR SELECT USING (
    clinic_id IN (
      SELECT id FROM clinics WHERE auth.uid() = id
    )
  );
```

---

## Migration Strategy

### Version 1.0.0 - Initial Schema
```sql
-- Create patients table
CREATE TABLE patients (...);

-- Create clinics table
CREATE TABLE clinics (...);

-- Create qeeg_files table
CREATE TABLE qeeg_files (...);

-- Create qeeg_reports table
CREATE TABLE qeeg_reports (...);

-- Add all indexes
CREATE INDEX ...;

-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE qeeg_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE qeeg_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY ...;
```

### Rollback Procedure
```sql
-- Disable RLS policies
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE qeeg_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE qeeg_reports DISABLE ROW LEVEL SECURITY;

-- Drop tables in reverse order
DROP TABLE qeeg_reports;
DROP TABLE qeeg_files;
DROP TABLE patients;
DROP TABLE clinics;
```

---

## Backup & Restore (Point 19)

### Daily Backup Script
```bash
#!/bin/bash
# backup_database.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backups/neuro360_${TIMESTAMP}.sql"

# Export database
pg_dump postgresql://user:password@host/neuro360 > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp ${BACKUP_FILE}.gz s3://neuro360-backups/

# Keep only last 30 days
find backups/ -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### Restore Procedure
```bash
#!/bin/bash
# restore_database.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore_database.sh <backup_file.sql.gz>"
  exit 1
fi

# Decompress
gunzip -c $BACKUP_FILE > /tmp/restore.sql

# Restore database
psql postgresql://user:password@host/neuro360 < /tmp/restore.sql

# Cleanup
rm /tmp/restore.sql

echo "Database restored from $BACKUP_FILE"
```

---

## Data Validation Rules

### Email Validation
- Must match RFC 5322 standard
- Must be unique in system
- Must be lowercase

### Password Validation
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Hashed with bcrypt

### File Upload Validation
- Maximum 100MB
- Only allowed types: PDF, CSV, XLSX
- Virus scan before storage
- Duplicate file detection

### QEEG Score Validation
- Range: 0-21
- Decimal precision: 2 places
- Null only if processing failed

---

## Performance Optimization

### Query Optimization
```sql
-- Use indexes for common queries
EXPLAIN ANALYZE
SELECT * FROM patients WHERE clinic_id = 'uuid' AND created_at > NOW() - INTERVAL '30 days';

-- Batch insert optimization
INSERT INTO qeeg_files (patient_id, file_name, file_path, file_size, file_type)
  VALUES (...), (...), (...)
  ON CONFLICT (file_path) DO UPDATE SET updated_at = NOW();
```

### Connection Pooling
- Min connections: 5
- Max connections: 20
- Connection timeout: 30s
- Idle connection timeout: 5min

### Caching Strategy
- Cache clinic data: 1 hour
- Cache patient counts: 30 minutes
- Cache report data: 24 hours
- Cache invalidation on update

---

## Monitoring & Maintenance

### Health Checks
```sql
-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index efficiency
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check slow queries
SELECT query, mean_time, calls FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_time DESC LIMIT 10;
```

### Maintenance Tasks
- Vacuum: Weekly
- Analyze: Daily
- Reindex: Monthly
- Backup: Daily

---

## Success Criteria

✅ All tables have PRIMARY KEY constraints  
✅ All foreign keys defined and indexed  
✅ RLS policies enforce data access  
✅ Validation constraints prevent bad data  
✅ Indexes optimize common queries  
✅ Backup procedure documented  
✅ Restore procedure tested  
✅ Migration strategy defined  

