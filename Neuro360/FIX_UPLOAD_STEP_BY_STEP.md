# Fix EDF File Upload - Step by Step

## Problem
EDF files are not uploading to the `edf-files` storage bucket.

## Solution - Follow These Steps in Order

---

## STEP 1: Create the Bucket in Supabase ⭐ MOST IMPORTANT

### 1.1 Open Supabase Dashboard
- Go to: https://supabase.com/dashboard
- Select your project: **Neuro360**

### 1.2 Run SQL Script
1. Click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open file: `CREATE_EDF_BUCKET_NOW.sql`
4. **Copy ALL the code** (lines 1-96)
5. **Paste** into Supabase SQL Editor
6. Click **Run** or press Ctrl+Enter

### 1.3 Verify Success
You should see output:
```
✅ SUCCESS: edf-files bucket created!
✅ Bucket ID: edf-files
✅ File size limit: 50MB
✅ Access: Private (authenticated users only)
✅ Policies: Upload, View, Update, Delete enabled
```

### 1.4 Check Storage UI
1. Click **Storage** in left sidebar
2. You should see **edf-files** in the bucket list
3. Click on it (it will be empty initially)

---

## STEP 2: Test Bucket Access (Browser Console Test)

### 2.1 Open Your App
- Go to: http://localhost:3000
- Login to your account

### 2.2 Open Browser Console
- Press **F12** (or Right-click → Inspect)
- Go to **Console** tab

### 2.3 Run Test Script
Copy and paste this into console:

```javascript
// Quick bucket test
(async () => {
  const { supabase } = await import('./src/lib/supabaseClient.js');

  // Test 1: List buckets
  const { data: buckets } = await supabase.storage.listBuckets();
  console.log('📦 Available buckets:', buckets.map(b => b.id));

  // Test 2: Check edf-files exists
  const edfBucket = buckets.find(b => b.id === 'edf-files');
  if (edfBucket) {
    console.log('✅ edf-files bucket found!');
  } else {
    console.error('❌ edf-files bucket NOT found!');
  }

  // Test 3: Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    console.log('✅ User authenticated:', session.user.email);
  } else {
    console.error('❌ User NOT authenticated!');
  }
})();
```

### 2.4 Expected Output
```
📦 Available buckets: ["patient-reports", "edf-files"]
✅ edf-files bucket found!
✅ User authenticated: your-email@example.com
```

---

## STEP 3: Test File Upload Through UI

### 3.1 Navigate to Patient Management
- Go to: http://localhost:3000/clinic/patients
- You should see your patients list

### 3.2 Upload a Test File
1. Click on any patient
2. Click **"Upload Report"** button
3. Fill in the form:
   - **Report Title**: Test EDF Upload
   - **Report Type**: EDF Raw Data
   - **File**: Select any small file (rename to `.edf` if needed)
4. Click **"Upload Report"**

### 3.3 Watch Console Logs
Open browser console (F12) and watch for these messages:

**✅ SUCCESS PATH:**
```
🚀 WORKFLOW: Starting file upload...
File name: test.edf
File size: 12345 bytes
✅ WORKFLOW: User authenticated: your-email@example.com
✅ WORKFLOW: edf-files bucket exists
📁 WORKFLOW: Uploading to edf-files bucket...
📁 Path: clinic-id/patient-id/timestamp_test.edf
✅ WORKFLOW: File uploaded successfully to edf-files bucket!
📄 File path: clinic-id/patient-id/timestamp_test.edf
🔗 File URL: https://...supabase.co/storage/v1/object/public/edf-files/...
```

**❌ ERROR PATHS:**

**Error 1: Bucket not found**
```
❌ WORKFLOW: edf-files bucket does not exist!
Available buckets: patient-reports
```
→ **Fix**: Go back to STEP 1 and create the bucket

**Error 2: Not authenticated**
```
❌ WORKFLOW: User not authenticated!
```
→ **Fix**: Logout and login again

**Error 3: Permission denied**
```
❌ Error statusCode: 403
❌ Error message: new row violates row-level security policy
```
→ **Fix**: Run CREATE_EDF_BUCKET_NOW.sql again (Step 1)

---

## STEP 4: Verify Upload in Supabase

### 4.1 Check Storage
1. Go to Supabase Dashboard
2. Click **Storage** → **edf-files**
3. You should see folders: `{clinic-id}/{patient-id}/`
4. Inside: Your uploaded file with timestamp

### 4.2 Check Database
1. Go to Supabase → **SQL Editor**
2. Run this query:

```sql
-- Check latest uploaded files
SELECT
  name,
  bucket_id,
  created_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'edf-files'
ORDER BY created_at DESC
LIMIT 5;
```

You should see your uploaded file!

---

## STEP 5: Check Reports Table

```sql
-- Check if report entry was created
SELECT
  id,
  clinic_id,
  patient_id,
  file_name,
  file_path,
  status,
  created_at
FROM reports
ORDER BY created_at DESC
LIMIT 5;
```

You should see a report entry with:
- `file_name`: Your uploaded file name
- `file_path`: Path in edf-files bucket
- `status`: 'processing'

---

## Common Issues & Solutions

### Issue 1: "Bucket not found"
**Symptoms:**
```
❌ WORKFLOW: edf-files bucket does not exist!
```

**Solution:**
1. Go to Supabase Dashboard → Storage
2. Check if `edf-files` bucket exists
3. If not, run `CREATE_EDF_BUCKET_NOW.sql` (Step 1)

---

### Issue 2: "Permission denied" (403 error)
**Symptoms:**
```
❌ Error statusCode: 403
❌ Error message: policy violation
```

**Solution:**
1. Run `CREATE_EDF_BUCKET_NOW.sql` again
2. This will recreate the storage policies
3. Try upload again

---

### Issue 3: "User not authenticated"
**Symptoms:**
```
❌ WORKFLOW: User not authenticated!
```

**Solution:**
1. Logout from app
2. Login again
3. Try upload again

---

### Issue 4: File uploads but doesn't appear in Storage UI
**Solution:**
1. Refresh Supabase Storage page
2. Click into folders: `{clinic-id}/{patient-id}/`
3. Check if file is there with timestamp prefix

---

## Quick Debug Commands

### Check if bucket exists:
```sql
SELECT * FROM storage.buckets WHERE id = 'edf-files';
```

### Check bucket policies:
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%edf%';
```

### Check uploaded files:
```sql
SELECT * FROM storage.objects
WHERE bucket_id = 'edf-files'
ORDER BY created_at DESC;
```

---

## Still Not Working?

If upload still fails after following all steps:

1. **Check browser console** (F12) for the EXACT error message
2. **Copy the error** and check which step failed:
   - ❌ User authenticated? → Login issue
   - ❌ Bucket exists? → Run CREATE_EDF_BUCKET_NOW.sql
   - ❌ Upload failed? → Check error code (403 = policy issue)

3. **Verify Supabase project**:
   - Correct project URL in `.env`?
   - Correct anon key in `.env`?

4. **Try the direct test**:
   - Open `TEST_BUCKET_DIRECT.js`
   - Copy code to browser console
   - Run `testEdfBucket()`
   - See detailed test results

---

## Success Checklist ✅

- [ ] Bucket created in Supabase Storage
- [ ] Bucket visible in Storage UI
- [ ] User can login successfully
- [ ] Console shows "✅ User authenticated"
- [ ] Console shows "✅ edf-files bucket exists"
- [ ] Upload shows "✅ File uploaded successfully"
- [ ] File visible in Supabase Storage → edf-files
- [ ] Report entry created in database

Once all checked ✅, your upload is working correctly!
