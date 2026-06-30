import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const isProd = process.env.NODE_ENV === "production";

// CSP allows: self, inline styles/scripts (Next needs these without nonce), remote
// images over https (Unsplash etc.) + data/blob (QR codes), Google Fonts, the Meta
// Pixel, Razorpay checkout, and Google Maps / YouTube embeds. Applied in prod only
// so `next dev` HMR (websocket/eval) keeps working.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://connect.facebook.net https://checkout.razorpay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://api.razorpay.com https://*.razorpay.com https://www.facebook.com https://connect.facebook.net",
  "frame-src 'self' https://www.google.com https://www.youtube.com https://www.youtube-nocookie.com https://checkout.razorpay.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  ...(isProd ? [{ key: "Content-Security-Policy", value: csp }] : []),
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// i18n-ready (ADR-012). Points at the request config below.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
