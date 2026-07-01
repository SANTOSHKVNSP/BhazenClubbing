# CLAUDE.md - Project Context for AI Assistants

> ## ⚡ Current direction: Sattvik Beats platform
> This project is being transformed from the single BhaZen Clubbing page into **Sattvik Beats** — a national, multi-city Art of Living concert **ticketing platform** (Next.js + Postgres + Razorpay, reserved seating, offline check-in).
> **Source of truth lives in [`docs/`](./docs/):** [DECISIONS](./docs/DECISIONS.md) · [ARCHITECTURE](./docs/ARCHITECTURE.md) · [TESTING_SCOPE](./docs/TESTING_SCOPE.md) · [IMPLEMENTATION_TRACKER](./docs/IMPLEMENTATION_TRACKER.md). **Keep all four in sync with every change.**
> BhaZen Clubbing (Vizag) becomes **event #1** under the platform; the static site below is its content source. The sections that follow describe that legacy static site.

## Project Overview

**BhaZen Clubbing** - Official event website for a live concert featuring **Nirvana Station** band, presented by **Art of Living**.

The site is a **single-page, hand-built static website** — no framework, no build step. It was rebuilt from scratch in January 2026 to replace a heavyweight multi-page template (Meeta), cutting the deployed directory from ~71 MB to ~3 MB. _(Now the content source for Sattvik Beats event #1 — see `docs/`.)_

## Event Details

- **Event Name**: Art of Living presents BhaZen Clubbing
- **Date**: Saturday, January 25th, 2026
- **Time**: 5:30 PM Onwards
- **Venue**: Gurajada Kalakshetram, Siripuram, Visakhapatnam, Andhra Pradesh, India
- **Capacity**: 2500+ attendees
- **Band**: Nirvana Station (8 members; 6 member roles shown on the page)

## Ticket Pricing

| Ticket Type | Price | Booking link |
|-------------|-------|--------------|
| Student Pass | ₹299 (Valid Student ID Required) | http://aolt.in/945415 |
| General Pass | ₹499 (Open to All) | http://aolt.in/945423 |

## Entry Process

- Attendees receive a QR Code 2 days before the event
- At venue, show QR Code to collect wristband for entry

## Brand Colors

Defined as CSS custom properties at the top of `assets/css/styles.css`:

```css
--primary:    #1d0541;   /* Primary dark purple (hero, header) */
--purple:     #2d0a4e;   /* Secondary purple */
--purple-deep:#1a0530;   /* Band/section gradients */
--orange:     #ff8c00;   /* Buttons, highlights, FAQ title */
--cyan:       #00ced1;    /* Accents, FAQ active state */
--magenta:    #ff1493;   /* Gradient accents */
```

Countdown ring accents: `#f9d464` (yellow), `#00acee` (blue), `#fc097c` (pink), `#554bb9` (purple).

## Project Structure

```
bhazenclubbing/
├── Meeta_HTML/
│   └── Meeta/                       # Cloudflare Pages root directory
│       ├── index.html              # Entire site (one page, all sections)
│       ├── assets/
│       │   ├── css/styles.css      # All styles (hand-built, ~28 KB)
│       │   ├── js/app.js           # All behavior (vanilla JS, ~8 KB)
│       │   └── images/             # 19 optimized images only
│       │       └── bg/concert-bg-1.jpg
│       ├── robots.txt
│       ├── sitemap.xml
│       └── .htaccess               # Apache config (inert on Cloudflare; kept for reference)
├── README.md
├── QUICKSTART.md
├── DEPLOYMENT_GUIDE.md
└── CLAUDE.md                       # This file
```

There are **only three files to edit** for content/behavior: `index.html`, `styles.css`, `app.js`.

## Tech Stack

- **HTML5 + CSS3 + vanilla JavaScript.** No jQuery, Bootstrap, Swiper, AOS, Modernizr, or icon fonts.
- **Icons** are inline SVG (no Font Awesome / Flaticon).
- **Fonts**: Google Fonts — *Big Shoulders Display* (headings) + *Open Sans* (body).
- **Layout**: CSS Grid + Flexbox, responsive via media queries (breakpoints 991 / 700 / 460 px).
- **No build step** — files are served as-is.

## JavaScript behaviors (`assets/js/app.js`)

All implemented with vanilla JS / `IntersectionObserver`:
- Countdown timer (target `2026-01-25T17:30:00`, clamps to `00` when past)
- Sticky header (adds `.scrolled` past 60 px)
- Mobile drawer (hamburger → slide-in menu + overlay, Esc to close)
- Scroll-reveal (`.reveal` → `.in`)
- Counter-up animation (`.counter-num[data-count]`)
- FAQ accordion (native `<details>`, single-open behavior)
- Back-to-top button with scroll-progress ring
- Video lightbox (About play button → YouTube embed)

## Page Sections (`index.html`)

1. **Header** — logo, nav (Home / Band / Contact), "Buy Ticket Now"; transparent over hero, gradient-bordered on scroll.
2. **Hero** — Art of Living logo (white asset) → "presents" → BhaZen logo, date/venue line, countdown, CTA. Unsplash background + `#1d0541` gradient overlay.
3. **About** — circular video thumbnail (YouTube lightbox) + features (Live Band, Photo Booth, Merchandise).
4. **Counter** — 8 Band Members, 2,500+ Attendees, 3 Hours of Music, 1 Epic Night.
5. **Band** (`id="band"`) — "Meet Nirvana Station", 6 member cards (Lead Vocalist, Lead Guitarist, Bassist, Drummer, Keyboardist, Flutist).
6. **Pricing** (`id="pricing"`) — Student Pass (₹299) and General Pass (₹499, featured).
7. **Gallery** — 8-image grid.
8. **FAQ** (`id="faq"`) — 8 questions in a 2-column accordion.
9. **Contact** (`id="contact"`) — Call Us, Venue Location, Follow Us.
10. **Footer** — event details, Instagram, Google Maps embed, copyright.

## Navigation

- **Desktop**: Home (`#top`), Band (`#band`), Contact (`#contact`) + "Buy Ticket Now" (`#pricing`).
- **Mobile (<992px)**: hamburger → slide-in drawer with the same links, plus a fixed floating "Buy Ticket Now" button always visible.

## Deployment

- **Platform**: Cloudflare Pages
- **Domain**: bhazenclubbing.com
- **Auto-deploy**: Push to `main` triggers deployment
- **Build settings**:
  - Root directory: `Meeta_HTML/Meeta`
  - Build command: (empty or `echo "build"`)
  - Output directory: `/`

## Development Commands

```bash
# Start local server (from the deploy root)
cd Meeta_HTML/Meeta && python3 -m http.server 3000

# View site
open http://localhost:3000
```

## Important Notes

- `AOL_LogoWhite.png` is already a white asset — **no CSS filter needed** (the old `brightness(0) invert(1)` trick is gone).
- Hero background: Unsplash `photo-1540039155733-5bb30b53aa14` with a `#1d0541` gradient overlay. Hero, Pricing, Contact, and Footer backgrounds are remote Unsplash images (kept remote = no repo weight).
- All "Buy Ticket Now" buttons link to the `#pricing` anchor; the two "Book Now" buttons link to the `aolt.in` ticketing URLs.
- Images are optimized: photos are JPG (max 1000 px, q≈82); the logo is a 600 px PNG with transparency. **Keep extensions lowercase** — Cloudflare/Linux is case-sensitive.
- Meta Pixel (Facebook) tracking is preserved in `<head>` (id `1657323088565733`).
- Respects `prefers-reduced-motion`.

## History

Originally built on the **Meeta - Event & Conference HTML5 Template**. Fully rebuilt from scratch in January 2026 as a lean hand-coded static page; all unused template pages, libraries, SCSS, icon fonts, and ~52 MB of unused images were removed.

## Git Branch

- Main branch: `main`
- Development branch: `Dev-env`
