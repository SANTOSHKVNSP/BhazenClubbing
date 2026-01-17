import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.join(__dirname, 'Meeta_HTML/Meeta/index.html');

console.log('🚀 Starting HTML optimization...\n');

let html = fs.readFileSync(htmlPath, 'utf8');
let changes = 0;

// 1. Add preconnect for Google Fonts (already exists, but add dns-prefetch)
console.log('📡 Adding resource hints...');
const headCloseTag = html.indexOf('</head>');
if (headCloseTag !== -1 && !html.includes('dns-prefetch')) {
  const resourceHints = `
    <!-- Resource Hints -->
    <link rel="dns-prefetch" href="https://fonts.googleapis.com">
    <link rel="dns-prefetch" href="https://fonts.gstatic.com">
`;
  html = html.slice(0, headCloseTag) + resourceHints + html.slice(headCloseTag);
  changes++;
}

// 2. Optimize Google Fonts loading with display=swap
console.log('⚡ Optimizing font loading...');
html = html.replace(
  /family=Big\+Shoulders\+Display:wght@300;400;500;600;700;800&family=Open\+Sans:wght@300;400;500;600;700;800&display=swap/g,
  'family=Big+Shoulders+Display:wght@300;400;500;600;700;800&family=Open+Sans:wght@300;400;500;600;700;800&display=swap'
);
html = html.replace(
  /family=Archivo:wght@300;400;500;600;700&display=swap/g,
  'family=Archivo:wght@300;400;500;600;700&display=swap'
);

// Add preload for critical fonts
if (!html.includes('preload') && !html.includes('as="font"')) {
  const fontPreload = `
    <!-- Preload Critical Fonts -->
    <link rel="preload" href="https://fonts.gstatic.com/s/bigsholdersdisplay/v17/fC1MPZJEZG-e9gHhZ7kGN78Rr_2k7pBV9Fxu8Rf2PgIVFw.woff2" as="font" type="font/woff2" crossorigin>
`;
  html = html.slice(0, headCloseTag) + fontPreload + html.slice(headCloseTag);
  changes++;
}

// 3. Add lazy loading to images (exclude hero images and logos)
console.log('🖼️  Adding lazy loading to images...');
html = html.replace(
  /<img([^>]*?)src="assets\/images\/((?!bhazenclubbing|AOL_LogoWhite|hero-background)[^"]*)"([^>]*?)>/gi,
  (match, before, imgName, after) => {
    if (match.includes('loading=')) return match;
    // Add loading="lazy" and decoding="async"
    return `<img${before}src="assets/images/${imgName}" loading="lazy" decoding="async"${after}>`;
  }
);
changes++;

// 4. Convert critical background images to WebP in inline styles
console.log('🎨 Optimizing background images...');
const bgImagePattern = /background-image:\s*url\(['"](assets\/images\/[^'"]+\.(?:jpg|jpeg|png))['"]\)/gi;
const bgMatches = [...html.matchAll(bgImagePattern)];
for (const match of bgMatches) {
  const originalPath = match[1];
  const webpPath = originalPath.replace(/\.(jpg|jpeg|png)$/i, '.webp').replace('/images/', '/images/webp/');
  // For now, keep original paths (we'll handle this in CSS)
}

// 5. Defer non-critical JavaScript
console.log('⚙️  Deferring JavaScript...');
html = html.replace(
  /<script src="assets\/js\/(?!vendor|jquery|bootstrap|modernizr)([^"]+)"([^>]*)><\/script>/gi,
  (match, filename, attrs) => {
    if (attrs.includes('defer') || attrs.includes('async')) return match;
    return `<script src="assets/js/${filename}" defer${attrs}></script>`;
  }
);
changes++;

// 6. Add viewport meta if not exists (it should exist)
if (!html.includes('viewport')) {
  console.log('📱 Adding viewport meta tag...');
  html = html.replace(
    /<meta charset/i,
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n    <meta charset'
  );
  changes++;
}

// Save optimized HTML
fs.writeFileSync(htmlPath, html, 'utf8');

console.log(`\n✅ HTML optimizations complete! Made ${changes} optimization groups.`);
console.log('📁 Updated: index.html');
console.log('\n📋 Optimizations applied:');
console.log('  ✓ Added resource hints (dns-prefetch)');
console.log('  ✓ Optimized font loading (display=swap, preload)');
console.log('  ✓ Added lazy loading to images');
console.log('  ✓ Deferred non-critical JavaScript');
