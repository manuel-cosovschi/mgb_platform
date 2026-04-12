import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes — always allow
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // No session — redirect to login
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user?.role;

  // Portal routes — only CLIENTE (SOCIO/EMPLEADO go to /dashboard)
  if (pathname.startsWith("/portal")) {
    if (role === "SOCIO" || role === "EMPLEADO") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Dashboard routes — CLIENTE goes to /portal
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/crm") ||
    pathname.startsWith("/prospectos") ||
    pathname.startsWith("/finance") ||
    pathname.startsWith("/time-tracking") ||
    pathname.startsWith("/employees") ||
    pathname.startsWith("/socios") ||
    pathname.startsWith("/documents") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/okrs") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/git-guide")
  ) {
    if (role === "CLIENTE") {
      return NextResponse.redirect(new URL("/portal", req.url));
    }
  }

  // Socios-only routes
  if (pathname.startsWith("/socios") && role !== "SOCIO") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
