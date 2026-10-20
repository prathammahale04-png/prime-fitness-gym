-- ==============================================================================
-- PRIME FITNESS MH19 GYM MANAGEMENT PLATFORM
-- CONSOLIDATED PRODUCTION DATABASE SCHEMA & RBAC POLICIES
-- Target: Supabase PostgreSQL
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS & TYPES
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('owner', 'staff', 'trainer');
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. USER PROFILES & RBAC FUNCTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role public.app_role NOT NULL DEFAULT 'staff',
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'owner'
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role::text = required_role
      AND is_active = true
  );
$$;

-- Profiles RLS Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Owners and staff can view all profiles" ON public.profiles;
CREATE POLICY "Owners and staff can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_owner() OR public.has_role('staff'));

DROP POLICY IF EXISTS "Users can update their own personal info" ON public.profiles;
CREATE POLICY "Users can update their own personal info"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      public.is_owner() OR (
        role = (SELECT role FROM public.profiles WHERE id = auth.uid())
        AND is_active = (SELECT is_active FROM public.profiles WHERE id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Only owners can update roles and active status" ON public.profiles;
CREATE POLICY "Only owners can update roles and active status"
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- Profile updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Profile auto-creation trigger (Hardened Owner Provisioning)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_designated_owner BOOLEAN;
  is_email_verified BOOLEAN;
BEGIN
  -- Strict owner authorization check:
  -- 1. Email must match authorized owner address exactly (case-insensitive)
  -- 2. Must be an email-confirmed account in auth.users or invited by an administrator
  is_designated_owner := (lower(new.email) = 'pranavsonawane1328@gmail.com');
  is_email_verified := (
    new.email_confirmed_at IS NOT NULL 
    OR new.confirmed_at IS NOT NULL 
    OR (new.raw_app_meta_data->>'provider') = 'email'
  );

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    is_active
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Prime Fitness Staff'),
    new.raw_user_meta_data->>'phone',
    -- Only the designated owner receives 'owner'; all other sign-ups default to 'staff'
    CASE 
      WHEN is_designated_owner AND is_email_verified THEN 'owner'::public.app_role 
      ELSE 'staff'::public.app_role 
    END,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role = CASE 
      WHEN lower(excluded.email) = 'pranavsonawane1328@gmail.com' AND (new.email_confirmed_at IS NOT NULL OR new.confirmed_at IS NOT NULL)
      THEN 'owner'::public.app_role
      ELSE profiles.role
    END,
    updated_at = timezone('utc'::text, now());

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 3. MEMBERSHIP PACKAGES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  duration_type TEXT NOT NULL DEFAULT 'monthly' CHECK (duration_type IN ('monthly', 'quarterly', 'half_yearly', 'yearly', 'custom')),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  description TEXT,
  features TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_packages_active ON public.packages(is_active);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active packages" ON public.packages;
CREATE POLICY "Anyone can view active packages"
  ON public.packages FOR SELECT TO public, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Staff and owners can manage packages" ON public.packages;
CREATE POLICY "Staff and owners can manage packages"
  ON public.packages FOR ALL TO authenticated
  USING (public.is_owner() OR public.has_role('staff'))
  WITH CHECK (public.is_owner() OR public.has_role('staff'));

-- Seed verified Prime Fitness MH19 packages
INSERT INTO public.packages (name, duration_days, duration_type, price, description, features, is_active)
VALUES
  ('1 MONTH STANDARD', 30, 'monthly', 1500, 'Full gym access with machine and free weight coaching', ARRAY['Full 4000+ Sq.Ft. gym access', 'General floor supervision', 'Locker & changing room', 'Basic fitness assessment'], true),
  ('3 MONTHS INTENSIVE', 90, 'quarterly', 3500, 'Our most popular progressive overload quarterly cycle', ARRAY['Full 4000+ Sq.Ft. gym access', 'Dedicated workout routine card', 'Body composition tracking', 'HYROX conditioning turf access', 'Diet consultation guideline'], true),
  ('6 MONTHS ATHLETIC', 180, 'half_yearly', 6000, 'Comprehensive strength and body composition transformation', ARRAY['Full 4000+ Sq.Ft. gym access', 'Bi-weekly body measurement audits', 'Advanced progressive overload planning', 'Full conditioning & turf access', 'Priority personal trainer slot booking'], true),
  ('12 MONTHS PRIME PRO', 365, 'yearly', 10000, 'The ultimate annual discipline commitment with prime perks', ARRAY['Full 4000+ Sq.Ft. unlimited gym access', 'Complete physique & mobility blueprint', 'Quarterly goal assessment with head coach', 'Zero freeze fees (up to 30 days pause)', 'Complimentary Prime Fitness athlete shaker'], true)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. GYM MEMBERS
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS member_code_seq START WITH 1001;

CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth DATE,
  address TEXT,
  emergency_contact TEXT,
  package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  package_name TEXT,
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending', 'inactive')),
  amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_members_phone ON public.members(phone);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);
CREATE INDEX IF NOT EXISTS idx_members_expiry ON public.members(expiry_date);
CREATE INDEX IF NOT EXISTS idx_members_code ON public.members(member_code);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff and owners can view members" ON public.members;
CREATE POLICY "Staff and owners can view members"
  ON public.members FOR SELECT TO authenticated
  USING (public.is_owner() OR public.has_role('staff'));

DROP POLICY IF EXISTS "Staff and owners can insert members" ON public.members;
CREATE POLICY "Staff and owners can insert members"
  ON public.members FOR INSERT TO authenticated
  WITH CHECK (public.is_owner() OR public.has_role('staff'));

DROP POLICY IF EXISTS "Staff and owners can update members" ON public.members;
CREATE POLICY "Staff and owners can update members"
  ON public.members FOR UPDATE TO authenticated
  USING (public.is_owner() OR public.has_role('staff'))
  WITH CHECK (public.is_owner() OR public.has_role('staff'));

DROP POLICY IF EXISTS "Only owners can delete members" ON public.members;
CREATE POLICY "Only owners can delete members"
  ON public.members FOR DELETE TO authenticated
  USING (public.is_owner());

-- Automatic Member Code Generator
CREATE OR REPLACE FUNCTION public.set_member_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF new.member_code IS NULL OR new.member_code = '' THEN
    new.member_code := 'PF-' || nextval('member_code_seq')::TEXT;
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_member_code ON public.members;
CREATE TRIGGER trg_set_member_code
  BEFORE INSERT ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.set_member_code();

-- Automatic Expiry Status Synchronizer
CREATE OR REPLACE FUNCTION public.update_member_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF new.status != 'inactive' THEN
    IF new.expiry_date < CURRENT_DATE THEN
      new.status := 'expired';
    ELSE
      new.status := 'active';
    END IF;
  END IF;
  new.updated_at := timezone('utc'::text, now());
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_member_status ON public.members;
CREATE TRIGGER trg_update_member_status
  BEFORE INSERT OR UPDATE OF expiry_date, status ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.update_member_status();

-- ------------------------------------------------------------------------------
-- 5. BILLING & PAYMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT UNIQUE NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  member_name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'card', 'bank_transfer')),
  reference_id TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_member ON public.payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON public.payments(receipt_number);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff and owners can view payments" ON public.payments;
CREATE POLICY "Staff and owners can view payments"
  ON public.payments FOR SELECT TO authenticated
  USING (public.is_owner() OR public.has_role('staff'));

DROP POLICY IF EXISTS "Staff and owners can insert payments" ON public.payments;
CREATE POLICY "Staff and owners can insert payments"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (public.is_owner() OR public.has_role('staff'));

-- ------------------------------------------------------------------------------
-- 6. ATTENDANCE & CHECK-INS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  member_code TEXT NOT NULL,
  member_name TEXT NOT NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'expired_override', 'guest')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_checkins_member ON public.checkins(member_id);
CREATE INDEX IF NOT EXISTS idx_checkins_timestamp ON public.checkins(checked_in_at);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff and owners can manage checkins" ON public.checkins;
CREATE POLICY "Staff and owners can manage checkins"
  ON public.checkins FOR ALL TO authenticated
  USING (public.is_owner() OR public.has_role('staff'))
  WITH CHECK (public.is_owner() OR public.has_role('staff'));

-- ------------------------------------------------------------------------------
-- 7. ENQUIRIES & LEADS PIPELINE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  source TEXT DEFAULT 'website',
  interested_package TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries(status);

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert enquiries" ON public.enquiries;
CREATE POLICY "Anyone can insert enquiries"
  ON public.enquiries FOR INSERT TO public, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Staff and owners can manage enquiries" ON public.enquiries;
CREATE POLICY "Staff and owners can manage enquiries"
  ON public.enquiries FOR ALL TO authenticated
  USING (public.is_owner() OR public.has_role('staff'))
  WITH CHECK (public.is_owner() OR public.has_role('staff'));

-- ------------------------------------------------------------------------------
-- 8. GYM EVENTS & WORKSHOPS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Prime Fitness Arena, Shivaji Nagar',
  registration_count INTEGER NOT NULL DEFAULT 0,
  max_capacity INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published events" ON public.events;
CREATE POLICY "Public can view published events"
  ON public.events FOR SELECT TO public, authenticated
  USING (is_published = true);

DROP POLICY IF EXISTS "Staff can manage events" ON public.events;
CREATE POLICY "Staff can manage events"
  ON public.events FOR ALL TO authenticated
  USING (public.is_owner() OR public.has_role('staff'))
  WITH CHECK (public.is_owner() OR public.has_role('staff'));

-- ------------------------------------------------------------------------------
-- 9. FITNESS CHALLENGES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Transformation',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  participants_count INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published challenges" ON public.challenges;
CREATE POLICY "Public can view published challenges"
  ON public.challenges FOR SELECT TO public, authenticated
  USING (is_published = true);

DROP POLICY IF EXISTS "Staff can manage challenges" ON public.challenges;
CREATE POLICY "Staff can manage challenges"
  ON public.challenges FOR ALL TO authenticated
  USING (public.is_owner() OR public.has_role('staff'))
  WITH CHECK (public.is_owner() OR public.has_role('staff'));

-- ------------------------------------------------------------------------------
-- 10. TRAINERS & COACHES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  specialty TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  active_members_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active trainers" ON public.trainers;
CREATE POLICY "Public can view active trainers"
  ON public.trainers FOR SELECT TO public, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Staff and owners can manage trainers" ON public.trainers;
CREATE POLICY "Staff and owners can manage trainers"
  ON public.trainers FOR ALL TO authenticated
  USING (public.is_owner() OR public.has_role('staff'))
  WITH CHECK (public.is_owner() OR public.has_role('staff'));

-- ------------------------------------------------------------------------------
-- 11. GYM INSTITUTION SETTINGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gym_settings (
  id TEXT PRIMARY KEY DEFAULT 'prime_fitness_main',
  gym_name TEXT NOT NULL DEFAULT 'Prime Fitness MH19',
  brand_slogan TEXT DEFAULT 'BECOME THE BEST VERSION OF YOU THE PRIME VERSION',
  public_slug TEXT DEFAULT 'primefitnessmh19',
  city TEXT NOT NULL DEFAULT 'Jalgaon',
  phone TEXT NOT NULL DEFAULT '+91 94222 78910',
  email TEXT NOT NULL DEFAULT 'pranavsonawane1328@gmail.com',
  address TEXT NOT NULL DEFAULT 'Prime Fitness, Near Shivaji Nagar Overbridge, Jalgaon, Maharashtra 425001',
  timings TEXT NOT NULL DEFAULT '5:00 AM – 10:00 AM | 4:30 PM – 10:00 PM',
  facility_size TEXT NOT NULL DEFAULT '4000+ SQ.FT.',
  disciplines TEXT NOT NULL DEFAULT 'Strength · Cardio · HYROX · Powerlifting',
  logo_url TEXT,
  banner_url TEXT,
  announcements TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.gym_settings ENABLE ROW LEVEL SECURITY;

-- Public website visitors can read public gym information
DROP POLICY IF EXISTS "Public can view gym settings" ON public.gym_settings;
CREATE POLICY "Public can view gym settings"
  ON public.gym_settings FOR SELECT TO public, authenticated
  USING (true);

-- Only authenticated staff and owners can update gym settings
DROP POLICY IF EXISTS "Staff and owners can manage gym settings" ON public.gym_settings;
CREATE POLICY "Staff and owners can manage gym settings"
  ON public.gym_settings FOR ALL TO authenticated
  USING (public.is_owner() OR public.has_role('staff'))
  WITH CHECK (public.is_owner() OR public.has_role('staff'));

DROP TRIGGER IF EXISTS trg_gym_settings_updated_at ON public.gym_settings;
CREATE TRIGGER trg_gym_settings_updated_at
  BEFORE UPDATE ON public.gym_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Seed initial gym settings for Prime Fitness MH19
INSERT INTO public.gym_settings (
  id,
  gym_name,
  brand_slogan,
  public_slug,
  city,
  phone,
  email,
  address,
  timings,
  facility_size,
  disciplines,
  announcements
)
VALUES (
  'prime_fitness_main',
  'Prime Fitness MH19',
  'BECOME THE BEST VERSION OF YOU THE PRIME VERSION',
  'primefitnessmh19',
  'Jalgaon',
  '+91 94222 78910',
  'pranavsonawane1328@gmail.com',
  'Prime Fitness, Near Shivaji Nagar Overbridge, Jalgaon, Maharashtra 425001',
  '5:00 AM – 10:00 AM | 4:30 PM – 10:00 PM',
  '4000+ SQ.FT.',
  'Strength · Cardio · HYROX · Powerlifting',
  'Prime Fitness MH19 — Jalgaon''s Premier 4000+ Sq.Ft. Commercial Training Facility'
)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- OWNER SECURE PROVISIONING INSTRUCTIONS:
-- 1. Run this entire script in Supabase Dashboard -> SQL Editor.
-- 2. Create or verify the owner user account in Supabase Dashboard -> Authentication:
--    Email: pranavsonawane1328@gmail.com
-- 3. If the user already existed in auth.users prior to this migration, run:
--    UPDATE public.profiles 
--    SET role = 'owner', is_active = true 
--    WHERE email = 'pranavsonawane1328@gmail.com';
-- ==============================================================================

