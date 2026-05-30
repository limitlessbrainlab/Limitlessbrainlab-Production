# Test EDF File Upload to Bucket

## Quick Test in Browser Console

Agar aap verify karna chahte ho ki `edf-files` bucket mein upload ho raha hai ya nahi, to ye code browser console mein run karo:

### Step 1: Open Browser Console
1. Go to your clinic dashboard (http://localhost:3000/clinic/patients)
2. Press `F12` to open Developer Tools
3. Go to **Console** tab

### Step 2: Run This Test Code

```javascript
// Test upload to edf-files bucket
async function testEDFUpload() {
  const { supabase } = await import('./src/lib/supabaseClient');

  // Create a test file
  const testContent = 'This is a test EDF file';
  const testBlob = new Blob([testContent], { type: 'application/octet-stream' });
  const testFile = new File([testBlob], 'test.edf', { type: 'application/octet-stream' });

  // Try to upload
  const filePath = `test-clinic/test-patient/test_${Date.now()}.edf`;

  console.log('Attempting upload to edf-files bucket:', filePath);

  const { data, error } = await supabase.storage
    .from('edf-files')
    .upload(filePath, testFile, {
      contentType: 'application/octet-stream',
      upsert: false
    });

  if (error) {
    console.error('❌ Upload failed:', error);
    console.error('Error code:', error.message);
    return;
  }

  console.log('✅ Upload successful!');
  console.log('File path:', data.path);
  console.log('Full data:', data);

  // Get URL
  const { data: urlData } = supabase.storage
    .from('edf-files')
    .getPublicUrl(data.path);

  console.log('File URL:', urlData.publicUrl);
}

// Run the test
testEDFUpload();
```

### Step 3: Check Result

**If successful:**
```
✅ Upload successful!
File path: test-clinic/test-patient/test_1765801234567.edf
```

**If failed:**
You'll see the error message. Common errors:
- `Bucket not found` → Run the SQL to create bucket
- `new row violates row-level security policy` → Run policy SQL
- `No policy found` → Policies not created

---

## Alternative: Check in Supabase Dashboard

1. Go to **Supabase Dashboard**
2. Click **Storage** → **edf-files** bucket
3. Click inside the bucket
4. Check if there are any folders/files

If the bucket is empty, the upload isn't working.

---

## Common Issues & Fixes

### Issue 1: Bucket Not Found
**Fix:** Run `fix_workflows_and_eeg_storage.sql` in Supabase SQL Editor

### Issue 2: RLS Policy Error
**Fix:** Run `verify_edf_bucket_policies.sql` to recreate policies

### Issue 3: Import Error in Code
**Fix:** Make sure this line works:
```javascript
const { supabase } = await import('../lib/supabaseClient');
```

If it doesn't work, change it to:
```javascript
import { supabase } from '../lib/supabaseClient';
```

### Issue 4: File Type Rejected
**Fix:** Make sure MIME type is in allowed list:
- `application/octet-stream`
- `application/x-edf`
- `application/edf`

---

## Verify Workflow Code is Running

Check console for these messages:
```
WORKFLOW: Uploading file to edf-files bucket: clinicId/patientId/timestamp_file.edf
WORKFLOW: File uploaded successfully to edf-files bucket: ...
```

If you don't see these messages, the workflow code might not be running.
