import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "./auth.config";
import { prisma } from "@/lib/db";
import { verifyOtp } from "@/lib/auth/otp";

// Full (Node) auth: base Edge config + the Prisma-backed Credentials provider.
// Phone OTP login (ADR-003). OTP delivery is dev-console until WhatsApp/email keys (Phase 4).
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Phone OTP",
      credentials: { phone: {}, code: {} },
      authorize: async (creds) => {
        const phone = typeof creds?.phone === "string" ? creds.phone : "";
        const code = typeof creds?.code === "string" ? creds.code : "";
        if (!phone || !code) return null;
        if (!(await verifyOtp(phone, code))) return null;
        const user = await prisma.user.upsert({ where: { phone }, update: {}, create: { phone } });
        return { id: user.id, phone: user.phone, name: user.name ?? null };
      },
    }),
  ],
});
