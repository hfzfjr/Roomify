"use client"

import { useRouter } from 'next/navigation'
import BackButton from '@/components/ui/BackButton'
import FaqPage from '@/components/faq/FaqPage'

const ownerFaqCategories = [
  {
    id: 'account',
    title: 'Akun & Profil',
    description: 'Pertanyaan seputar pengelolaan akun owner',
    items: [
      {
        question: 'Bagaimana cara mendaftar sebagai owner?',
        answer: 'Untuk mendaftar sebagai owner, Anda perlu mengisi formulir pendaftaran owner di dashboard. Tim kami akan memverifikasi data Anda dalam 1-2 hari kerja. Setelah disetujui, Anda dapat mulai menambahkan ruangan.'
      },
      {
        question: 'Bagaimana cara mengubah informasi profil owner?',
        answer: 'Anda dapat mengubah informasi profil melalui menu "Profil" di dashboard. Anda dapat mengubah nama, email, nomor telepon, dan informasi lainnya. Pastikan untuk menyimpan perubahan setelah selesai.'
      },
      {
        question: 'Apakah saya bisa memiliki lebih dari satu akun owner?',
        answer: 'Tidak, setiap individu atau entitas bisnis hanya boleh memiliki satu akun owner. Jika Anda memiliki beberapa lokasi bisnis, Anda dapat mengelola semuanya dalam satu akun.'
      }
    ]
  },
  {
    id: 'room',
    title: 'Manajemen Ruangan',
    description: 'Pertanyaan seputar penambahan dan pengelolaan ruangan',
    items: [
      {
        question: 'Bagaimana cara menambahkan ruangan baru?',
        answer: 'Klik tombol "Tambah Ruangan" di dashboard. Anda akan diminta untuk mengisi informasi dasar seperti nama ruangan, deskripsi, harga, kapasitas, tipe ruangan, fasilitas, lokasi, dan foto. Pastikan semua field wajib diisi sebelum menyimpan.'
      },
      {
        question: 'Berapa foto yang bisa saya unggah untuk setiap ruangan?',
        answer: 'Anda dapat mengunggah minimal 1 foto dan maksimal 8 foto untuk setiap ruangan. Foto pertama akan otomatis dijadikan sebagai foto utama. Anda dapat menggeser foto untuk mengubah urutan tampilan.'
      },
      {
        question: 'Bagaimana cara mengedit informasi ruangan?',
        answer: 'Buka dashboard, pilih ruangan yang ingin diedit, dan klik tombol "Edit". Anda dapat mengubah semua informasi kecuali ID ruangan. Perubahan akan langsung tersimpan setelah Anda klik tombol "Simpan".'
      },
      {
        question: 'Apakah saya bisa menghapus ruangan?',
        answer: 'Ya, Anda dapat menghapus ruangan melalui dashboard. Namun, ruangan yang memiliki booking aktif atau mendatang tidak dapat dihapus. Anda harus menyelesaikan atau membatalkan semua booking terlebih dahulu.'
      },
      {
        question: 'Bagaimana cara mengatur ketersediaan ruangan?',
        answer: 'Ruangan akan otomatis tersedia untuk booking kecuali ada booking yang sudah dikonfirmasi pada tanggal tersebut. Anda dapat mengatur status ruangan menjadi "Tidak Tersedia" sementara jika sedang dalam perbaikan atau alasan lain.'
      }
    ]
  },
  {
    id: 'booking',
    title: 'Booking & Pembayaran',
    description: 'Pertanyaan seputar booking dan pembayaran dari customer',
    items: [
      {
        question: 'Bagaimana cara melihat booking yang masuk?',
        answer: 'Semua booking masuk akan muncul di dashboard Anda. Anda dapat melihat detail booking termasuk tanggal, waktu, durasi, jumlah peserta, dan informasi customer. Booking akan memiliki status "Pending", "Confirmed", "Completed", atau "Cancelled".'
      },
      {
        question: 'Bagaimana cara mengkonfirmasi booking?',
        answer: 'Booking dengan status "Pending" perlu dikonfirmasi oleh Anda. Klik pada booking tersebut dan pilih "Konfirmasi" untuk menerima booking. Customer akan menerima notifikasi konfirmasi dan pembayaran akan diproses.'
      },
      {
        question: 'Bagaimana sistem pembayaran bekerja?',
        answer: 'Pembayaran dilakukan melalui platform kami. Customer membayar saat booking dikonfirmasi. Pembayaran akan ditahan hingga booking selesai, kemudian akan ditransfer ke rekening Anda dikurangi biaya platform sesuai dengan ketentuan yang berlaku.'
      },
      {
        question: 'Kapan saya menerima pembayaran?',
        answer: 'Pembayaran akan ditransfer ke rekening Anda maksimal 3-5 hari kerja setelah booking selesai. Anda dapat melihat riwayat pembayaran di menu "Laporan" di dashboard.'
      },
      {
        question: 'Bagaimana jika customer membatalkan booking?',
        answer: 'Kebijakan pembatalan tergantung pada waktu pembatalan. Jika dibatalkan lebih dari 24 jam sebelum waktu booking, customer akan mendapat pengembalian 50%. Jika kurang dari 24 jam, tidak ada pengembalian. Anda dapat melihat detail kebijakan di dashboard.'
      }
    ]
  },
  {
    id: 'policies',
    title: 'Kebijakan & Aturan',
    description: 'Pertanyaan seputar kebijakan dan aturan platform',
    items: [
      {
        question: 'Apa saja kebijakan yang harus saya patuhi?',
        answer: 'Anda harus mematuhi kebijakan platform termasuk: memberikan informasi yang akurat, merespon booking dalam waktu 24 jam, membatalkan booking hanya dengan alasan yang valid, dan menjaga kualitas ruangan sesuai dengan yang ditampilkan.'
      },
      {
        question: 'Berapa biaya platform yang dikenakan?',
        answer: 'Biaya platform adalah 10% dari total pembayaran untuk setiap booking yang berhasil. Biaya ini otomatis dipotong dari pembayaran sebelum ditransfer ke rekening Anda.'
      },
      {
        question: 'Apa yang terjadi jika saya melanggar kebijakan?',
        answer: 'Pelanggaran kebijakan dapat mengakibatkan peringatan, penangguhan, atau penghapusan akun tergantung pada tingkat keparahan. Kami akan memberikan notifikasi sebelum mengambil tindakan tegas.'
      },
      {
        question: 'Apakah ada batasan jumlah ruangan yang bisa saya tambahkan?',
        answer: 'Tidak ada batasan jumlah ruangan yang bisa Anda tambahkan. Namun, kami menyarankan untuk fokus pada kualitas daripada kuantitas untuk memastikan pengalaman terbaik bagi customer.'
      }
    ]
  },
  {
    id: 'technical',
    title: 'Bantuan Teknis',
    description: 'Pertanyaan seputar masalah teknis dan bantuan',
    items: [
      {
        question: 'Apa yang harus dilakukan jika ada masalah teknis?',
        answer: 'Jika Anda mengalami masalah teknis, silakan hubungi tim support kami melalui email support@roomify.com atau gunakan fitur "Hubungi Kami" di dashboard. Kami akan merespons dalam waktu 24 jam.'
      },
      {
        question: 'Bagaimana cara melaporkan bug atau masalah di platform?',
        answer: 'Anda dapat melaporkan bug melalui menu "Bantuan" di dashboard. Jelaskan masalah yang Anda alami dengan detail termasuk screenshot jika memungkinkan. Tim teknis kami akan segera menindaklanjuti.'
      },
      {
        question: 'Apakah ada panduan penggunaan platform?',
        answer: 'Ya, tersedia panduan lengkap di menu "Bantuan" di dashboard. Panduan mencakup semua fitur platform dari pendaftaran hingga pengelolaan booking dan pembayaran.'
      },
      {
        question: 'Bagaimana jika saya lupa password?',
        answer: 'Klik "Lupa Password" di halaman login. Anda akan menerima email dengan instruksi untuk mereset password. Jika tidak menerima email dalam 10 menit, periksa folder spam atau hubungi support.'
      }
    ]
  }
]

export default function OwnerFaqPage() {
  const router = useRouter()

  return (
    <>
      <BackButton onClick={() => router.push('/owner/dashboard')} title="FAQ Owner" />
      <FaqPage categories={ownerFaqCategories} />
    </>
  )
}
