// ============================================================
// TYPE DEFINITIONS - Roomify
// Semua tipe data yang digunakan di seluruh aplikasi
// ============================================================

// Role pengguna
export type UserRole = "customer" | "owner" | "admin";

// ============================================================
// AUTH TYPES
// Format data untuk request & response login
// Setara dengan LoginRequest.java & LoginResponse.java
// ============================================================

// Data yang dikirim dari frontend saat login
// Setara dengan: LoginRequest.java
export interface LoginRequest {
  email: string;
  password: string;
}

// Data yang dikembalikan ke frontend setelah login
// Setara dengan: LoginResponse.java
export interface LoginResponse {
  token: string | null;
  message: string;
  user?: {
    email: string;
    role: UserRole;
  };
}

// Data yang dikirim dari frontend saat registrasi
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

// ============================================================
// USER TYPES
// ============================================================
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

// ============================================================
// ROOM TYPES
// ============================================================
export type RoomStatus = "available" | "unavailable" | "pending_verification";

export interface Room {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  capacity: number;
  pricePerHour: number;
  location: string;
  facilities: string[];
  status: RoomStatus;
  imageUrl?: string;
  createdAt: string;
}

// ============================================================
// BOOKING TYPES
// ============================================================
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Booking {
  id: string;
  roomId: string;
  customerId: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
}

// ============================================================
// API RESPONSE WRAPPER
// Format standar semua response dari API
// ============================================================
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
}
