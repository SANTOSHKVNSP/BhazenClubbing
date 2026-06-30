# Decisions Log (ADRs) — Sattvick Beats

Architecture Decision Records. Each entry is immutable once **Accepted**; to change a decision, add a new ADR that **supersedes** the old one (and mark the old one `Superseded by ADR-NNN`).

**Status legend:** Accepted · Superseded · Proposed · Pending input

---

## ADR-001 — Tech stack & hosting
**Status:** Accepted
**Context:** Single static event page is being replaced by a national, data-driven, multi-city ticketing platform with admin, payments, and reserved seating.
**Decision:** **Next.js (App Router, TypeScript)** on **Vercel**; **PostgreSQL (Neon)** as the primary DB accessed via an ORM (Prisma or Drizzle — see ADR-018); **Vercel Blob** for uploaded media; **Razorpay** for payments.
**Consequences:** Move off Cloudflare Pages for the app. Excellent DX for SSR/admin/payments. Single language (TS) across stack.
**Alternatives:** Cloudflare Pages+Workers+D1 (rejected: D1/SQLite weaker for complex seat transactions, more bespoke); Astro+serverless (rejected: heavier for rich interactive seat-map flows).

## ADR-002 — Reserved seating with template-based authoring
**Status:** Accepted
**Context:** Buyers must pick specific seats (BookMyShow-like) across theatre and indoor-stadium venues.
**Decision:** **Full reserved seating.** Seat maps authored from **preset templates (Theatre, Stadium)** then tweaked (rows, seats, blocked, accessible, categories). Per-event/showtime pricing maps to seat categories.
**Consequences:** Requires a seat-map builder, normalized seat inventory per showtime, and concurrency-safe holds (ADR-009). Highest-complexity feature.
**Alternatives:** Tiered/GA-only (rejected as primary; GA still supported as a special non-numbered zone); fully freeform seat editor (deferred — templates are faster to author).

## ADR-003 — Buyer accounts & login (phone) with WhatsApp OTP
**Status:** Accepted
**Context:** Familiar, low-friction login for an Indian concert audience; buyers need booking history / ticket re-download.
**Decision:** **Phone-number accounts.** Login via **WhatsApp OTP**, with **email-OTP fallback** (added to mitigate WhatsApp delivery risk). Custom auth via **Auth.js** with our own user table and RBAC.
**Consequences:** No SMS provider initially. WhatsApp templates must be approved. Email fallback required for users without WhatsApp / delivery failure.
**Alternatives:** SMS OTP via MSG91 (rejected for now to avoid SMS/DLT setup; may revisit if WhatsApp delivery underperforms); Clerk managed auth (rejected: vendor cost + India OTP deliverability concerns).

## ADR-004 — Custom admin dashboard with RBAC + approval workflow
**Status:** Accepted
**Decision:** In-app admin. Roles: **Super Admin** (national), **City/Region Admin** (scoped), **Scanner** (event-scoped check-in). City Admins create content as drafts; Super Admin approves/publishes (**publish-approval workflow**). Admin includes **sales/analytics dashboard** and **promo codes / comp tickets / guest list**.
**Consequences:** Server-side RBAC enforcement everywhere; state machine for content (draft → pending → live).
**Alternatives:** Headless CMS (rejected: second system/cost); Git/config-based (rejected: not self-serve for AOL teams).

## ADR-005 — Payments, fees & GST (Razorpay, per-event config)
**Status:** Accepted
**Decision:** **Razorpay** (Orders API + Checkout + **webhook as source of truth**). **Per-event configurable** convenience fee (flat/%/none); **GST** applied per config; **free (₹0) events** supported; **GST invoice** generated per paid order (AOL GSTIN, SAC code, invoice number series).
**Consequences:** Need AOL merchant KYC, GSTIN, SAC, invoice numbering. We store **no** card data (PCI SAQ-A).
**Alternatives:** Face-value-only (rejected: less flexible/transparent); fixed platform fee (rejected: per-event flexibility preferred).

## ADR-006 — Partnerships are per-event display + AOL Trust redirect
**Status:** Accepted
**Decision:** **Per-event partners** (name, logo, tier, website link) managed in admin. A prominent **"Support AOL Trust"** CTA **redirects to the external AOL Trust donation page**. We process **no** donation payments.
**Consequences:** Recurring sponsors re-entered per event (accepted trade-off). Need the AOL Trust URL.
**Alternatives:** National/city-level partners (deferred); building a donation flow (out of scope).

## ADR-007 — Ticket delivery via Email + WhatsApp
**Status:** Accepted
**Decision:** Deliver tickets via **Email** (Resend or SES — PDF ticket with per-seat QR + GST invoice) and **WhatsApp Business API** (BSP: AiSensy/Gupshup/Meta Cloud — confirmation, ticket link, **reminder 2 days before**). WhatsApp also carries login OTP (ADR-003).
**Alternatives:** + SMS (deferred); email-only (rejected: weak reach in India).

## ADR-008 — Refunds & cancellation are per-event configurable
**Status:** Accepted
**Decision:** Per-event policy: **No refunds** (default) / **self-service until N days before with optional fee** / **admin-only**. Processed via **Razorpay Refunds API**; seats released; full **audit log**. **Auto refund-all** on event cancellation.
**Alternatives:** Admin-only globally (rejected: less flexible); platform-wide self-service window (rejected).

## ADR-009 — Concurrency-safe seat holds now; waiting room later
**Status:** Accepted
**Context:** On-sales can stampede; seats must never double-sell.
**Decision:** **Seat-hold service** with DB-enforced uniqueness: a **partial unique index on `(showtime_id, seat_id)` for state ∈ {held, sold}**, holds with **8-minute expiry**, atomic insert (`ON CONFLICT DO NOTHING`) to detect contention, lazy + scheduled expiry cleanup. **Idempotent** payment fulfillment. **Rate limiting** on hold/checkout/OTP. **Virtual waiting room deferred** (hooks left in).
**Consequences:** Robust under load without a queue; queue can be added later if a single on-sale goes viral.

## ADR-010 — Path-based multi-tenancy; migrate BhaZen as event #1
**Status:** Accepted
**Decision:** One domain, **path-based** routing: `/` (national landing), `/[city]` (e.g. `/vizag`), `/e/[event-slug]` (event). **BhaZen Clubbing (Vizag)** migrated as the first live event using existing content/images.
**Alternatives:** Subdomain per city (rejected: wildcard SSL + routing complexity, SEO split).

## ADR-011 — Evolve the BhaZen design system into Sattvick Beats
**Status:** Accepted
**Decision:** Reuse the BhaZen palette (deep purple / orange / cyan / magenta), Big Shoulders Display + Open Sans typography, and component styles as the Sattvick Beats design system (ported to the app's styling layer). Single national brand (no per-city theming initially).
**Alternatives:** Fresh brand (deferred — needs assets/design round); per-city accents (deferred).

## ADR-012 — English now, i18n-ready
**Status:** Accepted
**Decision:** Build with i18n scaffolding (`next-intl`): UI strings externalized, content fields translatable (`{en, …}` JSON). Ship **English only**; additional languages added later without rework.

## ADR-013 — Seat-map authoring via preset templates
**Status:** Accepted (see ADR-002)
**Decision:** Admin starts from **Theatre** or **Stadium** templates and tweaks. Seat maps attached to a **reusable Venue** (Assumption A-2) so repeat venues aren't re-authored; events reference a venue + map categories to prices.

## ADR-014 — Offline-first scanner / check-in (supersedes earlier "online scanner" assumption)
**Status:** Accepted
**Context:** Entry traffic peaks within a ~30-minute window and venue internet may be unreliable/compromised. Check-in must work with **no connectivity**.
**Decision:** Scanner is an **installable PWA, offline-first**:
- **Pre-event sync (online):** device authenticates (Scanner role, event/showtime-scoped) and downloads a signed **allowlist** for its showtime(s): per-ticket `{ticket_id, hash(qr_token), seat, category, holder_name_masked, status}` + the **Ed25519 public key** (ADR-015) + showtime metadata. Stored in **IndexedDB**.
- **Offline validation:** scan QR → verify **Ed25519 signature** locally (public key, no secret on device) → confirm ticket is in allowlist and not already used → check **local used-set** for instant duplicate blocking → mark used locally and enqueue the check-in event.
- **Sync (when online):** background-sync pushes queued check-ins (idempotent by `ticket_id`, **earliest timestamp wins**) and pulls allowlist deltas (new sales, refunds, comps).
- **Cross-device duplicates:** true real-time cross-gate dedup is impossible offline; same-device dup is blocked instantly; **cross-device duplicates are detected at sync and flagged** in a security report (first scan admitted, later scans flagged).
- **Stale-allowlist edge:** a ticket refunded after a device's last sync may still be admitted until the next sync; mitigated by periodic re-sync when any connectivity appears and by the duplicate/anomaly report.
**Consequences:** No dependency on venue network during the rush. Requires service worker, IndexedDB, camera QR scanning, background sync, and a robust merge/conflict protocol. Heavily tested (see TESTING_SCOPE §Offline Scanner).
**Alternatives:** Online-only scanner (rejected: fails on poor connectivity); peer-to-peer local-network sync between scanners (deferred: complex).

## ADR-015 — Tamper-proof tickets via Ed25519-signed QR
**Status:** Accepted
**Context:** Offline scanners must verify ticket authenticity without holding a server secret.
**Decision:** Each ticket QR encodes a compact payload (`ticket_id`, `showtime_id`, issue time) **signed with an Ed25519 private key** held only on the server. Scanners verify with the **public key** (safe to distribute). Validity (refund/cancel/used) is enforced via the downloaded allowlist + server on sync.
**Alternatives:** HMAC symmetric (rejected: would require shipping a secret to devices); opaque random tokens (rejected: require online lookup to validate authenticity).

## ADR-016 — Repo layout & cutover
**Status:** Accepted
**Decision:** Build the Next.js app in **this repository**; keep the legacy static site under `Meeta_HTML/` as the **content source** for the BhaZen migration (and in git history). Static site remains live on Cloudflare until the platform is production-ready, then **DNS cutover** to Vercel on `sattvickbeats.com`; `bhazenclubbing.com` redirects to the BhaZen event page.

## ADR-017 — QA / documentation discipline
**Status:** Accepted
**Decision:** Maintain four living documents (Decisions, Architecture, Testing Scope, Implementation Tracker) **in sync with every change**. A detailed Testing Scope is produced and kept current so QA can author test cases and stakeholders gain confidence before launch.

## ADR-018 — ORM choice
**Status:** Pending input (will default to **Prisma** unless you prefer Drizzle)
**Context:** Need type-safe DB access + migrations. **Prisma** = mature, great DX, easy migrations. **Drizzle** = lighter, SQL-first, fine-grained control (helpful for the `FOR UPDATE` / partial-index seat logic).
**Default if no objection:** **Prisma** for schema/migrations + raw SQL for the few hot concurrency paths.

---

## Assumptions (confirm/adjust)
- **A-1:** One Razorpay/AOL merchant account for all cities (single settlement), not per-city.
- **A-2:** Venues are reusable (authored once from a template, reused across events).
- **A-3:** General Admission supported as a special non-numbered zone within the reserved-seating engine.
- **A-4:** Scanner devices get **at least one** online window before doors to pre-sync the allowlist.
- **A-5:** English content authored by AOL teams; legal pages (T&C, privacy, refund text) provided by AOL.

## Pending inputs (needed before the phases that use them)
- Razorpay keys + KYC + AOL GSTIN/SAC/invoice series (Phase 3).
- WhatsApp BSP access + approved templates; email sending domain + DNS (Phase 3–4).
- `sattvickbeats.com` DNS access; `bhazenclubbing.com` redirect decision (Phase 6).
- Sattvick Beats logo/wordmark (or approve text wordmark) (Phase 1).
- AOL Trust donation URL (Phase 1).
- Owner of Vercel + Neon accounts (Phase 0).

---
_Last updated: 2026-06-30_
