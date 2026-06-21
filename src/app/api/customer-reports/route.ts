import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface ReportSubmission {
  customer_id: string
  room_id: string
  category: string
  description: string
  report_images?: string[]
}

// Helper function to generate report_id with format rpt-XXX
async function generateReportId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  // Get all report_ids and find the highest numeric value
  const { data: reports, error } = await supabase
    .from('report')
    .select('report_id')

  if (error) {
    console.error('Error fetching reports:', error)
    throw new Error('Failed to fetch reports for ID generation')
  }

  let nextNumber = 1
  if (reports && reports.length > 0) {
    const numbers = reports
      .map(r => parseInt(r.report_id.replace('rpt-', ''), 10))
      .filter(n => !isNaN(n))

    if (numbers.length > 0) {
      nextNumber = Math.max(...numbers) + 1
    }
  }

  // Format as 3-digit number with leading zeros
  const formattedNumber = nextNumber.toString().padStart(3, '0')
  return `rpt-${formattedNumber}`
}

// Helper function to upload image to Supabase storage
async function uploadImageToStorage(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  reportId: string,
  imageData: string,
  index: number
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase client is not available')
  }

  const base64Data = imageData.split(',')[1]
  const buffer = Buffer.from(base64Data, 'base64')
  const fileExt = imageData.split(';')[0].split('/')[1] || 'jpg'
  const fileName = `${Date.now()}_${index}.${fileExt}`
  const filePath = `report/report_image/${reportId}/${fileName}`

  const { data, error } = await supabase.storage
    .from('report')
    .upload(filePath, buffer, {
      contentType: `image/${fileExt}`,
      upsert: true
    })

  if (error) {
    console.error('Storage upload error:', error)
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  return `https://lvcuenqrzkeclrvvkdfx.supabase.co/storage/v1/object/public/report/${filePath}`
}

// GET endpoint to fetch reports by customer_id
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customer_id = searchParams.get('customer_id')

    if (!customer_id) {
      return NextResponse.json({ success: false, message: 'customer_id is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: reports, error } = await supabase
      .from('report')
      .select('*')
      .eq('customer_id', customer_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: reports
    })
  } catch (error) {
    console.error('Reports API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const customer_id = formData.get('customer_id') as string
    const room_id = formData.get('room_id') as string
    const booking_id = formData.get('booking_id') as string
    const category = formData.get('category') as string
    const description = formData.get('description') as string
    const images = formData.getAll('images') as File[]

    // Validate required fields
    if (!customer_id || !room_id || !category || !description) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Verify customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customer')
      .select('customer_id')
      .eq('customer_id', customer_id)
      .maybeSingle()

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      )
    }

    // Validate that the room exists
    const { data: room, error: roomError } = await supabase
      .from('room')
      .select('room_id, owner_id')
      .eq('room_id', room_id)
      .maybeSingle()

    if (roomError || !room) {
      return NextResponse.json(
        { success: false, message: 'Room not found' },
        { status: 404 }
      )
    }

    // Validate booking exists and is paid (confirmed or completed)
    if (booking_id) {
      const { data: booking, error: bookingError } = await supabase
        .from('booking')
        .select('booking_id, status')
        .eq('booking_id', booking_id)
        .eq('customer_id', customer_id)
        .maybeSingle()

      if (bookingError || !booking) {
        return NextResponse.json(
          { success: false, message: 'Booking not found' },
          { status: 404 }
        )
      }

      // Check if booking is paid (confirmed or completed)
      if (booking.status !== 'confirmed' && booking.status !== 'completed') {
        return NextResponse.json(
          { success: false, message: 'Laporan hanya dapat dibuat untuk booking yang telah lunas' },
          { status: 400 }
        )
      }

      // Check if report already exists for this booking
      const { data: existingReport, error: reportCheckError } = await supabase
        .from('report')
        .select('report_id')
        .eq('booking_id', booking_id)
        .maybeSingle()

      if (reportCheckError) {
        console.error('Error checking existing report:', reportCheckError)
        return NextResponse.json(
          { success: false, message: 'Error checking existing report' },
          { status: 500 }
        )
      }

      if (existingReport) {
        return NextResponse.json(
          { success: false, message: 'Anda sudah pernah membuat laporan untuk booking ini' },
          { status: 400 }
        )
      }
    }

    // Generate report ID
    const reportId = await generateReportId(supabase)

    // Upload images to storage if provided
    let imageUrls: string[] = []
    if (images && images.length > 0) {
      // Validate max 7 photos
      if (images.length > 7) {
        return NextResponse.json({ success: false, message: 'Maksimal 7 foto yang diizinkan' }, { status: 400 })
      }

      for (let i = 0; i < images.length; i++) {
        const file = images[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${i}.${fileExt}`
        const filePath = `report_image/${reportId}/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('report')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          return NextResponse.json({ success: false, message: 'Gagal mengupload foto' }, { status: 500 })
        }

        imageUrls.push(`https://lvcuenqrzkeclrvvkdfx.supabase.co/storage/v1/object/public/report/${filePath}`)
      }
    }

    // Insert report into database
    const { data: report, error: reportError } = await supabase
      .from('report')
      .insert({
        report_id: reportId,
        customer_id: customer.customer_id,
        room_id: room_id,
        booking_id: booking_id || null,
        category,
        description,
        report_image: imageUrls.length > 0 ? imageUrls : null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (reportError) {
      console.error('Report insertion error:', reportError)
      return NextResponse.json(
        { success: false, message: reportError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Laporan berhasil dikirim',
      data: report
    })

  } catch (error) {
    console.error('Report submission error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
