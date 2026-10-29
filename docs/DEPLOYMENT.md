# Deploying the real app on Hostinger

The real app is a Node.js (Next.js 16) server. It must run as a **Node.js app**, not as static files.
The prototype keeps its own static deploy from the `hostinger` branch; do not mix the two.

## 1. Before you start
- Do **not** point `sibelmcginnis.com` at this app yet. It still serves the old WordPress site.
  First deploy to a test address (a subdomain such as `new.sibelmcginnis.com`, or the temporary
  Hostinger domain), test everything there, then switch the main domain.
- In hPanel check that your plan offers **Websites → Add website → Node.js Apps**.

## 2. Create the Node.js app (hPanel)
1. Websites → Add website → **Node.js Apps** → import the GitHub repo `Paertner/sibelmcginnis`, branch `main`.
2. Framework: Next.js. Build command `npm run build`, start command `npm start`, Node 22 or newer.
3. Add the environment variables below (hPanel → the app → Environment variables).
4. Deploy. Later pushes to `main` can redeploy from the same screen.

## 3. Environment variables
| Name | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | The public address, e.g. `https://new.sibelmcginnis.com` (no trailing slash) |
| `DEMO_MODE` | `false` |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Project Settings → API |
| `UPLOADS_DIR` | A folder **outside** the app, e.g. `/home/<user>/mcc-uploads` (see below) |
| `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` | From the Zoom Server-to-Server OAuth app |
| `ZOOM_TIMEZONE` | Optional, default `America/New_York` |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | From Stripe (use test keys until you go live) |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_DAILY_LIMIT` | After the domain is verified in Resend |

Never put these in the repo. The app refuses to store uploads inside its own folder in production.

## 4. Uploaded audio and images
Files live in `UPLOADS_DIR`, outside the deployed app, so a redeploy never deletes them.
1. Create the folder (File Manager) and set `UPLOADS_DIR`.
2. Copy the `audio/` and `images/` folders (each with its `index.json`) from your computer's
   `.uploads` into it. Keep the `index.json` files with their folders.
3. Back this folder up from time to time (download it, or use Hostinger backups if they cover it).

## 5. After the first deploy
1. Open the site: pages load, the blog shows the 41 posts with their pictures.
2. Sign in at `/login` as `info@sibelmcginnis.com`.
3. Settings → Stripe → *Connect to Stripe* checks the key.
4. Stripe Dashboard → Developers → Webhooks → add `https://<address>/api/stripe/webhook` with the events
   `customer.subscription.created`, `.updated`, `.deleted` and `checkout.session.completed`; put its
   signing secret in `STRIPE_WEBHOOK_SECRET` and redeploy.
5. Stripe Dashboard → Settings → Billing → Customer portal → Save (needed for "Manage billing").
6. Supabase → Authentication → URL configuration: set the Site URL to the public address.

## 6. Switching the main domain
Only after everything above works on the test address: point `sibelmcginnis.com` to the new app,
verify the domain in Resend (add its SPF/DKIM records), turn on email confirmation in Supabase
Authentication, and switch Stripe to live keys.
