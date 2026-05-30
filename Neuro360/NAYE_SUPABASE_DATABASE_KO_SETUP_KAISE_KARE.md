# 🚀 Neuro360 Ko Naye Supabase Database Se Connect Karne Ka Complete Guide

---

## 📋 Overview

Ye guide aapko step-by-step batayegi ki kaise aap apne Neuro360 project ko ek **naye Supabase account** ke database se connect kar sakte hain.

**Total Time Required:** ~15-20 minutes

---

## ✅ Prerequisites (Pehle Ye Check Kar Lein)

- [ ] Naya Supabase account ready hai
- [ ] Naya Supabase project create kar liya hai
- [ ] Project dashboard ka URL aapke paas hai
- [ ] Supabase API keys aapke paas hain

---

## 🎯 STEP 1: Naya Supabase Project Create Karein

### 1.1 Supabase Dashboard Open Karein

1. Browser mein jaayen: **https://supabase.com**
2. **Sign In** karein (ya naya account banayein)
3. Dashboard mein **"New Project"** button par click karein

### 1.2 Project Details Fill Karein

```
Project Name: Neuro360
Database Password: [Strong password choose karein - SAVE THIS!]
Region: Mumbai (या आपके पास जो closest हो)
Pricing Plan: Free (शुरुआत के लिए)
```

4. **"Create new project"** par click karein
5. **2-3 minutes wait karein** - Database setup ho raha hai

---

## 🔑 STEP 2: API Keys Copy Karein

### 2.1 Project Settings Open Karein

1. Left sidebar mein **"Settings"** icon par click karein (⚙️)
2. **"API"** section par click karein

### 2.2 Important Values Copy Karein

Ye values copy kar ke notepad mein save kar lein:

```
Project URL: https://xxxxxxxxxxxxxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANT:** Service role key ko **SECRET** rakhen! Kabhi bhi public Github pe upload na karein.

---

## 💾 STEP 3: Database Schema Migrate Karein

### 3.1 SQL Editor Open Karein

1. Supabase Dashboard mein left sidebar se **"SQL Editor"** par click karein
2. **"New query"** button par click karein

### 3.2 Complete Migration Script Run Karein

1. Apne computer mein ye file open karein:
   ```
   D:\Todays\Neuro360\COMPLETE_SUPABASE_MIGRATION.sql
   ```

2. **Pure file ka content copy karein** (Ctrl+A, Ctrl+C)

3. Supabase SQL Editor mein **paste karein** (Ctrl+V)

4. **"Run"** button par click karein (या F5 press karein)

5. **Wait karein** ~30-60 seconds

### 3.3 Verify Karein Ki Sab Kuch Create Ho Gaya

SQL Editor mein ye query run karein:

```sql
-- Check tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected Output:** Aapko **35+ tables** dikhne chahiye including:
- ✅ profiles
- ✅ organizations
- ✅ clinics
- ✅ patients
- ✅ reports
- ✅ subscriptions
- ✅ payment_history
- ✅ uploaded_files
- ✅ algorithm_results
- ... aur bahut saare

---

## 🗄️ STEP 4: Storage Buckets Verify Karein

### 4.1 Storage Tab Open Karein

1. Left sidebar mein **"Storage"** icon par click karein
2. Aapko 4 buckets dikhne chahiye:

```
✅ patient-reports (Private)
✅ eeg-files (Private)
✅ reports (Private)
✅ clinic-logos (Public)
```

### 4.2 Agar Buckets Nahi Dikhe

SQL Editor mein ye query run karein:

```sql
SELECT * FROM storage.buckets;
```

Agar koi bucket missing hai, toh manually create karein:

1. **Storage** > **"New bucket"** button
2. Bucket details:
   ```
   Name: patient-reports
   Public: NO (❌)
   File size limit: 50 MB
   ```
3. **"Create bucket"** click karein
4. Repeat for all 4 buckets

---

## 🔐 STEP 5: Environment Variables Update Karein

### 5.1 Root .env File Update Karein

File location: `D:\Todays\Neuro360\.env`

```bash
# Neuro360 Environment Configuration

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_NEW_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_NEW_ANON_KEY...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_NEW_SERVICE_ROLE_KEY...

# Vite/React App Config (for apps/web)
VITE_SUPABASE_URL=https://YOUR_NEW_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_NEW_ANON_KEY...

# Supabase Storage Configuration
VITE_SUPABASE_STORAGE_BUCKET=patient-reports

# API Configuration
VITE_API_URL=http://localhost:3001/api

# OpenAI Configuration (Backend Only - No VITE_ prefix)
OPENAI_API_KEY=your-openai-api-key-here

# App Environment
NODE_ENV=development
PORT=3000

# Payment Integration (LIVE CREDENTIALS - KEEP SECURE!)
VITE_RAZORPAY_KEY_ID=rzp_live_RbfFXYnAzSNWYh
VITE_RAZORPAY_SECRET=FaV0K9r7IEgA8PcJxLUOa95A

# Development Settings
VITE_APP_ENV=development
VITE_DEBUG=true
```

⚠️ **Replace karna hai:**
- `YOUR_NEW_PROJECT_ID` → Apna naya project ID
- `YOUR_NEW_ANON_KEY` → Apni nayi anon key
- `YOUR_NEW_SERVICE_ROLE_KEY` → Apni nayi service role key

### 5.2 Server .env File Update Karein

File location: `D:\Todays\Neuro360\server\.env`

```bash
# Backend Server Environment Configuration

# Server Port
PORT=3001

# OpenAI API Configuration
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_KEY

# Google Gemini API Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# Supabase Configuration
SUPABASE_URL=https://YOUR_NEW_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_NEW_SERVICE_ROLE_KEY...

# Environment
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

⚠️ **Replace karna hai:**
- `YOUR_NEW_PROJECT_ID` → Apna naya project ID
- `YOUR_NEW_SERVICE_ROLE_KEY` → Apni nayi service role key

---

## 🧪 STEP 6: Test Karein Ki Sab Kuch Working Hai

### 6.1 Dependencies Install Karein (Agar Pehle Se Nahi Kiya)

```bash
cd D:\Todays\Neuro360
npm install

cd server
npm install
```

### 6.2 Application Start Karein

**Terminal 1 (Frontend):**
```bash
cd D:\Todays\Neuro360
npm run dev
```

**Terminal 2 (Backend):**
```bash
cd D:\Todays\Neuro360\server
npm start
```

### 6.3 Browser Mein Test Karein

1. Browser mein jaayen: **http://localhost:3000**

2. **Registration Test:**
   - Naya clinic register karein
   - Email aur password enter karein
   - Check karein ki registration successful hai

3. **Login Test:**
   - Login karein registered credentials se
   - Dashboard dikhna chahiye

4. **Database Verify:**
   - Supabase Dashboard → **Table Editor** → **clinics** table
   - Aapko naya registered clinic dikhna chahiye

### 6.4 File Upload Test (Optional But Recommended)

1. Application mein login karein
2. Patient create karein
3. File upload try karein (.edf, .eeg, या .bdf file)
4. Supabase Dashboard → **Storage** → **patient-reports**
5. Upload ki gayi file dikhni chahiye

---

## 📊 STEP 7: Data Migration (Agar Old Data Import Karna Hai)

### 7.1 Old Database Se Data Export Karein

**Option A: Supabase Dashboard Se**

1. Purane Supabase project mein jaayen
2. **Database** → **Backups** → **Create backup**
3. Download karein backup file

**Option B: SQL Export**

Purane Supabase SQL Editor mein:

```sql
-- Export clinics
COPY (SELECT * FROM clinics) TO STDOUT WITH CSV HEADER;

-- Export patients
COPY (SELECT * FROM patients) TO STDOUT WITH CSV HEADER;

-- Export other tables as needed
```

### 7.2 Naye Database Mein Import Karein

Naye Supabase SQL Editor mein:

```sql
-- Import clinics
COPY clinics FROM STDIN WITH CSV HEADER;
-- [Paste CSV data here]

-- Import patients
COPY patients FROM STDIN WITH CSV HEADER;
-- [Paste CSV data here]
```

⚠️ **Note:** Foreign key constraints dhyan mein rakhein (pehle parent tables import karein)

---

## 🎉 STEP 8: Final Verification Checklist

Migration complete hone ke baad ye sab check karein:

### Database Tables
- [ ] All tables created (35+ tables)
- [ ] Triggers working (updated_at auto-updates)
- [ ] RLS policies enabled
- [ ] Indexes created

### Storage Buckets
- [ ] patient-reports bucket exists
- [ ] eeg-files bucket exists
- [ ] reports bucket exists
- [ ] clinic-logos bucket exists
- [ ] Storage policies working

### Application
- [ ] Frontend running on http://localhost:3000
- [ ] Backend running on http://localhost:3001
- [ ] Registration working
- [ ] Login working
- [ ] File upload working
- [ ] Patient creation working

### Environment Variables
- [ ] Root .env updated
- [ ] Server .env updated
- [ ] No old credentials remaining
- [ ] API keys correct

---

## 🐛 Troubleshooting / Common Issues

### Issue 1: "relation does not exist" Error

**Reason:** Tables create nahi hue

**Solution:**
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Agar nahi hain toh migration script phir se run karein
```

### Issue 2: "Bucket not found" Error

**Reason:** Storage buckets create nahi hue

**Solution:**
1. Storage tab mein manually buckets create karein
2. Ya SQL Editor mein ye run karein:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-reports', 'patient-reports', false);
```

### Issue 3: "Permission denied for table" Error

**Reason:** RLS policies missing

**Solution:**
```sql
-- Disable RLS temporarily for testing
ALTER TABLE clinics DISABLE ROW LEVEL SECURITY;

-- Or create permissive policy
CREATE POLICY "Allow all" ON clinics FOR ALL USING (true);
```

### Issue 4: Connection Timeout

**Reason:** Wrong SUPABASE_URL in .env

**Solution:**
- .env file check karein
- URL format: `https://PROJECT_ID.supabase.co`
- Trailing slash (/) nahi hona chahiye

### Issue 5: File Upload Fails

**Reason:** Storage policies missing

**Solution:**
```sql
-- Check existing policies
SELECT * FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage';

-- Create basic policy
CREATE POLICY "Allow uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patient-reports');
```

---

## 📞 Support & Help

### Useful Supabase Dashboard Links

```
Main Dashboard: https://app.supabase.com/project/YOUR_PROJECT_ID
SQL Editor: https://app.supabase.com/project/YOUR_PROJECT_ID/sql
Table Editor: https://app.supabase.com/project/YOUR_PROJECT_ID/editor
Storage: https://app.supabase.com/project/YOUR_PROJECT_ID/storage/buckets
API Settings: https://app.supabase.com/project/YOUR_PROJECT_ID/settings/api
```

### Helpful SQL Queries

```sql
-- List all tables
\dt

-- Check table structure
\d+ clinics

-- Count records
SELECT COUNT(*) FROM clinics;

-- Check last 5 records
SELECT * FROM clinics ORDER BY created_at DESC LIMIT 5;

-- Check storage files
SELECT * FROM storage.objects ORDER BY created_at DESC LIMIT 10;

-- Check RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

### Browser Console Commands (For Testing)

Browser console (F12) mein ye commands try kar sakte hain:

```javascript
// Test Supabase connection
const { data, error } = await supabase.from('clinics').select('*').limit(5);
console.log('Clinics:', data);

// Test storage
const { data: buckets } = await supabase.storage.listBuckets();
console.log('Buckets:', buckets);

// Test authentication
const { data: user } = await supabase.auth.getUser();
console.log('Current user:', user);
```

---

## 🔒 Security Best Practices

### Environment Variables
- ✅ Service role key ko `.env` file mein hi rakhein
- ✅ `.env` file ko `.gitignore` mein add karein
- ❌ Kabhi bhi keys ko public repository mein push na karein

### RLS Policies
- ✅ Production mein strict RLS policies use karein
- ✅ Each table ke liye proper access control set karein
- ❌ `USING (true)` policy long-term mein use na karein

### Storage Buckets
- ✅ Private data ke liye private buckets use karein
- ✅ Public data (logos) ke liye hi public buckets use karein
- ✅ File size limits set karein

### API Keys
- ✅ Frontend mein sirf `anon` key use karein
- ✅ Backend mein sirf `service_role` key use karein
- ✅ Keys ko regularly rotate karein

---

## 📝 Quick Reference Card

### Essential Environment Variables

```bash
# Frontend (.env)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Backend (server/.env)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### File Structure

```
D:\Todays\Neuro360\
├── .env                              # Frontend environment variables
├── server/.env                        # Backend environment variables
├── COMPLETE_SUPABASE_MIGRATION.sql   # Complete migration script
└── NAYE_SUPABASE_DATABASE_KO_SETUP_KAISE_KARE.md  # This guide
```

### Important Tables

```
✅ clinics          - Clinic information
✅ patients         - Patient records
✅ profiles         - User profiles
✅ organizations    - Organizations/Clinics
✅ reports          - Generated reports
✅ subscriptions    - Subscription data
✅ payment_history  - Payment records
✅ uploaded_files   - File metadata
```

### Storage Buckets

```
✅ patient-reports  - Patient EEG files (.edf, .eeg, .bdf)
✅ eeg-files        - Raw EEG data
✅ reports          - Generated PDF/CSV reports
✅ clinic-logos     - Clinic branding (Public)
```

---

## ✅ Migration Complete!

Agar aapne upar ke saare steps successfully complete kar liye hain, toh:

🎉 **Congratulations!**

Aapka Neuro360 project ab successfully naye Supabase database se connected hai!

### Next Steps:
1. ✅ Production deployment ke liye prepare karein
2. ✅ Backup strategy set karein
3. ✅ Monitoring aur logging setup karein
4. ✅ RLS policies ko tighten karein
5. ✅ Performance optimization karein

---

## 🙏 Need Help?

Agar koi issue aa raha hai toh:

1. **Browser Console Check karein** (F12 → Console tab)
2. **Supabase Dashboard Logs dekhen** (Logs & Analytics)
3. **SQL Editor mein verification queries run karein**
4. **Error message carefully padhen** - usually wahi solution batata hai

---

**Happy Coding! 🚀**
