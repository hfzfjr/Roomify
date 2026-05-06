import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

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

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone_number, current_password, new_password } = body

    const supabase = await createClient()
    
    // Prepare update data
    const updateData: any = {}
    
    if (name) updateData.name = name
    if (phone_number !== undefined) updateData.phone_number = phone_number

    // Handle password change
    if (current_password && new_password) {
      // Get current user data to verify current password
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('password')
        .eq('user_id', user.user_id)
        .single()

      if (fetchError || !currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(current_password, currentUser.password)
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 10)
      updateData.password = hashedPassword
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', user.user_id)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      data 
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
