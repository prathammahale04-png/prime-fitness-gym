export type MemberStatus = 'active' | 'expiring_soon' | 'expired' | 'inactive';

export type PaymentMethod = 'UPI' | 'Cash' | 'Card' | 'Net Banking';

export interface Package {
  id: string;
  name: string;
  duration_type: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'custom';
  duration_days: number;
  price: number;
  description: string;
  benefits: string[];
  disciplines: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Member {
  id: string;
  member_code: string;
  full_name: string;
  phone: string;
  email?: string;
  gender?: 'Male' | 'Female' | 'Other';
  emergency_contact?: string;
  address?: string;
  notes?: string;
  status: MemberStatus;
  package_id?: string;
  package_name?: string;
  membership_start_date: string; // YYYY-MM-DD
  membership_end_date: string;   // YYYY-MM-DD
  days_remaining?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  member_id: string;
  member_name?: string;
  member_phone?: string;
  package_id?: string;
  package_name?: string;
  amount: number;
  payment_date: string; // YYYY-MM-DD
  payment_method: PaymentMethod;
  reference_no?: string;
  notes?: string;
  recorded_by: string;
  created_at?: string;
}

export interface CheckIn {
  id: string;
  member_id: string;
  member_name?: string;
  member_phone?: string;
  checkin_time: string; // ISO string
  checkin_type: 'manual' | 'qr' | 'biometric';
  status: 'valid' | 'expired_membership' | 'warning';
  notes?: string;
}

export interface Trainer {
  id: string;
  name: string;
  role: string;
  specialty: string;
  phone?: string;
  email?: string;
  bio: string;
  image_url: string;
  is_active: boolean;
  display_order?: number;
}

export interface Enquiry {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  plan_interest?: string;
  source: string;
  status: 'new' | 'contacted' | 'converted' | 'closed';
  notes?: string;
  follow_up_date?: string;
  created_at?: string;
}

export interface GymEvent {
  id: string;
  title: string;
  event_date: string; // YYYY-MM-DD
  event_time?: string;
  location: string;
  description: string;
  max_participants: number;
  registered_count: number;
  is_published: boolean;
  created_at?: string;
}

export interface Challenge {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  description: string;
  rules?: string;
  participants_count: number;
  is_active: boolean;
  created_at?: string;
}

export interface GymSettings {
  id: string;
  gym_name: string;
  city: string;
  phone: string;
  email: string;
  address: string;
  timings: string;
  facility_size: string;
  disciplines: string;
  announcements?: string;
  updated_at?: string;
}

export type AdminSection =
  | 'overview'
  | 'members'
  | 'packages'
  | 'billing'
  | 'checkin'
  | 'analytics'
  | 'events'
  | 'trainers'
  | 'enquiries'
  | 'challenges'
  | 'settings';
