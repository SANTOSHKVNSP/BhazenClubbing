import NextAuth from "next-auth";

// Auth.js skeleton (ADR-003). Establishes session plumbing + helpers (`auth`,
// `signIn`, `signOut`, `handlers`). The phone-number provider with WhatsApp OTP
// (+ email-OTP fallback) and the Prisma-backed user store are implemented in
// Phase 3 — see docs/IMPLEMENTATION_TRACKER.md.
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [],
  pages: {
    signIn: "/login",
  },
});
