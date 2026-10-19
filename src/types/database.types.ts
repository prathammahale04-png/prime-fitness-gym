export type AppRole = 'owner' | 'staff' | 'trainer';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: AppRole;
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
  | 'automation'
  | 'import'
  | 'settings';
