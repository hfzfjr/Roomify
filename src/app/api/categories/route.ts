import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Predefined categories from database schema constraint with formatted labels
    const categories = [
      { value: 'kerusakan_fasilitas', label: 'Kerusakan Fasilitas' },
      { value: 'tidak_sesuai_deskripsi', label: 'Tidak Sesuai Deskripsi' },
      { value: 'keamanan', label: 'Keamanan' },
      { value: 'ac_ventilasi', label: 'AC Ventilasi' },
      { value: 'fasilitas', label: 'Fasilitas' },
      { value: 'kebisingan', label: 'Kebisingan' },
      { value: 'lainnya', label: 'Lainnya' },
      { value: 'internet', label: 'Internet' },
      { value: 'kebersihan', label: 'Kebersihan' },
      { value: 'pelayanan', label: 'Pelayanan' }
    ]

    return NextResponse.json({
      success: true,
      data: {
        categories
      }
    })
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
