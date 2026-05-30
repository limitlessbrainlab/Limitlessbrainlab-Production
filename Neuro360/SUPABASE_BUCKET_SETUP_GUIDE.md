# Supabase Storage Bucket Setup Guide
## For NeuroSense Reports

This guide will help you create and configure the `neurosense-reports` bucket in Supabase to store PDF reports.

---

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ Active Supabase account (https://supabase.com)
- ✅ NeuroSense project created in Supabase
- ✅ Supabase credentials in your `.env` file:
  ```env
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```

---

## 🚀 Method 1: Automated Setup (Using Node.js Script) - RECOMMENDED

### Step 1: Run the Node.js Script

1. **Open Terminal** in your project root directory

2. **Make sure you have Supabase credentials in .env file**:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Run the bucket creation script**:
   ```bash
   node server/scripts/createNeuroSenseBucket.js
   ```

4. **You should see output like this**:
   ```
   🚀 ===== Creating NeuroSense Reports Bucket =====

   🔍 Checking if bucket already exists...
   📦 Creating bucket...
   ✅ Bucket created successfully!
      Bucket name: neurosense-reports
      Public: Yes
      File size limit: 50 MB
      Allowed types: PDF only

   🔒 Setting up security policies...
      ✅ INSERT policy created
      ✅ SELECT policy created
      ✅ UPDATE policy created
      ✅ DELETE policy created

   ✅ ===== Bucket Setup Complete! =====
   ```

### Step 2: Verify in Supabase Dashboard

1. Go to **Storage** in the left sidebar
2. You should see a new bucket named: **neurosense-reports**
3. Click on it to view details:
   - **Public**: Yes (checked)
   - **File size limit**: 50 MB
   - **Allowed MIME types**: application/pdf

---

## 🛠️ Method 2: Manual Setup (UI)

If you prefer to create the bucket manually through the UI:

### Step 1: Create the Bucket

1. **Go to Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Fill in the details:
   - **Bucket name**: `neurosense-reports`
   - **Public bucket**: ✅ **YES** (Check this box)
   - **File size limit**: `50 MB`
   - **Allowed MIME types**: `application/pdf`
4. Click **"Create bucket"**

### Step 2: Set Up Policies (RLS)

1. Click on the **neurosense-reports** bucket
2. Click on **"Policies"** tab
3. Add the following policies:

#### Policy 1: Allow Upload (INSERT)
- **Policy name**: Allow authenticated users to upload PDFs
- **Target roles**: `authenticated`
- **Operation**: `INSERT`
- **Policy definition**:
  ```sql
  bucket_id = 'neurosense-reports' AND
  (storage.extension(name) = 'pdf')
  ```

#### Policy 2: Allow Public Read (SELECT)
- **Policy name**: Allow public read access to PDFs
- **Target roles**: `public`
- **Operation**: `SELECT`
- **Policy definition**:
  ```sql
  bucket_id = 'neurosense-reports'
  ```

#### Policy 3: Allow Update (UPDATE)
- **Policy name**: Allow authenticated users to update PDFs
- **Target roles**: `authenticated`
- **Operation**: `UPDATE`
- **Policy definition**:
  ```sql
  bucket_id = 'neurosense-reports'
  ```

#### Policy 4: Allow Delete (DELETE) - Optional
- **Policy name**: Allow authenticated users to delete PDFs
- **Target roles**: `authenticated`
- **Operation**: `DELETE`
- **Policy definition**:
  ```sql
  bucket_id = 'neurosense-reports'
  ```

---

## ✅ Step 3: Verify Your Setup

### Check Environment Variables

Make sure your `.env` file has the correct Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**How to get these:**
1. Go to Supabase Dashboard → Project Settings → API
2. **SUPABASE_URL**: Copy from "Project URL"
3. **SUPABASE_SERVICE_ROLE_KEY**: Copy from "service_role" (secret key)

### Test the Upload

1. **Start your backend server**:
   ```bash
   npm run dev:backend
   ```

2. **Check the logs** for Supabase initialization:
   ```
   ✅ Supabase credentials found
   ✅ SUPABASE_URL: Set
   ✅ SUPABASE_SERVICE_ROLE_KEY: Set
   ```

3. **Generate a test report**:
   - Go to Algorithm Processor in your app
   - Upload QEEG files
   - Execute calculation
   - Click "Save & Download NeuroSense Report"

4. **Watch the backend logs** for:
   ```
   ☁️  Uploading PDF to Supabase storage...
   ✅ PDF uploaded to Supabase successfully
   🔗 Supabase URL: https://your-project.supabase.co/storage/v1/object/public/neurosense-reports/reports/neurosense-report-...pdf
   ```

5. **Verify in Supabase Dashboard**:
   - Go to Storage → neurosense-reports → reports/
   - You should see your PDF file
   - Click on it to view/download

---

## 📂 Bucket Structure

Your PDFs will be stored in this structure:

```
neurosense-reports/
  └── reports/
      ├── neurosense-report-patient1-1234567890.pdf
      ├── neurosense-report-patient2-1234567891.pdf
      ├── neurosense-report-john_doe-1765341955844.pdf
      └── ...
```

---

## 🔗 PDF URL Format

After upload, your PDFs will be accessible via:

```
https://[your-project-id].supabase.co/storage/v1/object/public/neurosense-reports/reports/[filename].pdf
```

Example:
```
https://abcdefgh.supabase.co/storage/v1/object/public/neurosense-reports/reports/neurosense-report-priyanka_sahare-1765341955844.pdf
```

---

## 🔧 Troubleshooting

### Issue 1: Upload Fails - Credentials Not Found

**Error:**
```
⚠️ Supabase credentials not found in environment variables
```

**Solution:**
1. Check your `.env` file has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
2. Restart your backend server after updating `.env`
3. Make sure the `.env` file is in the root directory (not in `server/` folder)

### Issue 2: Upload Fails - Bucket Not Found

**Error:**
```
Failed to upload to Supabase: Bucket not found
```

**Solution:**
1. Verify bucket exists: Go to Supabase Dashboard → Storage
2. Check the bucket name is exactly: `neurosense-reports` (no typos)
3. Re-run the SQL script if needed

### Issue 3: Upload Fails - Permission Denied

**Error:**
```
Failed to upload to Supabase: new row violates row-level security policy
```

**Solution:**
1. Check RLS policies are set up correctly (see Method 2, Step 2)
2. Make sure "Public bucket" is enabled
3. Verify policies allow `INSERT` for authenticated users

### Issue 4: PDF URL Not Working (404 Error)

**Error:**
```
404 Not Found when accessing PDF URL
```

**Solution:**
1. Verify bucket is **public** (check the box in bucket settings)
2. Check the `SELECT` policy allows `public` access
3. Verify the file exists in Storage → neurosense-reports

### Issue 5: Falls Back to Local Storage

**Warning:**
```
⚠️ Supabase upload failed, using local storage
```

**This is OK!** The system has a fallback mechanism:
1. **Tries to upload to Supabase first**
2. **If fails**, keeps the PDF in local `server/uploads/` folder
3. **Both work fine**, Supabase is just preferred for cloud storage

---

## 🎯 How It Works

### Upload Flow:

1. **User clicks "Save & Download NeuroSense Report"**
   ↓
2. **Frontend sends request to backend** (`/api/qeeg/generate-pdf`)
   ↓
3. **Backend generates PDF** with Gemini AI content
   ↓
4. **PDF saved to local** `server/uploads/` folder
   ↓
5. **Attempts Supabase upload**:
   - ✅ **Success**: Upload to `neurosense-reports/reports/`
   - ✅ **Success**: Delete local file (to save space)
   - ✅ **Success**: Return Supabase URL
   - ❌ **Failure**: Keep local file, return local URL
   ↓
6. **URL stored in database** (algorithmResults table)
   ↓
7. **Frontend auto-downloads PDF** for user

### Benefits of Supabase Storage:

✅ **Cloud-based**: PDFs accessible from anywhere
✅ **Scalable**: No server disk space limits
✅ **Fast CDN**: Quick downloads globally
✅ **Secure**: Row-level security policies
✅ **Automatic backups**: Built into Supabase
✅ **Cost-effective**: Free tier includes 1GB storage

---

## 📊 Monitoring

### Check Upload Statistics

You can monitor your bucket usage:

1. Go to **Supabase Dashboard** → **Storage**
2. Click on **neurosense-reports**
3. You'll see:
   - Number of files
   - Total size used
   - Bandwidth usage

### View Recent Uploads

```sql
-- Run this in SQL Editor to see recent uploads
SELECT
  name,
  created_at,
  metadata->>'size' as size_bytes,
  metadata->>'mimetype' as mime_type
FROM storage.objects
WHERE bucket_id = 'neurosense-reports'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** to Git
2. **Use service_role key only on backend** (never expose to frontend)
3. **Keep bucket public** for PDF downloads (PDFs aren't sensitive data)
4. **Use signed URLs** if you need expiring links (future enhancement)
5. **Regularly review policies** in Supabase Dashboard

---

## 📞 Need Help?

If you encounter issues:

1. **Check backend logs** for error messages
2. **Verify bucket exists** in Supabase Dashboard
3. **Test credentials** in Supabase → Project Settings → API
4. **Review policies** in Storage → neurosense-reports → Policies
5. **Check Supabase status**: https://status.supabase.com

---

## ✨ You're All Set!

Your NeuroSense reports are now being stored in the cloud! 🎉

Every time a user generates a report, it will:
- ✅ Generate professional PDF with AI insights
- ✅ Upload to Supabase cloud storage
- ✅ Store public URL in database
- ✅ Auto-download for user
- ✅ Available in Processing History with download link

Enjoy your cloud-powered NeuroSense system! 🧠☁️
