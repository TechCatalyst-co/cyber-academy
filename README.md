# Cyber Academy by TechCatalyst

Cyber Academy is TechCatalyst's multi-tenant security awareness training platform for providers who deliver a 12-month program to many small and medium businesses. One installation serves all of your clients. Each client company gets its own isolated workspace, and your team sees every client from a single provider dashboard.

## What it does

**For you (the provider)**
- Client overview: compliance, completion, phishing click and report rates, overdue work and estimated monthly revenue across all clients
- Add clients, choose their plan (Essentials, Professional, Premium), set the program start date, pause accounts
- Open any client's workspace to manage it on their behalf

**For each client company**
- Dashboard: compliance rate, training completion, quiz scores, phishing trend against the baseline, status by department, people who need attention, progress on this year's releases
- Employee compliance: per-employee status (Compliant, At risk, Non-compliant), completion, overdue modules, quiz average, phishing results, repeat-clicker flag and a transparent human-risk score
- Employee records: full training history, quiz attempts, phishing history, certificates; excuse or extend assignments; assign coaching courses
- Add employees one by one or import from CSV; managers see only their own department
- Phishing campaigns: create from the program calendar, record or import outcomes (clicked, entered data, reported), close campaigns
- Reports: compliance CSV, training-records CSV, phishing CSV and a printable evidence pack for insurers and auditors
- Settings: pass mark, days to complete modules, new-starter window, activity log

**For employees**
- My training: what is due, what is overdue, what is done
- Course player: short lessons, a realistic scenario, a practical action, then a knowledge check. Correct answers are only revealed after passing
- Certificates for every completed course

## The curriculum (built in)

| Type | Courses | When |
| --- | --- | --- |
| New starters | Security Essentials (ONB-01) | First week after hire, for staff who join after the program starts |
| Core modules | CORE-01 to CORE-12 | One per month |
| Six-month refreshers | REF-A (modules 1–6), REF-B (modules 7–12), 15-question check | Months 6 and 12 |
| Role tracks | Leadership, IT, Finance, HR, Remote/field, Customer-facing | Months 3 and 9, Professional and Premium plans |

Assignments are created automatically from each client's program start date and repeat every year. Edit the content in `content/`.

## Compliance rules

- **Non-compliant:** at least one assignment is past its due date and not complete
- **At risk:** nothing overdue, but something is due within 7 days and not complete
- **Compliant:** everything else. Excused assignments are not counted
- **Compliance rate:** share of active employees who are not non-compliant
- **Repeat clicker:** 3 or more failed phishing tests in 180 days
- **Risk score (0–100):** +15 per overdue module (max 45), +12 per failed phishing test in 180 days and +8 more if data was entered (max 40), +10 if average quiz score is under 80, −10 for reporting a simulation

These live in `core/compliance.js`.

## Database: MongoDB Atlas

Cyber Academy stores everything in MongoDB Atlas. Each table in `core/schema.js` is a collection in one database (`cyber_academy` by default); every client-owned document carries a `tenant_id`, and indexes are created automatically on first start (unique on `users.email` and `tenants.slug`). The adapter is `server/store-mongo.js`, using the official `mongodb` Node.js driver.

### Set up Atlas (about 15 minutes)

1. **Cluster.** In Atlas, create a cluster (M10 or larger for production; M0 is fine for a trial). Pick the region closest to your server and to your clients' data-residency needs.
2. **Database user.** Security > Database Access > Add user, e.g. `cyber_academy_app`, with the built-in role **readWrite** on the database `cyber_academy` only (not "Atlas admin"). Use a long generated password.
3. **Network access.** Security > Network Access: add your server's outbound IP address (or your cloud provider's private endpoint / VPC peering). Avoid `0.0.0.0/0` in production.
4. **Connection string.** Connect > Drivers > Node.js. Copy the `mongodb+srv://...` string and put the password in it. That is `MONGODB_URI`.
5. **Backups.** Turn on Cloud Backup with point-in-time restore. Atlas encrypts data at rest and requires TLS in transit by default.

### Run it

Requires Node.js 22.13 or newer.

Settings are read from a `.env` file in the project root (Node's built-in `--env-file-if-exists`, no extra package). `.env` is in `.gitignore`; never commit it.

```bash
npm install
cp .env.example .env        # then edit .env: MONGODB_URI, SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
openssl rand -base64 48     # paste the output into SESSION_SECRET
npm start                   # http://localhost:3000
```

`npm start`, `npm run dev`, `npm run seed` and `npm run test:mongo` all load `.env`. If the file is missing they carry on with whatever is in the environment, which is how the hosted deployments below work. A variable already set in the shell wins over the same variable in `.env`, so you can override one setting for a single command.

`ADMIN_EMAIL` and `ADMIN_PASSWORD` are only used on first start to create the provider admin; remove them from `.env` afterwards.

Check it: `curl http://localhost:3000/api/health` returns `{"ok":true,"database":"mongodb",...}`, or 503 if Atlas is unreachable.

Want demo data? Load it into a **separate** database, never the live one (the shell values override `.env`):

```bash
MONGODB_DB=cyber_academy_demo ALLOW_DEMO_SEED=1 npm run seed -- --reset   # five fictional clients, password Demo-Password-2026
```

Or with Docker (see `.env.example` for every setting):

```bash
docker build -t cyber-academy .
docker run -p 3000:3000 --env-file .env cyber-academy
```

Put it behind HTTPS (a load balancer, Caddy or nginx) and set `HSTS=1`. Because sessions and data live outside the container, you can run several instances behind the load balancer as long as they share `SESSION_SECRET`.

**Local development without Atlas:** comment out `MONGODB_URI` and `NODE_ENV` in `.env` (or run without a `.env`) and the server falls back to a local SQLite file in `./data` (Node's built-in SQLite). With `NODE_ENV=production` it refuses to start without `MONGODB_URI`.

## Deploy

The app is one Node server that serves both the API and the web client, so it needs a host that runs Node. **Render** runs the server. **Netlify** is optional: it can serve the web client from its CDN on your domain and forward `/api/*` to Render. Either way, set the variables in the host's dashboard; the `.env` file stays on your machine.

### Render (the server)

The repo includes `render.yaml`, a Render Blueprint for the web service.

1. Push the project to GitHub or GitLab (check `.env` and `data/` are not committed).
2. In Render: **New > Blueprint**, pick the repository. Render reads `render.yaml` and creates the `cyber-academy` web service (Node 22, `npm ci --omit=dev`, `npm start`, health check `/api/health`). It generates `SESSION_SECRET` for you.
   Without the Blueprint: **New > Web Service**, runtime **Node**, build command `npm ci --omit=dev`, start command `npm start`, and under Advanced set the health check path to `/api/health`.
3. Fill in the variables it asks for (Environment tab):
   - `MONGODB_URI`: your Atlas connection string
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` (12+ characters), `ADMIN_NAME`: first start only
   - Already set by the Blueprint: `NODE_ENV=production`, `NODE_VERSION=22`, `MONGODB_DB`, `BRAND_NAME`, `HSTS=1`. Don't set `PORT`; Render provides it.
4. Let Atlas accept Render's connections: in the Render service, **Connect > Outbound** lists its outbound IP addresses. Add each one in Atlas under Security > Network Access.
5. Deploy. When the log shows `Created provider admin ...`, sign in at `https://<service>.onrender.com`, then delete `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the Environment tab.
6. Optional: **Settings > Custom Domains** to serve it on your own domain (Render issues the TLS certificate).

To scale out, raise the instance count; every instance shares the same `SESSION_SECRET` automatically. Use a paid plan for production: free instances sleep when idle and the first request after that takes about a minute.

### Netlify (the web client, optional)

Netlify only serves static files, so it can't run the server. The included `netlify.toml` publishes `client/` as-is (no build step), sends the same security headers as the Node server, and proxies `/api/*` to Render, so the browser still talks to a single origin and the Content Security Policy stays `'self'`.

1. Deploy Render first and copy its URL.
2. In `netlify.toml`, replace `https://cyber-academy.onrender.com` in the `/api/*` redirect with your Render URL. Commit and push.
3. In Netlify: **Add new site > Import an existing project**, pick the repository. The settings come from `netlify.toml` (publish directory `client`, no build command). No environment variables are needed on Netlify.
4. Deploy, then open `https://<site>.netlify.app/api/health`. It should return the same JSON as Render. Sign in at the site's root.
5. Optional: **Domain management** to add your own domain. Users then use the Netlify address; the Render address keeps working for the API.

Client changes deploy on Netlify, server changes on Render; both redeploy on every push to the connected branch.

### Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | – | Atlas connection string. Required in production |
| `MONGODB_DB` | `cyber_academy` | Database name |
| `SESSION_SECRET` | – | Signs session tokens. Required in production; shared by every instance |
| `NODE_ENV` | – | `production` enforces the two settings above and blocks demo seeding |
| `PORT` | 3000 | HTTP port |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | – | Creates the first provider admin on first start |
| `BRAND_NAME` | Cyber Academy | Product name shown in the app and on certificates |
| `SESSION_HOURS` | 12 | Session length |
| `PBKDF2_ITERATIONS` | 310000 | Password hashing cost |
| `HSTS` | off | Set to `1` when served over HTTPS |
| `DATA_DIR` | `./data` | Development only: SQLite file and generated session secret |
| `ALLOW_DEMO_SEED` | – | Set to `1` to load demo data into a demo database while `NODE_ENV=production` |

## Brand

The interface follows the TechCatalyst Brand Style Guide v1.0: Royal #1F4487, White, Mist #93A7CB and Ink #101821, a wide grotesque (Archivo, self-hosted from `client/fonts/`, SIL Open Font License) with JetBrains Mono for register labels. Logo files live in `client/brand/` (from the official TechCatalyst logo PNG). `DESIGN.md` records the full design system.

## Architecture

```
core/        Business logic shared by server and demo
  app.js       API routes, auth checks, handlers (transport-agnostic)
  tenancy.js   Tenant-scoped data access
  scheduler.js Turns each client's program calendar into assignments
  compliance.js, analytics.js   Status, risk, dashboards, evidence pack
  auth.js      PBKDF2 password hashing and HMAC-signed session tokens (Web Crypto)
  schema.js    Tables and columns (also the query whitelist)
  store-memory.js  In-memory adapter (demo and tests)
  seed.js      Demo data
content/     Course lessons, quizzes and phishing themes
server/      Node HTTP server, MongoDB adapter (store-mongo.js), SQLite dev fallback, config, seed script
client/      Web app (plain ES modules, no build step)
demo/        Single-file browser demo build
tests/       API and isolation tests (npm test)
```

**Multi-tenancy.** Every client-owned row carries a `tenant_id`. Requests inside a company go through `scopedStore`, which adds the tenant to every read and write and refuses rows from other tenants, so a handler cannot leak data across clients. Company users are always pinned to their own tenant; only provider admins can choose a tenant (with the `X-Tenant-Id` header). Tests cover cross-tenant reads and writes.

**Security.** PBKDF2-SHA256 password hashing, signed expiring session tokens, login throttling, role checks on every route, database filters checked against the schema (only known fields and plain values, so request data can never become a MongoDB query operator), strict Content Security Policy and security headers, CSV formula-injection protection, activity log for administrative actions.

**Scaling.** Atlas handles storage, replication and backups; the app servers hold no state, so you scale by adding instances. Collections are shared across clients and indexed on `tenant_id`, which suits hundreds of SMB clients. Dashboards compute per tenant in the app; for very large tenants, move those aggregates into MongoDB aggregation pipelines. The storage layer is a small interface (`list/get/insert/insertMany/update/remove`), so the same code runs on Atlas, the SQLite dev fallback and the in-browser demo.

## What to add next

- Email reminders for due and overdue training (SendGrid, Postmark or Microsoft 365)
- Single sign-on (Microsoft Entra ID / Google Workspace) and directory sync
- Direct integration with a phishing platform (GoPhish or a commercial simulator) instead of CSV import
- Stripe billing per seat using the plan and employee counts already tracked
- SCORM/video lesson support and translated content

## Tests

```bash
npm test          # full suite twice: in-memory store, then the MongoDB adapter on an in-process stand-in
npm run test:mongo  # full suite against a real MongoDB (MONGODB_URI, database MONGODB_TEST_DB, default cyber_academy_test)
```

22 tests cover authentication, lockout, tenant isolation, role permissions, manager scoping, the learner quiz flow, CSV import and export, phishing campaigns, client onboarding, scheduling rules, and the MongoDB adapter (id mapping, unique keys, query-operator injection). Run `npm run test:mongo` against your Atlas cluster once before going live. It empties and refills the test database, so give the user readWrite on `cyber_academy_test` and never point it at the live database (the suite refuses a database name without "test" in it).
