// ============================================================
// API ROUTE: /api/auth
// Setara dengan: AuthController.java + AuthService.java
//
// METHOD 1 (AuthController) → Terima & validasi data dari frontend
// METHOD 2 (AuthService)    → Cek kesesuaian email & password
//
// Endpoint tersedia:
//   POST /api/auth/login    → Login dengan email & password
//   POST /api/auth/register → Daftar akun baru
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@/lib/supabase/server";
import { LoginRequest, LoginResponse, RegisterRequest, ApiResponse, User } from "@/types";

// ============================================================
// POST /api/auth/login
// Setara dengan: @PostMapping("/login") di AuthController.java
//
// Alur:
//   1. Terima email & password dari frontend (Next.js fetch/axios)
//   2. Validasi input tidak kosong
//   3. Cari user di Supabase berdasarkan email (ganti DUMMY_USERS)
//   4. Bandingkan password dengan bcrypt (setara passwordEncoder.matches)
//   5. Buat session Supabase (ganti JWT manual di AuthService.java)
//   6. Kembalikan response ke frontend
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, action } = body;

    // Routing: tentukan apakah request untuk login atau register
    if (action === "register") {
      return await handleRegister({ name: body.name, email, password, role: body.role });
    }

    return await handleLogin({ email, password });

  } catch {
    return NextResponse.json<LoginResponse>(
      { token: null, message: "Format request tidak valid" },
      { status: 400 }
    );
  }
}

// ============================================================
// handleLogin: METHOD 1 + METHOD 2 digabung
// Setara dengan: AuthController.login() + AuthService.checkCredentials()
// ============================================================
async function handleLogin(request: LoginRequest) {

  // ── VALIDASI INPUT (setara langkah 1 & 2 di AuthController.java) ──────────
  if (!request.email || request.email.trim() === "") {
    return NextResponse.json<LoginResponse>(
      { token: null, message: "Email wajib diisi" },
      { status: 400 }
    );
  }

  if (!request.password || request.password.trim() === "") {
    return NextResponse.json<LoginResponse>(
      { token: null, message: "Password wajib diisi" },
      { status: 400 }
    );
  }

  // Validasi format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(request.email)) {
    return NextResponse.json<LoginResponse>(
      { token: null, message: "Format email tidak valid" },
      { status: 400 }
    );
  }

  // ── CEK KESESUAIAN (setara AuthService.checkCredentials()) ───────────────
  const supabase = await createClient();

  // Langkah 1: Cari user berdasarkan email di tabel "users" Supabase
  // Setara dengan: DUMMY_USERS.get(email) di AuthService.java
  // Nanti tabel ini dibuat oleh anggota bagian Database
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, name, email, password_hash, role")
    .eq("email", request.email.toLowerCase().trim())
    .single();

  if (userError || !userData) {
    // Email tidak ditemukan — sama dengan throw new Exception("email atau password salah")
    return NextResponse.json<LoginResponse>(
      { token: null, message: "Email atau password salah" },
      { status: 401 }
    );
  }

  // Langkah 2: Bandingkan password dengan hash di database
  // Setara dengan: passwordEncoder.matches(password, passwordHash) di AuthService.java
  const passwordCocok = await bcrypt.compare(request.password, userData.password_hash);

  if (!passwordCocok) {
    return NextResponse.json<LoginResponse>(
      { token: null, message: "Email atau password salah" },
      { status: 401 }
    );
  }

  // Langkah 3: Buat session (setara generateToken() di AuthService.java)
  // Supabase mengelola token secara otomatis via cookie — tidak perlu JWT manual
  const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
    email: request.email.toLowerCase().trim(),
    password: request.password,
  });

  if (sessionError || !sessionData.session) {
    return NextResponse.json<LoginResponse>(
      { token: null, message: "Gagal membuat sesi login" },
      { status: 500 }
    );
  }

  // Login berhasil — kembalikan token & info user ke frontend
  // Setara dengan: return ResponseEntity.status(HttpStatus.OK).body(new LoginResponse(token, "login berhasil"))
  return NextResponse.json<LoginResponse>(
    {
      token: sessionData.session.access_token,  // setara JWT token di AuthService.java
      message: "Login berhasil",
      user: {
        email: userData.email,
        role: userData.role,
      },
    },
    { status: 200 }
  );
}

// ============================================================
// handleRegister: Daftar akun baru
// Dipanggil ketika action === "register"
// ============================================================
async function handleRegister(request: RegisterRequest) {

  // ── VALIDASI INPUT ────────────────────────────────────────────────────────
  if (!request.name || request.name.trim() === "") {
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Nama wajib diisi" },
      { status: 400 }
    );
  }

  if (!request.email || request.email.trim() === "") {
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Email wajib diisi" },
      { status: 400 }
    );
  }

  if (!request.password || request.password.length < 8) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Password minimal 8 karakter" },
      { status: 400 }
    );
  }

  if (!request.role || !["customer", "owner"].includes(request.role)) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Role harus 'customer' atau 'owner'" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Langkah 1: Cek apakah email sudah terdaftar
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", request.email.toLowerCase().trim())
    .single();

  if (existingUser) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Email sudah terdaftar" },
      { status: 409 }
    );
  }

  // Langkah 2: Hash password sebelum disimpan ke database
  // Setara dengan BCryptPasswordEncoder yang digunakan di AuthService.java
  const passwordHash = await bcrypt.hash(request.password, 10);

  // Langkah 3: Daftarkan ke Supabase Auth (untuk session management)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: request.email.toLowerCase().trim(),
    password: request.password,
  });

  if (authError || !authData.user) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Gagal membuat akun: " + authError?.message },
      { status: 500 }
    );
  }

  // Langkah 4: Simpan data tambahan ke tabel "users"
  // Tabel ini akan dibuat oleh anggota bagian Database (Hafiz)
  const { error: insertError } = await supabase
    .from("users")
    .insert({
      id: authData.user.id,           // ID dari Supabase Auth
      name: request.name.trim(),
      email: request.email.toLowerCase().trim(),
      password_hash: passwordHash,    // Disimpan untuk verifikasi manual
      role: request.role,
      created_at: new Date().toISOString(),
    });

  if (insertError) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Gagal menyimpan data pengguna" },
      { status: 500 }
    );
  }

  return NextResponse.json<ApiResponse<Partial<User>>>(
    {
      success: true,
      message: "Registrasi berhasil! Silakan login.",
      data: {
        email: request.email,
        role: request.role,
      },
    },
    { status: 201 }
  );
}
