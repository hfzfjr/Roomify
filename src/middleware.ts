import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Fungsi middleware untuk proteksi route
export function middleware(request: NextRequest) {
  // Untuk sementara, izinkan semua akses (belum ada auth)
  return NextResponse.next()
}

// Konfigurasi route mana yang akan diproses middleware
export const config = {
  matcher: [
    /*
     * Match semua request path kecuali:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}