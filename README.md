# CIVIC PULSE 360

A responsive citizen-services prototype that brings government information, document guidance, civic reporting, opportunity discovery, and Bengaluru municipal references into one workspace.

## What works in this prototype

- One responsive dashboard with 13 service modules, searchable service guidance, editable local demo preferences, and saved light/dark themes.
- Janavani assistant with a deterministic local guide. To enable Gemini, set `GEMINI_API_KEY` in the backend environment; the key is never sent to the browser.
- Civic Eye report creation, unique reference IDs, validated optional JPG/PNG uploads, SQLite storage, report history, and status history APIs. Reports created with the API are stored in SQLite; browser-only fallback is saved in local storage.
- Civic Opportunity Hub filters, bookmarks, and comparison selection, with official scheme and scholarship starting links.
- Loan EMI calculator using the entered principal, rate, and term.
- Service-preparation and document checklists, local renewal reminders, preliminary source-domain checks, an update-review demo, in-app alert controls, and real OpenStreetMap driving-route lookup.
- Interactive OpenStreetMap view centered on Bengaluru, with no fabricated live civic or transport incident markers.
- Official-source references and clear labels wherever live government or transport integrations are unavailable.
- Travel & Booking Hub with destination discovery across all states/UTs, state/type/search filters, official transport and tourism starting links, account-scoped outbound-link history, and Janavani travel-planning prompts that do not invent live availability or prices.
- Regional Status with all 28 states and 8 union territories seeded in SQLite, administrator-managed district/city/locality records, source-attributed status cards, OSM region maps, authenticated in-app alert subscriptions, and an audit log.

## Requirements

- Node.js 20.19+ or 22.12+
- Python 3.10+

## Run locally

Open two terminals from the project root.

### 1. Start the FastAPI backend

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r backend\requirements.txt
py -m uvicorn backend.app.main:app --reload
```

The API is available at `http://127.0.0.1:8000`; interactive API documentation is at `http://127.0.0.1:8000/docs`. SQLite is created at `backend/data/civic_pulse.db`.

### 2. Start the React frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). If the API is not running, the interface remains usable in local demo mode and shows that status in the header.

## Render deployment preparation

The checked-in `render.yaml` is a deployment blueprint only; it does not create services or publish the site by itself. Automatic deploys are disabled in the blueprint. Review this section and obtain approval before creating a Render Blueprint or changing DNS/production settings.

The blueprint provisions a single-instance FastAPI service with a 1 GB persistent disk at `/var/data/civic-pulse`. The SQLite database and complaint uploads are stored under that mount. Keep one API instance: local SQLite is not safe to share across multiple backend instances. The persistent disk is a paid Render feature; configure backups and test restore before production use.

When configuring the blueprint in Render:

1. Set the Static Site build-time `VITE_API_BASE` to `https://<api-service-host>/api`.
2. Set the API `CORS_ORIGINS` to the exact HTTPS Static Site origin (and any deliberately supported custom domain origins), with no wildcard.
3. Set `RESET_URL_BASE` to the deployed frontend's `/reset-password` URL. Configure SMTP credentials in the API service if password-reset email is required.
4. Set `ADMIN_BOOTSTRAP_EMAIL` and a unique `ADMIN_BOOTSTRAP_PASSWORD` using Render's secret environment settings. Sign in once, create individual administrator accounts, then remove the bootstrap password from the service environment.
5. Add optional Gemini, VAPID, SMS, WhatsApp, and authorized data-provider secrets only as backend environment variables. `VITE_*` values are public build-time values and must never contain secrets.
6. Configure a backup of the existing local SQLite database before migration. The Render disk starts empty; the blueprint does not copy local records. Import only after a separately reviewed backup/restore procedure, then verify users and required records before directing real users to the deployment.
7. Test the staging URL for health, CORS, registration, login/logout/session persistence, profile access, data isolation, admin authorization, database persistence after restart, and notification behavior. Do not treat deployment configuration as evidence that any integration or production workflow has passed.

This project has not been published to Render. Production URLs, credentials, database import, DNS, and provider settings remain unconfigured pending explicit approval.

## Optional Gemini and administrator setup

Set the project `.env.example` values in your backend process environment or a local, untracked `.env` file (start Uvicorn with `--env-file .env` to load that file). Set `GEMINI_API_KEY` only in the backend environment. If it is unset, Janavani uses the local guidance responses. An API/provider error is shown as an error rather than being presented as an AI response.

For the first administrator, set `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD` (at least 12 characters), and optionally `ADMIN_BOOTSTRAP_NAME`. The first successful sign-in at the Regional Status admin panel creates a Super Admin using a salted PBKDF2 hash. Remove the bootstrap password from the runtime environment after that login. A Super Admin can create individual accounts through `/api/admin/users`. Administrator session tokens are hashed in SQLite, expire after eight hours, can be rotated at `/api/admin/session/rotate`, and are held in frontend memory only. Roles are `super_admin`, `government_data_admin`, `content_admin`, `support_admin`, and `read_only_auditor`.

## External integration configuration

- Gemini: set `GEMINI_API_KEY` and optionally `GEMINI_MODEL` on the backend.
- Password reset email: set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, and `RESET_URL_BASE`.
- Browser push: generate VAPID keys and set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, and `VITE_VAPID_PUBLIC_KEY`.
- SMS: set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`.
- WhatsApp: set `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN`.
- BMTC live GPS: set `BMTC_LIVE_API_URL` and, if required, `BMTC_LIVE_API_KEY`. The endpoint remains unavailable until a genuine authorized feed is configured.
- Administrator bootstrap: set `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`, and optionally `ADMIN_BOOTSTRAP_NAME` once. Shared-token authorization is not supported.
- Radar scheduling: set `RADAR_MONITOR_ENABLED=true` and optionally `RADAR_INTERVAL_HOURS=6`.
- Official portal reachability checks: set `SOURCE_MONITOR_ENABLED=true` and optionally `SOURCE_MONITOR_INTERVAL_HOURS=12`. Manual administrator checks are available from the Regional Status module.
- Janavani request limit: `CHAT_RATE_LIMIT_PER_MINUTE` defaults to 20 per client IP in each backend process; this in-memory limit is not a distributed limiter.

## Tests and checks

```powershell
py -m unittest backend.tests.test_api
cd frontend
npm run lint
npm run build
```

## Important prototype boundaries

- The editable profile, saved items, preferences, chat transcript, and local-only reminders live in browser local storage. Account registration, login and session APIs are available; user-account roles are not.
- Civic Eye persists descriptions, categories, locations, and status history in SQLite when the API is online. It does not forward complaints to a government department or provide department-side admin authentication.
- Complaint and regional administration use per-person accounts and role checks. The bootstrap password is used only to create the first Super Admin; it is not an ongoing shared token. Existing individual administrator accounts remain in the database.
- Janavani is not legal advice. Gemini is optional and its API key stays backend-side. Regional assistance retrieves the selected region's actual stored records and labels their source, timestamp, and unverified status. No official-source page contents are currently retrieved as grounding, so Gemini answers are not guaranteed citations or government advice. Usage records store provider/outcome/time only, not prompt text.
- Opportunity Radar links to official portal references. Its source checker records HTTP reachability and timestamps only; it does not verify page contents or extract actual scholarship details. Eligibility, benefits and deadlines stay unverified unless reviewed from the current official notice.
- BMTC live GPS, routes, fares, schedules, and service alerts are not connected. The app explicitly reports live tracking as unavailable and does not invent vehicle positions.
- Travel is currently an official-portal directory and external redirect only. The module is labelled: “Official portal redirection – direct booking is not available through CIVIC PULSE 360.” Provider availability, current prices, slots, payment, confirmed booking, QR tickets, cancellation, refunds, and parking/accommodation inventory are not integrated. Account history records only outbound-link intent. The IRCTC page loaded its official search form in the tested browser, but its embedded Disha script reported an error and a separate HTTP fetch timed out; no train availability search was submitted. Retry at the official portal and use its own support links if it remains unavailable.
- Regional live feeds and state/district/city synchronization are not connected. Portal reachability monitoring is not regional data synchronization. Unavailable is the default for all regional categories. Admin-entered status reports include source/timestamps and are not feed-verified; old reports are downgraded. Historical daily/weekly/monthly analytics and CSV export summarize only actual stored reports; no records are synthesized.
- Regional category details distinguish configured Open-Meteo model data from official portal references. Bengaluru/Karnataka alternatives include Bengaluru Traffic Police, BMTC, BMRCL, BWSSB, BESCOM, Karnataka grievance/service portals, Indian Railways, NDMA, and Karnataka Tourism. The displayed portal-review date is a manual link/page review, not a feed timestamp or verification of live service data. Civic Eye reports stay inside this app unless a user separately submits them to an official portal. No authorized parking-availability source is connected.
- Regional geographies currently seed the 28 states and 8 union territories. District/city/locality records remain administrator-managed; no official all-India geography feed is connected. The Government of India open-data portal was not usable from this environment (HTTP fetch returned 403), so no source feed is claimed.
- Bengaluru 360 uses OpenStreetMap geocoding and OSRM road geometry for driving directions. It uses the official Karnataka One, BBMP property-tax, BWSSB, Seva Sindhu, and Karnataka grievance entry points instead of the unverified or unavailable BBMP information address.
- Satya Check reviews domain clues only. It cannot prove a claim true or false and has no deepfake detector.
- No Aadhaar OTPs, bank passwords, government credentials, or identity verification documents should be entered into this prototype.

## Integration test checklist

- [ ] Set `GEMINI_API_KEY`; send one text prompt in each supported language and verify a real provider response.
- [ ] Set SMTP credentials; call `/api/integrations/smtp/test` with an authorized admin token and verify inbox delivery.
- [ ] Generate VAPID keys; register a browser subscription and verify `/api/notifications/browser` sends a real push.
- [ ] Configure Twilio and send a real test SMS to an authorized test number.
- [ ] Configure WhatsApp and send a real approved-template or test message.
- [ ] Configure an authorized BMTC feed and verify `/api/transport/bmtc-live` returns real vehicle coordinates.
- [ ] Confirm provider authorization and API contracts before enabling direct bookings or claiming availability, payment, ticket, cancellation or refund status.
- [ ] Configure authorized regional provider feeds and verify every category's source, timestamp, freshness handling and error behavior before displaying it as live.
- [ ] Configure a one-time bootstrap administrator password locally, sign in, create individual role-specific accounts, remove the bootstrap password, and verify role permissions, session rotation/expiry, audit, and logout.
- [ ] Enable `SOURCE_MONITOR_ENABLED=true`; verify scheduled portal reachability checks and per-source history. This does not synchronize regions or verify source contents.
- [ ] Insert authorized-source records only after a real API contract is approved; verify historical analytics and exports from those genuine records.
- [ ] Log in and verify travel provider-link history plus regional subscribe, in-app alert delivery and unsubscribe.
- [ ] Enable `RADAR_MONITOR_ENABLED=true`; trigger `/api/radar/refresh` and verify source checks and change timestamps.
- [ ] Run `py -m unittest backend.tests.test_api` and `npm run lint && npm run build`.
