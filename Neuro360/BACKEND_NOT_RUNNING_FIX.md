# ❌ Backend Not Running - Quick Fix

## 🔴 Error You're Seeing:
```
POST http://localhost:3001/api/qeeg/process 404 (Not Found)
Failed to execute 'json' on 'Response': Unexpected end of JSON input
```

**Matlab**: Backend server running nahi hai!

---

## ✅ Solution (3 Easy Steps):

### Step 1: Check if Backend is Running

**Open new PowerShell terminal** aur ye run karo:
```powershell
node check-backend.js
```

**Agar output hai:**
```
❌ Backend is NOT RUNNING!
```

Toh backend start karna padega!

---

### Step 2: Start Backend Server

**Same terminal mein ye run karo:**

```powershell
npm run dev:backend
```

**Ya alternative:**
```powershell
# Server folder mein jao
cd server

# Start karo
npm start
```

---

### Step 3: Verify Backend Started

**Terminal mein ye dikhna chahiye:**
```
🚀 Neuro360 Backend Server running on port 3001
📊 QEEG Processing API: http://localhost:3001/api/qeeg
💚 Health Check: http://localhost:3001/api/health

📋 Environment Configuration:
   PORT: 3001
   OPENAI_API_KEY: ✓ Set (or ✗ Missing - OK!)
   SUPABASE_URL: ✓ Set

✅ Enhanced AI PDF Generator loaded successfully
```

**Agar ye sab dikha, toh SUCCESS! ✅**

---

## 🧪 Quick Test:

1. **Browser mein open karo:**
   http://localhost:3001/api/health

2. **Should show:**
   ```json
   {
     "status": "ok",
     "message": "Neuro360 Backend Server is running"
   }
   ```

3. **Agar ye dikha, backend working hai! ✅**

---

## 🎯 Now Test PDF Generation:

1. Go to Algorithm Data Processor
2. Select patient
3. Upload QEEG files
4. Click "Execute Calculation"
5. Should work now! ✅

---

## 🔧 Common Issues:

### Issue 1: Port 3001 already in use
```powershell
# Check what's using port 3001
netstat -ano | findstr :3001

# Kill that process
taskkill /PID <process-id> /F

# Then restart backend
npm run dev:backend
```

### Issue 2: "Cannot find module"
```powershell
# Install dependencies
cd server
npm install

# Go back to root
cd ..

# Start backend
npm run dev:backend
```

### Issue 3: Backend starts but crashes immediately
```powershell
# Check for errors in console
# Common issues:
# - Missing .env file
# - Wrong SUPABASE_URL or keys
# - Syntax error in code

# Try clean install
cd server
rm -rf node_modules
npm install
npm start
```

---

## 📝 Important Notes:

1. **Backend MUST be running** for PDF generation to work
2. **Don't close** the terminal where backend is running
3. Keep backend terminal **separate** from frontend
4. If backend crashes, **check error messages** in terminal

---

## ✅ Quick Command Reference:

```powershell
# Check backend status
node check-backend.js

# Start backend only
npm run dev:backend

# Start both frontend + backend
npm run dev:full

# Health check in browser
http://localhost:3001/api/health
```

---

## 🎯 Expected Setup:

You should have **2 terminals running**:

**Terminal 1: Frontend**
```
VITE v4.5.0  ready in 500 ms
➜  Local:   http://localhost:5173/
```

**Terminal 2: Backend**
```
🚀 Neuro360 Backend Server running on port 3001
✅ Enhanced AI PDF Generator loaded successfully
```

---

## 💡 Pro Tip:

Use **`npm run dev:full`** to start both together!

```powershell
npm run dev:full
```

This starts:
- Frontend on port 5173
- Backend on port 3001

Both in one command! 🚀

---

**Now start the backend and test again! It will work! ✅**
