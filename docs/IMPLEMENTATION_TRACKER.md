# Implementation Tracker — Sattvick Beats

> Durable, detailed phase/task plan. The harness task list mirrors the **current** phase; this file holds the full plan, definition-of-done (DoD), dependencies, and changelog. Update statuses here whenever work moves.

**Status keys:** ⬜ todo · 🟦 in progress · ✅ done · ⛔ blocked
**Current focus:** Phase 2 — Seat-map engine _(Phase 1 done; Vercel Blob upload + Vercel/Neon/Sentry deferred to accounts)_

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

## Phase 2 — Seat-map engine  ⬜  ★high-risk
**Goal:** Reserved seating end-to-end except payment.
- ⬜ Seat-map builder (Theatre/Stadium templates, tweak, categories, blocked/accessible, GA zone)
- ⬜ Venue reuse + per-event/showtime category→price mapping; publish materializes Seat inventory
- ⬜ Public seat-map render + selection UI (states, legend, max-per-order, mobile zoom)
- ⬜ Seat-hold service: partial unique index, 8-min holds, atomic insert, expiry cleanup, rate limiting
- ⬜ "Reserve" stub flow (no charge) + hold countdown UI
- ⬜ Load test (k6) proving no double-book
**DoD:** TS-SEAT, TS-SEATBLD, TS-HOLD, TS-PERF-02 pass.

## Phase 3 — Accounts & payments  ⬜
**Goal:** Login + real money.
- ⬜ Auth.js phone provider: **WhatsApp OTP + email fallback**; account area + booking history; rate limits/lockout
- ⬜ Pricing engine: per-event fee + GST + promo; ₹0 events
- ⬜ Razorpay: order creation, Checkout, **webhook** (signature + idempotency), fulfillment held→sold
- ⬜ GST invoice (numbering, GSTIN, SAC, PDF) 
- ⬜ Refund engine: per-event policy, Razorpay refunds, seat release, audit; event-cancel bulk refund
- ⬜ Reconciliation job for stuck `pending` orders
**DoD:** TS-AUTH, TS-CART, TS-PAY, TS-ORD, TS-REF pass (Razorpay test mode).
**Pending input:** Razorpay keys + KYC; GSTIN/SAC/invoice series.

## Phase 4 — Tickets, delivery & offline check-in  ⬜  ★high-risk (offline)
**Goal:** Get tickets to buyers; admit them offline.
- ⬜ Ed25519 QR signing; PDF tickets (per-seat QR)
- ⬜ Email (Resend/SES) confirmation + invoice; WhatsApp confirmation + ticket link; **T-2 reminder** job
- ⬜ Scanner PWA: install, pre-sync allowlist + public key (IndexedDB)
- ⬜ Offline validate (signature + allowlist + used-set), green/red UX, manual-entry fallback
- ⬜ Background sync (idempotent, earliest-wins) + cross-device duplicate flagging + anomaly report
**DoD:** TS-NOTIF, TS-SCAN (all), real-device offline drill pass.
**Pending input:** WhatsApp BSP + templates; email domain/DNS.

## Phase 5 — Admin completion & governance  ⬜
**Goal:** Self-serve, governed operations.
- ⬜ Full RBAC (super/city/scanner) + tenant scoping everywhere
- ⬜ Publish-approval workflow (draft→pending→live, reject+reason)
- ⬜ Analytics dashboard (revenue, sold, occupancy, refunds) + CSV/GST/settlement export
- ⬜ Promo codes, comp tickets, guest list
- ⬜ Audit logs for sensitive actions; admin notification settings
**DoD:** TS-ADMIN, TS-PROMO, TS-ANALYTICS pass; RBAC/IDOR security tests pass.

## Phase 6 — Hardening & launch  ⬜
**Goal:** Production-ready.
- ⬜ Security review (TS-SEC), pen-test checklist, rate-limit audit
- ⬜ Full load/on-sale simulation; performance budgets met
- ⬜ Accessibility AA (TS-A11Y); compatibility matrix (TS-COMPAT)
- ⬜ Monitoring/alerting (Sentry), backups (Neon PITR), runbooks (on-sale, refunds, scanner)
- ⬜ Content seeding for launch cities; legal pages
- ⬜ DNS cutover to Vercel (`sattvickbeats.com`); `bhazenclubbing.com` redirect
- ⬜ UAT sign-off (content/finance/ops); launch checklist (TESTING_SCOPE §10)
**DoD:** launch sign-off checklist complete.

## Deferred / future
- Virtual waiting room (queue) for viral on-sales (hooks reserved in Phase 2).
- Additional languages (Hindi/regional) — scaffolding ready (ADR-012).
- National/city-level partners; per-city theming.
- Peer-to-peer scanner sync over local network.
- SMS OTP channel (if WhatsApp deliverability underperforms).

---

## Changelog
- **2026-06-30** — Phase 1 complete: dynamic `sitemap.xml` + `robots.txt` (disallow /admin,/api), public per-event Partners section (+ sample partners seeded). Only deferred item: Vercel Blob image upload (account-gated). → Phase 2 next.
- **2026-06-30** — Content admin (super-admin): password-gated (`middleware.ts`, temp HTTP Basic) dashboard + CRUD for Cities/Venues/Bands/Events incl. inline showtimes/categories/partners + status publish; server actions; JSON editors for flexible content. Verified via screenshots. Remaining Phase 1: Vercel Blob media upload, sitemap/robots, public partners section.
- **2026-06-30** — Phase 1 slice: DB-driven public site. Seeded BhaZen; data-access layer (`lib/queries`); templated event page `/e/bhazen-clubbing` ported from the static site (reads Postgres) + countdown client component; dynamic home + `/[city]` with EventCard; per-page SEO. Verified via screenshots. Pending: sitemap/robots, partners section, content admin.
- **2026-06-30** — Phase 0 wrap (no-account items): next-intl i18n (en), design-system primitives + branded 404/loading, Auth.js v5 skeleton (builds on Next 16), CI workflow (lint+build), npm `db:*`/`postinstall` scripts. Remaining Phase 0 (Vercel deploy, Sentry) gated on accounts. Next: Phase 1.
- **2026-06-30** — Prisma data model landed: 22-model schema, init migration + raw-SQL partial unique index (`ticket_active_seat_unique`) for the seat-hold concurrency guard, verified in Postgres. Pinned **Prisma 6** (v7 dropped in-schema `url` + mandates driver adapters — deferred; see ADR-018). Dev DB on Docker `:5433`.
- **2026-06-30** — Phase 0 in progress: Next.js app scaffolded at repo root (Next 16 / React 19 / Tailwind 4), BhaZen design tokens + fonts ported, branded landing shell building & rendering. Note: Google merged "Big Shoulders Display" → "Big Shoulders" (variable) — `next/font` export is `Big_Shoulders`.
- **2026-06-30** — Initial plan created from discovery Q&A (ADR-001…017). Added offline-first scanner (ADR-014) + Ed25519 QR (ADR-015) after stakeholder input. Phase 0 started.

---
_Last updated: 2026-06-30_
