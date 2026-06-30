import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { verifyOtp } from "@/lib/auth/otp";

// Phone-number accounts via OTP (ADR-003). OTP delivery is dev-console until a
// WhatsApp BSP / email domain is configured (Phase 4). JWT sessions (no adapter).
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Phone OTP",
      credentials: { phone: {}, code: {} },
      authorize: async (creds) => {
        const phone = typeof creds?.phone === "string" ? creds.phone : "";
        const code = typeof creds?.code === "string" ? creds.code : "";
        if (!phone || !code) return null;
        if (!(await verifyOtp(phone, code))) return null;
        const user = await prisma.user.upsert({
          where: { phone },
          update: {},
          create: { phone },
        });
        return { id: user.id, phone: user.phone, name: user.name ?? null };
      },
    }),
  ],
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
});
