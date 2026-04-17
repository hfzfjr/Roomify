import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: rooms, error } = await supabase
      .from('room')
      .select('*')
      .limit(5)
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      message: 'Koneksi Supabase berhasil!',
      totalRooms: rooms.length,
      sampleRooms: rooms
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, message: String(error) },
      { status: 500 }
    )
  }
}