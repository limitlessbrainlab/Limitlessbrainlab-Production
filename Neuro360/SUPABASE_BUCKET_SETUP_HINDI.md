# Supabase Bucket Setup Guide (Hindi)
## NeuroSense Reports के लिए Cloud Storage

यह guide आपको NeuroSense PDF reports को Supabase cloud storage में store करने के लिए bucket बनाने में मदद करेगी।

---

## 📋 जरूरी चीजें

शुरू करने से पहले, सुनिश्चित करें कि आपके पास:
- ✅ Supabase account है (https://supabase.com)
- ✅ NeuroSense project Supabase में बना हुआ है
- ✅ आपकी `.env` file में Supabase credentials हैं:
  ```env
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```

---

## 🚀 तरीका 1: Automatic Setup (Node.js Script से) - सबसे आसान!

### Step 1: Terminal खोलें

अपने project के root folder में terminal खोलें।

### Step 2: .env File Check करें

सुनिश्चित करें कि आपकी `.env` file में ये credentials हैं:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Credentials कहाँ से लें:**
1. Supabase Dashboard खोलें: https://supabase.com/dashboard
2. अपना project select करें
3. जाएं: **Project Settings → API**
4. Copy करें:
   - **SUPABASE_URL**: "Project URL" से
   - **SUPABASE_SERVICE_ROLE_KEY**: "service_role" key से (secret key)

### Step 3: Script Run करें

Terminal में यह command चलाएं:

```bash
node server/scripts/createNeuroSenseBucket.js
```

### Step 4: Output देखें

आपको यह दिखना चाहिए:

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

🎉 Your NeuroSense reports will now be stored in the cloud!
```

### Step 5: Verify करें Supabase Dashboard में

1. Supabase Dashboard खोलें
2. Left sidebar में **Storage** पर click करें
3. आपको **neurosense-reports** bucket दिखना चाहिए ✅

हो गया! 🎉

---

## 🛠️ तरीका 2: Manual Setup (UI से)

अगर आप script से bucket नहीं बना पा रहे हैं, तो manually बनाएं:

### Step 1: Supabase Dashboard में जाएं

1. https://supabase.com/dashboard खोलें
2. अपना NeuroSense project select करें
3. Left sidebar में **Storage** पर click करें

### Step 2: New Bucket बनाएं

1. **"New bucket"** button पर click करें
2. ये details भरें:
   - **Bucket name**: `neurosense-reports` (exactly यही name)
   - **Public bucket**: ✅ Check करें (Yes)
   - **File size limit**: `50 MB`
   - **Allowed MIME types**: `application/pdf`
3. **"Create bucket"** पर click करें

### Step 3: Policies Setup करें

1. **neurosense-reports** bucket पर click करें
2. **"Policies"** tab खोलें
3. नीचे दिए गए policies add करें:

#### Policy 1: Upload की अनुमति (INSERT)
- **Policy name**: Allow authenticated users to upload PDFs
- **Target roles**: `authenticated`
- **Operation**: `INSERT`
- **Policy definition**:
  ```sql
  bucket_id = 'neurosense-reports' AND
  (storage.extension(name) = 'pdf')
  ```

#### Policy 2: Download की अनुमति (SELECT)
- **Policy name**: Allow public read access to PDFs
- **Target roles**: `public`
- **Operation**: `SELECT`
- **Policy definition**:
  ```sql
  bucket_id = 'neurosense-reports'
  ```

#### Policy 3: Update की अनुमति (UPDATE)
- **Policy name**: Allow authenticated users to update PDFs
- **Target roles**: `authenticated`
- **Operation**: `UPDATE`
- **Policy definition**:
  ```sql
  bucket_id = 'neurosense-reports'
  ```

#### Policy 4: Delete की अनुमति (DELETE)
- **Policy name**: Allow authenticated users to delete PDFs
- **Target roles**: `authenticated`
- **Operation**: `DELETE`
- **Policy definition**:
  ```sql
  bucket_id = 'neurosense-reports'
  ```

हो गया! 🎉

---

## ✅ Test करें

### Step 1: Backend Server Start करें

```bash
npm run dev:backend
```

### Step 2: Logs Check करें

Backend logs में यह दिखना चाहिए:
```
✅ Supabase credentials found
   SUPABASE_URL: Set
   SUPABASE_SERVICE_ROLE_KEY: Set
```

### Step 3: Report Generate करें

1. Algorithm Processor page खोलें
2. QEEG files upload करें
3. "Execute Calculation" click करें
4. **"Save & Download NeuroSense Report"** button click करें

### Step 4: Backend Logs देखें

आपको यह दिखना चाहिए:
```
☁️  Uploading PDF to Supabase storage...
✅ PDF uploaded to Supabase successfully
🔗 Supabase URL: https://...pdf
```

### Step 5: Supabase में Verify करें

1. Supabase Dashboard → **Storage** → **neurosense-reports** → **reports/**
2. आपको PDF file दिखनी चाहिए! 🎉

---

## 📂 कैसे काम करता है

जब user **"Save & Download NeuroSense Report"** click करता है:

1. ✅ **AI से PDF generate होता है** (Gemini AI से)
2. ✅ **Local folder में temporarily save होता है**
3. ✅ **Supabase cloud में upload होता है** (`neurosense-reports/reports/`)
4. ✅ **Local file delete हो जाती है** (server space बचाने के लिए)
5. ✅ **Supabase URL database में save होता है**
6. ✅ **User के लिए PDF automatically download होता है**
7. ✅ **Processing History में दिखता है** cloud download link के साथ

**Safe Fallback:** अगर Supabase upload fail हो जाए, तो local file रहेगी और local URL use होगा। दोनों तरीके से PDF accessible रहेगा!

---

## 🔗 PDF Links

आपके PDFs इस तरह के URLs पर accessible होंगे:

```
https://your-project.supabase.co/storage/v1/object/public/neurosense-reports/reports/neurosense-report-priyanka_sahare-1765341955844.pdf
```

---

## 🎁 फायदे

✅ **Cloud Storage** - PDFs Supabase cloud में store होते हैं, server पर नहीं
✅ **कोई Limit नहीं** - Disk space की चिंता नहीं
✅ **Fast Downloads** - Globally तेज़ downloads
✅ **Automatic Backups** - Supabase में built-in
✅ **Public URLs** - आसानी से share और download
✅ **Free Tier** - 1GB storage free में मिलता है

---

## 🐛 Problems और Solutions

### Problem 1: Credentials नहीं मिल रहे

**Error:**
```
❌ Error: Supabase credentials not found!
```

**Solution:**
1. `.env` file check करें - `SUPABASE_URL` और `SUPABASE_SERVICE_ROLE_KEY` होने चाहिए
2. Backend server restart करें
3. `.env` file root folder में होनी चाहिए (server/ folder में नहीं)

### Problem 2: Bucket नहीं बना

**Error:**
```
Failed to create bucket
```

**Solution:**
1. Service role key सही है verify करें
2. Supabase Dashboard में manually bucket बनाने की कोशिश करें
3. Internet connection check करें

### Problem 3: Upload Fail हो रहा है

**Error:**
```
⚠️ Supabase upload failed, using local storage
```

**यह OK है!** System automatically local storage use कर लेगा। Supabase सिर्फ prefer होता है, जरूरी नहीं।

---

## 📞 मदद चाहिए?

अगर कोई problem हो तो:

1. **Backend logs check करें** error messages के लिए
2. **Bucket exists verify करें** Supabase Dashboard में
3. **Credentials verify करें** Supabase → Project Settings → API
4. **Policies check करें** Storage → neurosense-reports → Policies

---

## ✨ हो गया!

आपके NeuroSense reports अब cloud में store होंगे! 🎉

हर बार जब user report generate करेगा:
- ✅ Professional PDF बनेगा AI insights के साथ
- ✅ Supabase cloud में upload होगा
- ✅ Database में URL save होगा
- ✅ User के लिए auto-download होगा
- ✅ Processing History में available होगा

Enjoy your cloud-powered NeuroSense system! 🧠☁️
