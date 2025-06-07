import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Skip middleware for setup page to avoid infinite redirects
  if (request.nextUrl.pathname === "/setup") {
    return NextResponse.next()
  }

  // Skip middleware for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Check if setup is complete for protected routes
  if (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname === "/") {
    try {
      const setupResponse = await fetch(new URL("/api/setup/check", request.url))

      if (setupResponse.ok) {
        const { setupComplete } = await setupResponse.json()

        if (!setupComplete) {
          return NextResponse.redirect(new URL("/setup", request.url))
        }
      } else {
        // If setup check fails, redirect to setup
        return NextResponse.redirect(new URL("/setup", request.url))
      }
    } catch (error) {
      // If we can't check setup status, redirect to setup
      console.error("Middleware error:", error)
      return NextResponse.redirect(new URL("/setup", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/admin/:path*"],
}
