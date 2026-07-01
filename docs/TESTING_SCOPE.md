# Testing Scope — Sattvik Beats

> Hand this to QA to author detailed test cases. Kept in sync with [ARCHITECTURE.md](./ARCHITECTURE.md) and [DECISIONS.md](./DECISIONS.md) (ADR-NNN). Each area lists **scope**, **happy-path scenarios**, **negative/edge cases**, and **acceptance criteria**. IDs (e.g. `TS-HOLD-03`) are stable handles for traceability.

## 1. How to use this document
- QA expands each scenario into concrete test cases (steps, data, expected result).
- Every feature must have functional + relevant non-functional coverage before its phase is "done."
- **Critical modules** (must not ship with open Sev-1/2): Seat Hold/Concurrency (TS-HOLD), General Admission (TS-GA), Payments (TS-PAY), Offline Scanner (TS-SCAN), Security (TS-SEC).

## 2. Test levels & types
- **Unit** (Vitest): pricing/fee/GST, hold state machine, QR sign/verify, RBAC checks, refund policy.
- **Integration** (API + DB + Razorpay test mode + email/WhatsApp sandbox): booking→payment→webhook→ticket.
- **E2E** (Playwright): full buyer & admin journeys, scanner PWA.
- **Load** (k6): on-sale concurrency, double-book prevention.
- **Manual / exploratory**: seat-map builder, scanner on real devices, WhatsApp/email rendering.
- **UAT**: AOL admins (content/approval), finance (GST/settlement), ops (scanning).

## 3. Environments, data, tooling
- **Envs:** Local, Preview (per-PR), Staging (prod-like), Production (smoke only).
- **Payments:** Razorpay **test** keys everywhere except prod; documented test cards/UPI success & failure.
- **Test data:** seed cities (≥2), venues (theatre + stadium), events (paid, free, sold-out, draft/pending/live), users (customer, city-admin, super-admin, scanner), promos (valid/expired/used-up), refundable & non-refundable events.
- **Devices:** Android + iOS phones for scanner & mobile web; desktop Chrome/Safari/Firefox/Edge.

## 4. Severity / priority & entry-exit criteria
- **Sev-1** data loss / double-sell / payment incorrect / security breach. **Sev-2** core flow blocked. **Sev-3** functional non-blocking. **Sev-4** cosmetic.
- **Entry:** feature code-complete, unit tests pass, build deployed to Preview/Staging, test data seeded.
- **Exit:** all planned cases executed; no open Sev-1/2; Sev-3 triaged; non-functional thresholds met; docs updated.

---

## 5. Functional scope

### TS-PUB — Public site, navigation, SEO
- **Scope:** national landing, header/footer, routing, SEO/OG, performance basics.
- **Happy:** landing lists cities/featured events; nav + anchors work; OG/meta present; sitemap/robots correct; 404 page.
- **Edge:** no live events (empty states); very long titles; missing images (fallbacks); slow network (skeletons); deep-link to event.
- **Acceptance:** all public routes 200; correct canonical/OG; Lighthouse perf/SEO/a11y ≥ target on key pages.

### TS-CITY — City & event discovery
- **Scope:** `/[city]` and `/e/[slug]`; listing, filtering by city/date, status visibility.
- **Happy:** city page shows its live events; event page shows band, gallery, showtimes, partners, AOL Trust CTA, "Buy".
- **Edge:** draft/pending events NOT publicly visible; past events marked/hidden; event with multiple showtimes; city with one venue vs many.
- **Acceptance:** only `live` content public; correct city↔event scoping; AOL Trust CTA opens external URL in new tab.

### TS-SEAT — Seat map rendering & selection
- **Scope:** render theatre & stadium layouts; categories/colors; availability states.
- **Happy:** map renders; sold/blocked/accessible/selected states visually distinct; select up to max-per-order; price updates live; legend correct.
- **Edge:** very large maps (perf/zoom/pan); accessible-seat rules; blocked seats unselectable; GA zone (quantity, no specific seat); mobile pinch-zoom; rapid select/deselect; max-seats limit enforced.
- **Acceptance:** rendered seats match published inventory exactly; cannot select sold/blocked seats; selection summary & price correct.

### TS-HOLD — Seat hold & concurrency  ★CRITICAL (ADR-009)
- **Scope:** hold creation, expiry, release, and **double-book prevention** under concurrency.
- **Happy:** selecting seats creates 8-min holds; countdown shown; proceeding to pay keeps hold; completing payment converts hold→sold.
- **Edge/negative:**
  - `TS-HOLD-01` Two users select the **same seat** within ms → exactly one wins; the other is told which seats were lost and re-prompted.
  - `TS-HOLD-02` Hold **expires** mid-checkout → seat released; payment attempt on expired hold is rejected gracefully.
  - `TS-HOLD-03` Abandon checkout → seats return to inventory after expiry.
  - `TS-HOLD-04` Back-button/refresh during hold → state consistent (no orphan holds).
  - `TS-HOLD-05` Payment **succeeds after** hold expiry but before cleanup → reconciliation does not double-sell (idempotent fulfillment; if seat already taken, auto-refund + notify).
  - `TS-HOLD-06` Same user opens two tabs → holds reconciled, no duplicate charge.
  - `TS-HOLD-07` Rate limit on rapid hold requests.
- **Acceptance:** **no seat ever sold twice** under any concurrency; expired holds always released; user messaging accurate. Verified by load test (TS-PERF-02).

### TS-AUTH — Authentication & OTP (ADR-003)
- **Scope:** phone login via WhatsApp OTP + **email-OTP fallback**, sessions, logout, account area.
- **Happy:** enter mobile → WhatsApp OTP → verify → logged in; booking history visible; logout.
- **Edge/negative:** invalid/expired OTP; resend throttling/cooldown; wrong number format/country; user without WhatsApp → email fallback path; OTP brute-force lockout; session expiry/refresh; concurrent sessions; account with no bookings.
- **Acceptance:** OTP single-use & time-limited; fallback works; rate-limited; no account enumeration; sessions secure (httpOnly).

### TS-CART — Checkout, pricing, fees, GST, promo (ADR-005)
- **Scope:** order summary, per-event fee, GST, promo application, free events.
- **Happy:** subtotal+fee+GST = total (matches config); promo applies correct discount; ₹0 event skips payment and issues ticket.
- **Edge/negative:** fee = none/flat/percent variants; GST inclusive vs additive; promo expired/used-up/over-limit/wrong-event/case-insensitivity; promo + free event; rounding (paise) correctness; currency formatting (₹, lakh grouping).
- **Acceptance:** every pricing permutation computed correctly to the paise; promos enforce all limits; totals shown == amount charged.

### TS-PAY — Payments (Razorpay)  ★CRITICAL (ADR-005)
- **Scope:** order creation, checkout, success, failure, webhook fulfillment, idempotency.
- **Happy:** pay (test card/UPI) → success → order `paid`, seats `sold`, ticket+invoice generated.
- **Edge/negative:**
  - `TS-PAY-01` Payment **failure/declined** → seats released, no ticket, clear error.
  - `TS-PAY-02` User closes Razorpay modal / timeout → order stays `pending`, hold rules apply.
  - `TS-PAY-03` **Webhook is source of truth**: success with delayed webhook still fulfills; client says success but webhook never arrives → reconciliation job resolves.
  - `TS-PAY-04` **Duplicate webhook** delivery → processed once (idempotent).
  - `TS-PAY-05` **Invalid webhook signature** → rejected & logged.
  - `TS-PAY-06` Amount tampering (client sends different amount) → server authoritative; mismatch rejected.
  - `TS-PAY-07` Partial/over capture, refund-in-flight states.
- **Acceptance:** money charged == order total; fulfillment exactly once; signature verified; no fulfillment without captured payment.

### TS-ORD — Orders, tickets, QR, invoice (ADR-015)
- **Scope:** ticket + per-seat QR generation, PDF, GST invoice, "My Bookings" re-download.
- **Happy:** each seat gets a unique signed QR; PDF correct (event/showtime/seat/holder); GST invoice fields correct; re-download works.
- **Edge:** multi-seat order; QR uniqueness; invoice numbering sequence (no gaps/dupes); regenerate after email failure; tampered QR fails verify.
- **Acceptance:** QR verifies with public key; invoice GST-compliant & sequential; tickets retrievable by the buyer only.

### TS-NOTIF — Notifications: Email + WhatsApp (ADR-007)
- **Scope:** OTP, confirmation (+PDF+invoice), T-2 reminder; retries; logging.
- **Happy:** confirmation email + WhatsApp arrive with correct content/links; reminder fires ~2 days before showtime.
- **Edge/negative:** invalid email/number; WhatsApp template rejected/opt-out → email still sent; provider downtime → retry/backoff; reminder for cancelled event suppressed; duplicate-send prevention; timezone-correct reminder timing.
- **Acceptance:** at least one channel delivers; no duplicate/incorrect messages; failures visible in admin.

### TS-REF — Refunds & cancellation (ADR-008)
- **Scope:** per-event policy enforcement, self-service & admin refunds, event cancellation.
- **Happy:** within window → self-service refund (minus fee) → Razorpay refund → seat released → notify; admin issues partial/full refund.
- **Edge/negative:** non-refundable event blocks refund; outside window blocked; double-refund prevented; refund of already-used (checked-in) ticket policy; event cancellation → bulk auto-refund all orders; refund failure at Razorpay → retriable, audited; seat re-released and resellable.
- **Acceptance:** refund amount per policy; seats freed; one refund per item; full audit log; bulk cancel refunds everyone exactly once.

### TS-ADMIN — Admin content, RBAC, approval (ADR-004)
- **Scope:** CRUD for cities/venues/bands/events/showtimes/partners; roles; approval workflow.
- **Happy:** City Admin creates event (draft) → submit → Super Admin approves → live; edits; media upload.
- **Edge/negative (RBAC ★):**
  - City Admin **cannot** access another city's data (UI + API/IDOR).
  - City Admin **cannot** publish without approval; cannot change roles/finance.
  - Scanner can access **only** `/scan` for assigned event; blocked elsewhere.
  - Rejected event returns to draft with reason; re-submit flow.
  - Concurrent admin edits (last-write/version conflict).
  - Audit log entries for publish/price/refund/role/comp.
- **Acceptance:** every restricted action denied server-side for unauthorized roles; approval state machine correct; audit complete.

### TS-SEATBLD — Seat-map builder (ADR-013)
- **Scope:** create from Theatre/Stadium templates; tweak rows/seats/sections/blocked/accessible/categories; reuse venue; map categories→prices.
- **Happy:** build map; assign categories; save to venue; reuse in new event; set per-event prices; publish materializes seat inventory.
- **Edge:** duplicate seat labels prevented; capacity recomputed; editing a venue used by a **live** event (guardrails — no breaking sold seats); blocked/accessible seats persist; GA zone definition; very large layouts.
- **Acceptance:** published inventory matches builder exactly; cannot corrupt seats already sold; reuse works.

### TS-GA — General admission & hybrid ticketing  ★CRITICAL (oversell) (ADR-019/020/021)
- **Scope:** GA quantity purchase, capacity/oversell guard, seatless tickets, hybrid (reserved + GA) orders, GA hold/refund counter consistency.
- **Scenarios:**
  - `TS-GA-01` Buy N GA tickets → N **seatless** tickets issued; `GaInventory.reserved` increases by exactly N.
  - `TS-GA-02` **Oversell under concurrency:** capacity C, many buyers concurrently requesting > C total → total sold **≤ C exactly**; the rest get "sold out". Verified by load test (TS-PERF-02).
  - `TS-GA-03` GA hold **expires** unpaid → held tickets released **and** `reserved` decremented (counter matches ticket states).
  - `TS-GA-04` GA **refund** → ticket refunded and `reserved` decremented (capacity freed for resale).
  - `TS-GA-05` **Hybrid order:** premium reserved seat(s) + GA quantity in one order → both held/sold **atomically**; a partial failure rolls back both (no orphan seat hold, no phantom GA quota).
  - `TS-GA-06` **GA QR/scan:** each GA ticket has its own signed QR; admits once; second scan blocked; scanner shows "General Admission · &lt;tier&gt;" (TS-SCAN rules apply, `seat_id` null).
  - `TS-GA-07` **Quantity limits:** per-order max enforced; buying the **last** available unit succeeds, one more fails cleanly.
  - `TS-GA-08` **Counter reconciliation:** `reserved` == count(held-unexpired + sold) per GA category after churn (holds, expiries, refunds).
  - `TS-GA-09` **Hybrid event page:** reserved sections render a seat map, GA categories render quantity steppers; totals/pricing correct across the mix.
- **Acceptance:** **GA never oversells** under any concurrency; the counter always reconciles with ticket states; hybrid orders are all-or-nothing.

### TS-EXT — Interim external ticketing (ADR-022)
- **Scope:** per-event `ticketingMode` = `external` redirects each tier to its `aolt.in` `bookingUrl`; internal events unaffected; reversibility.
- **Scenarios:**
  - `TS-EXT-01` External event: tickets section shows every tier with a **"Reserve →"** link pointing to that tier's `bookingUrl` (correct per-tier mapping), opening in a new tab.
  - `TS-EXT-02` External event: header + hero CTAs read **"Reserve Your Spot"** and anchor to `#tickets`; the internal "Select your seats" CTA is **not** rendered; the seats route is never linked.
  - `TS-EXT-03` Internal event (test events) unchanged: "Select your seats" flow present, **no** `aolt.in` links, native checkout intact.
  - `TS-EXT-04` **Reversibility:** flipping an event to `internal` (clearing `bookingUrl`s) restores native checkout with no code change.
- **Acceptance:** each tier links to the right external URL; internal flow untouched; the switch is data-only.  *(Verified locally 2026-07-01: BhaZen Jamming links Premium→1034073 · Family→1034075 · General→1034076 · Student→1034077; test events internal.)*

### TS-GOLIVE — Launch readiness (ADR-023) ★
- **Scope:** the public surface at launch = exactly one real event; branding/contact correct; no test content.
- **Scenarios:**
  - `TS-GOLIVE-01` **Only one event public:** `/e/bhazen-jamming` = 200; homepage/landing lists only it + Visakhapatnam; no demo events/cities anywhere.
  - `TS-GOLIVE-02` **Unknown/removed slug** (e.g. old demo slugs, typos) → the **404 page** (proper 404 status on Vercel's runtime).
  - `TS-GOLIVE-03` **Branding:** wordmark "Sattvik Beats"; **favicon** = logo in the browser tab (not the framework default); AOL + WAFC hero logos present.
  - `TS-GOLIVE-04` **Details:** date **Jul 18 2026**, **Port Stadium / indoor** copy (no "open-air"), contact **@bhazen_jamming**.
  - `TS-GOLIVE-05` **Admin login:** staff can reach `/admin` after OTP (interim: code from server logs — see ADR-023); non-staff phone → "Not authorized".
- **Acceptance:** nothing test is reachable; branding/details correct; admin reachable by staff only.

### TS-PROMO — Promo codes, comps, guest list
- **Scope:** create/limit codes; comp/free tickets; guest list invites.
- **Happy:** create % / flat codes with limits/expiry; comp tickets issue valid QR; guest list entry produces scannable ticket.
- **Edge:** max-uses & per-user limits; expiry boundaries; comp counts against inventory/holds; revoking a comp invalidates its QR at scan.
- **Acceptance:** limits enforced; comps/guests scan as valid; revocation reflected (online/after sync).

### TS-SCAN — Offline scanner & check-in  ★CRITICAL (ADR-014)
- **Scope:** PWA install, pre-sync, **fully offline** validate/admit, dedup, background sync, conflict flags.
- **Happy:** scanner logs in, selects showtime, pre-syncs allowlist; **with network OFF** scans valid QR → green ✓ (name/seat); duplicate scan on same device → "already used"; on reconnect, check-ins sync to server.
- **Edge/negative:**
  - `TS-SCAN-01` Valid ticket, **offline** → admitted; recorded locally.
  - `TS-SCAN-02` **Counterfeit/tampered QR** offline → rejected (signature fail).
  - `TS-SCAN-03` QR for **different showtime/event** → rejected.
  - `TS-SCAN-04` **Refunded/cancelled** ticket present in last sync → rejected; refunded **after** sync → admitted then **flagged** on sync (documented residual).
  - `TS-SCAN-05` Same ticket scanned twice **same device** → second blocked instantly.
  - `TS-SCAN-06` Same ticket scanned on **two devices** offline → both admit; on sync, first kept, second **flagged** in anomaly report.
  - `TS-SCAN-07` Device offline for entire event then syncs later → all check-ins upload; idempotent (earliest timestamp wins).
  - `TS-SCAN-08` App closed/reopened offline → IndexedDB state (allowlist, used-set, queue) persists.
  - `TS-SCAN-09` Partial connectivity (drops mid-sync) → resumable, no data loss/dupes.
  - `TS-SCAN-10` Large allowlist (e.g. 2,500+ tickets) → sync + scan performance acceptable on a mid-range phone.
  - `TS-SCAN-11` Device clock skew → server tie-breaks; no incorrect rejections.
  - `TS-SCAN-12` Camera permission denied / poor lighting / damaged QR → manual code entry fallback.
  - `TS-SCAN-13` Re-auth / new device → rebuilds used-set from server.
- **Acceptance:** valid tickets admit offline; forgeries rejected offline; no crashes; queued check-ins reach server exactly once; duplicates flagged; performance acceptable during a simulated 30-min rush.

---

## 6. Non-functional scope

### TS-PERF — Performance & load (ADR-009) ★
- Page perf budgets (LCP/CLS/TTI) on landing/city/event/seat-map.
- `TS-PERF-02` **On-sale load test (k6):** N concurrent users contend for the same showtime → **zero double-sell**, holds/locks behave, p95 latency within target, no deadlocks.
- Seat-map render perf for large venues; DB query performance on hot paths; reminder-job throughput.

### TS-SEC — Security ★
- AuthZ on every route/handler; **IDOR** across cities/events/users/orders/tickets.
- Webhook signature verification; replay/idempotency.
- QR forgery resistance (Ed25519); allowlist scoping; no secrets shipped to devices.
- Rate limiting (OTP, hold, checkout, login, sync); OTP brute-force lockout.
- Input validation (zod) & injection (SQL/XSS); CSRF on mutations; secure headers/CSP.
- PII handling/masking; secrets never in client bundle; admin session hardening.
- Payment data never stored (PCI SAQ-A).

### TS-A11Y — Accessibility
- WCAG 2.1 AA on public + checkout + scanner: keyboard nav, focus management (modals/drawer), color contrast, seat-map alt interactions, screen-reader labels, reduced-motion.

### TS-COMPAT — Compatibility
- Browsers: latest Chrome/Safari/Firefox/Edge. Devices: Android + iOS (incl. older mid-range). PWA install on Android/iOS. Email rendering (Gmail/Outlook/Apple Mail). WhatsApp message rendering.

### TS-RES — Reliability & resilience
- Network loss during booking/payment/scan; provider outages (Razorpay/email/WhatsApp) → graceful degradation + retries; DB failover; idempotent jobs; reconciliation of stuck `pending` orders; backup/restore drill.

### TS-I18N — i18n-readiness
- No hardcoded user-facing strings (all via catalog); layout tolerant of longer strings; ₹/number/date formatting; structure supports adding a language without code changes.

---

## 7. Regression & smoke
- **Smoke (prod, post-deploy):** home loads, event page loads, seat map renders, test booking on a staging event, scanner pre-sync, webhook health.
- **Regression suite:** automated e2e for buyer + admin + scanner critical paths; run each release.

## 8. UAT (pre-launch, with AOL)
- Content/admin (City + Super Admin): create→approve→publish a real event end-to-end.
- Finance: verify a live (small-value) transaction, GST invoice, settlement, refund.
- Ops: real-device offline scanning drill simulating the entry rush.

## 9. Traceability & reporting
- Each requirement/ADR ↔ test IDs (traceability matrix). Defects logged with severity, repro, env, evidence. Daily QA status during test cycles.

## 10. Launch sign-off checklist
- [ ] No open Sev-1/2 in critical modules (TS-HOLD, TS-PAY, TS-SCAN, TS-SEC)
- [ ] On-sale load test passed (no double-sell)
- [ ] Offline scanner real-device drill passed
- [ ] Payments live-keys smoke test + refund verified
- [ ] GST invoices validated by finance
- [ ] Email + WhatsApp deliverability confirmed
- [ ] Security review complete; rate limits active
- [ ] Backups + monitoring + runbooks in place
- [ ] Accessibility AA on core flows
- [ ] Docs (all four) up to date

---
_Last updated: 2026-07-01_
