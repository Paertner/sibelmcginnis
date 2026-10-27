# Sibel McGinnis · shareable interactive prototype

This is a browser-local review edition of the **current** Next.js app from this session. It preserves its public pages, member calendar, admin panel, announcement composer, five templates, image uploads, uppercase hero name and availability through 21:00.

The persistent bottom panel switches between Visitor, Free member (Amelia), Premium member (Layla), and Admin (Sibel). All records are synthetic sample data. Visitors can review and edit their own browser's copy; no sample-admin action affects another visitor or the original Next.js app.

## Local preview

```sh
npm ci
npm run build
npm run preview
```

Open the printed local URL (normally http://127.0.0.1:5188). Hash routing keeps all pages and role views usable on static hosting, including deep links. Refresh preserves the current persona in the browser tab and sample edits in local storage. Reset demo restores the sample records in this browser.

## Scope

- Public pages, responsive navigation, blog filters and simulated member gates.
- Premium calendar, open consultation dates/time slots, booking and cancellation, allowances and protected entry-page previews.
- Admin members/posts/sessions/availability/site-content editors.
- Recipient autocomplete, @all/@free/@premium, personal announcements, visual/HTML editor, image attachment and five email templates.
- Actual local ICS and personalized MIME email draft downloads. Uploaded images and audio are held locally, with browser-storage persistence when space permits.

There are no live payments, emails, Zoom meetings or real user accounts. **This browser-only preview is deliberately inspectable and role-switchable; it is not a secure production membership application.** The original Next.js app remains separate in `../morning-coffee-app/`, including its server authorization checks and its production-disabled demo sessions.

The `source/` directory is a snapshot of the current application UI. `preview/` supplies the browser-local auth, routing, storage, asset and export adapters. It does not change the original app. Fonts and client-approved photos are bundled locally; font licenses are in `public/fonts/`.

Browser QA verified all four roles, booking/cancellation, 21:00 availability, private announcement targeting, image uploads, email and ICS downloads, persistence after refresh and mobile role switching, with no browser errors.

For Vercel, select this `prototype/` directory as the project root. Vite builds the deployable site into `dist/`. The previous preview-platform configuration file is intentionally not included.

Admin styling now follows the original Claude artifact: icon sidebar, compact tables, header actions, centered modal editors, weekly meeting settings and two-column announcements. All later product features remain available.

The member panel also follows the original Claude layout, with the updated monthly booking calendar and private announcement feed preserved. Podcast and session-note Listen links open inside the member sidebar using `#/account?tab=podcast`, with protected audio available to Premium members only.
The extra body padding below admin, member and public pages has been removed on desktop and mobile; prototype controls remain fixed and accessible.

Static site copy is now centralized in source/lib/site-copy-catalog.json (376 fields in 19 sections). Admin → Site content → Page text → All site text edits headings, body copy, buttons, navigation, form labels and member-panel copy. Search within a section, keep drafts while switching sections, restore original wording, then Save site text. Headline, topics, price and schedule settings are under General settings. Blog posts, podcasts and announcements continue to use their respective editors. All saved copy is plain text, checked against known keys, and stored in the same browser-local review data.

All select menus use the same accessible branded control, with keyboard navigation, type-ahead, selected markers and top-layer menus inside dialogs. Membership feature icons use a centered SVG circle/plus.

Site content now has General settings, Page text and Page images tabs. Page images uploads replacements for each homepage photo, About/community photos, the shared brand icon, reusable blog cover styles and individual article covers. Descriptions, live image-focus previews and Restore default are included. Pages without existing photos show a clear empty state. JPG, PNG and WebP files are limited to 3 MB and validated by the action. Public page images use a separate media path; draft post images require the admin in the Next.js app. A post replacement is used wherever that post appears.

In this shared browser-local edition, uploaded image bytes are saved in IndexedDB and hydrated before rendering; the existing local storage state retains metadata. This avoids the small settings-storage quota for multiple photos. Existing inline saved images migrate on the next save. Image saves wait for persistence, and Reset demo clears the saved media. If IndexedDB is unavailable, inline browser storage is used when space permits. No uploaded image is sent to a live storage provider.

