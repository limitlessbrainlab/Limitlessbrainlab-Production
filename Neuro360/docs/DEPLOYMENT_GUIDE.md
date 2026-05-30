# Deployment Guide
## Points 24, 26, 27, 38-40: Deployment, Rollback, Go-Live Checklist

---

## Pre-Deployment Checklist

### 1 Day Before Deployment

- [ ] Run pre-deployment checklist:
  ```bash
  node scripts/pre-deploy-checklist.js
  ```

- [ ] Create production backup:
  ```bash
  ./scripts/backup-before-deploy.sh
  ```

- [ ] Verify all tests pass:
  ```bash
  npm test
  npm run test:integration
  npm run test:e2e
  ```

- [ ] Code review: All PRs approved
- [ ] Security scan: `npm audit` shows no high/critical issues
- [ ] Performance test: Load test under expected peak load
- [ ] Database: Backups verified, migration plan reviewed

### 30 Minutes Before Deployment

- [ ] Notify team in Slack
- [ ] Take screenshot of current production state
- [ ] Verify all environment variables in Render are correct
- [ ] Check Render health dashboard
- [ ] Have rollback procedure ready

---

## Deployment Steps

### Step 1: Push to Main Branch
```bash
# Ensure all changes are committed
git status

# Create final commit if needed
git add .
git commit -m "chore: pre-deployment cleanup"

# Push to main
git push origin main

# GitHub Actions will automatically:
# - Run tests
# - Run linting
# - Build frontend and backend
# - Deploy to production
```

### Step 2: Monitor Deployment

**In GitHub:**
- Go to Actions tab
- Watch CI/CD pipeline progress
- Ensure all checks pass ✅

**In Render:**
- Dashboard shows deployment in progress
- Wait for deployment to complete
- Check logs for errors

**In Application:**
- Open browser: https://neurosense360.site
- Test critical flows:
  - [ ] Server is running (`/api/health`)
  - [ ] Can login
  - [ ] Can upload QEEG file
  - [ ] Can generate report
  - [ ] Admin dashboard works

### Step 3: Post-Deployment Verification

```bash
# 1. Check health
curl https://neurosense360.site/api/health

# 2. Check logs
# In Render dashboard, view logs for:
# - No errors
# - All services started
# - Database connected

# 3. Test critical endpoints
curl -H "Authorization: Bearer <token>" \
  https://neurosense360.site/api/qeeg/quota-status

# 4. Check performance
# Open dev tools, Network tab
# Verify response times are normal
```

### Step 4: Notify Stakeholders
- [ ] Post deployment success in Slack
- [ ] Send email to team
- [ ] Update status page

---

## Rollback Procedure (If Deployment Fails)

### Automatic Rollback (If Within 1 Hour)

Render automatically keeps the previous version for 1 hour. To rollback:

1. Go to Render Dashboard
2. Select `neuro360-backend`
3. Click "Rollback to Previous Deploy"
4. Wait for restart

### Manual Rollback (If Beyond 1 Hour)

```bash
# 1. Restore database from backup
./scripts/restore_database.sh backups/neuro360_backup_TIMESTAMP.sql.gz

# 2. Revert code to previous commit
git revert HEAD
git push origin main

# 3. Trigger redeploy in Render
# (GitHub Actions will re-run)

# 4. Verify application works
curl https://neurosense360.site/api/health
```

### Decision Tree for Rollback

```
Issue Detected?
  ├─ YES: Deployment Errors
  │  └─ Automatic Rollback (Render button)
  │     └─ Works? → Done, investigate issue
  │     └─ Fails? → Manual Rollback (DB restore)
  │
  └─ NO: Application works
     └─ Continue monitoring
```

---

## Disaster Recovery

### Full Database Restore

```bash
# List available backups
ls -lh backups/

# Restore from specific backup
./scripts/restore_database.sh backups/neuro360_20260508_150000.sql.gz

# Verify data integrity
SELECT COUNT(*) FROM patients;
SELECT COUNT(*) FROM qeeg_files;
SELECT COUNT(*) FROM qeeg_reports;
```

### Data Loss Recovery

If critical data is lost:

1. **Immediate:**
   - Take application offline
   - Stop all write operations
   - Notify stakeholders

2. **Investigation:**
   - Check backup logs
   - Identify time of loss
   - Find closest clean backup

3. **Recovery:**
   - Restore from backup
   - Verify data integrity
   - Test critical flows
   - Bring application online

4. **Post-Recovery:**
   - Investigate root cause
   - Implement preventive measures
   - Review backup strategy
   - Document incident

---

## Environment Variables

### Required Production Variables

All these must be set in Render environment:

```
# Core
NODE_ENV=production
PORT=5000

# Supabase
SUPABASE_URL=<production-url>
SUPABASE_SERVICE_ROLE_KEY=<production-key>

# Gemini API
GEMINI_API_KEY=<your-key>
GEMINI_REQUEST_DELAY_MS=2000
GEMINI_DAILY_LIMIT=50

# Email
EMAIL_USER=<noreply-email>
EMAIL_PASS=<app-password>
EMAIL_FROM=noreply@neurosense360.site

# Stripe
STRIPE_SECRET_KEY=<production-key>
STRIPE_WEBHOOK_SECRET=<production-secret>

# Frontend URL (for CORS)
FRONTEND_URL=https://neurosense360.site

# Logging
LOG_LEVEL=INFO
```

### Verify Variables

```bash
# Check in Render dashboard:
# Settings → Environment
# All required vars should be present
```

---

## Performance Monitoring Post-Deployment

### First Hour
- [ ] Check error rate (should be <1%)
- [ ] Monitor API response times (should be <2s)
- [ ] Watch for memory leaks
- [ ] Monitor database connections

### First Day
- [ ] Review error logs for patterns
- [ ] Check user reports in support chat
- [ ] Monitor database performance
- [ ] Check email delivery rates

### First Week
- [ ] Generate performance report
- [ ] Check file upload success rate
- [ ] Monitor QEEG processing times
- [ ] Verify backup completion

---

## Health Checks

### Automated Checks (Every 5 minutes)

Render monitors:
- [ ] HTTP endpoint responds
- [ ] No memory leaks
- [ ] Database connection stable
- [ ] CPU usage normal

### Manual Checks (Daily)

```bash
# Check application logs
curl https://neurosense360.site/api/health

# Check database
SELECT NOW();  # Verify connectivity

# Check file storage
# Verify files can be uploaded and retrieved

# Check email
# Verify verification emails are sending
```

---

## Success Criteria

✅ All tests pass in CI/CD  
✅ Pre-deployment checklist passes  
✅ Backup created successfully  
✅ Deployment completes without errors  
✅ Health check endpoint responds  
✅ Can login and access dashboard  
✅ Can upload QEEG files  
✅ Reports generate successfully  
✅ No critical errors in logs  
✅ Team notified of deployment  

---

## Incident Response

### If Deployment Fails

1. **Immediate:** Rollback using procedure above
2. **Investigation:** Check error logs
3. **Fix:** Identify and fix issue locally
4. **Test:** Run full test suite
5. **Re-deploy:** Push fix and re-deploy
6. **Post-mortem:** Document what went wrong

### If Critical Bugs Found Post-Deploy

1. **Assessment:** Determine severity
   - Can users login? → Critical
   - Can users upload? → Critical
   - UI issues? → Non-critical

2. **Decision:**
   - Can fix in <1 hour? → Fix and re-deploy
   - Takes longer? → Rollback

3. **Communication:** Notify users via status page

---

## Version Control

### Git Workflow

```
main branch (production-ready)
  ↓
git push → GitHub Actions runs
            └─ Tests pass?
              ├─ YES → Build & Deploy
              └─ NO → Reject

develop branch (staging)
  ↓
PR Review → Merge to main
```

### Commit Messages

```
feat: add new feature
fix: fix critical bug
chore: pre-deployment cleanup
docs: update documentation
```

---

## Contacts & Escalation

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| DevOps Lead | Murali | murali@... | Available |
| Backend Lead | - | - | - |
| Security | - | - | - |
| Incident Commander | - | - | On-call |

---

## Documentation

Related documents:
- `API_DOCUMENTATION.md` - API reference
- `SECURITY_IMPLEMENTATION_SUMMARY.md` - Security details
- `QUICK_START_GUIDE.md` - Getting started
- `pre-deploy-checklist.js` - Automated checks

