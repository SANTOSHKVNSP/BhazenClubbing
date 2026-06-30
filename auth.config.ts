import type { NextAuthConfig } from "next-auth";

// Edge-safe base config (no Prisma / Node-only code) so it can run in middleware.
// The Credentials provider (which uses Prisma) is added in auth.ts.
export default {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id as string;
        token.phone = (user as { phone?: string }).phone;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? "";
        session.user.phone = token.phone as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
