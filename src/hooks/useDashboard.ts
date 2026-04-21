import { useState, useEffect, useCallback } from 'react'

interface OwnerDashboardData {
  stats: {
    totalRevenue: number
    totalBookings: number
    availableRooms: number
    totalRooms: number
    revenueMonthChangePercent: number | null
    bookingsMonthChangePercent: number | null
  }
  rooms: Array<{
    room_id: string
    name: string
    capacity: number
    price_per_hour: number
    is_available: boolean
  }>
  facilityRequests: Array<{
    request_id: string
    booking_id: string
    customer_id: string
    customer_name?: string | null
    room_name?: string | null
    details?: string
    message?: string
    priority?: string
    status: string
    created_at: string
  }>
  chartData: {
    weekly: Array<{
      label: string
      value: number
      active: boolean
    }>
    monthly: Array<{
      label: string
      value: number
      active: boolean
    }>
  }
}

export function useOwnerDashboard(userId: string | null) {
  const [data, setData] = useState<OwnerDashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      return
    }

    const fetchDashboardData = async () => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined
      try {
        setLoading(true)
        const controller = new AbortController()
        timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        const response = await fetch(`/api/reports?type=owner&user_id=${encodeURIComponent(userId)}`, {
          signal: controller.signal
        })

        if (!response.ok) {
          const errorBody = await response.text()
          throw new Error(`Failed to fetch dashboard data (${response.status}): ${errorBody}`)
        }

        const result = await response.json()

        if (result.success) {
          setData(result.data)
          setError(null)
        } else {
          throw new Error(result.message || 'Failed to fetch dashboard data')
        }
      } catch (err) {
        const errorMsg = err instanceof Error && err.name === 'AbortError'
          ? 'Dashboard request timed out after 30 seconds'
          : err instanceof Error
            ? err.message
            : 'An error occurred'
        setError(errorMsg)
        console.error('Dashboard error:', errorMsg)
        // Set empty data so it's not stuck in loading
        setData({
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
        })
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [userId])

  return {
    data,
    loading,
    error,
    refetch: () => {
      if (userId) {
        const fetchDashboardData = async () => {
          try {
            setLoading(true)
            const response = await fetch(`/api/reports?type=owner&user_id=${encodeURIComponent(userId)}`)
            const result = await response.json()
            if (result.success) {
              setData(result.data)
              setError(null)
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
          } finally {
            setLoading(false)
          }
        }
        fetchDashboardData()
      }
    }
  }
}

interface AdminDashboardData {
  stats: {
    totalUsers: number
    totalOwners: number
    totalRooms: number
    usersMonthChangePercent: number | null
    ownersMonthChangePercent: number | null
    roomsMonthChangePercent: number | null
  }
  pendingVerifications: Array<{
    user_id: string
    name: string
    email: string
    created_at: string
  }>
  chartData: Array<{
    label: string
    value: number
    active: boolean
  }>
}

export function useAdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/reports?type=admin')

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const result = await response.json()

        if (result.success) {
          setData(result.data)
        } else {
          throw new Error(result.message)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return { data, loading, error }
}

export function useFacilityRequests(userId: string | null, options?: { autoFetch?: boolean }) {
  const [requests, setRequests] = useState<OwnerDashboardData['facilityRequests']>([])
  const [loading, setLoading] = useState(false)
  const autoFetch = options?.autoFetch ?? true

  const fetchRequests = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/facility-requests?user_id=${userId}`)
      const result = await response.json()

      if (result.success) {
        setRequests(result.data)
      }
    } catch (error) {
      console.error('Error fetching facility requests:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      const response = await fetch(`/api/facility-requests?request_id=${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        setRequests(prev => prev.filter(req => req.request_id !== requestId))
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating request status:', error)
      return false
    }
  }

  useEffect(() => {
    if (!userId || !autoFetch) {
      return
    }

    const timeoutId = setTimeout(() => {
      void fetchRequests()
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [autoFetch, fetchRequests, userId])

  return { requests, loading, refetch: fetchRequests, updateRequestStatus }
}
