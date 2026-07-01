# Sattvik Beats — Deployment (Vercel + Neon)

Next.js app on **Vercel**, Postgres on **Supabase**. Migrations apply automatically on
every deploy (`vercel-build` = `prisma migrate deploy && next build`); the Prisma
client is generated on install (`postinstall`). Local `npm run build` stays
DB-independent (plain `next build`).

> First deploy can run with **payments simulated** (no Razorpay keys) — every paid
> integration has an inert/dev fallback. Add keys later to go fully live.

## One-time setup

### 1. Database — Supabase
- Create a Supabase project (region near the audience, e.g. **Mumbai** / **Singapore**). Save the DB password.
- **Project Settings → Database → Connection string** — copy two:
  - **Transaction pooler** (port `6543`) → `DATABASE_URL`; append `?pgbouncer=true&connection_limit=1`.
  - **Direct connection** (port `5432`) → `DIRECT_URL` (migrations).
- Prisma uses the pooled URL at runtime and the direct URL for `migrate deploy` (configured in `schema.prisma`).

### 2. Secrets (generate fresh — do not reuse dev)
- `AUTH_SECRET`: `openssl rand -base64 32`
- QR keypair (Ed25519):
  ```bash
  node -e "const{generateKeyPairSync}=require('crypto');const{publicKey,privateKey}=generateKeyPairSync('ed25519');console.log('QR_SIGNING_PRIVATE_KEY='+Buffer.from(privateKey.export({type:'pkcs8',format:'pem'})).toString('base64'));console.log('QR_SIGNING_PUBLIC_KEY='+Buffer.from(publicKey.export({type:'spki',format:'pem'})).toString('base64'))"
  ```

### 3. Vercel project
- Import the GitHub repo (Framework **Next.js**, auto-detected; Root Directory = repo root).
- Add the env vars below (Production + Preview).
- Deploy. `vercel-build` runs `prisma migrate deploy` then `next build`.

### 4. Seed once (fresh DB only)
`prisma/seed.ts` **clears and recreates** content — run it exactly once on the empty
prod DB, then manage everything via the admin UI.
```bash
# with prod DATABASE_URL + SUPER_ADMIN_PHONE exported (or `vercel env pull`)
npx tsx prisma/seed.ts
```

### 5. Domain
- Vercel → Domains: add `sattvikbeats.com` + `www`; point DNS as instructed.
- Set `NEXT_PUBLIC_SITE_URL=https://www.sattvikbeats.com`.

## Environment variables
| Var | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Supabase **transaction pooler** (6543) + `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | ✅ | Supabase **direct** connection (5432) — migrations |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `QR_SIGNING_PRIVATE_KEY` / `QR_SIGNING_PUBLIC_KEY` | ✅ | Ed25519 base64 PEM (fresh) |
| `SCANNER_TOKEN` | ✅ | gate for `/api/scan` |
| `SUPER_ADMIN_PHONE` | ✅ | seeded super admin, `+91…` |
| `NEXT_PUBLIC_SITE_URL` | ✅ | `https://www.sattvikbeats.com` |
| `RAZORPAY_*` | ⛔ optional | blank → checkout simulated |
| `RESEND_API_KEY` / `EMAIL_FROM` | ⛔ optional | blank → console |
| `WHATSAPP_*` | ⛔ optional | blank → console |
| `UPSTASH_*` | ⛔ optional | blank → in-memory rate limit |
| `BLOB_READ_WRITE_TOKEN` | ⛔ optional | media uploads |

## Migrations
- Applied on deploy by `vercel-build`. Never run `prisma migrate dev` against prod.
- New schema change → commit its migration; the next deploy applies it (idempotent).

## Going fully live (payments + delivery)
- **Razorpay:** add keys; set the webhook to `https://<domain>/api/webhooks/razorpay` with `RAZORPAY_WEBHOOK_SECRET`.
- **Resend + WhatsApp:** add keys for real ticket/OTP delivery.

## Health & rollback
- `GET /api/health` → `{ ok, db }`.
- Rollback: Vercel → Deployments → **Promote** the previous good deploy.
- Backups: enable **Neon PITR**. Monitoring: wire **Sentry**.
