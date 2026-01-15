# CLAUDE.md - Project Context for AI Assistants

## Project Overview

**BhaZen Clubbing** - Official event website for a live concert featuring **Nirvana Station** band.

## Event Details

- **Event Name**: BhaZen Clubbing presents Nirvana Station Live
- **Date**: Saturday, January 25th, 2026
- **Time**: 7:00 PM Onwards
- **Venue**: Gurajada Kalakshetram, Siripuram, Visakhapatnam, Andhra Pradesh, India
- **Capacity**: 2000+ attendees

## Ticket Pricing

| Ticket Type | Price |
|-------------|-------|
| Student Pass | ₹299 (Valid Student ID Required) |
| General Pass | ₹499 (Open to All) |

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
│       │   │   └── bhazen-custom.css  # Custom BhaZen theme (brand colors)
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
2. **assets/css/bhazen-custom.css** - Custom theme colors and styles
3. **README.md** - Project documentation and event details

## Current Page Sections (index.html)

1. **Hero Section** - Event title, countdown timer, "Get Your Ticket Now" button (scrolls to #pricing)
2. **About Section** - Event description with features (Live Band, Food & Drinks, Photo Booth, Merchandise)
3. **Counter Section** - Stats (6 Band Members, 500 Seats, 4 Hours of Music, 1 Epic Night)
4. **Band Section** - "Meet Nirvana Station" with band member roles
5. **Pricing Section** (id="pricing") - Student Pass (₹299) and General Pass (₹499)
6. **Partners Section** - Sponsor logos
7. **News Section** - Concert updates
8. **Gallery Section** - Event photos
9. **Footer** - Event details, venue map (Gurajada Kalakshetram), social links

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

- The "Get Your Ticket Now" button in hero section scrolls to `#pricing` anchor
- All "Book Now" buttons link to `#` (to be updated with actual booking link)
- Custom CSS overrides are in `bhazen-custom.css` (loaded after style.css)
- Hero background uses CSS gradient matching brand colors (no background image)

## Template Base

Built on **Meeta - Event & Conference HTML5 Template** with custom BhaZen branding.

## Git Branch

- Main branch: `main`
- Development branch: `Dev-env`
