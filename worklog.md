---
Task ID: 1
Agent: Main Agent
Task: Deploy Z ISP Solution to Vercel

Work Log:
- Analyzed previous session issues (SSO protection, sourceless deployments)
- Discovered Vercel CLI deployment works (unlike REST API file upload)
- Created new Vercel project (old one had SSO/blocking issues)
- Set DATABASE_URL and SESSION_SECRET env vars
- Fixed `ensureTables()` being called on every request (moved to write-only ops)
- Deployed successfully with all 26 routes (1 static + 25 dynamic)
- Renamed project from "my-project" to "z-isp"
- Pushed all code to GitHub

Stage Summary:
- App deployed at: https://my-project-rho-pearl.vercel.app (alias: z-isp.vercel.app would work if domain configured)
- Frontend loads correctly (HTTP 200)
- API routes respond correctly (401 when not authenticated)
- All 26 routes built and deployed
- BLOCKER: Neon database unreachable from both local and Vercel environments
  - Both pooler and non-pooler URLs fail with "Can't reach database server"
  - TCP port 5432 is open but PostgreSQL handshake fails
  - User needs to check Neon console (https://console.neon.tech)
  - Likely causes: project suspended, deleted, or password rotated
