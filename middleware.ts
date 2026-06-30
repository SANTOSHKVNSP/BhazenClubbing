import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// TEMPORARY admin gate via HTTP Basic auth. Replaced by Auth.js phone login +
// role-based access (Super/City admin) in Phase 3/5 — see docs/DECISIONS.md ADR-003/004.
export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USER || "admin";
  const pass = process.env.ADMIN_PASSWORD || "sattvick";
  const expected = "Basic " + btoa(`${user}:${pass}`);

  if (req.headers.get("authorization") !== expected) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Sattvick Beats Admin"' },
    });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
