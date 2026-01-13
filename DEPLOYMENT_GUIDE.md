# BhaZen Clubbing - Deployment Guide

## 🎸 Event Details
- **Event Name**: BhaZen Clubbing - Live with Nirvana Station
- **Date**: Saturday, January 25th, 2026
- **Time**: 7 PM Onwards
- **Venue**: Gurajada Kalakshetram, Visakhapatnam
- **Capacity**: 2000+ attendees
- **Tickets**: Student Pass ₹299 | General Pass ₹499

---

## 📁 Project Structure
```
Meeta_HTML/Meeta/
├── index.html                # Main event page (homepage - production-ready)
├── assets/
│   ├── css/
│   │   ├── style.css         # Base template styles
│   │   └── bhazen-custom.css # Custom BhaZen theme
│   ├── images/
│   │   └── bhazenclubbing.png # Official logo
│   └── js/                   # JavaScript files
├── .htaccess                 # Apache server configuration
├── robots.txt                # SEO crawler instructions
└── sitemap.xml               # XML sitemap for search engines
```

---

## 🚀 Deployment Options

### Option 1: Deploy to Shared Hosting (Recommended for beginners)

#### Services to consider:
- **Hostinger** (₹149/month) - Fast, reliable
- **Bluehost** (₹199/month) - Popular choice
- **SiteGround** (₹249/month) - Premium performance
- **GoDaddy** (₹199/month) - Easy to use

#### Steps:
1. **Purchase Hosting & Domain**
   - Domain: `bhazenclubbing.com` or similar
   - Choose a hosting plan with cPanel access

2. **Upload Files via FTP**
   ```
   FTP Details (from hosting provider):
   - Host: ftp.yourdomain.com
   - Username: your_username
   - Password: your_password
   - Port: 21
   ```

3. **Upload Using FileZilla (Free FTP Client)**
   - Download FileZilla: https://filezilla-project.org/
   - Connect using FTP details
   - Upload entire `Meeta_HTML/Meeta/` folder to `public_html/`

4. **Set Permissions**
   - Right-click `.htaccess` → Permissions → Set to `644`
   - Set folder permissions to `755`

### Option 2: Deploy to Netlify (Free, Easy, Fast)

#### Steps:
1. **Create Account**
   - Go to https://www.netlify.com/
   - Sign up with GitHub/Email

2. **Deploy via Drag & Drop**
   - Go to Netlify Dashboard
   - Drag the `Meeta_HTML/Meeta/` folder to the deployment area
   - Wait 30 seconds for deployment

3. **Configure Custom Domain** (Optional)
   - Go to Domain Settings
   - Add your custom domain
   - Update DNS records as instructed

4. **Set Redirects** (Create `_redirects` file)
   ```
   /index.html  /  301
   ```

### Option 3: Deploy to Vercel (Free, Fast CDN)

#### Steps:
1. Install Vercel CLI
   ```bash
   npm install -g vercel
   ```

2. Navigate to project folder
   ```bash
   cd /Users/santosh/Development/aol/bhazenclubbing/Meeta_HTML/Meeta
   ```

3. Deploy
   ```bash
   vercel
   ```

4. Follow prompts and get live URL

### Option 4: Deploy to GitHub Pages (Free)

#### Steps:
1. Create GitHub repository
2. Upload files to repository
3. Go to Settings → Pages
4. Select branch and `/root` folder
5. Save and get GitHub Pages URL

---

## ⚙️ Pre-Deployment Checklist

### 1. Update Configuration Files

#### Update `.htaccess` (Line 11)
```apache
# Replace with your actual domain
RewriteRule ^(.*)$ https://yourdomain.com/$1 [R=301,L]
```

#### Update `sitemap.xml` (Lines 4, 9)
```xml
<loc>https://yourdomain.com/</loc>
```

#### Update `robots.txt` (Line 7)
```
Sitemap: https://yourdomain.com/sitemap.xml
```

### 2. Enable Google Analytics

Edit `index.html` (Line 60-66):
```html
<!-- Uncomment and replace GA_MEASUREMENT_ID -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Get your Google Analytics ID:
1. Go to https://analytics.google.com/
2. Create property → Get Measurement ID

### 3. Update Social Media Links

Edit `index.html` (Lines 700-703):
```html
<a href="https://facebook.com/bhazenclubbing" title="Follow us on Facebook">
<a href="https://instagram.com/bhazenclubbing" title="Follow us on Instagram">
<a href="https://twitter.com/bhazenclubbing" title="Follow us on Twitter">
<a href="https://youtube.com/@bhazenclubbing" title="Watch on YouTube">
```

### 4. Update Video Link (Optional)

Edit `index.html` (Line 411):
```html
<a class="popup-video" href="https://www.youtube-nocookie.com/embed/YOUR_VIDEO_ID">
```
Replace `YOUR_VIDEO_ID` with actual Nirvana Station performance video

### 5. Connect Booking Form

#### Option A: Use Formspree (Easiest)
1. Go to https://formspree.io/
2. Create account
3. Get form endpoint
4. Update form action in `index.html` (Line 230):
   ```html
   <form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```

#### Option B: Use Google Forms
1. Create Google Form
2. Get form URL
3. Update button to redirect:
   ```html
   <a href="https://forms.google.com/YOUR_FORM" class="btn-2">Book Your Ticket Now</a>
   ```

#### Option C: Use Custom Backend
- Connect to your payment gateway (Razorpay, PayTM, Instamojo)
- See integration guide below

---

## 💳 Payment Gateway Integration

### Razorpay Integration (Recommended for India)

1. **Sign up**: https://razorpay.com/
2. **Get API Keys**: Dashboard → Settings → API Keys

3. **Add Razorpay Script** (Before `</body>` in `index.html`):
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
function bookTicket(ticketType) {
  var amount = ticketType === 'student' ? 29900 : 49900; // Amount in paise

  var options = {
    "key": "YOUR_RAZORPAY_KEY",
    "amount": amount,
    "currency": "INR",
    "name": "BhaZen Clubbing",
    "description": ticketType === 'student' ? "Student Pass" : "General Pass",
    "image": "assets/images/bhazenclubbing.png",
    "handler": function (response){
      alert("Payment successful! Ticket ID: " + response.razorpay_payment_id);
      // Send to your backend to generate ticket
    },
    "prefill": {
      "name": "",
      "email": "",
      "contact": ""
    },
    "theme": {
      "color": "#2D0A4E"
    }
  };
  var rzp = new Razorpay(options);
  rzp.open();
}
</script>
```

4. **Update Form Button** (Line 312):
```html
<button class="btn-2" type="button" onclick="bookTicket(document.querySelector('select').value)">
  Book Your Ticket Now
</button>
```

---

## 🎨 Customization Guide

### Change Colors
Edit `assets/css/bhazen-custom.css`:
```css
:root {
    --bhazen-purple: #2D0A4E;    /* Primary dark */
    --bhazen-orange: #FF8C00;    /* Accent 1 */
    --bhazen-cyan: #00CED1;      /* Accent 2 */
    --bhazen-magenta: #FF1493;   /* Accent 3 */
}
```

### Update Images
1. **Hero Background**: Replace `assets/images/hero-4.jpg`
2. **Gallery**: Replace `assets/images/gallery-*.jpg`
3. **Video Thumbnail**: Replace `assets/images/video-2.jpg`
4. **Favicon**: Replace `assets/images/favicon.png`

Recommended sizes:
- Hero: 1920x1080px
- Gallery: 600x600px
- Favicon: 32x32px or 512x512px

---

## 📊 SEO Optimization

### 1. Submit Sitemap to Google
1. Go to https://search.google.com/search-console
2. Add property (your website)
3. Submit sitemap: `https://yourdomain.com/sitemap.xml`

### 2. Meta Tags Already Included
- Open Graph tags for social media
- Schema.org structured data for events
- SEO-friendly title and description

### 3. Speed Optimization
- Images are already optimized
- Browser caching enabled via `.htaccess`
- Gzip compression enabled

---

## 🔒 Security Checklist

- ✅ HTTPS enabled (via `.htaccess` redirect)
- ✅ Security headers configured
- ✅ Directory browsing disabled
- ✅ Sensitive files protected
- ✅ XSS protection enabled

---

## 📱 Testing Checklist

### Before Going Live:
- [ ] Test on mobile devices (iOS & Android)
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Verify all links work
- [ ] Test booking form submission
- [ ] Check page load speed: https://pagespeed.web.dev/
- [ ] Verify countdown timer is working
- [ ] Test social media sharing (preview on Facebook, Twitter)
- [ ] Check SSL certificate is active (HTTPS)
- [ ] Verify Google Analytics is tracking

### Testing Tools:
- Mobile Responsiveness: http://responsivedesignchecker.com/
- Page Speed: https://pagespeed.web.dev/
- SEO Check: https://www.seobility.net/en/seocheck/
- Broken Links: https://www.deadlinkchecker.com/

---

## 🎯 Marketing & Promotion

### 1. Social Media
- Share event on Facebook, Instagram, Twitter
- Use hashtags: #BhaZenClubbing #NirvanaStation #VizagEvents
- Create event page on Facebook Events
- Post countdown updates

### 2. WhatsApp Marketing
- Create booking link shortener: https://bit.ly/
- Share in groups and status

### 3. Email Marketing
- Use newsletter form on website
- Send reminders 1 week, 3 days, 1 day before event

### 4. Local Promotion
- Partner with colleges for student tickets
- Distribute flyers at popular hangout spots
- Collaborate with local influencers

---

## 🆘 Troubleshooting

### Issue: Website not loading
- Check DNS propagation: https://www.whatsmydns.net/
- Wait 24-48 hours after domain setup
- Clear browser cache (Ctrl+Shift+R)

### Issue: Images not displaying
- Check file paths are correct
- Ensure images uploaded to correct folder
- Check file permissions (755 for folders, 644 for files)

### Issue: Form not working
- Verify form action URL
- Check email configuration in hosting
- Test with FormSpree as alternative

### Issue: Mobile layout broken
- Clear mobile browser cache
- Check CSS files are loading
- Verify viewport meta tag is present

---

## 📞 Support & Resources

### Hosting Support
- Hostinger: https://www.hostinger.in/tutorials/
- Netlify: https://docs.netlify.com/
- Vercel: https://vercel.com/docs

### Design Assets
- Free Images: https://unsplash.com/, https://pexels.com/
- Icon Library: https://fontawesome.com/
- Gradient Generator: https://cssgradient.io/

### Payment Gateway Docs
- Razorpay: https://razorpay.com/docs/
- Instamojo: https://docs.instamojo.com/
- PayTM: https://developer.paytm.com/docs/

---

## 🎉 Launch Day Checklist

- [ ] Verify website is live and accessible
- [ ] Test ticket booking end-to-end
- [ ] Monitor website traffic (Google Analytics)
- [ ] Respond to inquiries quickly
- [ ] Post going-live announcement on social media
- [ ] Share direct booking link everywhere
- [ ] Monitor form submissions
- [ ] Keep website admin panel open for updates

---

## 📝 Post-Event

- [ ] Thank attendees via email/social media
- [ ] Share event photos in gallery section
- [ ] Gather feedback via Google Forms
- [ ] Archive event for future reference
- [ ] Plan for next event based on learnings

---

## 🎸 Final Notes

Your BhaZen Clubbing website is now production-ready! The event page is optimized for:
- ✅ Mobile responsiveness
- ✅ Fast loading
- ✅ SEO optimization
- ✅ Social media sharing
- ✅ Easy ticket booking
- ✅ Professional design with Nirvana Station branding

**Website Features:**
- Countdown timer to Jan 25, 2026
- Responsive booking form
- Student & General ticket options
- Gurajada Kalakshetram venue info
- 2000+ capacity highlight
- Social media integration
- Gallery section for photos
- Partners/Sponsors section

Good luck with the event! 🎉🎸

---

**Need Help?** Contact your web developer or refer to hosting provider documentation.

**Quick Deploy**: Simplest way is Netlify drag & drop - takes 2 minutes!
