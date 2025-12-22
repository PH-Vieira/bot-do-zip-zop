# Backend Debugging Guide

## Problem Statement

The backend was receiving requests but had **no console logs**, making it impossible to debug issues like:
- 521 Cloudflare errors (Web server is down)
- Requests not reaching the backend
- Backend crashes or failures

## Solution Implemented

### 1. Enhanced Startup Logging

The server now logs detailed startup information:

```
[timestamp] INFO: === Starting WhatsApp API Backend ===
[timestamp] INFO: Environment: development
[timestamp] INFO: Port: 3000
[timestamp] INFO: CORS Origin: *
[timestamp] INFO: === Server Started Successfully ===
[timestamp] INFO: Server listening on http://0.0.0.0:3000
[timestamp] INFO: Health check: http://0.0.0.0:3000/health
[timestamp] INFO: API base URL: http://0.0.0.0:3000/api
[timestamp] INFO: WebSocket server ready on same port
[timestamp] INFO: ===================================
```

### 2. Request/Response Logging

Every HTTP request is now logged with:
- HTTP method (GET, POST, etc.)
- URL path
- Request headers
- Client IP address
- Request hostname

Example:
```
[timestamp] INFO: Incoming request
    method: "POST"
    url: "/api/session/start"
    headers: {
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0 ...",
      ...
    }
    ip: "192.168.1.1"
    hostname: "whatsapp.monumental.center"
```

### 3. Response Logging

Every response is logged with:
- HTTP method
- URL
- Status code

Example:
```
[timestamp] INFO: Request completed
    method: "POST"
    url: "/api/session/start"
    statusCode: 200
```

### 4. Error Logging

All errors are now logged with full details:
- Error message
- Stack trace
- HTTP method
- URL

Example:
```
[timestamp] ERROR: Request error
    error: "Database connection failed"
    stack: "Error: Database connection failed\n    at ..."
    method: "POST"
    url: "/api/session/start"
```

### 5. Session Controller Logging

All session operations now have detailed logs:

**Creating a session:**
```
[timestamp] INFO: Creating new session...
[timestamp] INFO: Generated sessionId: abc123xyz
[timestamp] INFO: Session created successfully: abc123xyz
```

**Getting session status:**
```
[timestamp] INFO: Getting status for session: abc123xyz
[timestamp] INFO: Session abc123xyz status: open, active: true
```

**Session not found:**
```
[timestamp] WARN: Session not found: abc123xyz
```

### 6. Enhanced Health Check

The `/health` endpoint now returns:
```json
{
  "status": "ok",
  "timestamp": 1703260800000,
  "uptime": 3600.5,
  "environment": "development",
  "port": 3000
}
```

And logs:
```
[timestamp] DEBUG: Health check requested
```

## How to Debug Issues

### Issue: No logs appearing

**Possible causes:**
1. Server not running
2. Wrong environment configuration
3. Logger not configured

**How to check:**
- Look for startup logs when server starts
- If no logs appear, check if `NODE_ENV` is set correctly
- Verify `pino` and `pino-pretty` are installed

### Issue: 521 Cloudflare Error

**What it means:** Cloudflare cannot connect to the origin server

**How to debug with new logs:**
1. Check if startup logs appear - if NO, server didn't start
2. Check if server is listening on `0.0.0.0` (it should be)
3. Check firewall rules between Cloudflare and server
4. Verify DNS points to correct server
5. Check if health check endpoint works: `curl http://localhost:3000/health`

**Expected logs if backend is working:**
```
=== Starting WhatsApp API Backend ===
Environment: production
Port: 3000
CORS Origin: https://frontend-domain.com
=== Server Started Successfully ===
Server listening on http://0.0.0.0:3000
```

**If you see NO logs:** The backend process is not running or crashed during startup

**If you see startup logs but no request logs:** Requests are not reaching the backend (network/proxy issue)

### Issue: Requests not logged

**Possible causes:**
1. Reverse proxy not forwarding to backend
2. Backend listening on wrong host/port
3. Firewall blocking connections

**How to debug:**
1. Check startup logs to confirm server is listening on correct port
2. Test locally: `curl http://localhost:3000/health`
3. If curl works locally but not externally, it's a network issue
4. Check proxy configuration (nginx, apache, etc.)

### Issue: Backend crashes on startup

**How to debug:**
1. Look for error logs with stack traces
2. Common issues:
   - Database connection failed
   - Redis connection failed
   - Missing environment variables
   - Port already in use

**Expected error log format:**
```
[timestamp] ERROR: Failed to start server
    error: "listen EADDRINUSE: address already in use :::3000"
    stack: "Error: listen EADDRINUSE...\n    at ..."
```

## Testing Checklist

When the backend starts, you should see:

- [ ] Startup banner with configuration
- [ ] Server listening confirmation
- [ ] When you hit `/health`: "Health check requested" log
- [ ] When you hit `/api/session/start`: "Incoming request" log
- [ ] After request completes: "Request completed" log with status code
- [ ] If error occurs: "Request error" log with details

## Production Recommendations

1. **Set `NODE_ENV=production`** to reduce log verbosity
2. **Use log aggregation** (CloudWatch, Datadog, etc.) to collect logs
3. **Monitor health check** endpoint for uptime
4. **Set up alerts** for error logs
5. **Use structured logging** already implemented via Pino

## Environment Variables

Make sure these are set:

```bash
PORT=3000                    # Port to listen on
NODE_ENV=production          # production or development
CORS_ORIGIN=https://...      # Frontend origin for CORS
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Quick Diagnostics

Run this command to check if backend is running and accessible:

```bash
# Local test
curl http://localhost:3000/health

# External test (from another server)
curl http://YOUR_SERVER_IP:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": 1703260800000,
  "uptime": 123.45,
  "environment": "production",
  "port": 3000
}
```

If this fails, the backend is not accessible. Check:
1. Is the backend process running?
2. Is it listening on the correct port?
3. Is the port open in firewall?
4. Can you reach the server from where you're testing?

## Summary

The backend now has comprehensive logging at all critical points:
- ✅ Startup configuration
- ✅ Server listening confirmation
- ✅ Every incoming request
- ✅ Every response
- ✅ All errors with stack traces
- ✅ All session operations
- ✅ Health check monitoring

**No more silent failures!** Every request and error will now be logged.
