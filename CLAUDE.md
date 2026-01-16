# CLAUDE.md - Project Context for AI Assistants

## Project Overview

**BhaZen Clubbing** - Official event website for a live concert featuring **Nirvana Station** band, presented by **Art of Living**.

## Event Details

- **Event Name**: Art of Living presents BhaZen Clubbing
- **Date**: Saturday, January 25th, 2026
- **Time**: 5:30 PM Onwards
- **Venue**: Gurajada Kalakshetram, Siripuram, Visakhapatnam, Andhra Pradesh, India
- **Capacity**: 2500+ attendees
- **Band**: Nirvana Station (8 members)

## Ticket Pricing

| Ticket Type | Price |
|-------------|-------|
| Student Pass | ₹299 (Valid Student ID Required) |
| General Pass | ₹499 (Open to All) |

## Entry Process

- Attendees receive a QR Code 2 days before the event
- At venue, show QR Code to collect wristband for entry

## Brand Colors (from Logo)

```css
--bhazen-purple: #2D0A4E;      /* Primary dark background */
--bhazen-dark-purple: #1a0530; /* Darker purple */
--bhazen-orange: #FF8C00;      /* "bhaZen" text accent */
--bhazen-cyan: #00CED1;        /* "clubbing" text accent */
--bhazen-magenta: #FF1493;     /* Gradient accents */
--bhazen-pink: #FF69B4;        /* Additional accent */
```

## Project Structure

```
bhazenclubbing/
├── Meeta_HTML/
│   └── Meeta/
│       ├── index.html              # Main homepage (BhaZen Clubbing event)
│       ├── index-2.html            # Same as index.html (source template)
│       ├── assets/
│       │   ├── css/
│       │   │   ├── style.css       # Base template styles
│       │   │   └── bhazen-fixes.css   # Custom BhaZen fixes and overrides
│       │   ├── images/
│       │   │   └── bhazenclubbing.png # Logo
│       │   └── js/                 # JavaScript files
│       └── [other template pages]
├── README.md                       # Project documentation
├── QUICKSTART.md                   # Quick deployment guide
├── DEPLOYMENT_GUIDE.md             # Complete deployment guide
└── CLAUDE.md                       # This file
```

## Key Files to Edit

1. **index.html** - Main homepage with all event content
2. **assets/css/bhazen-fixes.css** - Custom theme fixes and overrides
3. **README.md** - Project documentation and event details

## Current Page Sections (index.html)

1. **Hero Section** - Art of Living logo (white), "presents" text, "BhaZen Clubbing" title, countdown timer, "Grab Your Tickets Now" button (scrolls to #pricing). Background: Unsplash crowd party image with gradient overlay.
2. **About Section** - Event description with features (Live Band, Food & Drinks, Photo Booth, Merchandise)
3. **Counter Section** - Stats (8 Band Members, 2500 Attendees, 4 Hours of Music, 1 Epic Night)
4. **Band Section** (id="band") - "Meet Nirvana Station" with band member roles
5. **Pricing Section** (id="pricing") - Student Pass (₹299) and General Pass (₹499)
6. **Partners Section** - Sponsor logos
7. **News Section** - Concert updates
8. **Gallery Section** - Event photos
9. **FAQ Section** (id="faq") - Common questions including venue entry process
10. **Contact Section** (id="contact") - Contact information with subtle background
11. **Footer** - Event details, venue map (Gurajada Kalakshetram), social links

## Navigation

### Desktop Navigation
- Home, Band, Contact
- "Buy Ticket Now" button

### Mobile Navigation (Offcanvas)
- Home, Band, Contact
- "Buy Tickets Now" button in menu
- Fixed floating "Buy Tickets Now" button at bottom of screen (always visible)

## Removed Sections

- Event Schedule section (was between Band and Pricing sections)
- Separate pricing page (pricing is now inline on homepage)

## Development Commands

```bash
# Start local server (from project root)
cd Meeta_HTML/Meeta && python3 -m http.server 3000

# View site
open http://localhost:3000
```

## Important Notes

- Hero section displays: Art of Living logo (white) → "presents" → "BhaZen Clubbing"
- Art of Living logo uses CSS filter to make it white: `filter: brightness(0) invert(1)`
- Hero background is Unsplash image with crowd partying (photo-1540039155733-5bb30b53aa14)
- The "Grab Your Tickets Now" button in hero section scrolls to `#pricing` anchor
- All "Book Now" buttons link to `#` (to be updated with actual booking link)
- Mobile has a sticky floating "Buy Tickets Now" button (visible on screens < 992px)
- Contact and Footer sections have subtle dark overlays (97% opacity) for text readability
- Band section has `id="band"` for navigation linking

## Template Base

Built on **Meeta - Event & Conference HTML5 Template** with custom BhaZen branding.

## Git Branch

- Main branch: `main`
- Development branch: `Dev-env`
