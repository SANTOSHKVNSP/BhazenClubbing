# Sattvick Beats — Operational Runbooks

Practical procedures for ops / on-call during events. Keep alongside the other
living docs (see [README](./README.md)). Account-gated steps (Razorpay, Neon,
Vercel, Sentry) are marked **[acct]**.

---

## 1. On-sale (ticket launch)

**Before (T-1 day):**
- Event is **live** (admin → Events → status), showtime exists, and **seats are materialized** (event editor → showtime → *Generate seats*).
- Pricing, **fee type/value, GST rate**, and **refund policy** are set on the event.
- Payment keys live **[acct]**; `GET /api/health` returns `{ ok: true, db: "up" }`.
- Promo codes (if any) created; comps issued to guest list.

**During:**
- Watch **/admin/analytics** (revenue, sold, occupancy) and server logs.
- Holds expire automatically after **8 min** (`HOLD_MINUTES`); cleanup also runs on every new hold attempt — stuck "held" seats free themselves, no manual action.
- Rate limits: **OTP 5 / 10 min / phone**, **holds 20 / min / IP** (`lib/ratelimit.ts`). Raise if legitimate users are blocked (single-instance memory; move to Upstash for multi-instance **[acct]**).

**Paid but no ticket?** Fulfillment is **idempotent** (re-running `fulfillOrder` / re-delivering the Razorpay webhook is safe). Check `WebhookEvent` for the payment id; re-send the webhook from the Razorpay dashboard **[acct]**.

---

## 2. Refunds

- **Self-service:** available when the event's policy is `self_service` and within the window — buyer refunds from **/account**.
- **Admin:** **/admin/orders → Refund** (bypasses policy; scoped to your city; written to the audit log).
- **Effect:** seats move `sold → refunded` and become available again; the refund posts to the original method via Razorpay **[acct]**. Reconcile in the Razorpay dashboard.

---

## 3. Offline scanner

**Before the event (must be online):** on each device open **/scan**, pick the showtime, enter the **scanner token** (`SCANNER_TOKEN`; rotate per event **[acct]**), tap **Sync**. Confirm the ticket count ≈ sold + comps.

**During (may be offline):** scan by **camera** (or paste a token manually). **Green = admit**, **red = invalid / already used**. Validation is fully offline (allowlist hash + local used-set); check-ins queue in IndexedDB.

**After / when back online:** tap **Sync check-ins** to push the queue. **Cross-device duplicates are flagged** (a ticket admitted on two devices). Re-syncing is idempotent.

**A device dies:** any other synced device keeps working (each validates independently; duplicates are caught at sync). No single point of failure once devices are pre-synced.

---

## 4. Incidents

- **Health:** `GET /api/health` → `503` means the DB is unreachable.
- **DB down [acct]:** check Neon/Postgres status; reads/writes fail until restored.
- **Rollback [acct]:** Vercel → Deployments → **Promote** the previous good deploy.
- **Backups [acct]:** enable **Neon PITR** (point-in-time restore).
- **Monitoring [acct]:** wire **Sentry** for error alerting before launch.
