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
  // Get the highest report_id to generate the next one
  const { data: lastReport } = await supabase
    .from('report')
    .select('report_id')
    .order('report_id', { ascending: false })
    .limit(1)
    .maybeSingle()

  let nextNumber = 1
  if (lastReport) {
    const lastNumber = parseInt(lastReport.report_id.replace('rpt-', ''), 10)
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1
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
  const fileName = `image_${index + 1}.jpg`
  const filePath = `${reportId}/${fileName}`

  const { data, error } = await supabase.storage
    .from('report_image')
    .upload(filePath, buffer, {
      contentType: 'image/jpeg',
      upsert: true
    })

  if (error) {
    console.error('Storage upload error:', error)
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  const { data: publicUrlData } = supabase.storage
    .from('report_image')
    .getPublicUrl(filePath)

  return publicUrlData.publicUrl
}

export async function POST(request: Request) {
  try {
    const body: ReportSubmission = await request.json()
    const { customer_id, room_id, category, description, report_images } = body

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

    // Generate report ID
    const reportId = await generateReportId(supabase)

    // Upload images to storage if provided
    let imageUrls: string[] = []
    if (report_images && report_images.length > 0) {
      for (let i = 0; i < report_images.length; i++) {
        try {
          const imageUrl = await uploadImageToStorage(adminSupabase, reportId, report_images[i], i)
          imageUrls.push(imageUrl)
        } catch (uploadError) {
          console.error(`Failed to upload image ${i + 1}:`, uploadError)
          // Continue with other images if one fails
        }
      }
    }

    // Insert report into database
    const { data: report, error: reportError } = await supabase
      .from('report')
      .insert({
        report_id: reportId,
        customer_id: customer.customer_id,
        room_id: room_id,
        category,
        description,
        report_image: imageUrls.length > 0 ? imageUrls[0] : null, // Store first image as main image
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
