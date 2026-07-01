# Architecture — Sattvick Beats

> Cross-references decisions in [DECISIONS.md](./DECISIONS.md) (ADR-NNN).

## 1. Overview

Sattvick Beats is a national, multi-city concert ticketing platform for Art of Living. One generic engine powers many cities/events; content is customized via a custom admin (ADR-004). Buyers browse → pick city/event/showtime → select reserved seats → log in (phone) → pay (Razorpay) → receive ticket+QR by email/WhatsApp → enter via an offline-capable QR scanner.

## 2. Stack (ADR-001)

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, TypeScript), React Server Components |
| Hosting | Vercel |
| DB | PostgreSQL (Neon, serverless) |
| ORM | Prisma (default, ADR-018) + raw SQL for hot concurrency paths |
| Styling | Tailwind CSS with BhaZen design tokens (ADR-011) |
| Auth | Auth.js (custom phone-OTP provider) (ADR-003) |
| Media | Vercel Blob |
| Payments | Razorpay (Orders + Checkout + Webhooks) |
| Email | Resend (or SES) |
| WhatsApp | BSP (AiSensy / Gupshup / Meta Cloud API) |
| Rate limit / cache | Upstash Redis (or Vercel KV) |
| i18n | next-intl (ADR-012) |
| Error/monitoring | Sentry + Vercel Analytics |
| Tests | Vitest (unit), Playwright (e2e), k6 (load) |

## 3. Repo structure (target)

```
/                         # Next.js app root (Vercel project root)
├── app/                  # routes (public, account, admin, scanner, api)
│   ├── (public)/         # /, /[city], /e/[slug]
│   ├── account/          # login, bookings, tickets
│   ├── admin/            # dashboard (RBAC-gated)
│   ├── scan/             # offline scanner PWA
│   └── api/              # route handlers (booking, payments, webhooks, sync)
├── lib/                  # domain logic (pricing, holds, qr, rbac, notifications)
├── db/                   # schema, migrations, seed
├── components/           # design-system + feature components
├── messages/             # i18n catalogs (en.json, …)
├── public/               # static assets, PWA manifest, service worker
├── tests/                # unit / e2e / load
├── docs/                 # the four living docs
└── Meeta_HTML/           # legacy static BhaZen site (content source, ADR-016)
```

## 4. Environments & config

- **Local / Preview (Vercel) / Production.** Razorpay **test** keys in non-prod; **live** in prod only.
- Secrets in Vercel env: `DATABASE_URL`, `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET`, `QR_SIGNING_PRIVATE_KEY` (Ed25519), `QR_SIGNING_PUBLIC_KEY`, `RESEND_API_KEY`, `WHATSAPP_*`, `UPSTASH_*`, `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`.
- Per-env seed: demo cities/events in non-prod; real content in prod.

## 5. Data model (ADR-002, 004, 005)

Tables (key fields; PK `id`, plus `created_at/updated_at`; soft-delete where useful). Translatable text stored as JSON `{en, …}`.

- **City** — slug, name, state, hero_media, intro, status(draft/pending/live), seo.
- **Venue** — name, city_id, address, lat, lng, maps_embed, template_type(theatre|stadium), `layout_json` (sections/rows/seats with category, blocked, accessible), capacity.
- **Band** — name, bio, photo, socials. **BandMember** — band_id, name, role, photo. (Band ↔ Event many-to-many.)
- **Event** — slug, title, city_id, venue_id, description, hero_media, gallery_json, status, `fee_config`(none|flat|percent + value), `gst_config`(rate, inclusive?), `refund_policy`(type, window_days, fee_pct), on_sale_at, doors_at, seo, approval fields (submitted_by, approved_by, rejected_reason).
- **Showtime** — event_id, starts_at, ends_at, status. Owns seat inventory.
- **TicketCategory** — event_id, name, color, base_price, **admission(reserved|general)**, **capacity?** (GA pool size); `reserved` maps to seat `category` in the layout, `general` uses `GaInventory` (ADR-019).
- **Seat** — showtime_id, section, row, number, category, accessible(bool), blocked(bool). (Materialized per showtime from the venue layout at publish time.)
- **SeatHold** — showtime_id, seat_id, owner_token/user_id, expires_at. (Implemented as `BookingItem` rows in state `held`; see §6.)
- **User** — phone(unique), name, email, status. **StaffMembership** — user_id, role(super_admin|city_admin|scanner), scope_city_id?, scope_event_id?.
- **Order** — user_id, showtime_id, status(pending|paid|failed|refunded|partially_refunded|cancelled), subtotal, fee, gst, total, currency, razorpay_order_id, razorpay_payment_id, promo_id, invoice_id.
- **BookingItem / Ticket** — order_id, showtime_id, **seat_id (nullable — null for GA)**, **ticket_category_id (GA linkage)**, category, price, state(held|sold|refunded|comp), `qr_token`(Ed25519-signed), checkin_status(unused|used), checkin_at, scanner_device_id.
- **GaInventory** — showtime_id, ticket_category_id, capacity, reserved (held+sold counter); `@@unique(showtime_id, ticket_category_id)`; atomic reserve/release (ADR-020).
- **Promo** — code, scope(event), type(percent|flat), value, max_uses, per_user_limit, starts/ends, used_count.
- **Comp / GuestList** — event_id, name, phone, qty, issued tickets.
- **Refund** — order_id, amount, reason, status, razorpay_refund_id, actor_id.
- **Invoice** — order_id, number(series), gstin, sac, pdf_url, breakdown.
- **WebhookEvent** — provider, external_id(unique → idempotency), type, payload, processed_at.
- **CheckinEvent** — ticket_id, showtime_id, device_id, scanned_at, source(online|offline-sync), flagged(bool), flag_reason.
- **ScannerDevice** — event_id/showtime scope, label, auth_token_hash, last_sync_at.
- **AuditLog** — actor_id, action, entity, entity_id, before/after(json), ip, ts.
- **Media** — owner ref, blob_url, type, alt.

**Critical constraint:** partial unique index `UNIQUE (showtime_id, seat_id) WHERE state IN ('held','sold')` → a seat cannot be held/sold twice (ADR-009). For **GA** (`seat_id` null) oversell is prevented by the atomic `GaInventory` counter (ADR-020), not the index.

## 6. Booking & seat-hold concurrency (ADR-009)

1. **Select seats (reserved):** `BEGIN; INSERT booking_items(state='held', expires_at=now()+8min) ... ON CONFLICT (showtime_id,seat_id) WHERE state IN('held','sold') DO NOTHING; COMMIT;` Compare inserted vs requested → report any lost seats; UI re-prompts.
1b. **Select quantity (general):** atomic `UPDATE "GaInventory" SET reserved = reserved + :qty WHERE reserved + :qty <= capacity RETURNING reserved` → on a returned row create :qty seatless held items; else "sold out" (ADR-020). Reserved + GA may be combined in one transaction under one hold (ADR-021).
2. **Login** if needed (phone OTP).
3. **Price:** subtotal (Σ seat prices) + fee (per-event) + GST → store breakdown; apply promo if valid.
4. **Pay:** create Razorpay **order** for `total`; open Checkout.
5. **Fulfill (webhook, source of truth):** verify signature; idempotent via `WebhookEvent.external_id`; on `payment.captured` → flip items `held→sold`, generate `qr_token` per ticket, create Invoice, send Email+WhatsApp.
6. **Release:** expiry (lazy check + scheduled job) and on payment failure/cancel → delete/expire held items.
7. **Rate limiting** on hold/checkout/OTP (Upstash). **Waiting room** deferred (interface stub).

## 7. Payments, fees, GST, refunds (ADR-005, 008)

- **Razorpay Orders API** server-side (paise). **Webhook** is authoritative; client confirmation is UX only.
- **Pricing engine** (`lib/pricing`): per-event fee (none/flat/percent) + GST(rate, inclusive flag); ₹0 events skip payment. Pure, unit-tested.
- **GST invoice**: numbering series, AOL GSTIN, SAC, PDF (stored in Blob), emailed.
- **Refunds**: per-event policy gate → Razorpay Refunds API → update Order/Items, release seats, write Refund + AuditLog. Event cancellation → bulk refund job.

## 8. Tickets & QR (ADR-015)

- `qr_token` = base64url(payload `{tid, sid, iat}` + **Ed25519 signature**). Private key server-only; public key shipped to scanners.
- PDF ticket: event, showtime, seat(s), holder, per-seat QR. Generated server-side, stored in Blob, emailed; WhatsApp sends link + summary.

## 9. Offline scanner / check-in (ADR-014) — detailed

**Goal:** validate and admit attendees with **zero connectivity** during the entry rush.

**Components:** PWA at `/scan` (service worker + offline cache), IndexedDB stores (`allowlist`, `checkins_queue`, `used_set`, `meta`), camera QR decode, background sync.

**Lifecycle:**
1. **Auth + scope:** scanner operator logs in (Scanner role); selects event/showtime; device registered (`ScannerDevice`).
2. **Pre-sync (requires connectivity):** download allowlist for the showtime:
   `[{ ticket_id, qr_hash, seat, category, holder_masked, state }]` + `ed25519_public_key` + `showtime` + `allowlist_version`. Persist to IndexedDB. Show "Synced ✓ (N tickets, vX, at HH:MM)".
3. **Scan (offline):**
   - Decode QR → parse payload + signature.
   - **Verify signature** with public key (authenticity, offline).
   - **Lookup** `ticket_id` in allowlist → must exist, `state='sold'/'comp'`, `showtime` matches.
   - **Used check** against local `used_set` → if present → **"Already used (this device)"**.
   - On success → add to `used_set`, append to `checkins_queue` `{ticket_id, scanned_at, device_id, gate}` → show **green ✓** with name/seat/category. On failure → **red ✗** with reason (invalid signature / not found / wrong showtime / refunded / already used).
4. **Sync (whenever online):** push `checkins_queue` (idempotent by `ticket_id`; server keeps **earliest** `scanned_at`); pull allowlist deltas (new sales/refunds/comps) → bump `allowlist_version`.
5. **Conflict handling (server):** if a `ticket_id` is checked in by >1 device/time → admit first, **flag** the rest (`CheckinEvent.flagged`), surface in an **anomaly report** for security.
6. **Edge cases & mitigations:**
   - *Refund after last sync:* device may admit a since-refunded ticket → mitigated by periodic re-sync + anomaly report.
   - *Two gates, same ticket, both offline:* both may admit → detected & flagged at sync (documented residual risk; optional gate-partitioning later).
   - *Device clock skew:* timestamps normalized; server is tie-breaker by received order if skew suspected.
   - *Lost/replaced device:* re-auth + re-sync; `used_set` rebuilt from server on next sync.
   - *Counterfeit QR:* fails Ed25519 verification → rejected offline.

## 10. Notifications (ADR-007)

- **Email (Resend/SES):** OTP fallback, order confirmation + PDF ticket + invoice.
- **WhatsApp (BSP):** OTP, confirmation + ticket link, **T-2 day reminder** (scheduled job). Templates pre-approved.
- Delivery logged; retries with backoff; failures visible in admin.

## 11. Admin & RBAC (ADR-004)

- **Super Admin:** everything, approvals, all cities, finance.
- **City Admin:** scoped CRUD (its city's events/venues/partners/promos), view its sales, submit for approval.
- **Scanner:** `/scan` for assigned event only.
- **Approval state machine:** draft → pending → live (or rejected→draft). Server-enforced on every mutation/read. **AuditLog** on sensitive actions (publish, refund, comp, role change, price change).
- **Seat-map builder:** template (theatre/stadium) → tweak rows/seats/sections/blocked/accessible → categories; saved to Venue; per-event price mapping.
- **Analytics:** revenue, sold, occupancy %, refunds by event/city/showtime; CSV + GST/settlement export.

## 12. i18n (ADR-012)

`next-intl`; UI strings in `messages/*.json`; content fields translatable JSON; default `en`; locale via route segment or cookie (decided in Phase 1). English-only content now; structure ready for more.

## 13. Security & compliance

- **AuthZ** server-side on every route/handler; tenant scoping (city/event) to prevent IDOR.
- **Payments:** no card data stored (Razorpay SAQ-A); webhook signature verification; idempotency.
- **QR:** Ed25519 signatures; allowlist scoping; no secrets on devices.
- **Rate limiting:** OTP, hold, checkout, sync, login.
- **PII:** phone/email minimized & access-controlled; privacy policy; retention policy; masked in allowlist.
- **Invoicing:** GST-compliant numbering & fields.
- **Audit:** immutable audit log for sensitive actions.
- **Headers/CSP**, input validation (zod), CSRF protection on mutations.

## 14. Observability & ops

- Sentry (errors), structured logs, Vercel Analytics. Health checks. DB **backups** (Neon PITR). Runbooks for on-sale, refunds, scanner sync issues. Alerting on webhook failures / payment anomalies.

## 15. Performance & scale (ADR-009)

- Indexed hot paths (showtime seats, holds). Read-replicas if needed. Static/ISR for public content; dynamic for seat availability. Load-tested on-sale simulation (k6) proving **no double-booking** under concurrency. Waiting-room interface reserved for future.

## 16. Admission modes & hybrid ticketing (ADR-019, 020, 021)

**Two admission modes per `TicketCategory`:**
- **Reserved** — buyer picks specific `Seat`s from the venue map (theatre/stadium). Inventory = `Seat` rows; no-oversell = the partial unique index (§6, ADR-009). Unchanged.
- **General admission (GA)** — buyer picks a **quantity** against a capacity pool. Inventory = one `GaInventory` row per (showtime, category); no-oversell = the **atomic counter** (ADR-020). Tickets are **seatless** (`seat_id` null).

**Hybrid events** carry both (e.g. BhaZen Jamming: Premium reserved block + General/Student GA). One order/hold may mix them (ADR-021), created in a single transaction (all-or-nothing).

**Materialization:** `materializeSeats(showtime)` creates `Seat` rows for reserved categories (from the venue layout) **and** a `GaInventory` row (capacity from the category) for each general category.

**GA lifecycle:** *hold* = atomic reserve(+qty) → N seatless held tickets (8-min expiry); *expire/release* = delete held GA tickets **and** decrement `reserved`; *fulfill* = held→sold + sign a QR per ticket; *refund* = sold→refunded and decrement `reserved` (frees capacity).

**UX:** the booking page renders a **seat map** for reserved sections and **quantity steppers** for GA categories; hybrid shows both. Checkout sums reserved seat prices + Σ(GA qty × price) → the existing pricing engine (§7). Account/ticket/scanner show "General Admission · &lt;tier&gt;" when `seat_id` is null.

**The three booking "styles"** = **Theatre** (reserved + theatre map) · **Stadium** (reserved + stadium map) · **General Admission** (general). **Hybrid** = premium reserved + GA (the real event). Cross-cutting concerns (QR ADR-015, offline scanner ADR-014, analytics occupancy = `reserved/capacity`) apply to GA unchanged.

---
_Last updated: 2026-07-01_
