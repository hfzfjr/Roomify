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

type FacilityRequestRecord = {
  request_id: string
  booking_id: string
  customer_id: string
  details?: string | null
  priority?: string | null
  status: string
  created_at: string
}

type BookingRevenueRecord = {
  total_cost: number
  status: string
  booking_date: string
}

type ChartPoint = {
  label: string
  value: number
  active: boolean
}

type CheckInRecord = {
  check_in: string
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function formatShortMonth(date: Date) {
  return date.toLocaleDateString('id-ID', { month: 'short' })
}

function buildWeeklyCheckInChart(checkIns: CheckInRecord[], now: Date): ChartPoint[] {
  const dayStarts = Array.from({ length: 7 }, (_, index) => {
    const date = startOfDay(new Date(now))
    date.setDate(date.getDate() - (6 - index))
    return date
  })

  const dayMap = new Map(dayStarts.map((date) => [date.toISOString(), 0]))

  checkIns.forEach(({ check_in }) => {
    const dayStart = startOfDay(new Date(check_in)).toISOString()
    if (dayMap.has(dayStart)) {
      dayMap.set(dayStart, (dayMap.get(dayStart) || 0) + 1)
    }
  })

  const todayKey = startOfDay(now).toISOString()

  return dayStarts.map((date) => {
    const key = date.toISOString()
    return {
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      value: dayMap.get(key) || 0,
      active: key === todayKey,
    }
  })
}

function buildMonthlyCheckInChart(checkIns: CheckInRecord[], now: Date): ChartPoint[] {
  const monthStarts = Array.from({ length: 6 }, (_, index) => {
    return startOfMonth(new Date(now.getFullYear(), now.getMonth() - (5 - index), 1))
  })

  const monthMap = new Map(monthStarts.map((date) => [date.toISOString(), 0]))

  checkIns.forEach(({ check_in }) => {
    const checkInDate = new Date(check_in)
    const monthStart = startOfMonth(checkInDate).toISOString()
    if (monthMap.has(monthStart)) {
      monthMap.set(monthStart, (monthMap.get(monthStart) || 0) + 1)
    }
  })

  const currentMonthKey = startOfMonth(now).toISOString()

  return monthStarts.map((date) => {
    const key = date.toISOString()
    return {
      label: formatShortMonth(date),
      value: monthMap.get(key) || 0,
      active: key === currentMonthKey,
    }
  })
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
    const type = searchParams.get('type') // 'owner' or 'admin'
    const user_id = searchParams.get('user_id') // for owner dashboard

    const supabase = await createClient()

    if (type === 'owner') {
      // Owner Dashboard Data
      if (!user_id) {
        return NextResponse.json({ success: false, message: 'user_id required for owner dashboard' }, { status: 400 })
      }

      // Map logged-in user_id to actual owner_id
      const { data: ownerRecord, error: ownerLookupError } = await supabase
        .from('owner')
        .select('owner_id')
        .eq('user_id', user_id)
        .maybeSingle()

      if (ownerLookupError) {
        return NextResponse.json({ success: false, message: ownerLookupError.message }, { status: 500 })
      }

      if (!ownerRecord?.owner_id) {
        return NextResponse.json({
          success: true,
          data: {
            stats: {
              totalRevenue: 0,
              totalBookings: 0,
              availableRooms: 0,
              totalRooms: 0,
              revenueMonthChangePercent: null,
              bookingsMonthChangePercent: null
            },
            rooms: [],
            facilityRequests: [],
            chartData: {
              weekly: [],
              monthly: []
            }
          }
        })
      }

      const ownerId = ownerRecord.owner_id

      // Get owner's rooms
      const { data: ownerRooms, error: roomsError } = await supabase
        .from('room')
        .select('room_id, name, capacity, price_per_hour, is_available')
        .eq('owner_id', ownerId)

      if (roomsError) {
        return NextResponse.json({ success: false, message: roomsError.message }, { status: 500 })
      }

      // Calculate revenue from completed bookings
      const roomIds = ownerRooms?.map(room => room.room_id) || []
      let bookings: BookingRevenueRecord[] = []
      let bookingsError = null

      if (roomIds.length > 0) {
        const bookingsResult = await supabase
          .from('booking')
          .select('total_cost, status, booking_date')
          .in('room_id', roomIds)
          .eq('status', 'completed')

        bookings = bookingsResult.data || []
        bookingsError = bookingsResult.error
      }

      if (bookingsError) {
        console.warn('Bookings query failed:', bookingsError.message)
        bookings = []
      }

      // Calculate stats
      const totalRevenue = bookings?.reduce((sum, booking) => sum + booking.total_cost, 0) || 0
      const totalBookings = bookings?.length || 0
      const availableRooms = ownerRooms?.filter(room => room.is_available).length || 0
      const totalRooms = ownerRooms?.length || 0
      const unavailableRooms = totalRooms - availableRooms

      // Compare current month vs previous month for revenue and bookings
      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1)

      let currentMonthRevenue = 0
      let previousMonthRevenue = 0
      let currentMonthBookings = 0
      let previousMonthBookings = 0

      if (roomIds.length > 0) {
        const currentMonthResult = await supabase
          .from('booking')
          .select('total_cost')
          .in('room_id', roomIds)
          .gte('booking_date', currentMonthStart.toISOString())
          .lt('booking_date', nextMonthStart.toISOString())
          .eq('status', 'completed')

        if (!currentMonthResult.error) {
          currentMonthRevenue = currentMonthResult.data?.reduce((sum, booking: { total_cost: number }) => sum + booking.total_cost, 0) || 0
          currentMonthBookings = currentMonthResult.data?.length || 0
        } else {
          console.warn('Current month bookings query failed:', currentMonthResult.error.message)
        }

        const previousMonthResult = await supabase
          .from('booking')
          .select('total_cost')
          .in('room_id', roomIds)
          .gte('booking_date', previousMonthStart.toISOString())
          .lt('booking_date', previousMonthEnd.toISOString())
          .eq('status', 'completed')

        if (!previousMonthResult.error) {
          previousMonthRevenue = previousMonthResult.data?.reduce((sum, booking: { total_cost: number }) => sum + booking.total_cost, 0) || 0
          previousMonthBookings = previousMonthResult.data?.length || 0
        } else {
          console.warn('Previous month bookings query failed:', previousMonthResult.error.message)
        }
      }

      const calculatePercentChange = (current: number, previous: number) => {
        if (previous === 0) return null
        return ((current - previous) / previous) * 100
      }

      const revenueMonthChangePercent = calculatePercentChange(currentMonthRevenue, previousMonthRevenue)
      const bookingsMonthChangePercent = calculatePercentChange(currentMonthBookings, previousMonthBookings)

      // Get facility requests for owner rooms via booking records
      let facilityRequests: FacilityRequestRecord[] = []
      let requestsError = null
      if (roomIds.length > 0) {
        const bookingsResult = await supabase
          .from('booking')
          .select('booking_id')
          .in('room_id', roomIds)

        const bookingIds = bookingsResult.data?.map((booking: { booking_id: string }) => booking.booking_id) || []

        if (bookingIds.length > 0) {
          const requestsResult = await supabase
            .from('facility_request')
            .select('request_id, booking_id, customer_id, details, priority, status, created_at')
            .in('booking_id', bookingIds)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(10)

          const requests = requestsResult.data || []
          requestsError = requestsResult.error

          if (!requestsError) {
            const requestBookingIds = Array.from(new Set(requests.map((request: { booking_id: string }) => request.booking_id).filter(Boolean)))
            const requestCustomerIds = Array.from(new Set(requests.map((request: { customer_id: string }) => request.customer_id).filter(Boolean)))

            const { data: bookingData, error: bookingError } = await supabase
              .from('booking')
              .select('booking_id, room_id')
              .in('booking_id', requestBookingIds)

            if (bookingError) {
              requestsError = bookingError
            } else {
              const roomIdsForRequests = Array.from(new Set((bookingData || []).map((booking: { room_id: string }) => booking.room_id).filter(Boolean)))

              const { data: roomData, error: roomError } = await supabase
                .from('room')
                .select('room_id, name')
                .in('room_id', roomIdsForRequests)

              if (roomError) {
                requestsError = roomError
              } else {
                const customerMap = await getCustomerNameMapSafe(supabase, requestCustomerIds)
                const bookingMap = new Map((bookingData || []).map((booking: { booking_id: string; room_id: string }) => [booking.booking_id, booking.room_id]))
                const roomMap = new Map((roomData || []).map((room: { room_id: string; name: string }) => [room.room_id, room.name]))

                facilityRequests = requests.map((request: FacilityRequestRecord) => ({
                  ...request,
                  message: request.details,
                  customer_name: customerMap.get(request.customer_id) || null,
                  room_name: roomMap.get(bookingMap.get(request.booking_id)) || null,
                }))
              }
            }
          }
        }
      }

      if (requestsError) {
        console.warn('Error fetching facility requests:', requestsError.message)
      }

      // Get chart data (check-in trend for weekly and monthly view)
      const sevenDaysAgo = startOfDay(new Date())
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      const sixMonthsAgo = startOfMonth(new Date())
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)

      let chartData: CheckInRecord[] = []
      let chartError = null
      if (roomIds.length > 0) {
        const chartResult = await supabase
          .from('booking')
          .select('check_in')
          .in('room_id', roomIds)
          .gte('check_in', sixMonthsAgo.toISOString())
          .neq('status', 'cancelled')
          .not('check_in', 'is', null)

        chartData = chartResult.data || []
        chartError = chartResult.error
      }

      if (chartError) {
        console.warn('Error fetching chart data:', chartError.message)
        chartData = []
      }

      const nowForChart = new Date()
      const weeklyCheckIns = chartData.filter(({ check_in }) => new Date(check_in) >= sevenDaysAgo)
      const processedChartData = {
        weekly: buildWeeklyCheckInChart(weeklyCheckIns, nowForChart),
        monthly: buildMonthlyCheckInChart(chartData, nowForChart),
      }

      return NextResponse.json({
        success: true,
        data: {
          stats: {
            totalRevenue,
            totalBookings,
            availableRooms,
            totalRooms,
            revenueMonthChangePercent,
            bookingsMonthChangePercent
          },
          rooms: ownerRooms || [],
          facilityRequests: facilityRequests || [],
          chartData: processedChartData
        }
      })

    } else if (type === 'admin') {
      // Admin Dashboard Data

      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const previousMonthEnd = currentMonthStart

      // Get user counts by role
      const { data: userStats, error: userError } = await supabase
        .from('users')
        .select('role')

      if (userError) {
        return NextResponse.json({ success: false, message: userError.message }, { status: 500 })
      }

      const totalUsers = userStats?.length || 0
      const totalOwners = userStats?.filter(user => user.role === 'owner').length || 0

      // Get room count
      const { data: rooms, error: roomsError } = await supabase
        .from('room')
        .select('room_id')

      if (roomsError) {
        return NextResponse.json({ success: false, message: roomsError.message }, { status: 500 })
      }

      const totalRooms = rooms?.length || 0

      // Get current and previous month user registration counts
      const { data: currentUsers, error: currentUsersError } = await supabase
        .from('users')
        .select('user_id')
        .gte('created_at', currentMonthStart.toISOString())
        .lt('created_at', nextMonthStart.toISOString())

      const { data: previousUsers, error: previousUsersError } = await supabase
        .from('users')
        .select('user_id')
        .gte('created_at', previousMonthStart.toISOString())
        .lt('created_at', previousMonthEnd.toISOString())

      if (currentUsersError || previousUsersError) {
        console.warn('Error fetching user month counts:', (currentUsersError || previousUsersError)?.message)
      }

      const currentOwnersCountResult = await supabase
        .from('users')
        .select('user_id')
        .eq('role', 'owner')
        .gte('created_at', currentMonthStart.toISOString())
        .lt('created_at', nextMonthStart.toISOString())

      const previousOwnersCountResult = await supabase
        .from('users')
        .select('user_id')
        .eq('role', 'owner')
        .gte('created_at', previousMonthStart.toISOString())
        .lt('created_at', previousMonthEnd.toISOString())

      if (currentOwnersCountResult.error || previousOwnersCountResult.error) {
        console.warn('Error fetching owner month counts:', (currentOwnersCountResult.error || previousOwnersCountResult.error)?.message)
      }

      const currentRoomsCountResult = await supabase
        .from('room')
        .select('room_id')
        .gte('created_at', currentMonthStart.toISOString())
        .lt('created_at', nextMonthStart.toISOString())

      const previousRoomsCountResult = await supabase
        .from('room')
        .select('room_id')
        .gte('created_at', previousMonthStart.toISOString())
        .lt('created_at', previousMonthEnd.toISOString())

      if (currentRoomsCountResult.error || previousRoomsCountResult.error) {
        console.warn('Error fetching room month counts:', (currentRoomsCountResult.error || previousRoomsCountResult.error)?.message)
      }

      const currentUsersCount = currentUsers?.length || 0
      const previousUsersCount = previousUsers?.length || 0
      const currentOwnersCount = currentOwnersCountResult.data?.length || 0
      const previousOwnersCount = previousOwnersCountResult.data?.length || 0
      const currentRoomsCount = currentRoomsCountResult.data?.length || 0
      const previousRoomsCount = previousRoomsCountResult.data?.length || 0

      const calculatePercentChange = (current: number, previous: number) => {
        if (previous === 0) return null
        return ((current - previous) / previous) * 100
      }

      const usersMonthChangePercent = calculatePercentChange(currentUsersCount, previousUsersCount)
      const ownersMonthChangePercent = calculatePercentChange(currentOwnersCount, previousOwnersCount)
      const roomsMonthChangePercent = calculatePercentChange(currentRoomsCount, previousRoomsCount)

      // Get pending verifications (users with pending status)
      const { data: pendingVerifications, error: verificationsError } = await supabase
        .from('users')
        .select('user_id, name, email, created_at')
        .eq('status', 'pending')
        .eq('role', 'owner')
        .order('created_at', { ascending: false })
        .limit(10)

      if (verificationsError) {
        console.warn('Error fetching verifications:', verificationsError.message)
      }

      // Get chart data (user registrations per day for last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: chartData, error: chartError } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString())

      if (chartError) {
        console.warn('Error fetching chart data:', chartError.message)
      }

      // Process chart data
      const chartMap: { [key: string]: number } = {}
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

      // Initialize with 0
      days.forEach(day => chartMap[day] = 0)

      // Count registrations per day
      chartData?.forEach(user => {
        const date = new Date(user.created_at)
        const dayName = days[date.getDay()]
        chartMap[dayName]++
      })

      const processedChartData = days.map(day => ({
        label: day,
        value: chartMap[day],
        active: day === days[new Date().getDay()]
      }))

      return NextResponse.json({
        success: true,
        data: {
          stats: {
            totalUsers,
            totalOwners,
            totalRooms,
            usersMonthChangePercent,
            ownersMonthChangePercent,
            roomsMonthChangePercent
          },
          pendingVerifications: pendingVerifications || [],
          chartData: processedChartData
        }
      })
    }

    return NextResponse.json({ success: false, message: 'Invalid type parameter' }, { status: 400 })

  } catch (error) {
    console.error('Reports API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
