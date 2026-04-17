-- ============================================================
-- SCHEMA DATABASE - Roomify
-- Jalankan SQL ini di Supabase SQL Editor
-- Dibuat oleh: Tim Backend (untuk referensi anggota Database)
-- ============================================================

-- ── TABEL USERS ───────────────────────────────────────────────
-- Menyimpan data pengguna (customer, owner, admin)
-- Terhubung dengan Supabase Auth via kolom "id"
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,   -- bcrypt hash, untuk verifikasi manual
  role          VARCHAR(20) NOT NULL DEFAULT 'customer'
                  CHECK (role IN ('customer', 'owner', 'admin')),
  phone         VARCHAR(20),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk mempercepat pencarian berdasarkan email
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON public.users(role);

-- ── ROW LEVEL SECURITY (RLS) ──────────────────────────────────
-- Keamanan: setiap user hanya bisa akses data miliknya sendiri
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: user bisa baca data dirinya sendiri
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Policy: user bisa update data dirinya sendiri
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Policy: API route bisa insert saat registrasi
CREATE POLICY "Service role can insert users"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- ── TRIGGER: auto-update updated_at ───────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- CONTOH DATA UNTUK TESTING
-- Password semua akun: password123 (sudah di-hash dengan bcrypt)
-- ============================================================
-- INSERT INTO public.users (id, name, email, password_hash, role) VALUES
--   (gen_random_uuid(), 'Budi Customer', 'budi@example.com',
--    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'customer'),
--   (gen_random_uuid(), 'Sari Owner', 'sari@example.com',
--    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'owner');
