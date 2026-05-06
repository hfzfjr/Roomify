import { NextResponse } from 'next/server'
import { getRoomDetail } from '@/lib/rooms'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const room = await getRoomDetail(id)

    if (!room) {
      return NextResponse.json(
        { success: false, message: 'Ruangan tidak ditemukan.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: room })
  } catch (error) {
    console.error('Room detail API error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat memuat detail ruangan.' },
      { status: 500 }
    )
  }
}
