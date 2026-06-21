import { NextResponse } from 'next/server'
import { getRoomDetail } from '@/lib/rooms'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check if room exists and is not already deleted
    const { data: room } = await supabase
      .from('room')
      .select('room_id, is_deleted')
      .eq('room_id', id)
      .single()

    if (!room) {
      return NextResponse.json(
        { success: false, message: 'Ruangan tidak ditemukan.' },
        { status: 404 }
      )
    }

    if (room.is_deleted) {
      return NextResponse.json(
        { success: false, message: 'Ruangan sudah dihapus.' },
        { status: 400 }
      )
    }

    // Soft delete: set is_deleted to true (no booking check needed for soft delete)
    const { error: roomError } = await supabase
      .from('room')
      .update({ is_deleted: true })
      .eq('room_id', id)

    if (roomError) {
      return NextResponse.json(
        { success: false, message: 'Gagal menghapus ruangan: ' + roomError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Ruangan berhasil dihapus.'
    })
  } catch (error) {
    console.error('Room delete API error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat menghapus ruangan.' },
      { status: 500 }
    )
  }
}

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
    const { name, description, price_per_hour, capacity, facilities, type, location, region_id, photos, status } = body

    const supabase = await createClient()

    // 1. Update room details in Supabase
    const updateData: Record<string, string | number> = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price_per_hour !== undefined) updateData.price_per_hour = Number(price_per_hour)
    if (capacity !== undefined) updateData.capacity = Number(capacity)
    if (type !== undefined) updateData.type = type
    if (location !== undefined) updateData.location = location
    if (region_id !== undefined) updateData.region_id = region_id
    if (status !== undefined) updateData.status = status

    if (Object.keys(updateData).length > 0) {
      const { error: roomError } = await supabase
        .from('room')
        .update(updateData)
        .eq('room_id', id)

      if (roomError) {
        return NextResponse.json(
          { success: false, message: 'Gagal memperbarui room: ' + roomError.message },
          { status: 400 }
        )
      }
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
      // Generate amenity_id in format a-[i] with minimum 3 digits
      // Get the starting number once
      const { data: amenities, error: amenityError } = await supabase
        .from('room_amenity')
        .select('amenity_id')
        .like('amenity_id', 'a-%')
        .order('amenity_id', { ascending: false })
        .limit(1)

      let nextNumber = 1
      if (!amenityError && amenities && amenities.length > 0) {
        const lastId = amenities[0].amenity_id
        const match = lastId.match(/a-(\d+)/)
        if (match) {
          let lastNumber = parseInt(match[1], 10)
          // Ensure we start from at least 100 to use 3-digit format
          if (lastNumber < 100) {
            lastNumber = 100
          }
          nextNumber = lastNumber + 1
        }
      }

      // Generate unique IDs with retry logic to avoid duplicates
      const amenityInserts: Array<{ amenity_id: string; room_id: string; amenity: string }> = []
      const maxRetries = 10

      for (const fac of facilities) {
        let amenityId = ''
        let inserted = false
        let retryCount = 0

        while (!inserted && retryCount < maxRetries) {
          amenityId = `a-${String(nextNumber).padStart(3, '0')}`

          // Check if this ID already exists
          const { data: existingAmenity } = await supabase
            .from('room_amenity')
            .select('amenity_id')
            .eq('amenity_id', amenityId)
            .maybeSingle()

          if (!existingAmenity) {
            amenityInserts.push({
              amenity_id: amenityId,
              room_id: id,
              amenity: fac
            })
            inserted = true
            nextNumber++
          } else {
            nextNumber++
            retryCount++
          }
        }

        if (!inserted) {
          // Fallback to timestamp-based ID if all retries fail
          amenityId = `a-${Date.now()}`
          amenityInserts.push({
            amenity_id: amenityId,
            room_id: id,
            amenity: fac
          })
        }
      }

      const { error: insertError } = await supabase
        .from('room_amenity')
        .insert(amenityInserts)

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
