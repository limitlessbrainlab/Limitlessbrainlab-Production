# Automatic Backend Recovery

Use this pattern when a non-technical admin must recover a hosted backend without calling a developer.

## User experience

- **Green light:** service is healthy.
- **Red light:** the app detected a failed health check and automatically requests one restart.
- **Restore service:** show this only if the service remains red after the automatic attempt. Tell the user to wait two minutes before using it.
- Never expose HTTP codes, provider names, API keys, or stack traces to normal users.

## Required secure variables

Add these to the production host's encrypted environment-variable settings. Do not put them in frontend variables such as `VITE_*`.

```text
RENDER_API_KEY=<Render API key>
RENDER_SERVICE_ID=<Render web-service ID>
BACKEND_HEALTH_URL=https://your-backend.example.com/api/health
SUPABASE_URL=<server-side Supabase URL>
SUPABASE_SERVICE_ROLE_KEY=<server-side Supabase service key>
```

`BACKEND_HEALTH_URL` is optional if the code has a safe default. The API key must be allowed to restart only the intended Render service.

## Server endpoint

Create a serverless endpoint outside the backend proxy (for example, `/api/ops/backend`). Its rules are:

1. Require a valid signed-in super-admin session.
2. `GET` calls the backend health URL with a short timeout and returns only `healthy`, `status`, and `restartConfigured`.
3. `POST { "action": "restart" }` calls Render:

```text
POST https://api.render.com/v1/services/<RENDER_SERVICE_ID>/restart
Authorization: Bearer <RENDER_API_KEY>
```

4. Return a plain message such as: `The report service is restarting. Please retry in two minutes.`
5. Keep the restart key server-side. Never send it to the browser.

For Vercel rewrites, exclude this endpoint from any rule that proxies `/api/*` to the failing backend. Otherwise the recovery control disappears exactly when it is needed.

## Frontend behaviour

On the report-processing page, poll the protected health endpoint every 30 seconds while a super admin has the page open.

```text
if health check fails and restart is configured and no restart was attempted:
  request one restart automatically

if health check is healthy:
  reset the attempted-restart flag

if still unhealthy after two minutes:
  show “Restore service” as a manual fallback
```

Use an in-memory per-page attempted-restart flag. It prevents repeated restart requests while one incident is being recovered. A real background watchdog can be added later if recovery is required when nobody is signed in.

## Test safely

Do not deliberately stop a live backend. Temporarily point only `BACKEND_HEALTH_URL` to a harmless missing route, deploy, and refresh the admin processing page. Confirm the red light and automatic restart request, then remove the temporary variable and redeploy. The actual backend remains available during this test.

## Limits

Restarting fixes transient hosting failures and stalled processes. It cannot repair a broken deployment, missing secrets, exhausted billing, or a third-party outage. Keep a technical diagnostics section available only to administrators for a future support team.
