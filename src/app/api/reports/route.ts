import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
            chartData: []
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
      let bookings: Array<{ total_price: number; status: string; created_at: string }> = []
      let bookingsError = null

      if (roomIds.length > 0) {
        const bookingsResult = await supabase
          .from('booking')
          .select('total_price, status, created_at')
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
      const totalRevenue = bookings?.reduce((sum, booking) => sum + booking.total_price, 0) || 0
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
          .select('total_price')
          .in('room_id', roomIds)
          .gte('created_at', currentMonthStart.toISOString())
          .lt('created_at', nextMonthStart.toISOString())
          .eq('status', 'completed')

        if (!currentMonthResult.error) {
          currentMonthRevenue = currentMonthResult.data?.reduce((sum, booking) => sum + booking.total_price, 0) || 0
          currentMonthBookings = currentMonthResult.data?.length || 0
        } else {
          console.warn('Current month bookings query failed:', currentMonthResult.error.message)
        }

        const previousMonthResult = await supabase
          .from('booking')
          .select('total_price')
          .in('room_id', roomIds)
          .gte('created_at', previousMonthStart.toISOString())
          .lt('created_at', previousMonthEnd.toISOString())
          .eq('status', 'completed')

        if (!previousMonthResult.error) {
          previousMonthRevenue = previousMonthResult.data?.reduce((sum, booking) => sum + booking.total_price, 0) || 0
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
      let facilityRequests: Array<any> = []
      let requestsError = null
      if (roomIds.length > 0) {
        const bookingsResult = await supabase
          .from('booking')
          .select('booking_id')
          .in('room_id', roomIds)

        const bookingIds = bookingsResult.data?.map((booking: any) => booking.booking_id) || []

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
            const requestBookingIds = Array.from(new Set(requests.map((request: any) => request.booking_id).filter(Boolean)))
            const requestCustomerIds = Array.from(new Set(requests.map((request: any) => request.customer_id).filter(Boolean)))

            const { data: bookingData, error: bookingError } = await supabase
              .from('booking')
              .select('booking_id, room_id')
              .in('booking_id', requestBookingIds)

            if (bookingError) {
              requestsError = bookingError
            } else {
              const roomIdsForRequests = Array.from(new Set((bookingData || []).map((booking: any) => booking.room_id).filter(Boolean)))

              const { data: customerData, error: customerError } = await supabase
                .from('users')
                .select('user_id, name')
                .in('user_id', requestCustomerIds)

              const { data: roomData, error: roomError } = await supabase
                .from('room')
                .select('room_id, name')
                .in('room_id', roomIdsForRequests)

              if (customerError) {
                requestsError = customerError
              } else if (roomError) {
                requestsError = roomError
              } else {
                const bookingMap = new Map((bookingData || []).map((booking: any) => [booking.booking_id, booking.room_id]))
                const customerMap = new Map((customerData || []).map((customer: any) => [customer.user_id, customer.name]))
                const roomMap = new Map((roomData || []).map((room: any) => [room.room_id, room.name]))

                facilityRequests = requests.map((request: any) => ({
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

      // Get chart data (bookings per day for last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      let chartData: Array<{ created_at: string }> = []
      let chartError = null
      if (roomIds.length > 0) {
        const chartResult = await supabase
          .from('booking')
          .select('created_at')
          .in('room_id', roomIds)
          .gte('created_at', sevenDaysAgo.toISOString())
          .eq('status', 'completed')

        chartData = chartResult.data || []
        chartError = chartResult.error
      }

      if (chartError) {
        console.warn('Error fetching chart data:', chartError.message)
        chartData = []
      }

      // Process chart data
      const chartMap: { [key: string]: number } = {}
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

      // Initialize with 0
      days.forEach(day => chartMap[day] = 0)

      // Count bookings per day
      chartData?.forEach(booking => {
        const date = new Date(booking.created_at)
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