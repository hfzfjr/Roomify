import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type CustomerRecord = {
  customer_id: string
  user_id: string
}

type UserRecord = {
  user_id: string
  name: string | null
}

type BookingRoomRecord = {
  booking_id: string
  room_id: string
}

type RoomRecord = {
  room_id: string
  name: string
}

async function getCustomerNameMap(supabase: Awaited<ReturnType<typeof createClient>>, customerIds: string[]) {
  if (customerIds.length === 0) {
    return new Map<string, string>()
  }

  const { data: customerRecords, error: customerLookupError } = await supabase
    .from('customer')
    .select('customer_id, user_id')
    .in('customer_id', customerIds)

  if (customerLookupError) {
    throw customerLookupError
  }

  const customerToUserId = new Map(
    (customerRecords || [])
      .filter((customer: CustomerRecord) => customer.customer_id && customer.user_id)
      .map((customer: CustomerRecord) => [customer.customer_id, customer.user_id])
  )

  const unresolvedCustomerIds = customerIds.filter((customerId) => !customerToUserId.has(customerId))
  const userIds = Array.from(
    new Set([
      ...Array.from(customerToUserId.values()),
      ...unresolvedCustomerIds,
    ].filter(Boolean))
  )

  if (userIds.length === 0) {
    return new Map<string, string>()
  }

  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('user_id, name')
    .in('user_id', userIds)

  if (usersError) {
    throw usersError
  }

  const userNameMap = new Map((usersData || []).map((user: UserRecord) => [user.user_id, user.name]))

  return new Map(
    customerIds.map((customerId) => [
      customerId,
      userNameMap.get(customerToUserId.get(customerId) || customerId) || null,
    ])
  )
}

async function getCustomerNameMapSafe(supabase: Awaited<ReturnType<typeof createClient>>, customerIds: string[]) {
  try {
    return await getCustomerNameMap(supabase, customerIds)
  } catch (error) {
    console.warn('Customer name lookup failed:', error)
    return new Map<string, string>()
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id') // owner id
    const request_id = searchParams.get('request_id')

    const supabase = await createClient()

    if (request_id) {
      // Get specific request
      const { data: requestData, error: requestError } = await supabase
        .from('facility_request')
        .select('request_id, booking_id, customer_id, details, priority, status, created_at')
        .eq('request_id', request_id)
        .single()

      if (requestError) {
        return NextResponse.json({ success: false, message: requestError.message }, { status: 500 })
      }

      if (!requestData) {
        return NextResponse.json({ success: true, data: null })
      }

      const { data: bookingData } = await supabase
        .from('booking')
        .select('booking_id, room_id')
        .eq('booking_id', requestData.booking_id)
        .single()

      const customerMap = await getCustomerNameMapSafe(supabase, [requestData.customer_id].filter(Boolean))

      const { data: roomData } = await supabase
        .from('room')
        .select('room_id, name')
        .eq('room_id', bookingData?.room_id)
        .single()

      return NextResponse.json({
        success: true,
        data: {
          ...requestData,
          message: requestData.details,
          customer_name: customerMap.get(requestData.customer_id) || null,
          room_name: roomData?.name,
        }
      })
    }

    if (!user_id) {
      return NextResponse.json({ success: false, message: 'user_id required' }, { status: 400 })
    }

    const { data: ownerRecord, error: ownerLookupError } = await supabase
      .from('owner')
      .select('owner_id')
      .eq('user_id', user_id)
      .maybeSingle()

    if (ownerLookupError) {
      return NextResponse.json({ success: false, message: ownerLookupError.message }, { status: 500 })
    }

    if (!ownerRecord?.owner_id) {
      return NextResponse.json({ success: true, data: [] })
    }

    const ownerId = ownerRecord.owner_id

    // Get owner's rooms first
    const { data: ownerRooms, error: roomsError } = await supabase
      .from('room')
      .select('room_id')
      .eq('owner_id', ownerId)

    if (roomsError) {
      return NextResponse.json({ success: false, message: roomsError.message }, { status: 500 })
    }

    const roomIds = ownerRooms?.map(room => room.room_id) || []

    // Get facility requests for owner's rooms via booking records
    let bookingIds: string[] = []
    if (roomIds.length > 0) {
      const bookingsResult = await supabase
        .from('booking')
        .select('booking_id')
        .in('room_id', roomIds)

      bookingIds = bookingsResult.data?.map((booking: { booking_id: string }) => booking.booking_id) || []
    }

    if (bookingIds.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    const { data, error } = await supabase
      .from('facility_request')
      .select('request_id, booking_id, customer_id, details, priority, status, created_at')
      .in('booking_id', bookingIds)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    const requests = data || []
    const bookingIdsForLookup = Array.from(new Set(requests.map((request: { booking_id: string }) => request.booking_id).filter(Boolean)))
    const customerIds = Array.from(new Set(requests.map((request: { customer_id: string }) => request.customer_id).filter(Boolean)))

    const { data: bookingData, error: bookingError } = await supabase
      .from('booking')
      .select('booking_id, room_id')
      .in('booking_id', bookingIdsForLookup)

    if (bookingError) {
      return NextResponse.json({ success: false, message: bookingError.message }, { status: 500 })
    }

    const customerMap = await getCustomerNameMapSafe(supabase, customerIds)

    const { data: roomData, error: roomError } = await supabase
      .from('room')
      .select('room_id, name')
      .in('room_id', roomIds)

    if (roomError) {
      return NextResponse.json({ success: false, message: roomError.message }, { status: 500 })
    }

    const bookingMap = new Map((bookingData || []).map((booking: BookingRoomRecord) => [booking.booking_id, booking.room_id]))
    const roomMap = new Map((roomData || []).map((room: RoomRecord) => [room.room_id, room.name]))

    const mappedData = requests.map((request: { request_id: string; booking_id: string; customer_id: string; details?: string | null }) => ({
      ...request,
      message: request.details,
      customer_name: customerMap.get(request.customer_id) || null,
      room_name: roomMap.get(bookingMap.get(request.booking_id)) || null,
    }))

    return NextResponse.json({ success: true, data: mappedData })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { room_id, user_id, message } = body

    if (!room_id || !user_id || !message) {
      return NextResponse.json({ success: false, message: 'room_id, user_id, and message are required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('facility_request')
      .insert({
        room_id,
        user_id,
        message,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const request_id = searchParams.get('request_id')

    if (!request_id) {
      return NextResponse.json({ success: false, message: 'request_id required' }, { status: 400 })
    }

    const body = await request.json()
    const { status } = body

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Valid status required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('facility_request')
      .update({ status })
      .eq('request_id', request_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
