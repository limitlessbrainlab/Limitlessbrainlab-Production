# 40-Point Production Hardening - Implementation Plan
## (NO .env CHANGES - Code fixes only)

**Status:** Planning Phase  
**Start Date:** May 8, 2026  
**Target:** Complete all 40 points without modifying .env

---

## PHASE 1: SECURITY (Points 1-7)

### Point 1: Implement Authentication Properly ✅
**Current:** Supabase auth exists but routes unprotected  
**Action:**
- [ ] Create `server/middleware/authMiddleware.js` - JWT verification
- [ ] Create `server/middleware/verifyAuth.js` - Check token on protected routes
- [ ] Wrap all sensitive endpoints: `/api/qeeg/*`, `/api/admin/*`, `/api/clinic/*`
- [ ] Add Supabase session verification on frontend

**Files to Create:**
```
server/middleware/authMiddleware.js
server/middleware/requireAuth.js
```

**Files to Modify:**
```
server/index.js (add middleware to routes)
server/routes/qeegRoutes.js (protect all endpoints)
server/routes/ssoRoutes.js (add auth checks)
src/main.jsx (add auth interceptor)
```

---

### Point 2: Enforce RBAC ✅
**Current:** Roles exist but not enforced at API level  
**Action:**
- [ ] Create `server/middleware/rbac.js` - Role-based access control
- [ ] Add role check middleware: `requireRole('admin')`, `requireRole('clinic')`, `requireRole('patient')`
- [ ] Enforce on routes:
  - Admin routes: only admin
  - Clinic routes: only clinic + own clinic
  - Patient routes: only patient + own data
- [ ] Add Supabase RLS (Row-Level Security) policies

**Files to Create:**
```
server/middleware/rbac.js
server/services/roleService.js
```

**Files to Modify:**
```
server/routes/qeegRoutes.js (add role checks)
server/index.js (register middleware)
```

---

### Point 3: Secure All APIs ✅
**Current:** Multiple security gaps  
**Action:**
- [ ] Add helmet.js for security headers
- [ ] Add HTTPS enforcement in production
- [ ] Remove `rejectUnauthorized: false` from code
- [ ] Add X-Frame-Options, X-Content-Type-Options headers
- [ ] Add Content-Security-Policy headers
- [ ] Implement CSRF tokens for POST/PUT/DELETE
- [ ] Secure cookie flags (HttpOnly, Secure, SameSite)

**Files to Create:**
```
server/middleware/securityHeaders.js
server/middleware/csrfProtection.js
```

**Files to Modify:**
```
server/index.js (add helmet, security headers)
```

---

### Point 4: Input Validation ✅
**Current:** No schema validation  
**Action:**
- [ ] Create validation schemas with zod
- [ ] Validate all request bodies
- [ ] Validate file uploads (type, size, extensions)
- [ ] Sanitize string inputs
- [ ] Validate email formats strictly
- [ ] Validate phone numbers

**Files to Create:**
```
server/validators/schemas.js
server/middleware/validateRequest.js
```

**Files to Modify:**
```
server/routes/qeegRoutes.js (add validators)
server/index.js (add validation middleware)
```

---

### Point 5: Move Secrets to Env Configs ✅
**Current:** Hardcoded in .env (but NOT changing .env)  
**Action:**
- [ ] Create `server/config/secrets.js` - Read from process.env with fallbacks
- [ ] Create `server/config/validation.js` - Verify all required env vars exist at startup
- [ ] Log warnings if secrets missing (but don't crash)
- [ ] Document which env vars are required for production

**Files to Create:**
```
server/config/secrets.js
server/config/envValidation.js
```

**Files to Modify:**
```
server/index.js (add env validation on startup)
```

---

### Point 6: Rate Limiting ✅
**Current:** No rate limiting  
**Action:**
- [ ] Add express-rate-limit to all endpoints
- [ ] Strict limits on:
  - File uploads: 5 per minute per user
  - Email endpoints: 3 per hour per user
  - Login: 5 attempts per 15 minutes
  - API calls: 100 per hour per user
- [ ] Return 429 (Too Many Requests) status

**Files to Create:**
```
server/middleware/rateLimiter.js
server/config/rateLimitConfig.js
```

**Files to Modify:**
```
server/index.js (register rate limiters)
server/routes/qeegRoutes.js (add rate limit checks)
```

---

### Point 7: OWASP Checks ✅
**Current:** Multiple OWASP Top 10 vulnerabilities  
**Action:**
- [ ] A1 - Injection: Add input validation + parameterized queries check
- [ ] A2 - Auth: Add authentication (Point 1)
- [ ] A3 - Sensitive Data: Remove console.logs of sensitive data
- [ ] A4 - XML/External: Not applicable (no XML parsing)
- [ ] A5 - Access Control: Add RBAC (Point 2)
- [ ] A6 - Security Config: Add security headers (Point 3)
- [ ] A7 - XSS: Add Content-Security-Policy
- [ ] A8 - Deserialization: Validate JSON parsing
- [ ] A9 - Using Known Vulns: Dependency check
- [ ] A10 - Logging: Add proper logging (Point 9)

**Files to Create:**
```
server/security/owaspChecklist.js
```

**Files to Modify:**
```
server/index.js (implement all headers)
```

---

## PHASE 2: STABILITY (Points 8-11)

### Point 8: Global Error Handling ✅
**Current:** Crashes on unhandled errors  
**Action:**
- [ ] Create global error handler middleware
- [ ] Handle async route errors with try-catch wrappers
- [ ] Implement error response standardization
- [ ] Add error logging
- [ ] Return user-friendly messages (not stack traces)

**Files to Create:**
```
server/middleware/errorHandler.js
server/utils/asyncHandler.js
server/utils/errorFormatter.js
```

**Files to Modify:**
```
server/index.js (add global error handler)
server/routes/qeegRoutes.js (wrap async routes)
src/App.jsx (add error boundary)
```

---

### Point 9: Logging for Failures ✅
**Current:** 523+ console.logs, no centralized logging  
**Action:**
- [ ] Create structured logging service with Winston
- [ ] Log levels: ERROR, WARN, INFO, DEBUG
- [ ] Log to both console (dev) and file (prod)
- [ ] Remove sensitive data from logs
- [ ] Add request/response logging middleware
- [ ] Add error stack traces to logs

**Files to Create:**
```
server/services/logger.js
server/middleware/requestLogger.js
```

**Files to Modify:**
```
server/index.js (integrate logger)
All route files (replace console.log with logger)
```

---

### Point 10: Retry Logic ✅
**Current:** Partial (email has retries)  
**Action:**
- [ ] Create retry utility with exponential backoff
- [ ] Add retries for:
  - Database queries (3 retries)
  - Email sending (3 retries)
  - File uploads (2 retries)
  - Gemini API calls (3 retries)
  - Payment API calls (2 retries)

**Files to Create:**
```
server/utils/retryLogic.js
server/services/retryableService.js
```

**Files to Modify:**
```
server/routes/qeegRoutes.js (add retry to Gemini calls)
server/index.js (add retry to email sending)
```

---

### Point 11: Edge Case Testing ✅
**Current:** Zero automated tests  
**Action:**
- [ ] Create test suite structure
- [ ] Unit tests for:
  - Input validators
  - Auth middleware
  - RBAC middleware
  - Error handler
- [ ] Integration tests for:
  - File upload flow
  - QEEG processing
  - Email sending
  - Payment processing
- [ ] Edge case tests:
  - Large files (>100MB)
  - Concurrent uploads
  - Invalid formats
  - Network failures

**Files to Create:**
```
server/__tests__/unit/validators.test.js
server/__tests__/unit/auth.test.js
server/__tests__/integration/uploads.test.js
server/__tests__/integration/qeeg.test.js
src/__tests__/unit/authService.test.js
vitest.config.js
```

---

## PHASE 3: PERFORMANCE (Points 12-15)

### Point 12: Optimize APIs ✅
**Current:** Inefficient queries, monolithic components  
**Action:**
- [ ] Add query optimization (select specific columns, not *)
- [ ] Implement pagination for large result sets
- [ ] Add response compression (gzip)
- [ ] Use async/await properly (no blocking calls)
- [ ] Cache frequently accessed data in memory

**Files to Modify:**
```
server/routes/qeegRoutes.js (optimize queries)
server/index.js (add compression)
```

---

### Point 13: DB Optimization ✅
**Current:** Unknown optimization state  
**Action:**
- [ ] Create DB query analyzer
- [ ] Add indexes on frequently queried columns
- [ ] Monitor query performance
- [ ] Create connection pooling (if using direct DB)
- [ ] Add query result caching

**Files to Create:**
```
server/services/dbOptimizer.js
server/config/indexes.sql
```

---

### Point 14: Caching ✅
**Current:** No caching  
**Action:**
- [ ] Implement in-memory cache for:
  - User roles/permissions
  - Clinic data
  - Report templates
- [ ] Set cache expiration times
- [ ] Add cache invalidation on updates

**Files to Create:**
```
server/services/cacheService.js
server/config/cacheConfig.js
```

**Files to Modify:**
```
server/routes/qeegRoutes.js (add caching)
```

---

### Point 15: Load Testing ✅
**Current:** k6-test.js exists but unused  
**Action:**
- [ ] Create comprehensive load test script
- [ ] Test endpoints:
  - File uploads under load
  - Report generation
  - API calls
- [ ] Identify bottlenecks
- [ ] Document results

**Files to Create:**
```
load-tests/scenarios.js
load-tests/results.md
```

---

## PHASE 4: DATA (Points 16-18)

### Point 16: Clean DB Schema ✅
**Current:** Schema not documented  
**Action:**
- [ ] Document all tables and columns
- [ ] Export current Supabase schema
- [ ] Create schema validation checklist

**Files to Create:**
```
database/schema.sql
database/schema-documentation.md
```

---

### Point 17: DB Constraints ✅
**Current:** Cannot verify constraints  
**Action:**
- [ ] Add PRIMARY KEY constraints
- [ ] Add UNIQUE constraints on emails
- [ ] Add FOREIGN KEY constraints
- [ ] Add CHECK constraints for validity
- [ ] Document all constraints

**Files to Create:**
```
database/constraints.sql
database/rls-policies.sql
```

---

### Point 18: Migration Testing ✅
**Current:** apply-migration.js exists, untested  
**Action:**
- [ ] Document migration strategy
- [ ] Create rollback procedures
- [ ] Test migrations on staging
- [ ] Add migration validation

**Files to Create:**
```
database/migrations/README.md
database/migrations/rollback.sql
```

---

## PHASE 5: OBSERVABILITY (Points 20-23)

### Point 20: Central Logging ✅
**Current:** No centralized logging  
**Action:**
- [ ] Implement Winston logger (already started in Point 9)
- [ ] Log to file: `logs/app.log`
- [ ] Create log rotation
- [ ] Add structured JSON logging
- [ ] Create log analysis dashboard

**Files to Create:**
```
server/config/logger.js
logs/.gitkeep
```

---

### Point 21: Error Tracking ✅
**Current:** No error tracking  
**Action:**
- [ ] Create custom error tracking service
- [ ] Log all errors with context
- [ ] Group similar errors
- [ ] Track error frequency
- [ ] Create alerts for critical errors

**Files to Create:**
```
server/services/errorTracker.js
server/config/errorTracking.js
```

---

### Point 22: Monitoring ✅
**Current:** No monitoring  
**Action:**
- [ ] Create health check endpoint
- [ ] Monitor:
  - API response times
  - Error rates
  - File upload success/failure
  - Database connection status
- [ ] Create monitoring dashboard

**Files to Create:**
```
server/routes/healthCheck.js
server/services/metricsCollector.js
```

---

### Point 23: Alerts ✅
**Current:** No alerts  
**Action:**
- [ ] Create alert service for critical events
- [ ] Alert on:
  - High error rate (>5% in 5 min)
  - Database connection failure
  - API response time >5s
  - File upload failures
- [ ] Log alerts to file

**Files to Create:**
```
server/services/alertService.js
server/config/alertConfig.js
```

---

## PHASE 6: DEVOPS (Points 24-27)

### Point 24: Env Setup ✅
**Current:** Works locally, incomplete  
**Action:**
- [ ] Create `.env.template` with all required vars
- [ ] Create environment setup script
- [ ] Document environment setup procedure

**Files to Create:**
```
scripts/setup-env.sh
docs/environment-setup.md
```

---

### Point 25: CI/CD ✅
**Current:** Basic GitHub Actions  
**Action:**
- [ ] Add linting to CI
- [ ] Add type checking (tsc)
- [ ] Add test execution
- [ ] Add security scanning
- [ ] Add build validation

**Files to Create:**
```
.github/workflows/ci.yml (update)
```

---

### Point 26: Deployment Automation ✅
**Current:** Manual deployment  
**Action:**
- [ ] Create deployment validation script
- [ ] Create pre-deployment checklist automation
- [ ] Create deployment notification system

**Files to Create:**
```
scripts/validate-deployment.js
scripts/pre-deploy-checks.js
```

---

### Point 27: Rollback Testing ✅
**Current:** No rollback procedure  
**Action:**
- [ ] Document rollback steps
- [ ] Create backup strategy
- [ ] Test rollback procedure
- [ ] Create version pinning strategy

**Files to Create:**
```
docs/rollback-procedure.md
scripts/backup-before-deploy.sh
```

---

## PHASE 7: QA (Points 28-30)

### Point 28: End-to-End Testing ✅
**Current:** Only screenshot audits  
**Action:**
- [ ] Create Playwright tests for:
  - User signup/login flow
  - QEEG file upload
  - Report generation
  - Payment flow
  - Admin operations

**Files to Create:**
```
e2e-tests/tests/auth.spec.js
e2e-tests/tests/qeeg-upload.spec.js
e2e-tests/tests/payment.spec.js
e2e-tests/playwright.config.js
```

---

### Point 29: Regression Testing ✅
**Current:** No regression tests  
**Action:**
- [ ] Create regression test suite
- [ ] Test critical flows after changes
- [ ] Create test data generators
- [ ] Document regression test procedure

**Files to Create:**
```
server/__tests__/regression/critical-flows.test.js
server/__tests__/utils/testDataGenerator.js
```

---

### Point 30: Smoke Testing ✅
**Current:** No smoke tests  
**Action:**
- [ ] Create smoke test suite
- [ ] Test critical paths
- [ ] Test post-deployment
- [ ] Create smoke test automation

**Files to Create:**
```
server/__tests__/smoke/critical-endpoints.test.js
scripts/run-smoke-tests.sh
```

---

## PHASE 8: UX (Points 31-33)

### Point 31: Fix UI Issues ✅
**Current:** Generally OK  
**Action:**
- [ ] Review and fix UI inconsistencies
- [ ] Test responsive design
- [ ] Test on multiple browsers

**Files to Modify:**
```
src/components/* (as needed)
```

---

### Point 32: Error Messages ✅
**Current:** Messages present but inconsistent  
**Action:**
- [ ] Create error message constants
- [ ] Standardize error message format
- [ ] Make messages user-friendly

**Files to Create:**
```
src/constants/errorMessages.js
src/utils/formatErrorMessage.js
```

---

### Point 33: Empty/Loading States ✅
**Current:** Handled  
**Action:**
- [ ] Verify all async operations show loading state
- [ ] Verify empty states have helpful messages

**Files to Modify:**
```
src/components/* (verify loading/empty states)
```

---

## PHASE 9: ADMIN (Points 34-35)

### Point 34-35: Admin Panel ✅
**Current:** Exists  
**Action:**
- [ ] Verify admin access control
- [ ] Verify user management functions
- [ ] Add admin activity logging

**Files to Modify:**
```
src/components/admin/* (verify RBAC)
```

---

## PHASE 10: DOCUMENTATION (Points 36-38)

### Point 36: Architecture Doc ✅
**Current:** CLAUDE.md exists  
**Action:**
- [ ] Expand with diagrams
- [ ] Document data flow
- [ ] Document deployment architecture

**Files to Create:**
```
docs/architecture.md
docs/data-flow.md
```

---

### Point 37: API Doc ✅
**Current:** Missing  
**Action:**
- [ ] Create OpenAPI/Swagger spec
- [ ] Document all endpoints
- [ ] Document request/response formats
- [ ] Document error codes

**Files to Create:**
```
docs/api-documentation.md
openapi.json
```

---

### Point 38: Deployment Guide ✅
**Current:** Partial  
**Action:**
- [ ] Create step-by-step deployment guide
- [ ] Create troubleshooting guide
- [ ] Document secret rotation

**Files to Create:**
```
docs/deployment-guide.md
docs/troubleshooting.md
```

---

## PHASE 11: GO-LIVE (Points 39-40)

### Point 39: No Critical Bugs ✅
**Current:** Multiple issues  
**Action:**
- [ ] Fix all P0 issues from this plan
- [ ] Run full test suite
- [ ] Verify all 40 points implemented
- [ ] Security review

---

### Point 40: Stakeholder Sign-Off ✅
**Current:** Not possible  
**Action:**
- [ ] Complete all 40 points
- [ ] Generate compliance report
- [ ] Get stakeholder approval
- [ ] Deploy to production

---

## Implementation Order (Recommended)

**Week 1 (Security - Points 1-7):**
1. Authentication + RBAC (Points 1-2)
2. Input Validation (Point 4)
3. Rate Limiting (Point 6)
4. API Security (Point 3)
5. OWASP Checks (Point 7)

**Week 2 (Stability + Observability - Points 8-11, 20-23):**
6. Global Error Handling (Point 8)
7. Logging & Error Tracking (Points 9, 20-21)
8. Retry Logic (Point 10)
9. Monitoring & Alerts (Points 22-23)

**Week 3 (Performance + Data - Points 12-18):**
10. API Optimization (Point 12)
11. DB Optimization & Constraints (Points 13, 16-17)
12. Caching (Point 14)
13. Migration Testing (Point 18)

**Week 4 (Testing + DevOps - Points 25-30):**
14. Unit & Integration Tests (Point 11)
15. E2E Tests (Point 28)
16. Smoke Tests (Point 30)
17. CI/CD & Deployment (Points 25-26)

**Week 5 (Documentation + Go-Live - Points 36-40):**
18. Create all documentation (Points 36-38)
19. Final security review (Point 39)
20. Stakeholder sign-off (Point 40)

---

## Success Criteria

- [ ] All 40 points implemented
- [ ] All tests passing
- [ ] Security review passed
- [ ] Zero critical vulnerabilities
- [ ] Error tracking working
- [ ] Monitoring in place
- [ ] Stakeholder approval obtained

