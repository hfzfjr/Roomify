# Roomify - Aplikasi Penyewaan Ruangan

Roomify adalah platform penyewaan ruangan berbasis web yang menghubungkan pemilik ruangan (owner) dengan penyewa (customer). Dibangun dengan Next.js, TypeScript, Tailwind CSS, dan Supabase.

## Tech Stack

- **Framework**      : Next.js 15 (App Router)
- **Bahasa**         : TypeScript
- **Styling**        : Tailwind CSS
- **Database & Auth** : Supabase
- **Autentikasi**    : NextAuth.js

## Cara Menjalankan

```bash
### Install dependencies
npm install

### Jalankan development server
npm run dev

### Build untuk production
npm run build

### Jalankan production server
npm start
```

## Struktur Folder dan File

```bash
roomify/
│
├── src/                                                           # Source code utama aplikasi
│   ├── app/                                                       # Routing dan halaman Next.js (App Router)
│   │   ├── auth/                                                  # Grup auth (tanpa navbar/sidebar)
│   │   │   ├── login/                                             # Folder halaman login
│   │   │   │   └── page.tsx                                       # Halaman login customer/owner/admin
│   │   │   └── register/                                          # Folder halaman registrasi
│   │   │       └── page.tsx                                       # Halaman registrasi akun baru
│   │   │
│   │   ├── customer/                                              # Grup customer (dengan sidebar customer)
│   │   │   ├── layout.tsx                                         # Layout dengan sidebar khusus customer
│   │   │   ├── dashboard/                                         # Folder dashboard customer
│   │   │   │   └── page.tsx                                       # Dashboard customer (ringkasan booking, rekomendasi)
│   │   │   ├── rooms/                                             # Folder halaman ruangan
│   │   │   │   ├── page.tsx                                       # Daftar semua ruangan yang tersedia
│   │   │   │   └── id/                                            # Dynamic route untuk detail ruangan
│   │   │   │       └── page.tsx                                   # Detail ruangan (harga, fasilitas, booking)
│   │   │   ├── bookings/                                          # Folder riwayat booking
│   │   │   │   └── page.tsx                                       # Riwayat booking customer
│   │   │   ├── profile/                                           # Folder profil customer
│   │   │   │   └── page.tsx                                       # Profil & pengaturan akun customer
│   │   │   └── reviews/                                           # Folder ulasan
│   │   │       └── page.tsx                                       # Halaman melihat & menulis ulasan
│   │   │
│   │   ├── owner/                                                 # Grup owner (dengan sidebar owner)
│   │   │   ├── layout.tsx                                         # Layout dengan sidebar khusus owner
│   │   │   ├── dashboard/                                         # Folder dashboard owner
│   │   │   │   └── page.tsx                                       # Dashboard owner (statistik pendapatan, booking)
│   │   │   ├── rooms/                                             # Folder kelola ruangan
│   │   │   │   ├── page.tsx                                       # Kelola ruangan milik owner (CRUD)
│   │   │   │   ├── add/                                           # Folder form tambah ruangan
│   │   │   │   │   └── page.tsx                                   # Form tambah ruangan baru
│   │   │   │   └── edit/                                          # Folder edit ruangan
│   │   │   │       └── id/                                        # Dynamic route edit ruangan
│   │   │   │           └── page.tsx                               # Form edit ruangan
│   │   │   ├── bookings/                                          # Folder semua booking
│   │   │   │   └── page.tsx                                       # Semua booking untuk ruangan owner
│   │   │   ├── facility-requests/                                 # Folder permintaan fasilitas
│   │   │   │   └── page.tsx                                       # Kelola permintaan fasilitas dari customer
│   │   │   └── reports/                                           # Folder laporan
│   │   │       └── page.tsx                                       # Laporan penjualan & statistik
│   │   │
│   │   ├── admin/                                                 # Grup admin (dengan sidebar admin)
│   │   │   ├── layout.tsx                                         # Layout dengan sidebar khusus admin
│   │   │   ├── dashboard/                                         # Folder dashboard admin
│   │   │   │   └── page.tsx                                       # Dashboard admin (monitoring semua aktivitas)
│   │   │   └── verify-rooms/                                      # Folder verifikasi ruangan
│   │   │       └── page.tsx                                       # Verifikasi ruangan baru dari owner
│   │   │
│   │   ├── api/                                                   # API endpoints (backend)
│   │   │   ├── auth/                                              # Folder auth API
│   │   │   │   └── route.ts                                       # Auth API (NextAuth) - login, register, session
│   │   │   ├── rooms/                                             # Folder rooms API
│   │   │   │   ├── route.ts                                       # GET daftar ruangan, POST tambah ruangan
│   │   │   │   └── id/                                            # Dynamic route API
│   │   │   │       └── route.ts                                   # GET detail, PUT edit, DELETE hapus ruangan
│   │   │   ├── bookings/                                          # Folder bookings API
│   │   │   │   └── route.ts                                       # GET, POST booking
│   │   │   ├── payments/                                          # Folder payments API
│   │   │   │   └── route.ts                                       # POST payment, GET status pembayaran
│   │   │   ├── facility-requests/                                 # Folder facility requests API
│   │   │   │   └── route.ts                                       # GET, POST, PUT permintaan fasilitas
│   │   │   ├── reviews/                                           # Folder reviews API
│   │   │   │   └── route.ts                                       # GET, POST ulasan
│   │   │   └── reports/                                           # Folder reports API
│   │   │       └── route.ts                                       # GET data laporan penjualan
│   │   │
│   │   ├── layout.tsx                                             # Root layout global (HTML, body, font, providers)
│   │   └── page.tsx                                               # Landing page (beranda)
│   │
│   ├── components/                                                # Komponen reusable
│   │   ├── ui/                                                    # Komponen UI dasar
│   │   │   ├── Button.tsx                                         # Tombol reusable (variant, size, loading)
│   │   │   ├── Card.tsx                                           # Kartu untuk menampilkan informasi
│   │   │   ├── Input.tsx                                          # Input field reusable dengan validasi
│   │   │   ├── Modal.tsx                                          # Popup modal untuk konfirmasi/form
│   │   │   └── Loading.tsx                                        # Indikator loading
│   │   ├── layout/                                                # Komponen layout
│   │   │   ├── Navbar.tsx                                         # Navigasi bar atas
│   │   │   ├── SidebarCustomer.tsx                                # Sidebar untuk customer
│   │   │   ├── SidebarOwner.tsx                                   # Sidebar untuk owner
│   │   │   ├── SidebarAdmin.tsx                                   # Sidebar untuk admin
│   │   │   └── Footer.tsx                                         # Footer website
│   │   ├── rooms/                                                 # Komponen khusus ruangan
│   │   │   ├── RoomCard.tsx                                       # Kartu tampilan ruangan
│   │   │   ├── RoomFilter.tsx                                     # Filter pencarian ruangan
│   │   │   ├── RoomSearch.tsx                                     # Search bar ruangan
│   │   │   └── RoomForm.tsx                                       # Form tambah/edit ruangan
│   │   ├── booking/                                               # Komponen booking
│   │   │   ├── BookingForm.tsx                                    # Form pemesanan ruangan
│   │   │   ├── BookingSummary.tsx                                 # Ringkasan booking sebelum bayar
│   │   │   └── BookingCalendar.tsx                                # Kalender pilih tanggal booking
│   │   ├── dashboard/                                             # Komponen dashboard
│   │   │   ├── StatsCard.tsx                                      # Kartu statistik (total booking, pendapatan)
│   │   │   ├── RevenueChart.tsx                                   # Grafik pendapatan
│   │   │   └── BookingChart.tsx                                   # Grafik booking
│   │   └── auth/                                                  # Komponen auth
│   │       ├── LoginForm.tsx                                      # Form login
│   │       └── RegisterForm.tsx                                   # Form registrasi
│   │
│   ├── lib/                                                       # Utility & konfigurasi
│   │   └── supabase/                                              # Supabase client
│   │       ├── client.ts                                          # Supabase client untuk browser (client-side)
│   │       └── server.ts                                          # Supabase client untuk server (server-side)
│   │
│   ├── hooks/                                                     # Custom hooks React
│   │   ├── useAuth.ts                                             # Hook untuk autentikasi (login, logout, session)
│   │   ├── useRooms.ts                                            # Hook untuk data ruangan (fetch, filter, search)
│   │   ├── useBooking.ts                                          # Hook untuk booking (create, cancel, history)
│   │   └── useFacilityRequest.ts                                  # Hook untuk permintaan fasilitas
│   │
│   ├── types/                                                     # TypeScript type definitions
│   │   └── index.ts                                               # Export semua type definitions
│   │
│   ├── utils/                                                     # Helper functions
│   │   ├── formatDate.ts                                          # Format tanggal (Indonesia)
│   │   ├── formatRupiah.ts                                        # Format mata uang Rupiah
│   │   └── validation.ts                                          # Validasi form (email, phone, dll)
│   │
│   ├── styles/                                                    # Styling
│   │   └── globals.css                                            # Global CSS + Tailwind
│   │
│   └── middleware.ts                                              # Middleware untuk proteksi route (redirect jika belum login)
│
├── public/                                                        # File statis (asset publik)
│   ├── images/                                                    # Folder gambar (ruangan, logo, ilustrasi)
│   ├── fonts/                                                     # Folder font custom
│   └── favicon.ico                                                # Icon browser tab
│
├── .env.local                                                     # Environment variables (Supabase URL, keys, dll) - JANGAN COMMIT!
├── .gitignore                                                     # Menentukan file yang tidak di-commit ke Git
├── AGENTS.md                                                      # Dokumentasi untuk AI agents (opsional)
├── CLAUDE.md                                                      # Dokumentasi untuk Claude AI (opsional)
├── eslint.config.mjs                                              # Konfigurasi ESLint (linting JavaScript/TypeScript)
├── next.config.js                                                 # Konfigurasi Next.js (routing, build, dll)
├── package-lock.json                                              # Lock file untuk dependency version
├── package.json                                                   # Daftar dependency & script npm
├── postcss.config.mjs                                             # Konfigurasi PostCSS (untuk Tailwind CSS)
├── README.md                                                      # Dokumentasi proyek (file ini)
└── tsconfig.json                                                  # Konfigurasi TypeScript
```

## Fitur

### 👤 Customer (Penyewa)

| No | Fitur | Keterangan |
|----|-------|-------------|
| 1 | Mencari Ruangan | Mencari ruangan berdasarkan nama, lokasi, dan fasilitas |
| 2 | Filter Ruangan | Filter berdasarkan kapasitas, harga, dan fasilitas |
| 3 | Detail Ruangan | Melihat informasi lengkap ruangan (harga, kapasitas, fasilitas) |
| 4 | Cek Ketersediaan | Melihat jadwal dan jam tersedia ruangan |
| 5 | Booking Ruangan | Melakukan pemesanan ruangan sesuai jadwal |
| 6 | Pembayaran | Melakukan pembayaran booking melalui payment gateway |
| 7 | Riwayat Booking | Melihat daftar booking yang pernah dilakukan |
| 8 | Ulasan Ruangan | Memberikan rating dan komentar untuk ruangan yang sudah disewa |
| 9 | Permintaan Fasilitas | Meminta fasilitas tambahan kepada owner ruangan |
| 10 | Profil | Mengelola data diri dan pengaturan akun |

### 🏢 Owner (Pemilik Ruangan)

| No | Fitur | Keterangan |
|----|-------|-------------|
| 1 | Dashboard | Melihat ringkasan pendapatan dan statistik booking |
| 2 | Tambah Ruangan | Menambahkan ruangan baru dengan informasi lengkap |
| 3 | Edit Ruangan | Mengubah informasi ruangan yang sudah ditambahkan |
| 4 | Hapus Ruangan | Menghapus ruangan dari daftar penyewaan |
| 5 | Lihat Booking | Melihat semua booking yang masuk ke ruangan miliknya |
| 6 | Kelola Permintaan | Menyetujui atau menolak permintaan fasilitas dari customer |
| 7 | Laporan Penjualan | Melihat laporan pendapatan per periode (harian/mingguan/bulanan) |
| 8 | Grafik Statistik | Melihat visualisasi data pendapatan dan booking |

### 🛡️ Admin

| No | Fitur | Keterangan |
|----|-------|-------------|
| 1 | Dashboard Admin | Monitoring semua aktivitas di platform |
| 2 | Verifikasi Ruangan | Memverifikasi ruangan baru yang ditambahkan owner |
| 3 | Kelola User | Mengelola data customer dan owner |

## Tim Pengembang

| No | Nama | NIM | Peran |
|----|------|-----|-------|
| 1 | Muhammad Alvin Faa'iz | 103012400229 | Full Stack Developer |
| 2 | Hafiz Fajar Ramadhan | 103012430027 | Frontend Developer |
| 3 | Muhammad Rafiq Abdurrasyid | 103012400240 | Backend Developer |
| 4 | Rashaqa Nashwan Moya | 103012300058 | Database Engineer |
| 5 | Ridwan Faiz Herlambang | 103012400061 | UI/UX Designer |