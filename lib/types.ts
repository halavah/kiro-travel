export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: "user" | "guide" | "admin"
  created_at: string
  updated_at: string
}

export interface SpotCategory {
  id: string
  name: string
  description: string | null
  icon: string | null
  created_at: string
}

export interface Spot {
  id: string
  name: string
  description: string | null
  location: string | null
  address: string | null
  category_id: string | null
  images: string[] | null
  price: number
  rating: number
  is_recommended: boolean
  view_count: number
  created_at: string
  updated_at: string
  category?: SpotCategory
  likes_count?: number
  comments_count?: number
  is_liked?: boolean
  is_favorited?: boolean
}

export interface SpotComment {
  id: string
  spot_id: string
  user_id: string
  content: string
  rating: number | null
  created_at: string
  user?: Profile
}

export interface Ticket {
  id: string
  spot_id: string
  name: string
  description: string | null
  price: number
  stock: number
  valid_from: string | null
  valid_to: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  spot?: Spot
}

export interface CartItem {
  id: string
  user_id: string
  ticket_id: string
  quantity: number
  created_at: string
  ticket?: Ticket & { spot?: Spot }
}

export interface Order {
  id: string
  user_id: string
  order_no: string
  total_amount: number
  status: "pending" | "paid" | "cancelled" | "completed"
  paid_at: string | null
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  ticket_id: string
  ticket_name: string
  spot_name: string
  price: number
  quantity: number
  created_at: string
}

export interface Hotel {
  id: string
  name: string
  description: string | null
  address: string | null
  location: string | null
  images: string[] | null
  star_rating: number | null
  price_min: number | null
  price_max: number | null
  amenities: string[] | null
  contact_phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  rooms?: HotelRoom[]
}

export interface HotelRoom {
  id: string
  hotel_id: string
  name: string
  description: string | null
  price: number
  capacity: number
  images: string[] | null
  amenities: string[] | null
  stock: number
  is_active: boolean
  created_at: string
}

export interface HotelBooking {
  id: string
  user_id: string
  room_id: string
  hotel_name: string
  room_name: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: "pending" | "confirmed" | "cancelled" | "completed"
  created_at: string
}

export interface Activity {
  id: string
  title: string
  description: string | null
  location: string | null
  images: string[] | null
  activity_type: string | null
  start_time: string
  end_time: string
  price: number | null
  max_participants: number | null
  status: "active" | "cancelled"
  participant_count?: number
  available_slots?: number | null
  is_full?: boolean
  created_at: string
  updated_at: string
}

export interface News {
  id: string
  title: string
  content: string
  summary: string | null
  cover_image: string | null
  author_id: string | null
  view_count: number
  is_published: boolean
  published_at: string
  created_at: string
  updated_at: string
}
