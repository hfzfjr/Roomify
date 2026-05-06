import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    // Try to get user from localStorage simulation (check for user_id in header)
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return null
    }
    
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    return data
  }

  // For now, we'll use a simple approach - in production this should validate the token properly
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', token)
    .single()
  
  return data
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size too large. Maximum size is 5MB' }, { status: 400 })
    }

    const supabase = await createClient()
    const bucketName = 'profile_image'
    
    // Generate file name and path using user_id folder and (user_id)_Profile naming
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.user_id}_Profile.${fileExt}`
    const filePath = `${user.user_id}/${fileName}`

    console.log('Uploading file to:', filePath)

    // Upload new file to Supabase Storage dengan upsert true (akan menimpa file lama)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: `Failed to upload image: ${uploadError.message}` }, { status: 400 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    // Update user profile with new image URL
    console.log('Updating profile with URL:', urlData.publicUrl)
    console.log('User ID:', user.user_id)
    
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ profile_image: urlData.publicUrl })
      .eq('user_id', user.user_id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ error: `Failed to update profile: ${updateError.message}` }, { status: 400 })
    }

    console.log('Profile updated successfully:', updateData)

    return NextResponse.json({ 
      message: 'Profile image updated successfully',
      profile_image: urlData.publicUrl,
      data: updateData
    })
  } catch (error) {
    console.error('Profile image upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
