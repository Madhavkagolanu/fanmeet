export interface SocialMediaLinks {
  insta?: string;
  fb?: string;
  x?: string;
  linkedin?: string;
  youtube?: string;
}

export interface Profile {
  id: string; // UUID
  name: string;
  email: string;
  phone_number?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface Creator {
  id: string; // UUID
  user_id: string; // UUID references Profile
  handle: string; // e.g. "alex"
  display_name: string;
  bio?: string;
  avatar_url?: string;
  is_active: boolean;
  social_links: SocialMediaLinks;
  created_at: string;
  updated_at?: string;
}

export interface EventItem {
  id: string; // UUID
  creator_id: string; // UUID references Creator
  user_id: string; // UUID references Profile
  title: string;
  description: string;
  location: string; // Venue Address
  location_address?: string; // Additional Address details
  location_url?: string; // Google Maps URL / Meeting URL
  image_url: string;
  from_time: string; // ISO timestamp
  to_time: string; // ISO timestamp
  is_active: boolean;
  mrp: number;
  offer_price: number;
  capacity: number;
  booked_count?: number; // Calculated dynamically
  created_at: string;
  updated_at?: string;
  creator?: Creator;
}

export interface Booking {
  id: string; // UUID
  event_id: string; // UUID
  user_id?: string;
  payment_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  ticket_count: number;
  amount_paid: number;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string;
  attendee_address?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'refunded';
  qr_ticket_code: string;
  created_at: string;
  event?: EventItem;
}

export interface CreateEventInput {
  title: string;
  description: string;
  location: string;
  location_address?: string;
  location_url?: string;
  image_url?: string;
  from_time: string;
  to_time: string;
  mrp: number;
  offer_price: number;
  capacity: number;
}
