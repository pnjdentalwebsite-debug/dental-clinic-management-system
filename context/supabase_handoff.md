# Supabase Handoff - Phase M1B.5

Do not implement Supabase from this document yet. It is a planning handoff from the frozen mock frontend.

## Domain Models
- Subscribers/organizations, users/profiles, roles/memberships.
- Plans, plan features, plan limits.
- Subscriptions, subscription history, renewal/change/cancel lifecycle.
- Registrations, OTP verification state, payment submission state, approval/provisioning.
- Payments, allocations, refunds, reconciliation events.
- Clinics, clinic assignments, business hours.
- Laboratories, laboratory services, clinic-laboratory connections.
- Announcements, recipients, acknowledgements.
- Notifications, preferences, read/archive state.
- Audit events, audit alerts, integrity metadata.
- Platform settings, feature flags, maintenance mode.
- Analytics saved views and report filters.

## Relationships
- Subscriber owns users, clinics, laboratories, subscriptions, payments, announcements/notifications recipients.
- Plan has many subscriptions and governs clinic/lab/user limits.
- Subscription belongs to subscriber and plan; one operational subscription should be enforced per subscriber when applicable.
- Payment may relate to registration, subscriber, subscription, and allocations.
- Clinic belongs to subscriber and has many user assignments and lab connections.
- Laboratory belongs to subscriber and has many services and clinic connections.
- Announcement recipients and notifications target users/subscribers and optionally related records.
- Audit events reference actor, target, route, correlation ID, and source module.

## Server-Side Enforcement Required
- Authentication, role checks, tenant isolation, subscriber membership.
- Unique plan code/slug, payment reference, service code, announcement slug.
- Status transitions for subscribers, users, plans, subscriptions, payments, clinics, labs, announcements, notifications.
- Plan limits for clinics/laboratories/users.
- Cross-subscriber relationship blocking.
- Payment over-allocation and over-refund prevention.
- Audit append-only writes and redaction.
- Settings permissions and destructive confirmation enforcement.

## Proposed Migration Order
1. Organizations and subscribers
2. Authentication and profiles
3. Roles and memberships
4. Plans and plan features
5. Subscriptions
6. Registrations
7. Payments
8. Clinics
9. Clinic assignments
10. Laboratories
11. Notifications
12. Announcements
13. Audit logs
14. Platform settings
15. Analytics views
16. Storage and backup strategy

## Scheduled Jobs
- Subscription expiration and renewal warnings.
- Scheduled announcements.
- Notification expiration/digests.
- Audit alert detection.
- Data-quality snapshots.
- Backup retention once a real backup strategy exists.

## Storage Buckets
- Future clinic/lab logos, proof-of-payment uploads, announcement media, exported reports, and backup artifacts.
- Current prototype does not upload files.

## Realtime Candidates
- Notification bell unread counts.
- Payment review queue.
- Announcement delivery/read updates.
- Audit/security alerts.

## Edge Function Candidates
- OTP/email/SMS delivery.
- Payment gateway verification callbacks.
- Report export generation.
- Scheduled announcement dispatch.
- Audit alert fan-out.
- Backup orchestration.

## Must Never Remain Frontend-Only
- Role authorization, tenant isolation, payment verification, audit durability, destructive actions, backup/restore, maintenance enforcement, feature authorization, storage access, and all secret handling.

