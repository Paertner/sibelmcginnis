# Morning Coffee Community

Next.js App Router + TypeScript + Tailwind port of the approved HTML prototype. The approved legacy HTML prototype remains in the project workspace; this repository contains the active Next.js application.

## Run locally

Requires Node.js 20.9 or newer and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. On `/login`, choose Amelia (Free), Layla (Premium), or Sibel (Admin). These review accounts exist only in development. Set `DEMO_MODE=false` in `.env.local` to disable them locally as well.

```sh
npm run lint
npm run typecheck
npm run test:e2e
npm run build
npm start
```

Browser tests use an installed Microsoft Edge. To use Playwright Chromium instead, remove `channel: "msedge"` from `playwright.config.ts` and run `npx playwright install chromium`. Tests start a development server automatically on port 3000. Do not run them against an unrelated app on that port.

## Routes

- `/`, `/about`, `/morning-coffee`, `/solutions`, `/blog`, `/contact`
- `/post/[id]`: published posts, with server-rendered teasers and membership gates
- `/podcast`: Premium audio, linked from the member sidebar and homepage Programs card
- `/login`, `/join?plan=free`, `/join?plan=premium`
- `/account?tab=overview|library|sessions|book|membership`
- `/admin`: dashboard; `/admin/members`, `/admin/posts`, `/admin/sessions`, `/admin/podcast`, `/admin/consults`, `/admin/announce`, `/admin/content`
- `/api/calendar/session/[id]`, `/api/calendar/booking/[id]`: authorized calendar downloads
- `/api/audio/[id]`: authorized audio with byte-range support
- `/meetings/session/[id]`, `/meetings/booking/[id]`: membership-checked session entry
- `/api/announcement-image/[id]`: recipient-authorized message images
- `/api/announcements/[id]/email/[draftId]`: admin-only personalized MIME email drafts

Public pages use shared layout, typography, photos and design tokens from the prototype. Static HTML has been converted into React components, with interactive forms and mobile navigation in client components. There are no injected prototype scripts, role switcher, browser data store or reset controls.

## Stage-one boundaries

This is a runnable frontend and workflow scaffold, not a live membership service. Sample data, changes and uploaded audio live in server process memory and reset on restart. The repository is isolated in `src/lib/store.ts`, with typed fixture data in `src/lib/seed.json`. Do not use this store for real users or in a multi-instance deployment.

Development sessions use signed, expiring, HTTP-only cookies. Roles and paid-through timestamps are checked on the server on each request; account pages, every mutation, premium audio and calendar downloads check authorization. Locked post bodies are never passed to client components or included in visitor responses. Draft posts are unavailable publicly. Free members cannot fetch meeting links, passcodes, session notes or audio. Bookings validate open slots, overlapping reservations, and the allowance in the month being booked. Cancelled bookings release their allowance and time. The consultation picker has a monthly date grid, previous/next month controls, selectable time slots and a responsive meeting-details panel. Dates outside the open 21-day window or the member allowance are unavailable. The homepage metrics row was removed as requested.

Sample sign-in and all mutations are disabled when `NODE_ENV=production`, including when `DEMO_MODE=true` is set. A production build serves public sample content and honest unavailable states for registration, sign-in and contact. Search indexing is disabled until real content and services are ready.

Calendar events and member pages now link to protected session pages, never direct Zoom URLs or passcodes. Those pages check active membership on every visit, including saved invitations. Internal review meeting URLs use `example.invalid`. No actual Zoom join credential is issued until revocable registration is integrated. See `docs/meeting-access.md` for the live revocation architecture and release checks. There is no fake payment checkout or generated podcast tone. Podcast audio appears after an admin upload (MP3/M4A/WAV/OGG, 10 MB review limit). Announcements support registered-member autocomplete, removable recipient chips and `@all` / `@free` / `@premium` groups. Groups use current entitlement, and overlaps are deduplicated. Publishing snapshots recipient IDs so the same targeted announcement stays private on their dashboards. Five inline-styled templates are available (Saturday circle, consultation, welcome, reflection, personal note), with visual editing, pasted HTML source and sandboxed preview. HTML is sanitized both in the visual editor and on the server. A separate JPG/PNG/WebP banner (3 MB limit) appears in the account announcement and is embedded using CID in each downloadable `.eml` draft. Individual email drafts are prepared, not sent; Resend delivery remains unconnected. Message images and drafts have separate server authorization checks. State and uploads are still process-local. Contact validates inputs and explicitly reports that delivery is not connected.

The host timezone is not specified in the handoff. Calendar events preserve the prototype's floating local times. Confirm the host timezone and move to explicit timezone-aware scheduling before launch.

## Next implementation stages

1. Replace the in-memory repository and development sessions with Supabase Auth, database tables, RLS and private audio storage with signed URLs.
2. Connect Stripe Checkout, subscriptions, verified webhooks and the customer portal ($20/month). Derive paid access from trusted subscription records.
3. Connect Zoom registration-required meetings and individual registrant revocation. Add a durable Stripe outbox, paid-through expiry jobs and retry/reconciliation before issuing live join credentials (see `docs/meeting-access.md`). Add Resend delivery for the prepared per-recipient email messages, with durable idempotency and delivery status.
4. Persist uploads, implement durable booking transactions and complete client QA. Connect live service forms, final content, legal pages and production metadata before enabling indexing.

The open product questions from `../HANDOFF.md` still apply: Premium-only weekly links are preserved; limited admin roles remain unconfirmed.

Fonts are self-hosted using `next/font/local`; license files are alongside the font files in `src/app/fonts/`. Client-owned photos were copied from the supplied prototype. `scripts/port-prototype.py` records the initial migration; it is a one-time tool and rerunning it overwrites generated static pages and base styles.

## Dependency audit

At scaffold time, `npm audit` reports five related high-severity advisories in the development-only ESLint dependency chain (`braces` via `micromatch` and `fast-glob`). There is no compatible upstream fix in the installed Next.js lint configuration; the suggested automatic fix downgrades its major version. Production dependencies have no reported advisories. Recheck upstream before release.

Static copy uses src/lib/site-copy-catalog.json, server-side siteText(id), and SiteText/SiteCopyProvider for interactive components. Site content manages the allowlisted plain-text overrides in Store.siteCopy. When adding site copy, add a catalog entry and render it through the appropriate accessor; posts and private member records stay in their existing editors. The defaults do not contain private post bodies or meeting credentials.

Site content has separate General settings, Page text and Page images tabs. src/lib/site-image-catalog.ts defines the static image placements; src/lib/site-images.ts resolves descriptions, crop focus and per-post replacements. The admin-only mutation validates JPG/PNG/WebP signatures and the 3 MB limit, replaces old bytes and supports restoring defaults. The /api/site-image/[id] endpoint serves only currently referenced page images and keeps draft-post images admin-only. Announcement media keeps its existing private endpoint. Image metadata lives in Store.siteImages and bytes in the review image repository; durable production file storage still needs the planned storage integration.



## Vercel preview

Import this repository into Vercel with the repository root as the project root. The app is deployable as a public review preview. Production mode disables sample sign-in and all state-changing actions. Supabase, Stripe, Zoom, and Resend are not connected; do not use this deployment for real memberships or payments.
