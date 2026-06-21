import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const formData = await request.formData()
    const description = formData.get('description') as string
    const images = formData.getAll('images') as File[]

    // Validate input
    if (!images || images.length === 0) {
      return NextResponse.json({ success: false, message: 'Foto perbaikan wajib diisi' }, { status: 400 })
    }

    if (!description || description.trim().length === 0) {
      return NextResponse.json({ success: false, message: 'Deskripsi perbaikan wajib diisi' }, { status: 400 })
    }

    // Get current report status
    const { data: report, error: fetchError } = await supabase
      .from('report')
      .select('status')
      .eq('report_id', id)
      .single()

    if (fetchError || !report) {
      return NextResponse.json({ success: false, message: 'Laporan tidak ditemukan' }, { status: 404 })
    }

    // Validate status transition
    if (report.status !== 'pending' && report.status !== 'in_progress') {
      return NextResponse.json({ success: false, message: 'Status laporan tidak valid untuk diresolve' }, { status: 400 })
    }

    // Upload images to Supabase Storage
    const uploadedUrls: string[] = []
    for (let i = 0; i < images.length; i++) {
      const file = images[i]
      const fileExt = file.name.split('.').pop()?.toLowerCase()

      // Validate file format
      if (!fileExt || !['jpg', 'jpeg', 'png'].includes(fileExt)) {
        return NextResponse.json({ success: false, message: `Format file ${file.name} tidak didukung. Gunakan JPG atau PNG.` }, { status: 400 })
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, message: `File ${file.name} melebihi 5MB` }, { status: 400 })
      }

      const fileName = `${Date.now()}_${i}.${fileExt}`
      const filePath = `resolution_image/${id}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('report')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json({ success: false, message: `Gagal mengupload foto ${file.name}: ${uploadError.message}` }, { status: 500 })
      }

      uploadedUrls.push(`https://lvcuenqrzkeclrvvkdfx.supabase.co/storage/v1/object/public/report/${filePath}`)
    }

    // Update report status and resolution
    const { error: updateError } = await supabase
      .from('report')
      .update({
        status: 'resolved',
        resolution_image: uploadedUrls,
        resolution_description: description,
        resolution_submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('report_id', id)

    if (updateError) {
      console.error('Resolve report error:', updateError)
      return NextResponse.json({ success: false, message: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Perbaikan berhasil diajukan' })
  } catch (error) {
    console.error('Resolve report API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
