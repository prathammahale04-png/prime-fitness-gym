export type AppRole = 'owner' | 'staff' | 'trainer';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: AppRole | null;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
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
  | 'settings'
  | 'reminders';

export type PackageDurationType = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'custom';

export interface MembershipPackage {
  id: string;
  name: string;
  duration_days: number;
  duration_type: PackageDurationType;
  price: number;
  description: string | null;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export type MemberStatus = 'active' | 'expired' | 'pending' | 'inactive';

export interface Member {
  id: string;
  member_code: string;
  full_name: string;
  phone: string;
  email: string | null;
  gender: 'male' | 'female' | 'other' | null;
  date_of_birth: string | null;
  address: string | null;
  emergency_contact: string | null;
  package_id: string | null;
  package_name: string | null;
  joined_date: string;
  start_date: string;
  expiry_date: string;
  status: MemberStatus;
  amount_paid: number;
  balance_due: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberInput {
  full_name: string;
  phone: string;
  email?: string;
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string;
  address?: string;
  emergency_contact?: string;
  package_id: string;
  start_date: string;
  amount_paid: number;
  balance_due?: number;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank_transfer';

export interface PaymentRecord {
  id: string;
  receipt_number: string;
  member_id: string | null;
  member_name: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_id: string | null;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

export interface CheckInRecord {
  id: string;
  member_id: string;
  member_code: string;
  member_name: string;
  checked_in_at: string;
  status: 'valid' | 'expired_override' | 'guest';
  notes: string | null;
}

export type EnquiryStatus = 'new' | 'contacted' | 'converted' | 'closed';

export interface EnquiryRecord {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  source: string;
  interested_package: string | null;
  status: EnquiryStatus;
  notes: string | null;
  follow_up_date: string | null;
  created_at: string;
}

export interface GymEventRecord {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string;
  location: string;
  registration_count: number;
  max_capacity: number | null;
  is_published: boolean;
  created_at: string;
}

export interface FitnessChallengeRecord {
  id: string;
  title: string;
  category: string;
  start_date: string;
  end_date: string;
  description: string | null;
  participants_count: number;
  is_published: boolean;
  created_at: string;
}

export interface TrainerRecord {
  id: string;
  name: string;
  role: string;
  specialty: string;
  phone: string;
  email: string;
  active_members_count: number;
  is_active: boolean;
  bio?: string;
  image_url?: string;
  created_at?: string;
}
