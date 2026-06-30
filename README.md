# 🎸 BhaZen Clubbing — Official Event Website

<div align="center">

![BhaZen Clubbing](Meeta_HTML/Meeta/assets/images/bhazenclubbing.png)

**Art of Living presents Nirvana Station — Live in Concert**

</div>

A single-page, hand-built static website. **No framework, no build step** — just HTML, one CSS file, and one vanilla-JS file.

---

## 🎉 Event Details

- 📅 **Date**: Saturday, January 25th, 2026
- ⏰ **Time**: 5:30 PM Onwards
- 📍 **Venue**: Gurajada Kalakshetram, Siripuram, Visakhapatnam, Andhra Pradesh, India
- 👥 **Capacity**: 2,500+ attendees
- 🎤 **Band**: Nirvana Station

### 🎫 Tickets

| Ticket | Price | Notes |
|--------|-------|-------|
| Student Pass | ₹299 | Valid Student ID required |
| General Pass | ₹499 | Open to all |

Entry: attendees receive a QR code 2 days before the event; show it at the gate to collect a wristband.

---

## 🧱 Tech Stack

- **HTML5 + CSS3 + vanilla JavaScript** — no jQuery, Bootstrap, Swiper, AOS, or icon fonts.
- Icons are **inline SVG**; fonts are **Big Shoulders Display** + **Open Sans** (Google Fonts).
- Behaviors (all hand-written): countdown, sticky header, mobile drawer, scroll-reveal, counter-up, FAQ accordion, back-to-top ring, video lightbox.
- Responsive (CSS Grid/Flexbox) and respects `prefers-reduced-motion`.

The deployed directory is **~3 MB** (down from ~71 MB before the rebuild).

---

## 📁 Structure

```
Meeta_HTML/Meeta/          # Cloudflare Pages root
├── index.html             # The entire site
├── assets/
│   ├── css/styles.css     # All styles (~28 KB)
│   ├── js/app.js          # All behavior (~8 KB)
│   └── images/            # 19 optimized images
├── robots.txt
└── sitemap.xml
```

Only three files matter: `index.html`, `assets/css/styles.css`, `assets/js/app.js`.

---

## 💻 Local Development

```bash
cd Meeta_HTML/Meeta
python3 -m http.server 3000
open http://localhost:3000
```

---

## 🚀 Deployment

- **Platform**: Cloudflare Pages — push to `main` to auto-deploy.
- **Build settings**: Root directory `Meeta_HTML/Meeta`, build command empty, output `/`.
- **Domain**: bhazenclubbing.com

---

## ✏️ Common Edits

- **Text / sections** → `index.html`
- **Colors / layout** → CSS custom properties at the top of `assets/css/styles.css`
- **Countdown date** → `data-target` on `#countdown` in `index.html`
- **Ticket links** → the two `aolt.in` URLs in the Pricing section
- **Images** → `assets/images/` (keep extensions lowercase; optimize before committing)

---

<div align="center">© 2026 BhaZen Clubbing. All Rights Reserved.</div>
