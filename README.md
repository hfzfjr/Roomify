# Roomify - Aplikasi Penyewaan Ruangan

Roomify adalah platform penyewaan ruangan berbasis web yang menghubungkan pemilik ruangan (owner) dengan penyewa (customer). Dibangun dengan Next.js, TypeScript, Tailwind CSS, dan Supabase.

## Tech Stack

- **Framework**      : Next.js 16 (App Router)
- **Bahasa**         : TypeScript
- **Styling**        : Tailwind CSS 4
- **Database & Auth** : Supabase (PostgreSQL)
- **Autentikasi**    : NextAuth.js 4
- **Payment Gateway** : Inject Nominal QRIS (DANA)
- **Charts**         : Recharts
- **Icons**          : React Icons, Heroicons
- **Forms**          : React Hook Form
- **Notifications**  : React Toastify
- **PDF Generation** : Playwright

## Environment Variables

Buat file `.env.local` di root project dengan konfigurasi berikut:

```env
# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com/"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# QRIS Payment Configuration
QRIS_MERCHANT_PAYLOAD="your-qris-payload"

# Vercel Deployment (Optional)
VERCEL_OIDC_TOKEN="your-vercel-token"

# PDF Generation (Optional)
PDF_BROWSER_EXECUTABLE_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"

# Cron Job Security
CRON_SECRET="your-cron-secret"
```

## Struktur Database

### Tabel Utama

| Tabel | Deskripsi |
|-------|-----------|
| `users` | Data user (customer, owner, admin) |
| `customer` | Data customer (terkait dengan users) |
| `owner` | Data owner (terkait dengan users) |
| `admin` | Data admin (terkait dengan users) |
| `room` | Data ruangan yang disewakan |
| `room_amenity` | Fasilitas ruangan |
| `room_image` | Gambar ruangan |
| `booking` | Data booking/pemesanan |
| `payment` | Data pembayaran |
| `invoice` | Data invoice/bukti pembayaran |
| `review` | Ulasan customer |
| `facility_request` | Permintaan fasilitas tambahan |
| `report` | Laporan masalah dari customer |
| `notifications` | Notifikasi sistem |
| `province` | Data provinsi |
| `region` | Data kota/kabupaten |

### Status Booking
- `pending` - Menunggu konfirmasi
- `confirmed` - Dikonfirmasi
- `completed` - Selesai
- `cancelled` - Dibatalkan

### Status Payment
- `pending` - Menunggu pembayaran
- `success` - Pembayaran berhasil
- `failed` - Pembayaran gagal

### Status Owner
- `pending` - Menunggu verifikasi
- `active` - Aktif
- `suspended` - Ditangguhkan

## Struktur Project

```
roomify/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Halaman admin
│   │   ├── api/               # API Routes
│   │   ├── auth/              # Autentikasi
│   │   ├── customer/          # Halaman customer
│   │   └── owner/             # Halaman owner
│   ├── components/            # Komponen React
│   │   ├── booking/          # Komponen booking
│   │   ├── layout/           # Komponen layout
│   │   ├── ui/               # Komponen UI umum
│   │   └── icons/            # Komponen icon
│   ├── hooks/                # Custom React Hooks
│   ├── lib/                  # Library & utilities
│   └── types/                # TypeScript types
└── public/                   # Static files
```

## Cara Menjalankan

```bash
### Install dependencies
npm install

### Setup environment variables
# Copy .env.local.example ke .env.local dan isi dengan nilai yang sesuai

### Jalankan development server
npm run dev

### Build untuk production
npm run build

### Jalankan production server
npm start
```

## Deployment

### Vercel (Recommended)

1. Push code ke GitHub
2. Import project ke Vercel
3. Setup environment variables di Vercel dashboard
4. Deploy

### Docker

```bash
# Build image
docker build -t roomify-app .

# Run container
docker run -d -p 3000:3000 --name roomify-server --restart always \
  --env CRON_SECRET=$CRON_SECRET \
  roomify-app
```

Atau gunakan script deploy:
```bash
./deploy.sh
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
| 6 | Pembayaran QRIS | Melakukan pembayaran booking melalui QRIS (Inject Nominal) |
| 7 | Riwayat Booking | Melihat daftar booking yang pernah dilakukan |
| 8 | Ulasan Ruangan | Memberikan rating dan komentar untuk ruangan yang sudah disewa |
| 9 | Permintaan Fasilitas | Meminta fasilitas tambahan kepada owner ruangan |
| 10 | Laporan Masalah | Melaporkan masalah pada ruangan yang disewa |
| 11 | Notifikasi | Menerima notifikasi pembayaran, booking, dan reminder |
| 12 | Profil | Mengelola data diri dan pengaturan akun |

### 🏢 Owner (Pemilik Ruangan)

| No | Fitur | Keterangan |
|----|-------|-------------|
| 1 | Dashboard | Melihat ringkasan pendapatan dan statistik booking bulanan |
| 2 | Tambah Ruangan | Menambahkan ruangan baru dengan informasi lengkap |
| 3 | Edit Ruangan | Mengubah informasi ruangan yang sudah ditambahkan |
| 4 | Hapus Ruangan | Menghapus ruangan dari daftar penyewaan (soft delete) |
| 5 | Lihat Booking | Melihat semua booking yang masuk ke ruangan miliknya |
| 6 | Kelola Permintaan | Menyetujui atau menolak permintaan fasilitas dari customer |
| 7 | Laporan Transaksi | Melihat laporan pendapatan per periode (harian/mingguan/bulanan) |
| 8 | Grafik Statistik | Melihat visualisasi data pendapatan dan booking |
| 9 | Notifikasi | Menerima notifikasi booking dan permintaan fasilitas |
| 10 | Kelola Fasilitas | Menambahkan/menghapus fasilitas ruangan |

### 🛡️ Admin

| No | Fitur | Keterangan |
|----|-------|-------------|
| 1 | Dashboard Admin | Monitoring semua aktivitas di platform (total user, owner, room) |
| 2 | Verifikasi Owner | Memverifikasi permintaan owner baru untuk bergabung |
| 3 | Kelola User | Mengelola data customer dan owner |
| 4 | Laporan Masalah | Melihat dan menangani laporan dari customer |
| 5 | Statistik Platform | Melihat statistik pertumbuhan user dan ruangan |

## Tim Pengembang

| No | Nama | NIM | Peran |
|----|------|-----|-------|
| 1 | Muhammad Alvin Faa'iz | 103012400229 | Desain UI |
| 2 | Hafiz Fajar Ramadhan | 103012430027 | Database |
| 3 | Muhammad Rafiq Abdurrasyid | 103012400240 | Backend API |
| 4 | Rashaqa Nashwan Moya | 103012300058 |  Backend Auth |
| 5 | Ridwan Faiz Herlambang | 103012400061 | Frontend |