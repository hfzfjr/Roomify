import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function formatDateForDatabase(): string {
  return new Date().toISOString()
}

async function generateImageIds(supabase: Awaited<ReturnType<typeof createClient>>, count: number): Promise<string[]> {
  // Get the highest existing image_id with format img-[number]
  const { data: existingImages, error } = await supabase
    .from('room_image')
    .select('image_id')
    .like('image_id', 'img-%')
    .order('image_id', { ascending: false })
    .limit(1)

  if (error) {
    throw new Error('Failed to generate image ID: ' + error.message)
  }

  let nextNumber = 11 // Start from img-11 as requested
  if (existingImages && existingImages.length > 0) {
    const lastId = existingImages[0].image_id
    const match = lastId.match(/img-(\d+)/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  // Generate sequential IDs for each image
  const ids: string[] = []
  for (let i = 0; i < count; i++) {
    ids.push(`img-${nextNumber + i}`)
  }
  return ids
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('photos') as File[]
    const roomId = formData.get('room_id') as string

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, message: 'No files uploaded' }, { status: 400 })
    }

    if (!roomId) {
      return NextResponse.json({ success: false, message: 'room_id is required' }, { status: 400 })
    }

    const userId = formData.get('user_id') as string
    if (!userId) {
      return NextResponse.json({ success: false, message: 'user_id is required' }, { status: 400 })
    }

    const roomName = formData.get('room_name') as string
    if (!roomName) {
      return NextResponse.json({ success: false, message: 'room_name is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify user is the owner of the room
    const { data: roomData, error: roomError } = await supabase
      .from('room')
      .select('room_id, owner_id')
      .eq('room_id', roomId)
      .maybeSingle()

    if (roomError || !roomData) {
      return NextResponse.json({ success: false, message: 'Room tidak ditemukan' }, { status: 404 })
    }

    const { data: ownerData, error: ownerError } = await supabase
      .from('owner')
      .select('owner_id')
      .eq('user_id', userId)
      .eq('owner_id', roomData.owner_id)
      .maybeSingle()

    if (ownerError || !ownerData) {
      return NextResponse.json({ success: false, message: 'Anda tidak memiliki akses ke room ini' }, { status: 403 })
    }

    const uploadedUrls: { url: string; path: string }[] = []
    const errors: string[] = []

    // Generate sequential image IDs
    const imageIds = await generateImageIds(supabase, files.length)
    const now = formatDateForDatabase()

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      // Validate file type
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: File bukan gambar`)
        continue
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name}: Ukuran file melebihi 5MB`)
        continue
      }

      const fileExt = file.name.split('.').pop()
      // Sanitize room name: lowercase, replace spaces with hyphens, remove special chars
      const sanitizedRoomName = roomName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .substring(0, 50) // Limit length
      const fileName = `${sanitizedRoomName}-${i + 1}.${fileExt}`
      const filePath = `${roomId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('rooms')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        errors.push(`${file.name}: ${uploadError.message}`)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('rooms')
        .getPublicUrl(filePath)

      uploadedUrls.push({ url: publicUrl, path: filePath })
    }

    // Insert to room_image table
    if (uploadedUrls.length > 0) {
      const imageRecords = uploadedUrls.map((item, index) => ({
        image_id: imageIds[index],
        room_id: roomId,
        image_url: item.url,
        sort_order: index,
        is_primary: index === 0, // First image is primary
        uploaded_at: now,
      }))

      const { error: imageError } = await supabase.from('room_image').insert(imageRecords)

      if (imageError) {
        console.error('Error inserting room images:', imageError)
        // Cleanup uploaded files if database insert fails
        for (const item of uploadedUrls) {
          await supabase.storage.from('rooms').remove([item.path])
        }
        return NextResponse.json(
          { success: false, message: `Gagal menyimpan data gambar: ${imageError.message}` },
          { status: 500 }
        )
      }
    }

    if (uploadedUrls.length === 0 && errors.length > 0) {
      return NextResponse.json(
        { success: false, message: errors.join(', ') },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls.map(item => item.url),
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mengupload file.' },
      { status: 500 }
    )
  }
}
