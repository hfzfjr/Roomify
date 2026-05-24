import { NextResponse } from 'next/server'
import { getRoomDetail } from '@/lib/rooms'
import { createClient } from '@/lib/supabase/server'

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, price_per_hour, capacity, facilities, type, location, region_id, photos } = body

    const supabase = await createClient()

    // 1. Update room details in Supabase
    const { error: roomError } = await supabase
      .from('room')
      .update({
        name,
        description,
        price_per_hour: Number(price_per_hour),
        capacity: Number(capacity),
        type,
        location,
        region_id
      })
      .eq('room_id', id)

    if (roomError) {
      return NextResponse.json(
        { success: false, message: 'Gagal memperbarui room: ' + roomError.message },
        { status: 400 }
      )
    }

    // 2. Synchronize amenities: Delete old ones and insert new ones
    const { error: deleteError } = await supabase
      .from('room_amenity')
      .delete()
      .eq('room_id', id)

    if (deleteError) {
      console.warn('Warning amenities delete fail:', deleteError.message)
    }

    if (Array.isArray(facilities) && facilities.length > 0) {
      // Generate UUID for amenity_id and insert with amenity name
      const { error: insertError } = await supabase
        .from('room_amenity')
        .insert(
          facilities.map((fac: string) => ({
            amenity_id: crypto.randomUUID(),
            room_id: id,
            amenity: fac
          }))
        )

      if (insertError) {
        return NextResponse.json(
          { success: false, message: 'Gagal memperbarui fasilitas: ' + insertError.message },
          { status: 400 }
        )
      }
    }

    // 3. Synchronize photos (room_image table)
    if (Array.isArray(photos)) {
      // a) Delete room_image rows whose image_url is not in the remaining photos
      const { data: dbImages, error: fetchImagesError } = await supabase
        .from('room_image')
        .select('image_url')
        .eq('room_id', id)

      if (!fetchImagesError && dbImages) {
        const toDelete = dbImages
          .filter(img => !photos.includes(img.image_url))
          .map(img => img.image_url)

        if (toDelete.length > 0) {
          const { error: imageDeleteError } = await supabase
            .from('room_image')
            .delete()
            .eq('room_id', id)
            .in('image_url', toDelete)

          if (imageDeleteError) {
            console.warn('Warning room image delete fail:', imageDeleteError.message)
          }
        }
      }

      // b) Update sort_order and is_primary for remaining images
      for (let i = 0; i < photos.length; i++) {
        const url = photos[i]
        const { error: updateImgError } = await supabase
          .from('room_image')
          .update({
            sort_order: i,
            is_primary: i === 0
          })
          .eq('room_id', id)
          .eq('image_url', url)

        if (updateImgError) {
          console.warn(`Warning update image order failed for ${url}:`, updateImgError.message)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Ruangan berhasil diperbarui.'
    })
  } catch (error) {
    console.error('Room update API error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat memperbarui detail ruangan.' },
      { status: 500 }
    )
  }
}
