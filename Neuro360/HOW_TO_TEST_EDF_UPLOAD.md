# ✅ EDF File Upload Fix - Testing Guide

Maine sab fix kar diya hai! Ab test karo.

## 🔧 Kya Fix Kiya Maine:

### 1. **Import Issue Fixed**
- ✅ Added `supabase` import at the top
- ✅ Removed dynamic import (jo error de raha tha)
- **File:** `reportWorkflowService.js`

### 2. **Better Logging Added**
Ab console mein clear messages dikhengi:
```
🚀 WORKFLOW: Starting file upload...
File name: brain_scan.edf
File size: 12345 bytes
File type: application/octet-stream
Clinic ID: c2a38daf-ad34-4853-ac14-d25503ae0844
Patient ID: LIMITLES-202512-0001

📁 WORKFLOW: Uploading to edf-files bucket...
Path: c2a38daf.../patient-id/timestamp_brain_scan.edf

✅ WORKFLOW: File uploaded successfully!
📄 File path: c2a38daf.../patient-id/1765801234567_brain_scan.edf
🔗 File URL: https://...supabase.co/storage/v1/object/public/edf-files/...
📦 Bucket: edf-files
```

### 3. **Error Logging Improved**
Agar error aaye to ye dikhega:
```
❌ WORKFLOW: Upload to edf-files bucket failed!
Error code: 42501
Error message: new row violates row-level security policy
Error details: {...}
```

---

## 🚀 Ab Kaise Test Karein:

### Step 1: Ensure SQL is Run
Pehle ye ensure karo ki SQL run hua hai:
```bash
# In Supabase SQL Editor
# Run: fix_workflows_and_eeg_storage.sql
```

### Step 2: Refresh Your App
```bash
# Stop the dev server (Ctrl+C)
# Restart it
npm run dev
```

### Step 3: Upload a File
1. Go to **Patient Management**: http://localhost:3000/clinic/patients
2. Click on any patient
3. Click **"Upload New Report"** button
4. Fill the form:
   - Report Title: "Test Brain Scan"
   - Report Type: "qEEG Analysis"
   - Notes: (optional)
5. **Choose an EDF file** (.edf, .eeg, or .bdf)
6. Click **"Upload Report"**

### Step 4: Watch the Console
Open Browser Console (F12) and watch for messages:

**Success Path:**
```
🚀 WORKFLOW: Starting file upload...
📁 WORKFLOW: Uploading to edf-files bucket...
✅ WORKFLOW: File uploaded successfully!
```

**Error Path:**
```
❌ WORKFLOW: Upload to edf-files bucket failed!
Error message: ...
```

### Step 5: Verify in Supabase
1. Go to Supabase Dashboard
2. Click **Storage** → **edf-files**
3. Navigate to: `your-clinic-id/patient-id/`
4. **You should see the uploaded file!** 📁

---

## 🔍 Troubleshooting:

### Problem 1: "Bucket not found"
**Solution:**
```sql
-- Run this in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'edf-files',
  'edf-files',
  false,
  52428800,
  ARRAY['application/octet-stream', 'application/x-edf', 'application/edf']
)
ON CONFLICT (id) DO NOTHING;
```

### Problem 2: "Row-level security policy"
**Solution:** Run `verify_edf_bucket_policies.sql`

### Problem 3: Console shows no upload messages
**Reason:** Workflow might not be starting.
**Check:**
- Is file an EDF file (.edf, .eeg, .bdf)?
- Is clinic ID correct?
- Is patient ID correct?

---

## 📊 Expected Console Output:

```
🚀 WORKFLOW: Starting file upload...
File name: patient_eeg_scan.edf
File size: 2451234 bytes
File type: application/octet-stream
Clinic ID: c2a38daf-ad34-4853-ac14-d25503ae0844
Patient ID: LIMITLES-202512-0001

📁 WORKFLOW: Uploading to edf-files bucket...
Path: c2a38daf-ad34-4853-ac14-d25503ae0844/LIMITLES-202512-0001/1765801234567_patient_eeg_scan.edf

✅ WORKFLOW: File uploaded successfully to edf-files bucket!
📄 File path: c2a38daf-ad34-4853-ac14-d25503ae0844/LIMITLES-202512-0001/1765801234567_patient_eeg_scan.edf
🔗 File URL: https://wqykofpjpaytjuqsessf.supabase.co/storage/v1/object/public/edf-files/c2a38daf-ad34-4853-ac14-d25503ae0844/LIMITLES-202512-0001/1765801234567_patient_eeg_scan.edf
📦 Bucket: edf-files

SUCCESS: File record saved to database
SUCCESS: IMMEDIATE REPORT CREATED! User can see it now
INFO: Report ID: abc123-def456-...
INFO: Status: processing
```

---

## ✅ Success Indicators:

1. ✅ Console shows "✅ WORKFLOW: File uploaded successfully!"
2. ✅ File appears in Supabase Storage → edf-files bucket
3. ✅ Report entry created in `reports` table (status: 'processing')
4. ✅ Workflow entry created in `workflows` table
5. ✅ No errors in console

---

## 🎯 Final Verification:

Go to Supabase and run:
```sql
-- Check if file was uploaded
SELECT * FROM storage.objects
WHERE bucket_id = 'edf-files'
ORDER BY created_at DESC
LIMIT 5;

-- Check if workflow was created
SELECT * FROM workflows
ORDER BY created_at DESC
LIMIT 5;

-- Check if report was created
SELECT * FROM reports
ORDER BY created_at DESC
LIMIT 5;
```

All three should show your uploaded file!

---

## 📞 Still Not Working?

Share:
1. Browser console output
2. Supabase error logs
3. Screenshot of upload form

I'll help you fix it! 🚀
