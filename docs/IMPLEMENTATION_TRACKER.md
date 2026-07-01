# Implementation Tracker — Sattvick Beats

> Durable, detailed phase/task plan. The harness task list mirrors the **current** phase; this file holds the full plan, definition-of-done (DoD), dependencies, and changelog. Update statuses here whenever work moves.

**Status keys:** ⬜ todo · 🟦 in progress · ✅ done · ⛔ blocked
**Current focus:** Phase 4 — Tickets, delivery & offline check-in _(Phase 3 account-free scaffolding done; live payments/OTP-send need keys)_

---

## Phase 0 — Foundations  🟦
**Goal:** A running, deployable Next.js skeleton with DB, auth shell, design tokens, CI, and docs wired in.
- ✅ Scaffold Next.js (App Router, TS, ESLint, Tailwind) at repo root — Next 16.2.9 / React 19.2.4 / Tailwind 4.3.2; builds clean
- ✅ Port BhaZen design tokens (colors, Big Shoulders + Open Sans fonts) into Tailwind `@theme`; branded landing shell renders
- ✅ Add Postgres + Prisma 6 — schema (22 models), initial migration + partial-index guard (ADR-009) applied & verified; `.env`/`.env.example` + `lib/db.ts`. Dev DB = local Docker Postgres on **:5433** (host :5432 was taken); Neon for prod later.
- ✅ Auth.js skeleton (v5) — session plumbing + `/api/auth/[...nextauth]`; OTP provider deferred to Phase 3; builds on Next 16
- ✅ i18n scaffolding (next-intl, "without routing"); `en` catalog; landing strings externalized
- ✅ Base layout + design-system primitives (Button/ButtonLink, Container), branded 404 + loading states
- 🟦 CI (GitHub Action: lint + build) added; Vercel project + preview deploys pending account 
- ⬜ Sentry + analytics wiring (no-op safe in dev)
- ✅ Repo housekeeping: `.gitignore`, npm scripts (`db:*`, `typecheck`, `postinstall`→prisma generate)
**DoD:** app builds & deploys to Preview; CI green; tokens visible on a sample page; DB migration runs; docs updated.
**Depends on:** Vercel + Neon account owner (Pending input).

## Phase 1 — Content model & public site  ✅ _(Vercel Blob image upload deferred — account-gated)_
**Goal:** Public browsing of cities/events; BhaZen migrated as event #1; basic content admin (super admin).
- ✅ Schema: City, Venue, Band/BandMember, Event, Showtime, Partner, Media (+ translatable JSON, Event.contentJson)
- ✅ Public routes: `/`, `/[city]`, `/e/[slug]` + per-page SEO + dynamic `sitemap.xml`/`robots.txt`
- ✅ Templated DB-driven event page (hero+countdown, about, counter, band, tickets, gallery, FAQ, contact, footer)
- ✅ Seed **BhaZen Clubbing (Vizag)** — city/venue/band+members/event/showtime/categories; images copied to `public/images/bhazen/`
- ✅ AOL Trust CTA (external redirect) + per-event Partners section on the public event page
- ✅ Admin (super-admin): dashboard + CRUD for Cities/Venues/Bands/Events (+ inline showtimes/ticket-categories/partners), server actions, JSON editors; temp HTTP-Basic gate (`middleware.ts`). Media via image URLs for now — Vercel Blob upload deferred to account.
**DoD:** BhaZen event fully renders via the platform; only `live` content public; TS-PUB/TS-CITY pass.
**Pending input:** Sattvick Beats logo (or approve text wordmark); AOL Trust URL.

## Phase 2 — Seat-map engine  ✅  ★high-risk _(visual drag builder, GA zone, rate-limit deferred)_
**Goal:** Reserved seating end-to-end except payment.
- 🟦 Seat-map generators (theatre/stadium) in `lib/seatmap` + admin "Generate seats"; visual drag builder + GA zone later
- ✅ Materialize Seat inventory per showtime from venue layout (336 seats seeded for BhaZen); category→price via TicketCategory
- ✅ Public seat-selection UI (tier-colored map, available/held/sold/blocked/selected, legend, max 10/order, mobile scroll)
- ✅ Seat-hold service: atomic 8-min holds via partial unique index (`ON CONFLICT DO NOTHING` + rollback), lazy expiry cleanup. Rate limiting deferred (needs Upstash/account)
- ✅ Reserve flow → hold page with 8-min countdown + total; payment placeholder (Phase 3)
- ✅ Concurrency proof (`scripts/hold-concurrency.ts`): 25 simultaneous holds → 1 winner, no double-book
**DoD:** TS-SEAT, TS-SEATBLD, TS-HOLD, TS-PERF-02 pass.

## Phase 3 — Accounts & payments  ✅ _(account-free scaffolding done; live Razorpay widget + WhatsApp/email send + reconciliation activate with keys/accounts)_
**Goal:** Login + real money.
- ✅ Auth.js phone OTP (dev-console code; WhatsApp/email send wired in Phase 4) + account/booking history + 5-attempt lockout. Rate-limit deferred (Upstash)
- ✅ Pricing engine: per-event fee + GST (additive/inclusive), ₹0 events; 7 vitest unit tests; CI runs `npm test`. Promo later
- 🟦 Razorpay REST client + signature-verified idempotent **webhook** + idempotent fulfillment (held→sold). Dev-pay simulates capture; live Checkout widget wires when keys provided
- ✅ GST invoice: gap-free numbering (Counter), GSTIN/SAC, breakdown + viewable invoice page (PDF/delivery in Phase 4) 
- ✅ Refund engine: per-event policy gate, Razorpay refund (dev-aware), seat release (sold→refunded), Refund + AuditLog, admin + self-service (bulk event-cancel later)
- ⬜ Reconciliation job for stuck `pending` orders
**DoD:** TS-AUTH, TS-CART, TS-PAY, TS-ORD, TS-REF pass (Razorpay test mode).
**Pending input:** Razorpay keys + KYC; GSTIN/SAC/invoice series.

## Phase 4 — Tickets, delivery & offline check-in  🟦  ★high-risk (offline) _(core done; PDF ticket, T-2 reminder job, real-device camera/PWA QA deferred)_
**Goal:** Get tickets to buyers; admit them offline.
- ✅ Ed25519 QR signing (`lib/tickets/qr`) + per-ticket token on fulfillment + owner ticket page `/ticket/[id]` with rendered QR + confirmation links. PDF later
- 🟦 Confirmation via notify module (email Resend + WhatsApp BSP; dev-console fallback) on fulfillment. PDF attachment + T-2 reminder job deferred
- ✅ Scanner PWA: pre-sync allowlist + public key to IndexedDB; manifest + service worker (offline cache)
- ✅ Offline validate (allowlist hash membership + local used-set), green/red UX, manual + BarcodeDetector camera entry
- ✅ Check-in sync (idempotent resync; cross-device duplicate flagging via flagged CheckinEvent). Earliest-wins refinement + anomaly-report UI later
**DoD:** TS-NOTIF, TS-SCAN (all), real-device offline drill pass.
**Pending input:** WhatsApp BSP + templates; email domain/DNS.

## Phase 5 — Admin completion & governance  ✅ _(admin notification settings deferred)_
**Goal:** Self-serve, governed operations.
- ✅ RBAC: Auth.js + **middleware** session gate (`/admin`·`/account`·`/checkout`·`/ticket`); StaffMembership roles (super/city) in layout; events/orders scoped by city; cities/venues/bands super-only. Scanner via token (role-login later)
- ✅ Approval workflow: city-admin draft → submit (pending) → super approve (live) / reject (+reason); status clamped for city admins; audit logged
- ✅ Analytics dashboard (revenue, paid orders, tickets sold, comps, occupancy, refunds; per-event) + orders CSV export (`/api/admin/export`), city-scoped
- ✅ Promo codes (%/flat, max-uses, expiry) applied at checkout (discount → fee/GST recompute) + comps/guest list (auto-assign + block seats, signed QR under a ₹0 paid order). Verified: 10% promo, comps signed + seats blocked + no double-book
- ✅ Audit-log viewer (`/admin/audit`, super-only); entries written on approve/reject/refund/comp. Admin notification settings deferred
**DoD:** TS-ADMIN, TS-PROMO, TS-ANALYTICS pass; RBAC/IDOR security tests pass.

## Phase 6 — Hardening & launch  🟦
**Goal:** Production-ready.
- ✅ Security: authz/IDOR fixes (event sub-entities scoped) + headers + CSP + rate-limiting (OTP 5/10min per phone, holds 20/min per IP). Full pen-test checklist at UAT
- ⬜ Full load/on-sale simulation; performance budgets met
- 🟦 Accessibility: focus-visible ring, seat aria-labels/pressed + live regions, login alert role (lang + reduced-motion present). Full AA audit (TS-A11Y) + compat matrix at UAT
- 🟦 Runbooks (on-sale, refunds, scanner, incidents) → `docs/RUNBOOKS.md`. Monitoring (Sentry) + backups (Neon PITR) account-gated
- 🟦 Legal pages (terms/privacy/refund — draft) + `/api/health` (DB ping) + error/404 boundaries done. Content seeding for launch cities pending
- ⬜ DNS cutover to Vercel (`sattvickbeats.com`); `bhazenclubbing.com` redirect
- ⬜ UAT sign-off (content/finance/ops); launch checklist (TESTING_SCOPE §10)
**DoD:** launch sign-off checklist complete.

## Phase 7 — Admission modes & hybrid ticketing (GA)  ✅ built & verified locally (ADR-019/020/021)
**Goal:** Support reserved + General Admission + hybrid events; ship 3 events (1 real + 2 test).
- ✅ Schema: `TicketCategory.admission`+`capacity`; `GaInventory(showtime, category, capacity, reserved)`; `Ticket.seatId` nullable + `ticketCategoryId` (migration `admission_modes`)
- ✅ GA inventory: atomic reserve/release/refund counter (ADR-020); `materializeSeats` creates `GaInventory` for general categories
- ✅ Unified `reserveTickets`: reserved seats + GA under one `holdToken` in one transaction; expiry/release/refund decrement the counter
- ✅ Checkout / fulfillment / refund handle seatless tickets; QR per GA ticket; all seat labels seatless-safe
- ✅ Booking UI: GA quantity steppers + reserved seat map (hybrid page); "General Admission" labels on account/ticket/scanner
- ✅ Admin: category admission + capacity fields; analytics occupancy includes GA capacity
- ✅ Seeded 3 events (below) + **deployed to production** (Supabase migrated + reseeded; new event logo optimized 16MB→516KB & live)
- ✅ Tests: `scripts/ga-test` (12 vs cap 5 → no oversell, no drift) · `scripts/hybrid-test` (mixed hold→sold→refund frees GA). Full k6 load at UAT
**DoD:** GA never oversells (proven); hybrid orders atomic; counter reconciles; **3 events live in production**.

**Events seeded (2026-07-01):**
- **BhaZen Jamming** @ **Port Stadium, Akkayapalem, Visakhapatnam** (4500, stadium) — **Hybrid:** Premium ₹2999 reserved ×500 + General ₹999 GA ×3000 + Student ₹499 GA ×1000. *(Renamed BhaZen Clubbing.)*
- **Sattvick Strings** @ Ravindra Bharathi, Hyderabad — **Theatre** (Gold/Silver/Bronze, 240 seats).
- **Sattvick Rhythms** @ Kanteerava, Bengaluru — **Stadium** (VIP/Standard, 800 seats).

## Deferred / future
- Virtual waiting room (queue) for viral on-sales (hooks reserved in Phase 2).
- Additional languages (Hindi/regional) — scaffolding ready (ADR-012).
- National/city-level partners; per-city theming.
- Peer-to-peer scanner sync over local network.
- SMS OTP channel (if WhatsApp deliverability underperforms).

---

## Changelog
- **2026-07-01** — **Phase 7 deployed to production**: `admission_modes` migration applied to Supabase (via `vercel-build`) + prod reseeded with the 3 events (BhaZen Jamming hybrid + Sattvick Strings theatre + Sattvick Rhythms stadium); new event logo optimized (6250² 16 MB → 900² 516 KB) and live. Verified: health ok, all 3 events + hybrid booking live at sattvick-beats.vercel.app; old `/e/bhazen-clubbing` now soft-404s (renamed).
- **2026-07-01** — **Phase 7 built** (admission modes / GA / hybrid): migration `admission_modes` (admission+capacity, `GaInventory`, nullable seatId); unified `reserveTickets` (reserved+GA in one txn); GA oversell via atomic counter; seatless tickets throughout; GA steppers + hybrid booking UI; admin admission/capacity + GA analytics. Seeded 3 events (BhaZen Jamming hybrid + Sattvick Strings theatre + Sattvick Rhythms stadium). Verified: `ga-test` (12 vs cap 5 → exactly 5, no drift), `hybrid-test` (mixed order → sold w/ QR each → refund frees GA), hybrid booking page screenshot. **Local only — prod deploy (Supabase migrate + reseed) pending.**
- **2026-07-01** — Planned **Phase 7 — Admission modes & hybrid ticketing** (docs-only): designed reserved-vs-general admission, `GaInventory` atomic-counter oversell guard, seatless tickets, hybrid orders (ADR-019/020/021 + ARCHITECTURE §16 + TS-GA). Real event → **BhaZen Jamming** @ Port Stadium (4500): Premium ₹2999 reserved ×500 + General ₹999 GA ×3000 + Student ₹499 GA ×1000; + 2 test events (theatre + stadium). Implementation pending.
- **2026-07-01** — Deployed to production: Vercel (`satvik-beats/sattvick-beats`, region bom1) + Supabase (pooled runtime / direct migrations). Perf fix: functions co-located with DB, `connection_limit=5`, public reads deduped via React `cache()` — event page 9s→~0.3s, fixed the connection-pool-timeout "Oops". Live at https://sattvick-beats.vercel.app.
- **2026-06-30** — Deploy prep: `vercel-build` (migrate deploy + build) so Vercel auto-applies migrations; cleaned `.env.example` (required ✅ vs optional; dropped legacy ADMIN_USER/PASSWORD; added SUPER_ADMIN_PHONE); `docs/DEPLOYMENT.md` (Vercel + Neon, env table, seed-once, domain). Plus self-serve dev login (dev-only OTP auto-fill) + demo tooling.
- **2026-06-30** — Phase 6 (a11y + runbooks): accessibility pass — global focus-visible ring, seat-map aria-labels/aria-pressed + live regions, login error `role=alert` (lang + reduced-motion already present); `docs/RUNBOOKS.md` (on-sale, refunds, offline scanner, incidents). **Account-free Phase 6 hardening complete**; remaining items account-gated (Sentry/Neon/Vercel/DNS) + load/UAT.
- **2026-06-30** — Phase 6 (rate-limit + ops pages): in-memory rate limiter (Upstash later) on OTP (5/10min per phone) + holds (20/min per IP); `/api/health` (DB ping); global error boundary; legal pages (terms/privacy/refund, draft). Verified: limiter blocks 6th call, health ok, legal pages 200.
- **2026-06-30** — Phase 6 start (security): closed server-action authz gaps — `deleteEvent`/`setEventStatus` + all event sub-entity actions (showtime/category/partner/seats) now assert admin + city scope (entity-derived, not form-supplied); `setEventStatus` super-only. Added security headers (CSP, X-Frame-Options DENY, HSTS, Referrer-Policy, Permissions-Policy `camera=(self)`) via next.config (CSP prod-only). Verified: 6 headers present + event page renders under CSP.
- **2026-06-30** — Phase 5 close: audit-log viewer (`/admin/audit`, super-only) listing approve/reject/refund/comp actions with actor + details. **Phase 5 governance complete** (admin notification settings deferred). → Phase 6 (hardening) + account-gated activations.
- **2026-06-30** — Phase 5 analytics + promo/comps: analytics dashboard (KPIs + per-event, city-scoped) + orders CSV export; promo codes (CRUD in event editor; apply at checkout recomputes discount→fee/GST); comps/guest list (auto-assign + block seats, signed QR under a ₹0 paid order, phone login to view). Added `Order.discount`. Verified via script: 10% promo (₹2998→₹2698.20), 2 comps signed + seats blocked + comped seat unholdable.
- **2026-06-30** — Phase 5 RBAC + approval: replaced temp HTTP-Basic gate with Auth.js session gating via **middleware** (split Edge-safe `auth.config.ts`) on /admin·/account·/checkout·/ticket + StaffMembership roles (super/city), city scoping, and the approval workflow (draft→pending→live/reject, audited). **Fixed an auth gap** — layout/page `redirect()` didn't reliably block document GETs; added `trustHost`. Verified `/admin`→302 `/login`. Seeded super `+919999999999` + city admin `+918888888888`.
- **2026-06-30** — Phase 4 scanner + delivery: offline scanner PWA (`/scan`) — token-gated sync API (allowlist + Ed25519 public key) → IndexedDB, offline validate (hash membership + used-set), manual + camera (BarcodeDetector) entry, idempotent check-in sync with cross-device duplicate flagging; manifest + service worker. Notify module (email/WhatsApp, dev-console fallback) sends confirmation on fulfillment. Server flow verified: sync → admit → duplicate → resync. Deferred: PDF ticket, T-2 reminder, real-device camera/offline-reload QA.
- **2026-06-30** — Phase 4 start: Ed25519-signed QR tickets — keypair, `lib/tickets/qr` (sign/verify/hash), sign per ticket on fulfillment, owner ticket page `/ticket/[id]` with rendered QR + confirmation links. QR test passes (roundtrip, tamper rejected, PNG). Next: delivery + offline scanner.
- **2026-06-30** — Phase 3 tail: refund engine (per-event policy gate, dev-aware Razorpay refund, seat release sold→refunded, Refund + AuditLog, admin + self-service) + GST invoice (gap-free Counter numbering + viewable invoice page) generated on payment. Refund test passes (seats freed; invoice SB/2026/00001). Phase 3 account-free scaffolding complete. → Phase 4.
- **2026-06-30** — Phase 3 auth + checkout (account-free): phone OTP login (dev-console code) + account/booking history; hold→Order→pricing→idempotent fulfillment (held→sold) with dev-pay simulation; Razorpay REST client + signature-verified idempotent webhook (inert until keys). Money-path test passes (paid, 2 seats sold, idempotent). Remaining P3: GST invoice, refund engine, live Razorpay widget.
- **2026-06-30** — Phase 3 start (account-free): pricing engine (fee + GST, additive/inclusive, free events) with 7 vitest unit tests; CI now runs `npm test`. Next: dev-mode OTP auth, checkout flow, Razorpay/webhook scaffolding.
- **2026-06-30** — Phase 2 complete (seat engine): atomic seat-hold service (8-min holds on the partial unique index), interactive tier-colored seat-selection UI, reserve→hold-countdown flow (payment placeholder for Phase 3). Concurrency proof passes (25 holds → 1 winner, no double-book). Rate limiting + visual drag builder + GA zone deferred. → Phase 3.
- **2026-06-30** — Phase 2 start (seat engine foundation): seat-map types + theatre/stadium generators (`lib/seatmap`), per-showtime seat materialization + admin "Generate seats"; reseeded BhaZen with a 14×24 theatre map + Gold/Silver/Bronze tiers (336 seats). Next: hold service + selection UI.
- **2026-06-30** — Phase 1 complete: dynamic `sitemap.xml` + `robots.txt` (disallow /admin,/api), public per-event Partners section (+ sample partners seeded). Only deferred item: Vercel Blob image upload (account-gated). → Phase 2 next.
- **2026-06-30** — Content admin (super-admin): password-gated (`middleware.ts`, temp HTTP Basic) dashboard + CRUD for Cities/Venues/Bands/Events incl. inline showtimes/categories/partners + status publish; server actions; JSON editors for flexible content. Verified via screenshots. Remaining Phase 1: Vercel Blob media upload, sitemap/robots, public partners section.
- **2026-06-30** — Phase 1 slice: DB-driven public site. Seeded BhaZen; data-access layer (`lib/queries`); templated event page `/e/bhazen-clubbing` ported from the static site (reads Postgres) + countdown client component; dynamic home + `/[city]` with EventCard; per-page SEO. Verified via screenshots. Pending: sitemap/robots, partners section, content admin.
- **2026-06-30** — Phase 0 wrap (no-account items): next-intl i18n (en), design-system primitives + branded 404/loading, Auth.js v5 skeleton (builds on Next 16), CI workflow (lint+build), npm `db:*`/`postinstall` scripts. Remaining Phase 0 (Vercel deploy, Sentry) gated on accounts. Next: Phase 1.
- **2026-06-30** — Prisma data model landed: 22-model schema, init migration + raw-SQL partial unique index (`ticket_active_seat_unique`) for the seat-hold concurrency guard, verified in Postgres. Pinned **Prisma 6** (v7 dropped in-schema `url` + mandates driver adapters — deferred; see ADR-018). Dev DB on Docker `:5433`.
- **2026-06-30** — Phase 0 in progress: Next.js app scaffolded at repo root (Next 16 / React 19 / Tailwind 4), BhaZen design tokens + fonts ported, branded landing shell building & rendering. Note: Google merged "Big Shoulders Display" → "Big Shoulders" (variable) — `next/font` export is `Big_Shoulders`.
- **2026-06-30** — Initial plan created from discovery Q&A (ADR-001…017). Added offline-first scanner (ADR-014) + Ed25519 QR (ADR-015) after stakeholder input. Phase 0 started.

---
_Last updated: 2026-06-30_
