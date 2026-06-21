import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ owner_id: string }> }
) {
  try {
    const { owner_id } = await params
    const body = await request.json()
    const { is_deleted, status } = body

    const supabase = await createClient()

    // Get owner's user_id before updating
    const { data: ownerData, error: ownerFetchError } = await supabase
      .from('owner')
      .select('user_id, status')
      .eq('owner_id', owner_id)
      .maybeSingle()

    if (ownerFetchError) {
      console.error('Error fetching owner:', ownerFetchError)
      return NextResponse.json({ success: false, message: ownerFetchError.message }, { status: 500 })
    }

    if (!ownerData) {
      return NextResponse.json({ success: false, message: 'Owner not found' }, { status: 404 })
    }

    // Handle status change (approve/reject)
    if (status) {
      const { error: statusError } = await supabase
        .from('owner')
        .update({ status, approved_at: status === 'active' ? new Date().toISOString() : null })
        .eq('owner_id', owner_id)

      if (statusError) {
        console.error('Error updating owner status:', statusError)
        return NextResponse.json({ success: false, message: statusError.message }, { status: 500 })
      }

      // Update user role based on status
      if (status === 'active' && ownerData.user_id) {
        const { error: userRoleError } = await supabase
          .from('users')
          .update({ role: 'owner' })
          .eq('user_id', ownerData.user_id)

        if (userRoleError) {
          console.warn('Warning: Failed to update user role to owner:', userRoleError.message)
        }
      } else if (status === 'suspended' && ownerData.user_id) {
        const { error: userRoleError } = await supabase
          .from('users')
          .update({ role: 'customer' })
          .eq('user_id', ownerData.user_id)

        if (userRoleError) {
          console.warn('Warning: Failed to update user role to customer:', userRoleError.message)
        }
      }

      return NextResponse.json({ success: true, message: 'Owner status updated successfully' })
    }

    // Handle soft delete
    if (is_deleted !== undefined) {
      const { error } = await supabase
        .from('owner')
        .update({ is_deleted })
        .eq('owner_id', owner_id)

      if (error) {
        console.error('Error updating owner:', error)
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
      }

      // Cascade soft delete to all rooms owned by this owner
      if (is_deleted === true) {
        const { error: roomsError } = await supabase
          .from('room')
          .update({ is_deleted: true })
          .eq('owner_id', owner_id)

        if (roomsError) {
          console.warn('Warning: Failed to cascade soft delete to rooms:', roomsError.message)
        }

        // Change user role from OWNER to CUSTOMER
        if (ownerData?.user_id) {
          const { error: userRoleError } = await supabase
            .from('users')
            .update({ role: 'customer' })
            .eq('user_id', ownerData.user_id)

          if (userRoleError) {
            console.warn('Warning: Failed to update user role:', userRoleError.message)
          }
        }
      }

      return NextResponse.json({ success: true, message: 'Owner updated successfully' })
    }

    return NextResponse.json({ success: false, message: 'No valid update parameters provided' }, { status: 400 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
