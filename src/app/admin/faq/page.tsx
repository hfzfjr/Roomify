"use client"

import { useState, useRef } from 'react'
import FaqPage from '@/components/faq/FaqPage'
import SidebarAdmin from '@/components/layout/SidebarAdmin'
import { useUser } from '@/hooks/useUser'
import styles from './page.module.css'

const adminCategories = [
  {
    id: 'room-management',
    title: 'Manajemen Kamar',
    description: 'Pertanyaan seputar pengelolaan kamar dan verifikasi',
    items: [
      {
        question: 'Bagaimana cara menambahkan kamar baru?',
        answer: 'Anda dapat menambahkan kamar baru melalui menu "Tambah Kamar" di dashboard admin. Isi semua informasi yang diperlukan seperti nama kamar, tipe kamar, harga, fasilitas, dan upload foto kamar. Pastikan semua data sudah benar sebelum disubmit.'
      },
      {
        question: 'Bagaimana cara memverifikasi kamar?',
        answer: 'Kamar yang diajukan oleh pemilik akan muncul di menu "Verifikasi Kamar". Review semua informasi dan foto kamar, lalu klik tombol "Terima" untuk menyetujui atau "Tolak" jika ada ketidaksesuaian. Kamar yang diverifikasi akan langsung tampil di pencarian.'
      },
      {
        question: 'Bagaimana cara mengedit atau menghapus kamar?',
        answer: 'Untuk mengedit kamar, buka menu "Manajemen Kamar" dan klik tombol edit pada kamar yang diinginkan. Untuk menghapus, gunakan menu "Hapus Kamar" dan pilih kamar yang ingin dihapus. Perhatikan bahwa kamar yang memiliki booking aktif tidak dapat dihapus.'
      },
      {
        question: 'Apa yang harus dilakukan jika ada keluhan tentang kamar?',
        answer: 'Review keluhan dari pelanggan melalui menu Laporan. Jika keluhan valid, hubungi pemilik kamar untuk perbaikan. Dalam kasus serius, Anda dapat menonaktifkan sementara kamar dari pencarian sampai perbaikan selesai.'
      }
    ]
  },
  {
    id: 'owner-management',
    title: 'Manajemen Pemilik',
    description: 'Pertanyaan seputar pengelolaan akun pemilik kamar',
    items: [
      {
        question: 'Bagaimana cara mendaftarkan pemilik baru?',
        answer: 'Pemilik dapat mendaftar sendiri melalui aplikasi pelanggan. Setelah mendaftar, mereka perlu mengajukan verifikasi sebagai pemilik dengan melampirkan dokumen identitas dan bukti kepemilikan properti. Anda dapat meninjau dan menyetujui pendaftaran di menu verifikasi.'
      },
      {
        question: 'Bagaimana cara menangani pemilik yang melanggar aturan?',
        answer: 'Jika pemilik terbukti melanggar aturan (misalnya: membatalkan booking secara sepihak, memberikan informasi palsu, atau melakukan penipuan), Anda dapat memberikan peringatan atau menonaktifkan akun mereka. Catat semua insiden untuk referensi masa depan.'
      },
      {
        question: 'Bagaimana cara menghapus akun pemilik?',
        answer: 'Gunakan menu "Hapus Pemilik" untuk menghapus akun pemilik. Pastikan pemilik tidak memiliki kamar aktif atau booking yang sedang berlangsung sebelum menghapus akun. Pemilik akan diberi notifikasi sebelum akun dihapus.'
      },
      {
        question: 'Bagaimana cara melihat performa pemilik?',
        answer: 'Laporan performa pemilik tersedia di menu Laporan. Anda dapat melihat jumlah kamar yang dimiliki, tingkat okupansi, rating dari pelanggan, dan total pendapatan. Data ini membantu dalam mengevaluasi kinerja pemilik.'
      }
    ]
  },
  {
    id: 'booking-management',
    title: 'Manajemen Booking',
    description: 'Pertanyaan seputar pengelolaan pemesanan kamar',
    items: [
      {
        question: 'Bagaimana cara melihat semua booking yang aktif?',
        answer: 'Semua booking aktif dapat dilihat di dashboard admin atau menu khusus Booking. Filter berdasarkan tanggal, status, atau kamar untuk memudahkan pencarian. Booking akan ditampilkan dengan detail pelanggan, kamar, dan periode menginap.'
      },
      {
        question: 'Bagaimana cara menangani pembatalan booking?',
        answer: 'Pembatalan dapat dilakukan oleh pelanggan atau admin. Jika admin membatalkan, tentukan alasan pembatalan. Kebijakan refund akan diterapkan otomatis berdasarkan waktu pembatalan. Notifikasi akan dikirim ke pelanggan dan pemilik kamar.'
      },
      {
        question: 'Apa yang harus dilakukan jika ada konflik booking?',
        answer: 'Konflik booking (double booking) harus diselesaikan segera. Prioritaskan booking yang pertama dibuat. Hubungi pelanggan yang terdampak untuk penjelasan dan alternatif solusi. Review sistem untuk mencegah konflik serupa di masa depan.'
      },
      {
        question: 'Bagaimana cara memproses check-in dan check-out?',
        answer: 'Check-in dan check-out dapat dilakukan melalui dashboard admin. Saat check-in, verifikasi identitas pelanggan dan berikan akses kamar. Saat check-out, pastikan kamar dalam kondisi baik sebelum memproses refund deposit jika ada.'
      }
    ]
  },
  {
    id: 'reports',
    title: 'Laporan',
    description: 'Pertanyaan seputar laporan dan analitik',
    items: [
      {
        question: 'Laporan apa saja yang tersedia?',
        answer: 'Sistem menyediakan berbagai laporan: laporan pendapatan, laporan okupansi kamar, laporan performa pemilik, laporan keluhan pelanggan, dan laporan transaksi. Semua laporan dapat diunduh dalam format PDF atau Excel.'
      },
      {
        question: 'Bagaimana cara mengakses laporan?',
        answer: 'Akses menu "Laporan" di dashboard admin. Pilih jenis laporan yang diinginkan, tentukan periode waktu (harian, mingguan, bulanan, atau kustom), lalu klik "Generate Report". Laporan akan ditampilkan dan dapat diunduh.'
      },
      {
        question: 'Bagaimana cara menangani keluhan pelanggan?',
        answer: 'Keluhan pelanggan masuk ke sistem laporan. Review setiap keluhan, klasifikasikan berdasarkan urgensi, dan ambil tindakan yang sesuai. Respon cepat kepada pelanggan dan dokumentasikan semua tindakan yang diambil untuk referensi.'
      },
      {
        question: 'Bagaimana cara melihat statistik platform?',
        answer: 'Statistik platform tersedia di dashboard utama admin. Anda dapat melihat total pengguna, total booking, pendapatan, tingkat okupansi rata-rata, dan metrik penting lainnya dalam real-time. Data ini diperbarui secara otomatis.'
      }
    ]
  },
  {
    id: 'account',
    title: 'Akun & Keamanan',
    description: 'Pertanyaan seputar pengaturan akun admin',
    items: [
      {
        question: 'Bagaimana cara mengubah password admin?',
        answer: 'Masuk ke menu "Pengaturan Akun" dan klik "Ubah Password". Masukkan password lama dan password baru. Password harus minimal 8 karakter dengan kombinasi huruf dan angka. Perubahan akan diterapkan segera setelah dikonfirmasi.'
      },
      {
        question: 'Bagaimana cara menambahkan admin baru?',
        answer: 'Hanya super admin yang dapat menambahkan admin baru. Masuk ke pengaturan dan pilih "Tambah Admin". Masukkan email dan role untuk admin baru. Admin baru akan menerima email undangan untuk mengatur password mereka.'
      },
      {
        question: 'Apa yang harus dilakukan jika mencurigai aktivitas mencurigakan?',
        answer: 'Jika mencurigai aktivitas mencurigakan (login dari lokasi tidak biasa, banyak booking dalam waktu singkat, dll), segera investigasi. Periksa log aktivitas dan jika perlu, blokir sementara akun yang terdampak sampai investigasi selesai.'
      },
      {
        question: 'Bagaimana cara mengatur notifikasi?',
        answer: 'Pengaturan notifikasi tersedia di menu "Pengaturan Akun". Anda dapat memilih untuk menerima notifikasi via email untuk booking baru, pembatalan, keluhan, dan update sistem. Sesuaikan sesuai kebutuhan Anda.'
      }
    ]
  }
]

export default function AdminFaqPage() {
  const user = useUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sidebarRef = useRef<HTMLElement | null>(null)

  return (
    <div className={styles.pageLayout}>
      {/* Sidebar */}
      <SidebarAdmin
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarRef={sidebarRef}
      />

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main area */}
      <div className={styles.mainArea}>
        {/* Mobile topbar */}
        <div className={styles.mobileTopbar}>
          <button
            type="button"
            className={styles.hamburger}
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
              <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
              <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
            </svg>
          </button>
          <span className={styles.mobileTopbarTitle}>FAQ Admin</span>
        </div>

        <div className={styles.container}>
          <FaqPage categories={adminCategories} />
        </div>
      </div>
    </div>
  )
}
