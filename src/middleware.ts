import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { middlewareAuth } from "@/lib/auth-edge"

export default middlewareAuth((req: NextRequest & { auth?: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const role = session?.user?.role

  // Public routes
  const publicRoutes = ["/login", "/register", "/api/auth", "/api/doctors"]
  if (publicRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // Protected dashboard routes
  if (pathname.startsWith("/patient") || pathname.startsWith("/doctor") || pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Role-based redirects
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      const dashboard = role === "DOCTOR" ? "/doctor/dashboard" : "/patient/dashboard"
      return NextResponse.redirect(new URL(dashboard, req.url))
    }
    if (pathname.startsWith("/doctor") && role !== "DOCTOR") {
      const dashboard = role === "ADMIN" ? "/admin/dashboard" : "/patient/dashboard"
      return NextResponse.redirect(new URL(dashboard, req.url))
    }
    if (pathname.startsWith("/patient") && role !== "PATIENT") {
      const dashboard = role === "ADMIN" ? "/admin/dashboard" : "/doctor/dashboard"
      return NextResponse.redirect(new URL(dashboard, req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
