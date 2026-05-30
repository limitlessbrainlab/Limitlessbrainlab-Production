# SSO Solution: LBW → DDO (Seamless Access)

**Prepared for:** DrM Hope Software / Dr. Shweta Adatya
**Date:** 2026-04-03

---

## Context

### The Business

**Dr. Shweta Adatya** runs franchisee brain wellness clinics across India and Dubai. She uses two platforms built by **DrM Hope Software**:

1. **Limitless Brain Lab (LBW)** — `limitlessbrainlab.com`
   Brain assessment, QEEG reports, clinic/franchisee management, patient wellness tracking.
   Patients, clinic admins, and super admins log in here.

2. **DDO (Digital Doctors Office)** — `aisurgeonpilot.com`
   Online consultation platform. Appointment booking, Zoom meetings, prescriptions, AI transcripts.
   This is a **SaaS product** used by multiple doctors — Dr. Shweta is one tenant.

### The DDO Architecture (Important)

DDO is **two separate projects sharing one database**:

```
DDO Database (Supabase: uakqdjxuceckjssjdyui)
         │
         ├──── Doctor Portal (AiSurgeonPilot)
         │     Framework: Next.js 16 (SSR)
         │     Domain: aisurgeonpilot.com
         │     Users: Doctors, Admin, Superadmin
         │     Auth: Supabase SSR cookies (@supabase/ssr)
         │
         └──── Patient Portal (AidocCall)
               Framework: React + Vite (SPA)
               Domain: aidoccall.com
               Users: Patients
               Auth: Supabase client-side (supabase-js)
               Routes: /patient/portal, /patient/intake,
                       /patient/prescription, /dashboard
```

Both portals read/write to the **same tables**: `doc_patients`, `doc_doctors`, `doc_appointments`, etc.

### The LBW Architecture

```
LBW Database (Supabase: wqykofpjpaytjuqsessf)
         │
         └──── Single Project (Neuro360)
               Framework: React + Vite (SPA) + Express backend
               Domain: limitlessbrainlab.com
               Users: Patients, Clinic Admins, Super Admins
               Auth: Custom tokens + Supabase fallback
               Tables: patients, clinics, profiles, reports, etc.
```

---

## The Requirement

- DDO is accessed from LBW via **hyperlinks**
- If a user is **logged into LBW** and clicks a DDO link, they **must not be asked to log in again**
- **Whichever user is logged into LBW** — their profile opens in the correct DDO portal:
  - **Patient** → lands in DDO **Patient Portal** (aidoccall.com) — logged in, ready to book
  - **Dr. Shweta (clinic admin)** → lands in DDO **Doctor Portal** (aisurgeonpilot.com) — logged in, sees her dashboard with all appointments
  - **Super Admin** → lands in DDO **Doctor Portal** as superadmin
- **All DDO features remain exactly the same.** SSO is just an extra entry point — nothing else changes in DDO.
- If someone opens DDO directly (not from LBW), normal DDO login applies — no change.
- **Patient auto-registration:** When a patient clicks the link from LBW for the first time, their profile is **automatically created** in DDO's database from the data LBW already has. No registration form.

---

## How It Works

```
User logged into LBW
       │
       │  clicks a DDO hyperlink inside LBW
       ▼
LBW backend signs a short-lived token (60 seconds)
containing: who this user is (email, name, role, phone, etc.)
       │
       ▼
Browser redirects to DDO with token in URL:
  Patient     → aidoccall.com/auth/sso?token=xxx
  Doctor      → aisurgeonpilot.com/auth/sso?token=xxx
  Superadmin  → aisurgeonpilot.com/auth/sso?token=xxx
       │
       ▼
DDO verifies the token (checks signature, expiry, one-time use)
       │
       ▼
DDO finds or auto-creates the user in its database
DDO creates a Supabase Auth session
       │
       ▼
User lands in DDO — fully logged in, correct profile, correct portal.
No login screen. All DDO features work normally.
```

---

## Why This Works Across Different Apps

LBW and DDO are on **different domains** with **different databases**. Browsers don't allow sharing cookies or sessions across domains. The signed token is the bridge:

| Problem | Solution |
|---------|----------|
| Can't share cookies across domains | Pass a signed JWT token in the URL |
| Can't share database sessions | DDO creates its own session after verifying the token |
| How does DDO trust LBW? | Both backends share a secret key. Only LBW can produce a valid token. |
| What if someone forges a token? | They can't — they don't know the secret. Signature verification fails. |
| What if someone steals a token URL? | Token expires in 60 seconds and can only be used once. |

---

## The Token (JWT)

LBW signs this and puts it in the redirect URL:

```json
{
  "sub": "user-id-in-lbw",
  "email": "user@example.com",
  "name": "User Name",
  "role": "patient",
  "phone": "+919876543210",
  "dob": "1990-05-15",
  "gender": "male",
  "iss": "limitlessbrainlab",
  "aud": "ddo",
  "jti": "unique-random-id",
  "exp": 1712150460
}
```

| Field | Purpose |
|-------|---------|
| `sub` | User's ID in LBW (stored as `lbw_patient_id` in DDO for cross-reference) |
| `email` | Identifies the user in DDO (primary match key) |
| `name` | Display name for DDO profile |
| `role` | What DDO role: `patient` → patient portal, `doctor` → doctor portal, `superadmin` → doctor portal admin |
| `phone` | For DDO patient record |
| `dob` | Date of birth — for DDO patient record |
| `gender` | For DDO patient record |
| `iss` | Issuer — DDO checks this equals `"limitlessbrainlab"` |
| `aud` | Audience — DDO checks this equals `"ddo"` |
| `jti` | Unique ID — prevents the same token from being used twice |
| `exp` | Expiry — 60 seconds after creation |

---

## Security

| Attack | Defense |
|--------|---------|
| Forge a token | Can't — attacker doesn't know the shared secret |
| Steal token from URL | Expires in 60 seconds + can only be used once |
| Replay (use same token twice) | DDO stores used `jti` values, rejects duplicates |
| Intercept in transit | Both sites use HTTPS — token is encrypted in transit |
| Use token on wrong app | `aud` claim checked — DDO rejects tokens not meant for it |

---

## What Each User Experiences

### Patient

```
LBW Patient Dashboard
┌─────────────────────────────────┐
│  Your Brain Health Results      │
│  Focus: 72  Memory: 65         │
│                                 │
│  [Book Appointment] ← clicks   │
└────────────────┬────────────────┘
                 │ (1-2 seconds, automatic)
                 ▼
DDO Patient Portal (aidoccall.com)
┌─────────────────────────────────┐
│  Welcome, Rahul Sharma          │
│  Already logged in ✓            │
│                                 │
│  Book Appointment               │
│  My Appointments                │
│  My Prescriptions               │
│                                 │
│  [← Back to Brain Lab]         │
└─────────────────────────────────┘
```

### Dr. Shweta

```
LBW Clinic Admin Panel
┌─────────────────────────────────┐
│  Patients: 347                  │
│  Franchisees: 12                │
│                                 │
│  [My Consultations] ← clicks   │
└────────────────┬────────────────┘
                 │ (1-2 seconds, automatic)
                 ▼
DDO Doctor Portal (aisurgeonpilot.com)
┌─────────────────────────────────┐
│  Dr. Shweta Adatya              │
│  Already logged in ✓            │
│                                 │
│  Today's Appointments:          │
│  10:00 AM  Rahul Sharma [Join]  │
│  02:30 PM  Priya Patel          │
│                                 │
│  All Patients  |  Calendar      │
│                                 │
│  [← Back to Brain Lab]         │
└─────────────────────────────────┘
```

### Super Admin

```
LBW Super Admin Panel
┌─────────────────────────────────┐
│  [DDO Admin Panel] ← clicks    │
└────────────────┬────────────────┘
                 │
                 ▼
DDO Doctor Portal — Superadmin View
┌─────────────────────────────────┐
│  DDO Admin Dashboard            │
│  Already logged in ✓            │
│  Doctors | Appointments | ...   │
└─────────────────────────────────┘
```

---

## Patient Auto-Registration in DDO

When a patient clicks the DDO link from LBW **for the first time**, they don't exist in DDO's database yet. The SSO route handles this automatically:

```
First click from LBW:
  Token arrives at DDO with: email, name, phone, dob, gender
       │
       ├─ Check: SELECT * FROM doc_patients WHERE email = 'rahul@gmail.com'
       │
       ├─ NOT FOUND → Auto-create:
       │     1. Create Supabase Auth user in DDO
       │        (random password — patient never needs it)
       │        (email verification skipped)
       │     2. INSERT INTO doc_patients (email, first_name, last_name,
       │        phone_number, date_of_birth, gender, lbw_patient_id, source)
       │     3. Patient now exists in DDO ✓
       │
       └─ Create session → redirect to patient portal → done

Second click onwards:
  Token arrives → patient FOUND → just create session → redirect → done
```

**The patient never fills a registration form in DDO.** Their data comes from LBW via the token.

---

## What Needs to Be Built

### LBW Side (2 things)

#### 1. New backend endpoint: `POST /api/sso/generate-token`

**File: `server/routes/ssoRoutes.js` (NEW)**

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const SSO_SECRET = process.env.SHARED_SSO_SECRET;
const DDO_DOCTOR_URL = process.env.DDO_DOCTOR_URL;   // aisurgeonpilot.com
const DDO_PATIENT_URL = process.env.DDO_PATIENT_URL;  // aidoccall.com

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.post('/generate-token', async (req, res) => {
  try {
    const { userId, email, role } = req.body;

    if (!userId || !email || !role) {
      return res.status(400).json({ error: 'userId, email, and role are required' });
    }

    // Fetch user from LBW database
    let user;
    if (role === 'patient') {
      const { data } = await supabase
        .from('patients')
        .select('id, full_name, email, phone, date_of_birth, gender')
        .eq('id', userId).eq('email', email).single();
      user = data;
    } else if (role === 'clinic_admin') {
      const { data } = await supabase
        .from('clinics')
        .select('id, name, email, phone, contact_person')
        .eq('id', userId).eq('email', email).single();
      user = data;
    } else if (role === 'super_admin') {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', userId).eq('email', email).single();
      user = data;
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Map LBW roles to DDO roles
    const ddoRole = {
      'patient': 'patient',
      'clinic_admin': 'doctor',
      'super_admin': 'superadmin',
    }[role];

    // Sign the token
    const token = jwt.sign({
      sub: user.id,
      email: user.email,
      name: user.full_name || user.contact_person || user.name,
      role: ddoRole,
      phone: user.phone || null,
      dob: user.date_of_birth || null,
      gender: user.gender || null,
      iss: 'limitlessbrainlab',
      aud: 'ddo',
      jti: crypto.randomUUID(),
    }, SSO_SECRET, { expiresIn: '60s' });

    // Redirect to the correct DDO portal based on role
    const baseUrl = ddoRole === 'patient' ? DDO_PATIENT_URL : DDO_DOCTOR_URL;
    const redirectUrl = `${baseUrl}/auth/sso?token=${encodeURIComponent(token)}`;

    res.json({ success: true, redirectUrl });
  } catch (error) {
    console.error('SSO token generation error:', error);
    res.status(500).json({ error: 'Failed to generate SSO token' });
  }
});

module.exports = router;
```

**Mount in `server/index.js`:**

```javascript
const ssoRoutes = require('./routes/ssoRoutes');
app.use('/api/sso', ssoRoutes);
```

#### 2. Frontend: SSO helper + hyperlinks

**File: `src/services/ssoService.js` (NEW)**

```javascript
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function openDDO(userId, email, role) {
  const res = await axios.post(`${API_URL}/sso/generate-token`,
    { userId, email, role },
    { headers: { Authorization: `Bearer ${Cookies.get('authToken')}` } }
  );
  window.location.href = res.data.redirectUrl;
}
```

**Use anywhere in LBW:**

```jsx
import { openDDO } from '../services/ssoService';
import { useAuth } from '../contexts/AuthContext';

function DDOLink({ label }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await openDDO(user.id, user.email, user.role);
    } catch {
      toast.error('Unable to connect. Try again.');
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Connecting...' : label}
    </button>
  );
}

// Usage in patient dashboard:
<DDOLink label="Book Appointment" />

// Usage in clinic admin panel:
<DDOLink label="My Consultations" />

// Usage in super admin panel:
<DDOLink label="DDO Admin Panel" />
```

---

### DDO Doctor Portal Side — AiSurgeonPilot (3 things)

#### 1. New route: `src/app/auth/sso/route.ts`

Handles **doctor** and **superadmin** SSO (patients go to patient portal instead).

```typescript
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const SSO_SECRET = process.env.SHARED_SSO_SECRET!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

interface SSOPayload {
  sub: string;
  email: string;
  name: string;
  role: 'doctor' | 'superadmin';
  phone?: string;
  iss: string;
  aud: string;
  jti: string;
}

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return NextResponse.redirect(new URL('/login?error=missing_token', APP_URL));

  // Verify token
  let payload: SSOPayload;
  try {
    payload = jwt.verify(token, SSO_SECRET, {
      issuer: 'limitlessbrainlab',
      audience: 'ddo',
    }) as SSOPayload;
  } catch (err: any) {
    const code = err.name === 'TokenExpiredError' ? 'token_expired' : 'invalid_token';
    return NextResponse.redirect(new URL(`/login?error=${code}`, APP_URL));
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Replay protection
  const { data: used } = await supabase
    .from('doc_sso_used_tokens')
    .select('jti').eq('jti', payload.jti).single();
  if (used) return NextResponse.redirect(new URL('/login?error=token_used', APP_URL));

  await supabase.from('doc_sso_used_tokens').insert({
    jti: payload.jti,
    email: payload.email,
    used_at: new Date().toISOString(),
  });

  // Doctor or superadmin must already exist in doc_doctors
  const { data: doctor } = await supabase
    .from('doc_doctors')
    .select('id, user_id, email, role, is_active')
    .eq('email', payload.email)
    .single();

  if (!doctor) {
    return NextResponse.redirect(new URL('/login?error=profile_not_found', APP_URL));
  }

  if (!doctor.is_active) {
    return NextResponse.redirect(new URL('/login?error=account_inactive', APP_URL));
  }

  // Create session via magic link
  const destination = payload.role === 'superadmin' ? '/superadmin' : '/dashboard';

  const { data: linkData } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: payload.email,
    options: { redirectTo: `${APP_URL}/auth/callback?next=${destination}` },
  });

  if (!linkData?.properties?.action_link) {
    return NextResponse.redirect(new URL('/login?error=session_failed', APP_URL));
  }

  return NextResponse.redirect(linkData.properties.action_link);
}
```

#### 2. Update middleware: `src/middleware.ts`

Add `/auth/sso` to the list of allowed routes:

```typescript
// Find the auth pages check and add /auth/sso:

const isAuthPage =
  pathname === '/login' ||
  pathname === '/signup' ||
  pathname === '/forgot-password' ||
  pathname === '/reset-password' ||
  pathname === '/change-password' ||
  pathname === '/request-account' ||
  pathname === '/auth/callback' ||
  pathname === '/auth/sso';             // ← ADD THIS
```

#### 3. Database migration

```sql
-- Replay protection table (shared by both portals — same database)
CREATE TABLE doc_sso_used_tokens (
  jti     TEXT PRIMARY KEY,
  email   TEXT NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Track which patients came from LBW
ALTER TABLE doc_patients
  ADD COLUMN IF NOT EXISTS lbw_patient_id TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'direct';

-- Cleanup old tokens periodically
-- DELETE FROM doc_sso_used_tokens WHERE used_at < NOW() - INTERVAL '1 hour';
```

---

### DDO Patient Portal Side — AidocCall (2 things)

Since AidocCall is a React + Vite SPA (not Next.js), the SSO route is handled differently — as a React page component.

#### 1. New page: `src/pages/SSOCallback.jsx`

```jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, getAdminClient } from '../lib/supabaseClient';

export default function SSOCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    handleSSO();
  }, []);

  async function handleSSO() {
    const token = searchParams.get('token');
    if (!token) {
      setError('Missing token');
      return;
    }

    try {
      // Send token to a verification API endpoint
      // Since this is a client-side SPA, we need a backend endpoint to:
      //   1. Verify the JWT (needs the secret — can't do this client-side)
      //   2. Find/create the patient
      //   3. Return a magic link or session
      //
      // This calls the AiSurgeonPilot backend (same database)
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/sso/verify-patient`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'SSO verification failed');
        return;
      }

      // Sign in using the email + temporary password returned by backend
      // Or redirect through magic link
      if (data.magicLink) {
        window.location.href = data.magicLink;
      } else if (data.email && data.tempPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.tempPassword,
        });
        if (signInError) {
          setError('Login failed');
          return;
        }
        navigate('/patient/portal');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <a href="/" className="text-blue-500 underline">Go to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Connecting to your account...</p>
    </div>
  );
}
```

#### 2. Add route in router config

```jsx
// In the router setup (App.jsx or wherever routes are defined):
import SSOCallback from './pages/SSOCallback';

// Add to routes (public, no auth required):
<Route path="/auth/sso" element={<SSOCallback />} />
```

---

### DDO Backend — Shared SSO Verification Endpoint

Since both DDO portals share the same database and the AiSurgeonPilot project has the backend (Next.js API routes), add one more API route there for the patient portal to call:

**File: `src/app/api/sso/verify-patient/route.ts` (NEW in AiSurgeonPilot)**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SSO_SECRET = process.env.SHARED_SSO_SECRET!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface SSOPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  dob?: string;
  gender?: string;
  iss: string;
  aud: string;
  jti: string;
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    // Verify token
    let payload: SSOPayload;
    try {
      payload = jwt.verify(token, SSO_SECRET, {
        issuer: 'limitlessbrainlab',
        audience: 'ddo',
      }) as SSOPayload;
    } catch (err: any) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' });
    }

    if (payload.role !== 'patient') {
      return NextResponse.json({ success: false, error: 'Not a patient token' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Replay protection
    const { data: used } = await supabase
      .from('doc_sso_used_tokens')
      .select('jti').eq('jti', payload.jti).single();
    if (used) {
      return NextResponse.json({ success: false, error: 'Token already used' });
    }
    await supabase.from('doc_sso_used_tokens').insert({
      jti: payload.jti,
      email: payload.email,
      used_at: new Date().toISOString(),
    });

    // Find or create patient
    let { data: patient } = await supabase
      .from('doc_patients')
      .select('id, user_id, email')
      .eq('email', payload.email)
      .single();

    const tempPassword = crypto.randomUUID();

    if (!patient) {
      // Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: payload.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: payload.name, source: 'lbw_sso' },
      });

      if (authError && !authError.message?.includes('already registered')) {
        return NextResponse.json({ success: false, error: 'User creation failed' });
      }

      const userId = authData?.user?.id;

      // Create doc_patients record
      const nameParts = (payload.name || 'Patient').split(' ');
      await supabase.from('doc_patients').insert({
        user_id: userId,
        email: payload.email,
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' ') || '',
        phone_number: payload.phone || null,
        date_of_birth: payload.dob || null,
        gender: payload.gender || null,
        lbw_patient_id: payload.sub,
        source: 'lbw_sso',
        is_active: true,
        registration_completed: true,
      });
    } else {
      // Patient exists — update their password so we can sign them in
      if (patient.user_id) {
        await supabase.auth.admin.updateUser(patient.user_id, {
          password: tempPassword,
        });
      }
    }

    // Return credentials for client-side sign-in
    return NextResponse.json({
      success: true,
      email: payload.email,
      tempPassword: tempPassword,
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'SSO verification failed' });
  }
}
```

**Note:** This endpoint sets a temporary password and returns it so the patient portal (client-side SPA) can call `supabase.auth.signInWithPassword()`. The password is random and changes every SSO attempt. The patient never sees or knows this password.

---

## Environment Variables

### Generate the shared secret (run once):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### LBW `server/.env` — ADD:

```
SHARED_SSO_SECRET=<paste the generated hex string>
DDO_DOCTOR_URL=https://aisurgeonpilot.com
DDO_PATIENT_URL=https://aidoccall.com
```

### DDO Doctor Portal (AiSurgeonPilot) `.env` — ADD:

```
SHARED_SSO_SECRET=<same exact hex string>
```

### DDO Patient Portal (AidocCall) `.env` — ADD:

```
VITE_API_BASE_URL=https://aisurgeonpilot.com
```

(AidocCall doesn't need the secret — it calls the AiSurgeonPilot backend to verify tokens.)

---

## Install Dependencies

```bash
# LBW backend
cd server && npm install jsonwebtoken

# DDO Doctor Portal (AiSurgeonPilot)
npm install jsonwebtoken @types/jsonwebtoken

# DDO Patient Portal (AidocCall)
# No new dependencies needed — uses existing supabase-js + fetch
```

---

## Complete Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    LBW (limitlessbrainlab.com)                    │
│                    Database: Supabase Project A                  │
│                                                                  │
│  ┌─────────────┐  ┌────────────────┐  ┌──────────────────┐     │
│  │ Patient      │  │ Dr. Shweta     │  │ Super Admin      │     │
│  │              │  │ (clinic admin) │  │                  │     │
│  │ [Book Appt]  │  │ [Consult Portal│  │ [DDO Admin]     │     │
│  └──────┬───────┘  └──────┬────────┘  └──────┬───────────┘     │
│         │                  │                   │                 │
│         ▼                  ▼                   ▼                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  POST /api/sso/generate-token                            │   │
│  │  Signs JWT → redirects to correct DDO portal             │   │
│  └───────┬──────────────────────────────┬───────────────────┘   │
│          │                              │                       │
└──────────┼──────────────────────────────┼───────────────────────┘
           │                              │
   Patient token                  Doctor/Admin token
   (role: patient)                (role: doctor/superadmin)
           │                              │
           ▼                              ▼
┌─────────────────────────┐  ┌──────────────────────────────────┐
│ DDO Patient Portal      │  │ DDO Doctor Portal                │
│ (aidoccall.com)         │  │ (aisurgeonpilot.com)             │
│ React + Vite SPA        │  │ Next.js 16 SSR                   │
│                         │  │                                  │
│ /auth/sso               │  │ /auth/sso                        │
│   ↓                     │  │   ↓                              │
│ Calls AiSurgeonPilot    │  │ Verifies token                   │
│ /api/sso/verify-patient │  │ Finds doctor/admin in doc_doctors│
│   ↓                     │  │ Creates session                  │
│ Gets temp credentials   │  │ Redirects to /dashboard or       │
│ Signs in via Supabase   │  │   /superadmin                    │
│ Redirects to            │  │                                  │
│   /patient/portal       │  │                                  │
│                         │  │                                  │
│ Features: Book appt,    │  │ Features: View patients, manage  │
│ view prescriptions,     │  │ appointments, Zoom meetings,     │
│ intake forms, etc.      │  │ prescriptions, AI transcripts    │
│                         │  │                                  │
└────────────┬────────────┘  └────────────────┬─────────────────┘
             │                                │
             │     SAME DATABASE              │
             └──────────┬─────────────────────┘
                        ▼
              ┌──────────────────────┐
              │ DDO Database         │
              │ Supabase Project B   │
              │                      │
              │ doc_patients         │
              │ doc_doctors          │
              │ doc_appointments     │
              │ doc_meetings         │
              │ doc_sso_used_tokens  │
              └──────────────────────┘
```

---

## What Dr. Adatya Sees

When Dr. Adatya opens DDO (via SSO from LBW), she lands in the **Doctor Portal** and sees all patients who have booked appointments — exactly like any other DDO doctor. The SSO doesn't change what she sees, it just removes the login step.

Patients appear in her DDO dashboard **after they book an appointment** through the patient portal. The flow is:

```
1. Patient clicks "Book Appointment" in LBW
2. SSO takes them to DDO Patient Portal (auto-logged in, auto-registered)
3. Patient books an appointment with Dr. Adatya
4. Dr. Adatya opens DDO Doctor Portal (via SSO from LBW)
5. She sees the appointment in her dashboard ✓
```

---

## Summary

| Component | Change | New Code |
|-----------|--------|----------|
| **LBW Backend** | New `/api/sso/generate-token` endpoint | ~60 lines |
| **LBW Frontend** | `ssoService.js` + DDO link buttons | ~30 lines |
| **DDO Doctor Portal** | New `/auth/sso` route + middleware update | ~80 lines |
| **DDO Doctor Portal** | New `/api/sso/verify-patient` for patient portal | ~90 lines |
| **DDO Patient Portal** | New `SSOCallback.jsx` page + route | ~60 lines |
| **DDO Database** | `doc_sso_used_tokens` table + 2 columns on `doc_patients` | ~10 lines SQL |
| **Environment** | `SHARED_SSO_SECRET` in LBW + DDO Doctor Portal | 3 env vars |
| **Dependencies** | `jsonwebtoken` in LBW + DDO Doctor Portal | 2 npm installs |

**Total new code:** ~320 lines across 3 projects.
**No existing features change.** SSO is an additional entry point — everything else stays the same.
