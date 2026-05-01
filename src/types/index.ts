// =============================================
// ROOMIFY – Type Definitions
// =============================================

export type UserRole = 'customer' | 'owner' | 'admin'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type FacilityRequestStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  user_id: string
  name: string
  email: string
  role: UserRole
  phone_number?: string | null
}

export interface Room {
  room_id: string
  name: string
  capacity: number
  price_per_hour: number
  location: string
  is_available: boolean
  description?: string
  type?: string
  facilities: string[]
  images?: string[]
  image_url?: string | null
}

export interface UpcomingBooking {
  booking_id: string
  check_in: string
  check_out: string
  status: BookingStatus
}

export interface RoomDetail extends Room {
  status?: string | null
  created_at?: string | null
  region_name?: string | null
  province_name?: string | null
  upcoming_booking_count?: number
  upcoming_bookings?: UpcomingBooking[]
  next_booking?: UpcomingBooking | null
  rating?: number
  review_count?: number
}

export interface Booking {
  booking_id: string
  booking_date: string
  check_in: string
  check_out: string
  total_cost: number
  status: BookingStatus
  notes?: string | null
  payment_due_at?: string | null
  room: {
    room_id: string
    name: string
    location: string
    capacity: number
    region_name?: string | null
    province_name?: string | null
    images: string[]
    image_url?: string | null
  }
}

export interface FacilityRequest {
  request_id: string
  booking_id: string
  customer_id: string
  details: string
  priority: string
  status: FacilityRequestStatus
  created_at: string
  room_name?: string | null
  customer_name?: string | null
}

export interface Review {
  review_id: string
  booking_id: string
  room_id: string
  customer_id: string
  rating: number
  comment?: string | null
  created_at: string
  customer_name?: string | null
}

export interface RoomRating {
  average_rating: number
  review_count: number
}
