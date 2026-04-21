import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    // Admin-ruter krever ADMIN-rolle
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/calculator", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Tillat tilgang hvis bruker er autentisert
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/calculator/:path*", "/admin/:path*"],
};
