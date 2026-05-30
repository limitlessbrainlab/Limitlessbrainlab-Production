# PDF Generation Troubleshooting Guide
## NeuroSense Report Generate Nahi Ho Rahi

---

## 🔍 Common Issues & Solutions

### Issue 1: Backend Server Port Mismatch ⚠️

**Problem:**
Frontend port 3001 pe call kar raha hai, lekin backend port 5000 pe chal raha hai.

**Console mein dikhe ga:**
```
Failed to fetch
net::ERR_CONNECTION_REFUSED
```

**Solution:**

#### Option A: .env File Fix (Recommended)

1. Check karo `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

2. Agar nahi hai to add karo:
```bash
# Frontend .env file
VITE_API_URL=http://localhost:5000/api
```

3. Frontend restart karo:
```bash
# Terminal mein
npm run dev
```

#### Option B: Backend Port Check

1. Backend terminal check karo:
```
Server running on port 5000
या
Server running on port 3001
```

2. Agar port 3001 pe hai to sab kuch sahi hai.
3. Agar port 5000 pe hai to `.env` mein update karo (Option A)

---

### Issue 2: Backend Server Running Nahi Hai ❌

**Problem:**
Backend hi nahi chal raha.

**Kaise pata chalega:**
- Console mein: `Failed to fetch` error
- Network tab mein: Request fail

**Solution:**

1. Backend start karo:
```bash
# New terminal window
cd D:\Neuro360-10-12-2025-15.47pm\Neuro360
npm run dev:backend
```

2. Check karo ye messages aane chahiye:
```
✅ Server running on port 5000
✅ Gemini API key present: true
✅ Supabase credentials found
```

---

### Issue 3: Gemini API Key Missing/Invalid 🔑

**Problem:**
PDF generate karne ke liye Gemini AI ki zaroorat hai content ke liye.

**Console mein dikhe ga:**
```
❌ Gemini API key not found
या
❌ Gemini API error: 401 Unauthorized
```

**Solution:**

1. Check `.env` file:
```env
GEMINI_API_KEY=your-gemini-api-key
```

2. Agar missing hai to add karo:
   - Go to: https://aistudio.google.com/apikey
   - Create API key
   - Copy and paste in `.env`

3. Backend restart karo

---

### Issue 4: PDF Generator Dependencies Missing 📦

**Problem:**
Backend dependencies install nahi hain.

**Console mein dikhe ga:**
```
Error: Cannot find module 'pdfkit'
या
Error: Cannot find module 'chartjs-node-canvas'
```

**Solution:**

```bash
# Backend folder mein
cd D:\Neuro360-10-12-2025-15.47pm\Neuro360\server
npm install

# Ya root folder se
npm run install:all
```

---

### Issue 5: CORS Error 🚫

**Problem:**
Frontend se backend call blocked ho rahi hai.

**Console mein dikhe ga:**
```
Access to fetch blocked by CORS policy
```

**Solution:**

Check karo `server/index.js` mein CORS enabled hai:
```javascript
const cors = require('cors');
app.use(cors());
```

---

## 🔧 Step-by-Step Debugging Process

### Step 1: Check Backend Console

Backend terminal mein dekho kya error aa raha hai jab "Save" button click karte ho.

**Expected output:**
```
📄 === PDF Report Generation Started ===
👤 Patient: John A
📊 Parameters: 7
🤖 Using Gemini AI PDF Generator
📝 Generating AI-powered PDF to: neurosense-report-john_a-1234567890.pdf
✅ PDF Report Generated Successfully!
☁️  Uploading PDF to Supabase storage...
✅ PDF uploaded to Supabase successfully
```

**If you see errors:**
- Gemini errors → Check API key
- File system errors → Check permissions
- Supabase errors → Check Supabase credentials

### Step 2: Check Browser Console

Browser console mein Network tab open karo:

1. Open DevTools (F12)
2. Go to **Network** tab
3. Click "Save & Download" button
4. Check for request to `/api/qeeg/generate-pdf`

**Check response:**
- ✅ Status 200 → PDF generated successfully
- ❌ Status 404 → Endpoint not found (backend issue)
- ❌ Status 500 → Server error (check backend console)
- ❌ Failed → Backend not running

### Step 3: Check Environment Variables

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000/api
```

**Backend (.env):**
```env
# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Supabase (optional for PDF storage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (optional fallback)
OPENAI_API_KEY=your-openai-api-key
```

### Step 4: Test PDF Generation Manually

Browser console mein ye command run karo:

```javascript
// Test PDF generation endpoint
fetch('http://localhost:5000/api/qeeg/generate-pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patientData: {
      name: 'Test Patient',
      dateOfRecording: '2025-12-11',
      age: 30,
      gender: 'male',
      handedness: 'Right'
    },
    algorithmResults: {
      parameters: [
        { name: 'Cognition', score: 1, maxScore: 3, classification: 'Low', metrics: [] }
      ],
      overallScore: 1
    },
    qeegData: {
      EC: { absolute: {}, relative: {}, special: {} },
      EO: { absolute: {}, relative: {} }
    }
  })
})
.then(r => r.json())
.then(data => console.log('✅ PDF Test Success:', data))
.catch(err => console.error('❌ PDF Test Failed:', err));
```

---

## 🚀 Quick Fix Checklist

Run these commands in order:

```bash
# 1. Check backend is running
# Backend terminal should show: "Server running on port 5000"

# 2. If not, start backend
npm run dev:backend

# 3. Check frontend .env
echo %VITE_API_URL%
# Should show: http://localhost:5000/api

# 4. If not set, create .env file
echo VITE_API_URL=http://localhost:5000/api > .env

# 5. Restart frontend
npm run dev

# 6. Test in browser
# Go to Algorithm Processor
# Upload files, execute, then click "Save & Download"
```

---

## 📊 Expected Flow (When Working Correctly)

1. **User clicks "Save & Download"**
   ↓
2. **Frontend calls handleSaveResults()**
   ↓
3. **Checks if pdfUrl exists**
   - ❌ No → Call generatePDFReport()
   - ✅ Yes → Skip to step 6
   ↓
4. **generatePDFReport() calls backend**
   - POST http://localhost:5000/api/qeeg/generate-pdf
   ↓
5. **Backend generates PDF**
   - Uses Gemini AI for content
   - Creates PDF with PDFKit
   - Uploads to Supabase (if configured)
   - Returns PDF URL
   ↓
6. **Frontend saves to database**
   - Saves results + PDF URL
   ↓
7. **Auto-downloads PDF**
   - Downloads file to user's computer
   ↓
8. **Button changes to "Saved ✓"**

---

## 🐛 Still Not Working?

### Enable Detailed Logging

1. Open `AlgorithmDataProcessor.jsx`
2. Find `handleSaveResults` function
3. Add console.logs at each step
4. Watch console for where it fails

### Check Specific Errors

**Error: "Cannot read property 'url' of null"**
- Backend returned null → Check backend console for errors

**Error: "Failed to generate PDF: Server returned 500"**
- Backend crashed → Check backend console for error stack trace

**Error: "PDF generation timed out"**
- Backend too slow → Check if Gemini API is responding
- Increase timeout in line 769: `setTimeout(() => controller.abort(), 60000)` // 60 seconds

---

## 📞 Need More Help?

1. **Share backend console output** (copy full error message)
2. **Share browser console errors** (Network tab + Console tab)
3. **Check backend logs** when clicking "Save & Download"
4. **Verify all environment variables** are set correctly

---

## ✅ Success Indicators

When everything works, you should see:

**Backend Console:**
```
📄 === PDF Report Generation Started ===
✅ PDF Report Generated Successfully!
📄 File: neurosense-report-john_a-1734529327984.pdf
📊 Size: 45.32 KB
☁️  Uploading PDF to Supabase storage...
✅ PDF uploaded to Supabase successfully
🏁 === PDF Generation Completed ===
```

**Browser Console:**
```
🔧 Preparing patient data...
👤 Patient Data: { name: 'John A', ... }
🌐 Calling backend API: http://localhost:5000/api/qeeg/generate-pdf
📡 Backend response status: 200
✅ PDF generated successfully! { url: 'https://...', filename: '...' }
💾 Saving to database...
✅ Results saved successfully!
📥 Auto-downloading PDF...
```

**User Experience:**
- ✅ Toast: "Generating NeuroSense PDF Report..."
- ✅ Toast: "PDF Report generated!"
- ✅ Toast: "Results saved successfully!"
- ✅ PDF downloads automatically
- ✅ Button shows "Saved ✓" (green)

---

Agar phir bhi koi issue ho to specific error message share karein! 🙏
