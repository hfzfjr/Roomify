// ============================================================
// SUPABASE CLIENT - Browser / Client Side
// Digunakan di komponen React yang berjalan di browser
// ============================================================

import { createBrowserClient } from "@supabase/ssr";

// Membuat koneksi Supabase untuk sisi browser
// Variabel ini wajib ada di file .env.local
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
