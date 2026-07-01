# Sattvick Beats — Project Documentation

This folder holds the **single source of truth** for the Sattvick Beats platform. The first four are **kept continuously in sync** — every phase / significant change updates all of the relevant ones in the same change set.

| Document | Purpose | Audience |
|---|---|---|
| [DECISIONS.md](./DECISIONS.md) | Architecture Decision Records (ADRs) — every product/technical decision with context, rationale, alternatives, and consequences. | Everyone |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design: stack, data model, booking/concurrency, payments, offline scanner, security, i18n. | Engineers |
| [TESTING_SCOPE.md](./TESTING_SCOPE.md) | Detailed QA scope — functional + non-functional test areas, scenarios, edge cases, acceptance criteria. Handed to QA to produce test cases. | QA / Stakeholders |
| [IMPLEMENTATION_TRACKER.md](./IMPLEMENTATION_TRACKER.md) | Phased plan, task breakdown, status, definition-of-done, changelog. | Everyone |
| [RUNBOOKS.md](./RUNBOOKS.md) | Operational procedures — on-sale, refunds, offline scanner, incidents. | Ops / On-call |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel + Neon deploy — setup, env vars, migrations, domain. | Deploy / DevOps |

## Maintenance rules (the "always up to date" contract)

1. **A change is not "done" until the docs reflect it.** Code + docs land together.
2. **New decision → new ADR** in DECISIONS.md (never edit history; supersede instead).
3. **New/changed behavior → update ARCHITECTURE.md and TESTING_SCOPE.md** in the same change.
4. **Task status changes → update IMPLEMENTATION_TRACKER.md** and the harness task list together.
5. Each document has a **Last updated** line and a **changelog** at the bottom.

## Quick status

- **Phase:** Phases 0–6 built & **deployed** (Vercel + Supabase, live at sattvick-beats.vercel.app); **Phase 7 — admission modes / GA / hybrid** designed (ADR-019/020/021), implementation pending.
- **Stack:** Next.js (App Router, TS) · Postgres (Neon) · Vercel · Razorpay · Resend + WhatsApp BSP
- **First event to migrate:** BhaZen Clubbing (Vizag) — content already in `Meeta_HTML/` (legacy static site, kept as content source).

_Last updated: 2026-06-30_
