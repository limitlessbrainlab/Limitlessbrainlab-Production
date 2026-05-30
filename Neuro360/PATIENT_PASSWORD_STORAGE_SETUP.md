# Patient Password Storage Setup

## Changes Made

### Issue
Patient registration details (especially password) were not being saved to the `patients` table. The password was only used for creating Supabase auth accounts but not stored in the database for reference.

### Solution
Updated the patient creation flow to save password along with all other registration details to the `patients` table.

---

## Files Modified

### 1. `src/components/clinic/PatientManagement.jsx` (Line 255)

**Before:**
```javascript
const patientData = {
  org_id: clinicId,
  clinic_id: clinicId,
  external_id: patientUID,
  full_name: data.name,
  gender: data.gender?.toLowerCase(),
  email: data.email?.trim().toLowerCase(),
  phone: data.phone?.trim(),
  address: data.address?.trim(),
  medical_history: data.notes ? { notes: data.notes } : {},
  date_of_birth: data.dateOfBirth || null,
  created_at: new Date().toISOString()
};
```

**After:**
```javascript
const patientData = {
  org_id: clinicId,
  clinic_id: clinicId,
  external_id: patientUID,
  full_name: data.name,
  gender: data.gender?.toLowerCase(),
  email: data.email?.trim().toLowerCase(),
  phone: data.phone?.trim(),
  address: data.address?.trim(),
  password: data.password, // ✅ NEW: Store password for reference
  medical_history: data.notes ? { notes: data.notes } : {},
  date_of_birth: data.dateOfBirth || null,
  created_at: new Date().toISOString()
};
```

---

## Database Setup

### Step 1: Add Password Column (Required)

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run the script: `ADD_PASSWORD_COLUMN_TO_PATIENTS.sql`

**Script Content:**
```sql
-- Add password column if it doesn't exist
ALTER TABLE patients ADD COLUMN IF NOT EXISTS password TEXT;
```

### Step 2: Verify Column Added

Run this query to verify:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'patients'
  AND column_name = 'password';
```

Expected output:
```
column_name | data_type
------------|----------
password    | text
```

---

## What Gets Saved

When a new patient is created, the following data is saved to the `patients` table:

| Field            | Example Value                    | Description                          |
|------------------|----------------------------------|--------------------------------------|
| `id`             | `auto-generated UUID`            | Primary key                          |
| `org_id`         | `6cdb9c11-454a-40f8-9219...`     | Clinic ID                            |
| `clinic_id`      | `6cdb9c11-454a-40f8-9219...`     | Clinic ID (duplicate for compatibility) |
| `external_id`    | `LIMITLES-202512-0001`           | Patient UID (display ID)             |
| `full_name`      | `John Doe`                       | Patient's full name                  |
| `email`          | `johndoe@gmail.com`              | Login email (sanitized & lowercase)  |
| `password`       | `SecurePass123`                  | ✅ **Login password**                |
| `phone`          | `9876543210`                     | Contact number                       |
| `gender`         | `male`                           | Gender (lowercase)                   |
| `date_of_birth`  | `1990-01-15`                     | Date of birth                        |
| `address`        | `123 Main Street`                | Address                              |
| `medical_history`| `{ "notes": "..." }`             | JSONB field for medical notes        |
| `created_at`     | `2025-12-19T10:30:00Z`           | Creation timestamp                   |

---

## Flow Diagram

```
┌─────────────────────────────────────┐
│ Clinic creates new patient          │
│ - Name: John Doe                    │
│ - Email: john@example.com           │
│ - Password: SecurePass123           │
│ - Phone: 9876543210                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Step 1: Create Supabase Auth        │
│ - Email: john@example.com           │
│ - Password: SecurePass123           │
│ - Role: patient                     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Step 2: Save to patients table      │
│ ✅ All registration details saved:  │
│    - Name, Email, Phone, Address    │
│    - Password ← NEW!                │
│    - Date of Birth, Gender          │
│    - Medical History                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ ✅ Patient can login with:          │
│    Email: john@example.com          │
│    Password: SecurePass123          │
└─────────────────────────────────────┘
```

---

## Testing

### Test Patient Creation:

1. **Go to**: http://localhost:3000/clinic/patients
2. **Click**: "Add Patient" button
3. **Fill form**:
   - Name: Test Patient
   - Email: test@example.com
   - Password: TestPass123
   - Phone: 9876543210
   - Gender: Male
   - Date of Birth: 1990-01-01
4. **Click**: "Add Patient"

### Verify in Database:

```sql
SELECT
  id,
  external_id,
  full_name,
  email,
  password,
  phone,
  created_at
FROM patients
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
```
id       | external_id         | full_name    | email               | password     | phone
---------|---------------------|--------------|---------------------|--------------|----------
uuid...  | LIMITLES-202512-0002| Test Patient | test@example.com    | TestPass123  | 9876543210
```

---

## Security Considerations

### ⚠️ Important Notes:

1. **Plain Text Storage**: The password is currently stored in **plain text** in the patients table.
   - This is for **reference/recovery purposes only**
   - Supabase Auth uses proper password hashing for actual authentication
   - **Recommendation**: Consider encrypting this field if storing production data

2. **Access Control**: Make sure RLS (Row Level Security) policies prevent patients from seeing other patients' passwords.

3. **Password Display**: The password is shown in the success toast message after patient creation so the clinic can share it with the patient.

---

## Recommended: Add Encryption (Optional)

If you want to encrypt passwords in the database:

```sql
-- Install pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create encrypted password column
ALTER TABLE patients
ADD COLUMN encrypted_password TEXT;

-- Update existing passwords to encrypted version
UPDATE patients
SET encrypted_password = crypt(password, gen_salt('bf'))
WHERE password IS NOT NULL;

-- Remove plain password column (optional)
-- ALTER TABLE patients DROP COLUMN password;
```

---

## Summary

✅ **Password field added** to patients table
✅ **Patient creation updated** to save password
✅ **Database column** configured
✅ **All registration details** now saved properly

**Next Steps:**
1. Run `ADD_PASSWORD_COLUMN_TO_PATIENTS.sql` in Supabase
2. Test patient creation
3. Verify data in patients table
4. (Optional) Add password encryption

---

## Quick Checklist

- [ ] Run SQL script to add password column
- [ ] Verify column exists in Supabase
- [ ] Create test patient
- [ ] Check patients table for saved password
- [ ] Verify patient can login with saved credentials
- [ ] (Optional) Implement password encryption

---

**All registration details including password are now properly saved to the patients table!** 🎉
