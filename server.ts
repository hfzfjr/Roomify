// ============================================================
// SUPABASE CLIENT - Server Side
// Digunakan di API routes (src/app/api/) dan Server Components
// ============================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Membuat koneksi Supabase untuk sisi server
// Otomatis membaca cookie session pengguna
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Cookie tidak bisa di-set di Server Component — tidak masalah
            // karena middleware sudah menangani refresh session
          }
        },
      },
    }
  );
}
