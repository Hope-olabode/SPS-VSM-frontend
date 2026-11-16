# SPS VMS Frontend

The web app for the SPS Visitor Management System: the staff dashboard, the front-desk kiosk, and the public event registration page.

Built with **Next.js 16** (App Router), **React 19**, **TypeScript** and **Tailwind CSS 4**. Charts use Recharts, and the QR scanner uses jsQR.

The API lives in the sibling `backend/` folder (see its README).

## Requirements

- Node.js 20.9 or newer
- The backend running (default `http://localhost:4000`)

## Quick start

```bash
cd frontend
npm install
```

Create `.env.local`:

```bash
# Address of the Express API (the backend's PORT)
API_URL=http://localhost:4000
```

Then, with the backend already running:

```bash
npm run dev
```

Open http://localhost:3000. Sign in with the account created by the backend's `npm run seed` (`admin@example.com`; the default password is in the backend README, and should be changed after first login).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Environment variables

| Variable | Required | Default | What it does |
| --- | --- | --- | --- |
| `API_URL` | no | `http://localhost:4000` | Where the Next.js server forwards API calls. Server-side only, so it is not `NEXT_PUBLIC_`. Set it to the deployed API URL in production |

## How it talks to the API

The browser never calls the API directly. It calls `/backend/...` on this site, and `next.config.ts` rewrites that to `API_URL/api/...`.

- **No CORS problems**, because everything is same-origin.
- The API's httpOnly login cookie (`vms_session`) is visible to this app's `src/proxy.ts`.
- In code, use the helper: `api("/visitors")` from `src/lib/api.ts`. It sends the cookie, throws an `ApiError` with the server's message on failure, and sends the user to the login page on a `401`.

## Pages

| Route | What it is | Access |
| --- | --- | --- |
| `/auth/Login` | Staff sign-in | Public |
| `/dashboard` | Overview, banners and live stats | Signed in |
| `/dashboard/check-in` | Staff check-in, with QR scanning and photo/signature steps | Signed in |
| `/dashboard/visitors` | Visitor log and details drawer | Signed in |
| `/dashboard/pre-registration` | Expected visitors and QR passes | Signed in |
| `/dashboard/events`, `/dashboard/events/[id]` | Events and registrations | Signed in |
| `/dashboard/analytics`, `/dashboard/reports` | Charts and downloadable reports | Signed in |
| `/dashboard/watchlist`, `/dashboard/emergency` | Watchlist and evacuation roster | Signed in |
| `/dashboard/marketing` | SMS campaigns | Marketing access |
| `/dashboard/audit-trail` | Audit trail | Admin |
| `/dashboard/control-panel`, `/users`, `/locations`, `/documents`, `/old-records` | Administration | Admin (old records: global admin) |
| `/kiosk?token=...` | Front-desk tablet, no login | Kiosk link + 6-digit code |
| `/register/[token]` | Public event sign-up, no login | Secret link |

Staff sign-in is guarded in two layers: `src/proxy.ts` redirects signed-out visitors away from `/dashboard/*` (it only checks that the cookie exists), and the API verifies the session on every request. The sidebar hides pages a role can't open, and the API enforces the same limits.

## Kiosk setup

1. An admin opens the Overview or Control Panel and copies the kiosk link for the location.
2. Open that link on the tablet (`/kiosk?token=...`).
3. Enter the location's 6-digit access code shown beside the link to unlock it.

Treat the link like a password. If it leaks, regenerate it from the same screen.

## Project structure

```
frontend/
├── public/            logos, service worker (sw.js, used for desktop notifications)
└── src/
    ├── proxy.ts       sends signed-out users to the login page
    ├── app/           routes: auth/, dashboard/, kiosk/, register/
    ├── components/    UI grouped by feature (check-in, visitors, events, analytics, ...)
    ├── hooks/         shared hooks (e.g. useTheme)
    └── lib/           api.ts, nav.ts, qr.ts, CSV download, filters, shared types and helpers
```

Notes:
- `lib/api.ts` is the only place that knows how to reach the backend.
- `lib/nav.ts` defines the sidebar and which role sees each item.
- Several `lib/mock-*.ts` files still hold shared types and helpers (for example `Visitor`, `maskPhone`, `hasAccess`). The name is historical; check a file before assuming it only contains sample data.

## Camera and notifications

- The QR scanner and the visitor photo step need camera access. `next.config.ts` sets `Permissions-Policy: camera=(self)`, so only this site may use it. Browsers require HTTPS (or `localhost`) for camera access, which matters for the kiosk tablet in production.
- Desktop notifications use the service worker in `public/sw.js`. Users must allow notifications in the browser.

## Deployment

1. Deploy the backend first and run its migrations.
2. Set `API_URL` on the frontend host to the backend's public URL.
3. `npm run build` then `npm start` (or deploy to a platform such as Vercel).
4. Make sure the backend's `CLIENT_ORIGIN` matches the frontend's public URL.

## Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| "The server isn't responding. Is the API running?" | Backend isn't running, or `API_URL` is wrong. Restart the dev server after changing `.env.local` |
| Redirected to login again and again | Cookie not being set. Make sure you use the `/backend/...` path (via `api()`), not the API's port directly |
| Camera doesn't start | Not on HTTPS or `localhost`, or camera permission was denied in the browser |
| Kiosk won't unlock | Wrong access code, or the link was regenerated. Copy the new link from the dashboard |