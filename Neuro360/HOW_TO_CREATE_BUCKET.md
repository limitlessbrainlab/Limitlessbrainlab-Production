# Create EDF-Files Bucket in Supabase

## Steps to Create the Bucket

### 1. Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: **Neuro360**

### 2. Open SQL Editor
1. Click **SQL Editor** in the left sidebar
2. Click **New Query** button

### 3. Run the SQL Script
1. Open the file: `CREATE_EDF_BUCKET_NOW.sql`
2. **Copy ALL the code** from that file
3. **Paste** into Supabase SQL Editor
4. Click **Run** button (or press Ctrl+Enter)

### 4. Verify Success
You should see these messages:
```
✅ SUCCESS: edf-files bucket created!
✅ Bucket ID: edf-files
✅ File size limit: 50MB
✅ Access: Private (authenticated users only)
✅ Policies: Upload, View, Update, Delete enabled
```

### 5. Verify in Storage UI
1. Click **Storage** in left sidebar
2. You should see **edf-files** bucket in the list
3. Click on it to open (it will be empty initially)

---

## Test Upload After Creating Bucket

### Step 1: Upload a Test File
1. Go to your app: http://localhost:3000/clinic/patients
2. Click on any patient
3. Click **Upload Report** button
4. Fill in the form:
   - **Report Title**: Test EDF Upload
   - **Report Type**: EDF Raw Data
   - **File**: Select any `.edf`, `.eeg`, or `.bdf` file
5. Click **Upload Report**

### Step 2: Check Console Logs
Open browser console (F12) and look for:
```
🚀 WORKFLOW: Starting file upload...
📁 WORKFLOW: Uploading to edf-files bucket...
Path: {clinicId}/{patientId}/{timestamp}_{filename}

✅ WORKFLOW: File uploaded successfully to edf-files bucket!
📄 File path: ...
🔗 File URL: https://...supabase.co/storage/v1/object/public/edf-files/...
📦 Bucket: edf-files
```

### Step 3: Verify in Supabase Storage
1. Go to Supabase Dashboard → Storage → edf-files
2. You should see folders: `{clinicId}/{patientId}/`
3. Inside you should see your uploaded file!

---

## Troubleshooting

### Error: "Bucket not found"
❌ **Problem**: Bucket doesn't exist
✅ **Solution**: Run the `CREATE_EDF_BUCKET_NOW.sql` script again

### Error: "new row violates row-level security policy"
❌ **Problem**: Policies not set correctly
✅ **Solution**: Run the SQL script again to recreate policies

### Error: "User not authenticated"
❌ **Problem**: You're not logged in
✅ **Solution**:
1. Make sure you're logged in to the app
2. Check if `authToken` cookie exists (F12 → Application → Cookies)

### Files Not Appearing in Storage
❌ **Problem**: Upload failed silently
✅ **Solution**:
1. Open browser console (F12)
2. Look for error messages
3. Check if workflow started: Look for "🚀 WORKFLOW: Starting file upload..."
4. If you see "❌ WORKFLOW: Upload to edf-files bucket failed!", check error message

---

## Quick Verification SQL

Run this in Supabase SQL Editor to check bucket status:

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'edf-files';

-- Check bucket policies
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%edf%';

-- Check uploaded files
SELECT
  name,
  bucket_id,
  created_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'edf-files'
ORDER BY created_at DESC
LIMIT 10;
```

---

## What the Bucket Does

- **Bucket Name**: `edf-files`
- **Purpose**: Store raw EEG/qEEG data files (.edf, .eeg, .bdf)
- **Access**: Private (only authenticated users can access)
- **File Size Limit**: 50MB per file
- **File Structure**: `{clinicId}/{patientId}/{timestamp}_{filename}`

Example file path:
```
edf-files/
  └── c2a38daf-ad34-4853-ac14-d25503ae0844/  (Clinic ID)
      └── LIMITLES-202512-0001/               (Patient ID)
          └── 1734601234567_brain_scan.edf   (Uploaded file)
```

---

## Need Help?

If you still see "still not uploaded" error:
1. Check browser console for error messages (F12)
2. Verify you ran the SQL script successfully
3. Make sure you're logged in to the app
4. Check Supabase project settings to ensure it's the correct project
