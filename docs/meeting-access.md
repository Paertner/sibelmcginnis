# Membership-bound meeting access

## What the app now enforces

Member pages and calendar events contain a stable site URL, `/meetings/session/[id]` or `/meetings/booking/[id]`. They never contain Zoom URLs or passcodes. Opening an old invitation checks the current signed-in account, active Premium entitlement and consultation ownership. Membership entitlement is derived from status, tier and the paid-through timestamp on every request. The review admin can change **Premium access ends (UTC)** to test expiry without waiting for a payment provider.

Calendar buttons for future sessions can remain available: saving an event is not permission to enter it. Calendar descriptions contain no reusable Zoom credentials. Consultation cancellations also deny access through previously saved links.

The review entry page deliberately does not redirect to a shared Zoom URL. Until Zoom is configured with revocable participant registration, it cannot safely issue a real join link. This prevents an apparent fix that protects the website but still leaves a copied Zoom URL usable.

## Required live Zoom implementation

1. Use a licensed host and a separate registration-required meeting for each Saturday and consultation. Do not expose the common join URL, meeting passcode, host start URL or a public automatic-registration page. Use manual approval controlled by the backend. Configure participant identity authentication and test it using an attendee account, not the host.
2. Store a registration row per member per meeting: member ID, meeting ID, Zoom registrant ID, unique join URL, entitlement generation, status, paid-through timestamp. Enforce a unique key on member + meeting. Only issue an individual registration after checking current paid access. Prefer just-in-time registration near the meeting; a calendar event always points to the site entry page.
3. On subscription cancellation **at period end**, keep access until the paid-through timestamp. Immediate cancellation, payment-driven revocation, admin suspension or downgrade must invalidate access according to the agreed billing policy. Never equate `cancel_at_period_end=true` with immediate expiry.
4. On loss of entitlement, update Zoom registrant status using `PUT /v2/meetings/{meetingId}/registrants/status` with `action: cancel` (or the tested appropriate denied state) for every outstanding registration belonging to that member. Changing a website role alone cannot revoke an already copied Zoom link.
5. Process verified Stripe webhooks through a durable, idempotent outbox. Schedule a durable expiry job at `paid_through`; **webhooks alone are insufficient**, because access can end as time passes without a new user request. Retry Zoom cancellation failures, alert the admin and reconcile membership/registration state before sessions. Deny new join credentials while revocation state is uncertain. Do not use an in-process timer or the stage-one memory store for these jobs.
6. Do not silently reapprove a canceled registration from an old saved request. A renewal must check a fresh entitlement and deliberately establish a new valid registration generation. Ensure pending registration API calls cannot race a revocation and issue credentials after expiry.
7. Confirm scope for attendees already inside a meeting: cancellation prevents future admission, but the requirement to remove someone whose access expires during an ongoing meeting needs separate participant removal/lifecycle handling. A website redirect or registrant cancellation should not be described as automatically ejecting an attendee.

Previously distributed direct Zoom URLs cannot be retroactively protected by changing this website. Existing meetings/registrations must be revoked or migrated on Zoom before relying on the new entry path.

## Release gate

With real Zoom test credentials, prove that an attendee can join while subscribed; then end that member's entitlement and prove that **both the old site URL and the previously copied personal Zoom URL fail**, while another paid member still joins. Cover scheduled expiry with no browser open, webhook retries, direct meeting ID/passcode entry, self-registration bypasses, link sharing, renewal, and consultation cancellation. The local browser tests only verify the website boundary and calendar contents; they do not prove Zoom revocation.

## Primary sources (checked October 22, 2026)

- [Zoom Meetings API: add registrants, registration settings, update registrant status](https://developers.zoom.us/docs/api/meetings/)
- [Zoom meeting registration cancellation event and API behavior](https://developers.zoom.us/docs/api/meetings/events/)
- [Zoom participant registration workflow and unique join URLs](https://developers.zoom.us/docs/isv/workflows/join-meeting-reg/)

Meeting timezone remains a launch prerequisite. The current calendar implementation preserves the prototype's floating times until the host timezone is confirmed.
