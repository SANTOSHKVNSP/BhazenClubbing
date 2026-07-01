# Sattvik Beats — Admin Panel Guide

A practical, step-by-step guide for AOL staff who manage events on the Sattvik Beats platform. No coding needed for day-to-day content.

> The admin panel lives at **`/admin`** (e.g. `https://www.sattvikbeats.com/admin`).

---

## 1. Who can log in — roles

| Role | What they can do | Sees these menus |
|------|------------------|------------------|
| **Super Admin** (national) | Everything: create/edit/**publish** any event in any city; manage cities, venues, bands; view the audit log. | Dashboard, Analytics, Events, Orders, **Cities, Venues, Bands, Audit** |
| **City Admin** (scoped to a city) | Create/edit events **only in their city**; submit them for approval (cannot self-publish); view their city's analytics & orders. | Dashboard, Analytics, Events, Orders |
| **Scanner** | Door check-in only (uses the separate Scanner app, not this panel). | — |

Only someone who is already a **staff member** can enter `/admin`. If you log in with a phone that has no staff role, you'll see **"Not authorized."** Ask a Super Admin to add you (staff membership is created against your mobile number).

---

## 2. Logging in

1. Go to **`/admin`** → you'll be redirected to **`/login`**.
2. Enter your **10-digit mobile number** (the one registered as staff) and tap **Send code**.
3. Enter the **6-digit one-time code**, then **Verify & continue**. You'll land on the admin Dashboard.

> **⚠️ Important (current status):** automatic OTP delivery (WhatsApp/SMS) is **not connected yet**.
> - **On the live site:** the code is written to the server logs, not sent to your phone. To retrieve it: **Vercel → the `sattvick-beats` project → Logs**, and look for a line like `[DEV OTP] +9170… → 123456` right after you tap *Send code*.
> - **On a local/dev site:** the code is shown on screen for convenience.
>
> Connecting a real OTP channel (WhatsApp Business or email) is a recommended step before handing the panel to non-technical staff — see the platform team.

The code expires in **5 minutes**; 5 wrong tries invalidate it (just request a new one). Codes are rate-limited to 5 per 10 minutes per number.

---

## 3. The admin at a glance

Left sidebar:

- **Dashboard** — quick overview.
- **Analytics** — sales, occupancy (reserved *and* GA), revenue; CSV export.
- **Events** — the list of all events; **+ New event** lives here.
- **Orders** — individual bookings, with refund actions.
- **Cities / Venues / Bands** *(Super only)* — the building blocks an event points to.
- **Audit** *(Super only)* — a log of who changed what.

---

## 4. Before you create an event

An event **points to** a City, (optionally) a Venue, and (optionally) Bands — so those must exist first. For BhaZen Jamming these are already set up (**Visakhapatnam** city, **Port Stadium** venue, **Nirvana Station** band). To add a brand-new event elsewhere:

1. *(Super)* **Cities → + New** — add the city if it doesn't exist.
2. *(Super)* **Venues → + New** — add the venue; pick a **template** (Theatre or Stadium) and capacity. This is what generates the seat map for reserved seating.
3. *(Super)* **Bands → + New** — add the performing act and its members (used on the public page).

---

## 5. Step-by-step: create & publish an event

1. **Events → + New event.**
2. Fill in the **core form** (see the field reference in §6) and click **Create event**.
3. The page reloads in *edit* mode and now shows extra sections. Add, in order:
   - **Showtimes** — at least one date/time. After adding, click **Generate seats** on that showtime to build the seat inventory (needed for reserved categories and to create GA pools).
   - **Ticket categories** — your passes/tiers (see §8).
   - **Partners** — sponsors/associates shown on the page (see §9).
   - *(optional)* **Promo codes**, **Comps / guest list**.
4. **Publish:**
   - **Super Admin:** set **Status → live** in the core form (or use **Approve & publish** if it's pending) and **Save**.
   - **City Admin:** click **Submit for review**; a Super Admin then **Approve & publish** (or **Reject** with a reason).
5. Once **live**, use **View public page ↗** (top-right) to check it. Only `live` events appear on the public site.

> **Tip:** work in **draft** until everything looks right — drafts are invisible to the public.

---

## 6. Event field reference (core form)

| Field | What it does | Notes / example |
|-------|--------------|-----------------|
| **Title** | Event name shown everywhere. | `BhaZen Jamming` |
| **Slug** | The URL piece: `/e/<slug>`. | lowercase-with-hyphens, e.g. `bhazen-jamming`. Changing it changes the public URL. |
| **City** | Which city the event belongs to. | City Admins only see their own cities. |
| **Venue** | The venue (drives the seat-map template). | Optional, but required for reserved seating. |
| **Status** | `draft` → `pending` → `live` → `archived`. | Only **live** is public. City Admins can't set this directly (use *Submit for review*). |
| **Hero image URL** | Big background image on the event page. | Full URL or `/images/...` path. |
| **On-sale at** | When sales open. | Date-time. **Entered in UTC** — for 9:00 AM IST enter `03:30`. |
| **Doors at** | Event start / doors open. | Date-time, UTC (as above). |
| **Fee type** | Convenience fee model. | `none` / `flat` / `percent`. |
| **Fee value** | The fee amount. | **`flat` = paise** (₹30 → `3000`); **`percent` = percent×100** (3% → `300`). |
| **GST rate** | GST applied at checkout. | **percent×100** — 18% → `1800`. |
| **Refund policy** | `none` / `self_service` / `admin_only`. | Governs buyer-facing refund options. |
| **Refund window (days)** | Self-service refunds allowed until N days before. | e.g. `3`. |
| **Refund fee (percent×100)** | Fee retained on a refund. | 10% → `1000`. |
| **Bands** | Tick the acts performing. | Managed under *Bands*. |
| **Description (English)** | Short paragraph near the top of the page. | Plain text. |
| **Gallery (JSON)** | Photo grid. | JSON array of image URLs — see §10. |
| **Content (JSON)** | Hero logos, tagline, features, stats, FAQs, contact. | See §10 for the template. |

> 💰 **Money cheat-sheet (avoid mistakes!):**
> - **Ticket price** → entered in **rupees** (`Price (₹)` field): `2999`.
> - **Fee (flat)** and **promo (flat)** → **paise**: ₹30 → `3000`.
> - **Fee (percent)**, **GST**, **refund fee** → **percent × 100**: 18% → `1800`.
> - **Promo (percent)** → the **percentage number**: 10% → `10`.

---

## 7. Showtimes

Each showtime is one date/time slot. Add the date (**UTC**), set status `live`, **Add showtime**, then click **Generate seats** to materialise the inventory:
- For **reserved** categories → creates the individual seats from the venue's template.
- For **general admission** categories → creates the capacity pool.

Re-generating replaces the inventory for that showtime, so do it **before** sales open.

---

## 8. Ticket categories (passes / tiers)

Add one row per pass. Fields:

| Field | Meaning |
|-------|---------|
| **Name** | Shown on the card, e.g. `Category: Premium`. |
| **Color** | Dot/accent colour (hex). |
| **Price (₹)** | Price in **rupees** (e.g. `599`). |
| **Admission** | **`reserved`** = buyer picks a seat from the map. **`general` (GA)** = buyer picks a **quantity**, no seat. |
| **GA capacity** | Only for `general` — how many can be sold (e.g. `3000`). Leave blank for reserved. |

An event can mix both (this is **hybrid** — like Jamming: Premium is reserved, General/Student/Family are GA). GA can never oversell its capacity.

---

## 9. Partners

Sponsors/associates shown on the event page. Fields: **Name**, **Tier** (e.g. `Presented by`, `In association with`), **Logo URL**, **Website**. They display in the order added.

---

## 10. Gallery JSON & Content JSON

These two textareas take raw JSON. Copy a template and edit the values — **keep the quotes and commas valid** (a broken bracket blocks saving).

**Gallery** — a list of image URLs:
```json
["/images/bhazen/edit-8.jpg", "/images/bhazen/nirvana-17.jpg", "/images/bhazen/nirvana-2.jpg"]
```

**Content** — everything else on the page:
```json
{
  "presents": "Art of Living",
  "heroLogos": {
    "aol": "/images/bhazen/AOL_LogoWhite.png",
    "event": "/images/bhazen/bhazenclubbing.png",
    "wafc": "/images/partners/world-forum.png"
  },
  "tagline": "An electrifying indoor night of live music",
  "about": { "image": "/images/bhazen/nirvana-8.jpg", "video": "https://www.youtube-nocookie.com/embed/XXXX" },
  "features": ["Live Band", "Photo Booth", "Merchandise"],
  "stats": [
    { "value": 8, "label": "Band Members" },
    { "value": 4500, "suffix": "+", "label": "Capacity" },
    { "value": 3, "label": "Hours of Music" },
    { "value": 1, "label": "Epic Night" }
  ],
  "faqs": [
    { "q": "How will I enter the venue?", "a": "Show your QR code at the gate to collect your wristband." }
  ],
  "contact": {
    "phone": "+91 97030 46062",
    "phoneLabel": "Support",
    "instagram": "https://www.instagram.com/bhazen_jamming",
    "instagramHandle": "@bhazen_jamming",
    "email": "hello@sattvikbeats.com"
  },
  "trustUrl": "https://www.artofliving.org"
}
```

Images referenced by `/images/...` must exist in the site's `public/images/…` folder (ask the platform team to add new ones).

---

## 11. Interim external ticketing (important right now)

Until the Razorpay payment account is live, **BhaZen Jamming sells through AOL's `aolt.in` links**, not our in-app checkout. On such an event the public page shows a **"Reserve →"** button per pass that opens the external link, and the "Select your seats" flow is hidden.

- This is controlled by two settings on the event/category: **`ticketingMode = external`** and each category's **`bookingUrl`**.
- **These two are not editable in the admin form yet** — they're set in the seed/database by the platform team. Ask them to change a link or flip an event back to in-app checkout.
- When Razorpay goes live, flipping `ticketingMode` back to `internal` (and clearing the `bookingUrl`s) re-enables the native seat/GA checkout **with no other change**.

*(See `docs/DECISIONS.md` ADR-022 for the rationale.)*

---

## 12. Promo codes & comps

- **Promo codes:** `Code`, `Type` (`percent`/`flat`), `Value` (10% → `10`; ₹200 flat → `200`), optional `Max uses`. Applied by buyers at checkout (in-app checkout only).
- **Comps / guest list:** enter a guest **name + phone + qty**; the system auto-assigns seats, blocks them, and issues a signed QR per ticket. The guest logs in with that phone to view their ticket. *(Applies to in-app events.)*

---

## 13. Publishing workflow

```
draft ──(City Admin: Submit for review)──▶ pending ──(Super: Approve & publish)──▶ live
   ▲                                              │
   └──────────────(Super: Reject, w/ reason)◀─────┘
```
Super Admins can also set **Status → live** directly. Only **live** events are visible to the public.

---

## 14. Go-live safety checklist

- [ ] Event **Title, Slug, City, Venue** correct; **Doors/On-sale** times right (remember **UTC**).
- [ ] **Prices** sane (rupees in *Price (₹)*; GST `1800` = 18%).
- [ ] At least one **Showtime** added **and** *Generate seats* run.
- [ ] Categories complete; GA categories have a **capacity**.
- [ ] For external ticketing: every pass has a working **`aolt.in`** link (platform team).
- [ ] **Description / Content JSON** proofread (venue, date, Instagram `@bhazen_jamming`).
- [ ] Preview via **View public page ↗** before setting **live**.
- [ ] Only the intended event is **live** — no test/demo events public.

---

_Last updated: 2026-07-01 · Questions the guide can't answer → platform team._
