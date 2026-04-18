// =============================================
// ROOMIFY – Type Definitions
// =============================================

export type UserRole = 'customer' | 'owner' | 'admin'

export interface User {
  user_id: string
  name: string
  email: string
  role: UserRole
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
}

export interface Booking {
  booking_id: string
  start_time: string
  end_time: string
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  created_at: string
  rooms: {
    room_id: string
    name: string
    location: string
    images: string[]
  }
}
