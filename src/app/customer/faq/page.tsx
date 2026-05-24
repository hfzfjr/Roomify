import FaqPage from '@/components/faq/FaqPage'
import Navbar from '@/components/layout/Navbar'

const categories = [
  {
    id: 'akun',
    title: 'Akun',
    description: 'Pernyataan seputar akun',
    items: [
      {
        question: 'Bagaimana cara mengubah foto profil? ',
        answer: 'Buka halaman Profil Anda melalui menu akun, klik ubah foto, lalu unggah gambar baru. Sistem akan menyimpan foto setelah konfirmasi.'
      },
      {
        question: 'Saya lupa kata sandi. Apa yang harus dilakukan?',
        answer: 'Gunakan fitur "Lupa Kata Sandi" di halaman login untuk menerima tautan reset via email.'
      },
      {
        question: 'Bagaimana cara memperbarui informasi pribadi?',
        answer: 'Masuk ke halaman Profil dan klik tombol "Edit" untuk mengubah nama, nomor telepon, dan alamat.'
      },
      {
        question: 'Bisakah saya menghapus akun saya?',
        answer: 'Silakan hubungi tim support melalui halaman Hubungi Kami untuk proses penghapusan akun.'
      }
    ]
  },
  {
    id: 'pemesanan',
    title: 'Pemesanan Ruangan',
    description: 'Informasi mengenai proses pemesanan dan pembatalan',
    items: [
      {
        question: 'Bagaimana cara memesan ruangan?',
        answer: 'Cari ruang, pilih tanggal dan jam, lalu ikuti langkah pada formulir pemesanan hingga melakukan pembayaran.'
      },
      {
        question: 'Bisakah saya mengubah jadwal setelah memesan?',
        answer: 'Perubahan jadwal tergantung kebijakan pemilik. Silakan hubungi pemilik ruang melalui detail booking atau batalkan dan buat pemesanan baru jika perlu.'
      },
      {
        question: 'Apa yang terjadi jika pemesanan dibatalkan oleh pemilik?',
        answer: 'Anda akan menerima notifikasi dan pengembalian dana sesuai kebijakan pembatalan yang berlaku.'
      }
    ]
  },
  {
    id: 'pembayaran',
    title: 'Pembayaran',
    description: 'Pertanyaan umum seputar metode pembayaran dan pengembalian dana',
    items: [
      {
        question: 'Metode pembayaran apa saja yang tersedia?',
        answer: 'Kami mendukung transfer bank, pembayaran lewat gerbang pembayaran, dan kartu kredit sesuai pilihan yang ditampilkan saat checkout.'
      },
      {
        question: 'Bagaimana cara meminta refund?',
        answer: 'Jika memenuhi syarat pembatalan, ajukan permintaan melalui halaman Pesanan atau hubungi support dengan bukti transaksi.'
      },
      {
        question: 'Kapan saya menerima konfirmasi pembayaran?',
        answer: 'Konfirmasi biasanya dikirim otomatis setelah pembayaran berhasil. Jika belum, periksa riwayat transaksi atau hubungi support.'
      }
    ]
  }
]

export default function Page() {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '80px' }}>
        <FaqPage categories={categories} />
      </div>
    </>
  )
}
