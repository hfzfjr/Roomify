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

## Deployment ke Vercel

### Persiapan

1. **Push kode ke GitHub** (jika belum):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Siapkan Environment Variables**:
   - Copy `.env.example` ke `.env.local`
   - Isi dengan nilai yang benar dari Supabase project Anda

### Langkah Deployment

1. **Buka [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Import Project**:
   - Klik "New Project"
   - Connect ke GitHub repository Anda
   - Pilih repository `roomify`

3. **Konfigurasi Project**:
   - **Framework Preset**: Next.js (otomatis terdeteksi)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (otomatis)
   - **Output Directory**: `.next` (otomatis)

4. **Environment Variables**:
   Tambahkan environment variables berikut di tab "Environment Variables":

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXTAUTH_SECRET=your_random_secret_string
   NEXTAUTH_URL=https://your-app-name.vercel.app
   ```

5. **Deploy**:
   - Klik "Deploy"
   - Tunggu proses build selesai (biasanya 2-3 menit)

### Setelah Deployment

1. **Update NEXTAUTH_URL**:
   - Setelah deploy berhasil, update `NEXTAUTH_URL` di environment variables Vercel
   - Gunakan URL yang diberikan Vercel (contoh: `https://roomify-yourname.vercel.app`)

2. **Test Login**:
   - Gunakan credentials test yang sudah disiapkan:
     - Customer: `andi@email.com` / `password123`
     - Owner: `maju@owner.com` / `password123`
     - Admin: `admin@roomify.com` / `password123`

### Troubleshooting

- **Build Error**: Pastikan semua dependencies terinstall dengan benar
- **Environment Variables**: Pastikan semua env vars sudah di-set dengan benar
- **Database Connection**: Pastikan Supabase URL dan keys valid
- **CORS Issues**: Vercel sudah dikonfigurasi untuk handle CORS di `vercel.json`

### Custom Domain (Opsional)

Untuk menggunakan custom domain:
1. Buka project di Vercel Dashboard
2. Tab "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records sesuai instruksi Vercel
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
| 1 | Muhammad Alvin Faa'iz | 103012400229 | Desain UI |
| 2 | Hafiz Fajar Ramadhan | 103012430027 | Database |
| 3 | Muhammad Rafiq Abdurrasyid | 103012400240 | Backend API |
| 4 | Rashaqa Nashwan Moya | 103012300058 |  Backend Auth |
| 5 | Ridwan Faiz Herlambang | 103012400061 | Frontend |