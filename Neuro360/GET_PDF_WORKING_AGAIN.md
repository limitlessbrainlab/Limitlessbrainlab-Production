# 🔧 Get PDF Working Again - Pehle Jaisa!

## 📊 Analysis:

**Sample PDF (Working):** `neurosense-report-priyanka_sahare-1765018667310.pdf`
- ✅ Perfect format
- ✅ All 7 parameters
- ✅ Radar chart
- ✅ AI recommendations
- ✅ Professional design

**Current Error:** 404 Not Found
- ❌ PDFs not accessible at `/uploads/` path
- ❌ Backend not responding properly
- ❌ Files might exist but server not serving them

---

## 🎯 What Was Working Before:

Based on sample PDF (Priyanka Sahare from Dec 6, 2025):

1. ✅ **Gemini AI** was working (generated content)
2. ✅ **PDF generation** was successful
3. ✅ **Backend** was properly configured
4. ✅ **File serving** was working

---

## ⚠️ What's Broken Now:

1. ❌ **404 errors** on PDF URLs
2. ❌ **Backend not serving files** from `/uploads` folder
3. ❌ **"PDF: Not available"** status in history
4. ❌ **Multiple failed attempts** in console

---

## ✅ Fix Steps (Back to Working State):

### Step 1: Check Backend is Running

```bash
# Start backend
npm run dev:backend
```

**Expected output:**
```
🚀 Neuro360 Backend Server running on port 5000
📊 QEEG Processing API: http://localhost:5000/api/qeeg
✅ Gemini API key present: true
✅ Supabase credentials found (optional)
```

**If backend shows errors, continue to Step 2.**

---

### Step 2: Create/Fix .env File

Create `.env` file in **ROOT** folder (NOT in server folder):

```env
# ===== CRITICAL: Backend API Configuration =====
VITE_API_URL=http://localhost:5000/api

# ===== REQUIRED: Gemini AI Key =====
# Get from: https://aistudio.google.com/apikey
GEMINI_API_KEY=your-actual-gemini-api-key-here

# ===== OPTIONAL: Supabase (for cloud storage) =====
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# ===== Environment =====
NODE_ENV=development
PORT=5000
```

**Critical:** `GEMINI_API_KEY` must be valid! Get from https://aistudio.google.com/apikey

---

### Step 3: Install Dependencies (If Missing)

```bash
# Root folder
npm install

# Server folder
cd server
npm install
cd ..
```

---

### Step 4: Restart Both Servers

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend (new terminal)
npm run dev
```

---

### Step 5: Hard Refresh Browser

```
Ctrl + Shift + R
```

Or clear browser cache:
```
Ctrl + Shift + Delete
→ Clear cache and cookies
```

---

### Step 6: Test PDF Generation

1. **Select patient** (e.g., Priyanka Sahare)
2. **Upload files:**
   - Eyes Open PDF
   - Eyes Closed PDF
3. **Click "Execute Calculation"**
4. **Wait for results** (right panel should show 7 parameters)
5. **Click "Save & Download NeuroSense Report"**
6. **Wait 30-60 seconds** (Gemini AI takes time)
7. **PDF should download automatically!**

---

## 🔍 Troubleshooting:

### Issue 1: "Gemini API key not found"

**Backend shows:**
```
❌ GEMINI_API_KEY not found
```

**Fix:**
1. Get API key: https://aistudio.google.com/apikey
2. Add to `.env`: `GEMINI_API_KEY=your-key`
3. Restart backend

---

### Issue 2: "Module not found" Errors

**Backend shows:**
```
Error: Cannot find module 'pdfkit'
```

**Fix:**
```bash
cd server
npm install pdfkit chartjs-node-canvas canvas @google/generative-ai
cd ..
npm run dev:backend
```

---

### Issue 3: "Port already in use"

**Backend shows:**
```
Error: listen EADDRINUSE :::5000
```

**Fix (Windows):**
```bash
# Find process on port 5000
netstat -ano | findstr :5000

# Kill it (replace PID)
taskkill /PID <PID_NUMBER> /F

# Restart backend
npm run dev:backend
```

---

### Issue 4: Backend Starts But PDFs Still 404

**Check uploads folder exists:**
```bash
# Should exist:
ls server/uploads
```

**If missing, create it:**
```bash
mkdir server/uploads
```

**Check backend serves static files:**

Look in `server/index.js` for:
```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

---

## 📊 Expected Working Flow:

### 1. User Uploads Files
```
Frontend → Backend: POST /api/qeeg/process
Backend: Processing with Gemini AI...
Backend: Extracting data from PDFs...
Backend: Calculating 7 parameters...
Backend → Frontend: Results with scores
```

### 2. User Clicks "Save & Download"
```
Frontend: Checking existing PDFs...
Frontend: No PDF found, generating...
Frontend → Backend: POST /api/qeeg/generate-pdf
Backend: Using Gemini for AI content...
Backend: Creating PDF with PDFKit...
Backend: Saved to /uploads/neurosense-report-*.pdf
Backend → Frontend: PDF URL
Frontend: Auto-downloading PDF...
User: PDF downloaded! ✅
```

### 3. Backend Logs (Success)
```
📄 === PDF Report Generation Started ===
👤 Patient: Priyanka Sahare
📊 Parameters: 7
🤖 Using Gemini AI PDF Generator
📝 Generating AI-powered PDF...
✅ PDF Report Generated Successfully!
📄 File: neurosense-report-priyanka_sahare-1765018667310.pdf
📊 Size: 171 KB
🏁 === PDF Generation Completed ===
```

---

## 🎯 Quick Checklist:

Before testing, ensure:

- [ ] Backend running on port 5000
- [ ] `.env` file exists in ROOT folder
- [ ] `VITE_API_URL=http://localhost:5000/api` in .env
- [ ] `GEMINI_API_KEY` is valid in .env
- [ ] `server/uploads/` folder exists
- [ ] Frontend restarted after .env changes
- [ ] Browser cache cleared (Ctrl+Shift+R)
- [ ] No other process using port 5000
- [ ] Internet connection stable (for Gemini AI)

---

## 💡 Pro Tips:

### Tip 1: Keep Backend Terminal Visible
Watch for errors in real-time during PDF generation.

### Tip 2: Check Network Tab
Open DevTools (F12) → Network → Filter: "generate-pdf"
See if request reaches backend and what response is.

### Tip 3: Test Backend Health
Open in browser:
```
http://localhost:5000/api/health
```
Should show: `{"status":"OK"}`

### Tip 4: Sample Test Data
Use same patient as working PDF:
- Name: Priyanka Sahare
- Age: 9
- Gender: Female
- Should generate similar PDF

---

## 🚀 Success Indicators:

When everything works:

**Backend Console:**
```
📄 === PDF Report Generation Started ===
🤖 Using Gemini 2.0 Flash (Multimodal)
✅ Model initialized: gemini-2.0-flash
✅ Gemini extraction successful!
✅ PDF Report Generated Successfully!
```

**Frontend Console:**
```
🔧 Preparing patient data...
🌐 Calling backend API: http://localhost:5000/api/qeeg/generate-pdf
📡 Backend response status: 200
✅ PDF generated successfully!
💾 Saving to database...
✅ Results saved successfully!
📥 Auto-downloading PDF...
```

**Browser:**
- ✅ Toast: "Generating NeuroSense PDF Report..."
- ✅ Toast: "PDF Report generated!"
- ✅ PDF file downloads automatically
- ✅ File size: ~100-200 KB
- ✅ Opens properly in PDF viewer

**Processing History:**
- ✅ Shows "PDF Available" badge (green)
- ✅ "NeuroSense Report" button enabled
- ✅ Clicking downloads PDF

---

## ⚠️ Common Mistakes:

### Mistake 1: .env in Wrong Location
```
❌ server/.env  (wrong!)
✅ .env         (correct - root folder)
```

### Mistake 2: Wrong Port in .env
```
❌ VITE_API_URL=http://localhost:3001/api
✅ VITE_API_URL=http://localhost:5000/api
```

### Mistake 3: Invalid/Missing Gemini Key
```
❌ GEMINI_API_KEY=
❌ GEMINI_API_KEY=your-key-here (placeholder!)
✅ GEMINI_API_KEY=AIzaSyB... (actual key)
```

### Mistake 4: Not Restarting After Changes
After editing .env:
1. ✅ Restart backend
2. ✅ Restart frontend
3. ✅ Hard refresh browser

---

## 📞 Still Not Working?

### Collect Debug Info:

1. **Backend terminal output** (full logs)
2. **Browser console errors** (F12 → Console)
3. **Network tab** (F12 → Network → "generate-pdf" request)
4. **`.env` file contents** (hide API keys)
5. **Backend port** (from terminal)
6. **File sizes** of PDFs you're uploading

### Check These Specific Things:

```bash
# 1. Backend health
curl http://localhost:5000/api/health

# 2. Uploads folder exists
ls server/uploads

# 3. Gemini key in env
cat .env | grep GEMINI

# 4. Process on port 5000
netstat -ano | findstr :5000

# 5. Dependencies installed
ls node_modules | grep pdfkit
ls server/node_modules | grep @google
```

---

## ✨ Final Words:

**Sample PDF shows everything was configured correctly before!**

Main issues usually:
1. Missing/invalid Gemini API key
2. Backend not running
3. Wrong port in .env
4. Dependencies not installed

**Follow steps exactly and it WILL work again like before!** 🎉

The sample PDF proves:
- ✅ Code is correct
- ✅ Gemini integration works
- ✅ PDF design is perfect
- ✅ Just need proper setup!

**Good luck! Ab same perfect PDFs banegi! 🚀**
