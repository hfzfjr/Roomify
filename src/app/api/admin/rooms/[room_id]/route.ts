import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ room_id: string }> }
) {
  try {
    const { room_id } = await params
    const body = await request.json()
    const { is_deleted } = body

    const supabase = await createClient()

    const { error } = await supabase
      .from('room')
      .update({ is_deleted })
      .eq('room_id', room_id)

    if (error) {
      console.error('Error updating room:', error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Room updated successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
