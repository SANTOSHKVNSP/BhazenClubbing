import NextAuth from "next-auth";
import authConfig from "./auth.config";

// Edge session gate: protected routes require a logged-in session (reliable 307).
// Role checks (staff/super) happen in the admin layout/pages with Prisma.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*", "/ticket/:path*"],
};
