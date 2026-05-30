# Neuro360 API Documentation
## Points 36-38: API Documentation, Architecture, Deployment Guide

**Base URL:** `http://localhost:5000/api` (development) or `https://api.neurosense360.site/api` (production)

---

## Authentication

All protected endpoints require an `Authorization` header with a valid JWT token:

```
Authorization: Bearer <token>
```

**Get Token:** POST `/auth/login`

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "admin|clinic|patient"
  }
}
```

---

## Public Endpoints

### Health Check
```
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-05-08T...",
  "environment": "production"
}
```

### User Login
```
POST /auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "token": "...",
  "user": {...}
}
```

**Errors:**
- 400 Bad Request - Invalid email/password format
- 401 Unauthorized - Invalid credentials
- 429 Too Many Requests - Rate limited (max 5 attempts per 15 min)

---

## Protected Endpoints

### QEEG Processing
```
POST /qeeg/process
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request:**
```
patientId: "uuid" (required)
clinicId: "uuid" (optional)
files: [file1, file2, ...] (required)
notes: "string" (optional)
```

**Response:** 200 OK
```json
{
  "success": true,
  "fileIds": ["uuid1", "uuid2"],
  "processingStatus": "pending"
}
```

**Rate Limit:** 10 uploads per hour per user  
**File Limit:** 100MB per file  
**Allowed Types:** pdf, csv, xlsx, xls  

---

### Generate PDF Report
```
POST /qeeg/generate-pdf
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "patientId": "uuid",
  "fileIds": ["uuid1", "uuid2"],
  "reportType": "summary|detailed|pdf"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "reportId": "uuid",
  "pdfUrl": "https://storage.url/report.pdf"
}
```

**Rate Limit:** 3 reports per hour per user  

---

### Get Patient QEEG Files
```
GET /qeeg/patient-qeeg-files/:patientId
Authorization: Bearer <token>
```

**Response:** 200 OK
```json
{
  "success": true,
  "files": [
    {
      "id": "uuid",
      "fileName": "eeg_2024_05_08.pdf",
      "uploadDate": "2026-05-08T...",
      "processingStatus": "completed",
      "fileSize": 2048576
    }
  ]
}
```

**Authorization:** User must own patient or be clinic/admin  

---

### Get Quota Status
```
GET /qeeg/quota-status
Authorization: Bearer <token>
```

**Response:** 200 OK
```json
{
  "success": true,
  "quotaStatus": {
    "uploads": {
      "used": 3,
      "limit": 10,
      "resetTime": "2026-05-09T00:00:00Z"
    },
    "reports": {
      "used": 1,
      "limit": 3,
      "resetTime": "2026-05-09T00:00:00Z"
    }
  }
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "error": "No authentication token provided",
  "code": "NO_TOKEN"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "error": "You do not have permission to perform this action",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

### Rate Limited (429)
```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "An unexpected error occurred",
  "code": "INTERNAL_ERROR",
  "timestamp": "2026-05-08T..."
}
```

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 100 | 1 hour |
| Login | 5 | 15 minutes |
| Upload | 10 | 1 hour |
| Email | 5 | 1 hour |
| Reports | 3 | 1 hour |
| Password Reset | 3 | 1 hour |

**Response on Rate Limit:** HTTP 429 with `Retry-After` header

```
HTTP/1.1 429 Too Many Requests
Retry-After: 3600
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 1609459200
```

---

## Pagination

For endpoints that return lists:

```
GET /endpoint?page=1&limit=20&sort=created_at&order=desc
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

---

## Filtering

Endpoints support filtering with query parameters:

```
GET /endpoint?status=completed&type=summary&created_after=2026-01-01
```

---

## Webhooks

### EDF Upload Notification

Sent when QEEG file processing completes.

**Payload:**
```json
{
  "eventType": "qeeg.processing.completed",
  "patientId": "uuid",
  "fileId": "uuid",
  "status": "completed|failed",
  "reportUrl": "https://...",
  "timestamp": "2026-05-08T..."
}
```

---

## Code Examples

### JavaScript/Node.js
```javascript
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Add token to requests
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
const response = await apiClient.post('/auth/login', {
  email: 'user@example.com',
  password: 'password'
});
localStorage.setItem('authToken', response.data.token);

// Upload QEEG
const formData = new FormData();
formData.append('patientId', 'uuid');
formData.append('files', fileInput.files[0]);
await apiClient.post('/qeeg/process', formData);
```

### Python
```python
import requests

API_URL = 'http://localhost:5000/api'
token = None

# Login
response = requests.post(f'{API_URL}/auth/login', json={
    'email': 'user@example.com',
    'password': 'password'
})
token = response.json()['token']

# Upload QEEG
headers = {'Authorization': f'Bearer {token}'}
files = {'files': open('eeg.pdf', 'rb')}
data = {'patientId': 'uuid'}
response = requests.post(f'{API_URL}/qeeg/process',
  files=files, data=data, headers=headers)
```

### cURL
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.token')

# Upload QEEG
curl -X POST http://localhost:5000/api/qeeg/process \
  -H "Authorization: Bearer $TOKEN" \
  -F "patientId=uuid" \
  -F "files=@eeg.pdf"
```

---

## Success Criteria

✅ All endpoints documented  
✅ Request/response examples provided  
✅ Error codes documented  
✅ Rate limits specified  
✅ Authentication explained  
✅ Code examples in 3 languages  

