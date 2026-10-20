-- ==============================================================================
-- PRIME FITNESS MH19 GYM MANAGEMENT PLATFORM
-- CONSOLIDATED PRODUCTION DATABASE SCHEMA & RBAC SECURITY ARCHITECTURE
-- Target Environment: Supabase PostgreSQL
-- Idempotent & Non-Destructive: Safe for both fresh setups and existing projects
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS & CUSTOM ENUMS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('owner', 'staff', 'trainer');
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. USER PROFILES & ROLE-BASED ACCESS CONTROL (RBAC)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role public.app_role DEFAULT NULL, -- NULL by default: arbitrary signups hold NO administrative role
  is_active BOOLEAN NOT NULL DEFAULT false, -- Inactive by default: zero access until owner approves
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Backward compatibility column additions for existing installations
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.app_role DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security Definer Role Check: is_owner()
-- Executes with owner privileges and fixed search path to avoid infinite RLS recursion
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

-- Security Definer Role Check: has_role()
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

-- Anti-Tamper Trigger: strictly prevents self-promotion or unauthorized profile modification
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Strict guard: If the caller is not an active owner, forbid altering critical security fields
  IF NOT public.is_owner() THEN
    IF (new.role IS DISTINCT FROM old.role) THEN
      RAISE EXCEPTION 'Privilege escalation rejected: Users cannot modify administrative roles.';
    END IF;
    IF (new.is_active IS DISTINCT FROM old.is_active) THEN
      RAISE EXCEPTION 'Account activation rejected: Only active gym owners can activate or deactivate accounts.';
    END IF;
    IF (new.email IS DISTINCT FROM old.email) THEN
      RAISE EXCEPTION 'Email alteration rejected: Profile email must match auth.users account.';
    END IF;
    IF (new.id IS DISTINCT FROM old.id) THEN
      RAISE EXCEPTION 'Account ID cannot be altered.';
    END IF;
  END IF;

  -- Account ID is permanently immutable even for owners
  IF (new.id IS DISTINCT FROM old.id) THEN
    RAISE EXCEPTION 'Account ID is immutable and cannot be altered.';
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- Generic updated_at timestamp trigger function
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

-- Explicit Profiles RLS Policies (Separated by command to avoid recursive or OR-combination loopholes)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Owners and staff can view all profiles" ON public.profiles;
CREATE POLICY "Owners and staff can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_owner() OR public.has_role('staff'));

DROP POLICY IF EXISTS "Active users can update their own personal info" ON public.profiles;
CREATE POLICY "Active users can update their own personal info"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id AND is_active = true)
  WITH CHECK (auth.uid() = id AND is_active = true);

DROP POLICY IF EXISTS "Only owners can update any profile" ON public.profiles;
CREATE POLICY "Only owners can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Only owners can insert profiles" ON public.profiles;
CREATE POLICY "Only owners can insert profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Only owners can delete profiles" ON public.profiles;
CREATE POLICY "Only owners can delete profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.is_owner());

-- Profile auto-creation trigger on auth.users signups
-- Arbitrary signups receive role = NULL and is_active = false (ZERO administrative privileges)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    COALESCE(new.raw_user_meta_data->>'full_name', 'Prime Fitness Account'),
    new.raw_user_meta_data->>'phone',
    NULL, -- No role assigned to unverified signups
    false -- Inactive by default: owner must explicitly provision or approve
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- ADMINISTRATIVE OWNER & STAFF PROVISIONING PROCEDURES
-- ------------------------------------------------------------------------------

-- Controlled Owner Provisioning Procedure
-- Requires:
--  1. Target email MUST exactly match 'pranavsonawane1328@gmail.com'
--  2. Account MUST already exist in auth.users
--  3. Account email MUST be confirmed (email_confirmed_at / confirmed_at IS NOT NULL)
-- Restricted strictly to postgres and service_role (DBA execution in SQL Editor only)
CREATE OR REPLACE FUNCTION public.provision_owner(target_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_is_confirmed boolean;
BEGIN
  -- 1. Guard against unauthorized target emails
  IF lower(trim(target_email)) != 'pranavsonawane1328@gmail.com' THEN
    RAISE EXCEPTION 'Access denied: % is not the authorized owner email for Prime Fitness MH19.', target_email;
  END IF;

  -- 2. Locate user in auth.users and verify email confirmation
  SELECT id, (email_confirmed_at IS NOT NULL OR confirmed_at IS NOT NULL)
  INTO v_user_id, v_is_confirmed
  FROM auth.users
  WHERE lower(email) = lower(trim(target_email));

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Account % was not found in auth.users. Please create or invite the user via Supabase Dashboard -> Authentication -> Users first.', target_email;
  END IF;

  IF NOT coalesce(v_is_confirmed, false) THEN
    RAISE EXCEPTION 'Account % exists in auth.users but its email is unconfirmed. The owner must confirm their email before owner privileges can be granted.', target_email;
  END IF;

  -- 3. Upsert profile with owner role and active state
  INSERT INTO public.profiles (id, email, full_name, role, is_active, updated_at)
  VALUES (
    v_user_id,
    lower(trim(target_email)),
    'Prime Fitness Owner',
    'owner'::public.app_role,
    true,
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'owner'::public.app_role,
    is_active = true,
    updated_at = timezone('utc'::text, now());

  RAISE NOTICE 'Prime Fitness MH19 Owner successfully provisioned for % (UUID: %)', target_email, v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.provision_owner(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.provision_owner(text) TO postgres, service_role;

-- Secure procedure allowing active owner to approve and assign staff or trainer accounts
CREATE OR REPLACE FUNCTION public.approve_staff_or_trainer(target_user_id uuid, target_role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'Access denied: Only active gym owners can approve staff or trainer accounts.';
  END IF;

  IF target_role IS NULL OR target_role = 'owner' THEN
    RAISE EXCEPTION 'Invalid role assignment. Only staff or trainer roles can be assigned via this procedure.';
  END IF;

  UPDATE public.profiles
  SET role = target_role,
      is_active = true,
      updated_at = timezone('utc'::text, now())
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile with ID % not found.', target_user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_staff_or_trainer(uuid, public.app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.approve_staff_or_trainer(uuid, public.app_role) TO authenticated, service_role;

-- Secure procedure allowing active owner to deactivate accounts
CREATE OR REPLACE FUNCTION public.deactivate_user_account(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'Access denied: Only active gym owners can deactivate accounts.';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Operation rejected: Owner cannot deactivate their own administrative account.';
  END IF;

  UPDATE public.profiles
  SET is_active = false,
      updated_at = timezone('utc'::text, now())
  WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.deactivate_user_account(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.deactivate_user_account(uuid) TO authenticated, service_role;

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

ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS duration_type TEXT NOT NULL DEFAULT 'monthly';
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_packages_active ON public.packages(is_active);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active packages" ON public.packages;
CREATE POLICY "Anyone can view active packages"
  ON public.packages FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Staff and owners can manage packages" ON public.packages;
CREATE POLICY "Staff and owners can manage packages"
  ON public.packages FOR ALL TO authenticated
  USING (public.is_owner() OR public.has_role('staff'))
  WITH CHECK (public.is_owner() OR public.has_role('staff'));

DROP TRIGGER IF EXISTS trg_packages_updated_at ON public.packages;
CREATE TRIGGER trg_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ==============================================================================
-- TEMPLATE STARTER PACKAGES (UNCONFIRMED DEFAULTS - PENDING OWNER VERIFICATION)
-- ==============================================================================
-- IMPORTANT NOTICE FOR GYM OWNER:
-- The package names, durations, prices, and features below are initial template
-- defaults provided for layout and UI demonstration. They are NOT confirmed
-- business facts. The gym owner must review and customize them in /admin/packages.
--
-- IDEMPOTENT CONFLICT STRATEGY:
-- Uses WHERE NOT EXISTS so that running this migration repeatedly will NOT create
-- duplicate packages, and will NEVER overwrite customized prices or features.
-- ==============================================================================
INSERT INTO public.packages (name, duration_days, duration_type, price, description, features, is_active)
SELECT d.name, d.duration_days, d.duration_type, d.price, d.description, d.features, d.is_active
FROM (
  VALUES
    ('1 MONTH STANDARD', 30, 'monthly', 1500.00, 'Full gym access with machine and free weight coaching', ARRAY['Full 4000+ Sq.Ft. gym access', 'General floor supervision', 'Locker & changing room', 'Basic fitness assessment'], true),
    ('3 MONTHS INTENSIVE', 90, 'quarterly', 3500.00, 'Progressive overload quarterly cycle', ARRAY['Full 4000+ Sq.Ft. gym access', 'Dedicated workout routine card', 'Body composition tracking', 'HYROX conditioning turf access', 'Diet consultation guideline'], true),
    ('6 MONTHS ATHLETIC', 180, 'half_yearly', 6000.00, 'Comprehensive strength and body composition transformation', ARRAY['Full 4000+ Sq.Ft. gym access', 'Bi-weekly body measurement audits', 'Advanced progressive overload planning', 'Full conditioning & turf access', 'Priority personal trainer slot booking'], true),
    ('12 MONTHS PRIME PRO', 365, 'yearly', 10000.00, 'The ultimate annual discipline commitment with prime perks', ARRAY['Full 4000+ Sq.Ft. unlimited gym access', 'Complete physique & mobility blueprint', 'Quarterly goal assessment with head coach', 'Zero freeze fees (up to 30 days pause)', 'Complimentary Prime Fitness athlete shaker'], true)
) AS d(name, duration_days, duration_type, price, description, features, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM public.packages p WHERE p.name = d.name
);

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

ALTER TABLE public.members ADD COLUMN IF NOT EXISTS package_name TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS balance_due NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

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

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS member_name TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS reference_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES auth.users(id);

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

DROP POLICY IF EXISTS "Only owners can delete payments" ON public.payments;
CREATE POLICY "Only owners can delete payments"
  ON public.payments FOR DELETE TO authenticated
  USING (public.is_owner());

-- NOTE ON IMMUTABILITY: No UPDATE policy is created for public.payments.
-- Payment history records are immutable for audit integrity.

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

-- Backward compatibility for column name differences between early migrations
ALTER TABLE public.checkins ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'checkins' AND column_name = 'checkin_time'
  ) THEN
    UPDATE public.checkins SET checked_in_at = checkin_time WHERE checked_in_at IS NULL;
  END IF;
END $$;

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

ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS interested_package TEXT;
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries(status);

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Public website visitors can INSERT leads, but CANNOT read back any records
DROP POLICY IF EXISTS "Anyone can insert enquiries" ON public.enquiries;
CREATE POLICY "Anyone can insert enquiries"
  ON public.enquiries FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Staff and owners can manage enquiries" ON public.enquiries;
CREATE POLICY "Staff and owners can manage enquiries"
  ON public.enquiries FOR ALL TO authenticated
  USING (public.is_owner() OR public.has_role('staff'))
  WITH CHECK (public.is_owner() OR public.has_role('staff'));

DROP TRIGGER IF EXISTS trg_enquiries_updated_at ON public.enquiries;
CREATE TRIGGER trg_enquiries_updated_at
  BEFORE UPDATE ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

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

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS registration_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published events" ON public.events;
CREATE POLICY "Public can view published events"
  ON public.events FOR SELECT TO anon, authenticated
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

ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS participants_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published challenges" ON public.challenges;
CREATE POLICY "Public can view published challenges"
  ON public.challenges FOR SELECT TO anon, authenticated
  USING (is_published = true);

DROP POLICY IF EXISTS "Staff can manage challenges" ON public.challenges;
CREATE POLICY "Staff can manage challenges"
  ON public.challenges FOR ALL TO authenticated
  USING (public.is_owner() OR public.has_role('staff'))
  WITH CHECK (public.is_owner() OR public.has_role('staff'));

-- ------------------------------------------------------------------------------
-- 10. TRAINERS & COACHES (WITH PRIVACY SHIELD VIEW)
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

ALTER TABLE public.trainers ADD COLUMN IF NOT EXISTS active_members_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.trainers ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.trainers ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;

-- Underlying table: Strictly restricted to authenticated staff and owner
DROP POLICY IF EXISTS "Public can view active trainers" ON public.trainers;
DROP POLICY IF EXISTS "Staff and owners can view trainers" ON public.trainers;
CREATE POLICY "Staff and owners can view trainers"
  ON public.trainers FOR SELECT TO authenticated
  USING (public.is_owner() OR public.has_role('staff'));

DROP POLICY IF EXISTS "Staff and owners can manage trainers" ON public.trainers;
CREATE POLICY "Staff and owners can manage trainers"
  ON public.trainers FOR ALL TO authenticated
  USING (public.is_owner() OR public.has_role('staff'))
  WITH CHECK (public.is_owner() OR public.has_role('staff'));

-- Safe Public Projection View: Exposes non-sensitive trainer profile fields
-- Omits private phone, email, and active_members_count
CREATE OR REPLACE VIEW public.public_trainers
WITH (security_invoker = false)
AS
  SELECT id, name, role, specialty, bio
  FROM public.trainers
  WHERE is_active = true;

-- ------------------------------------------------------------------------------
-- 11. GYM INSTITUTION SETTINGS (WITH PRIVACY SHIELD VIEW)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gym_settings (
  id TEXT PRIMARY KEY DEFAULT 'prime_fitness_main',
  gym_name TEXT NOT NULL DEFAULT 'Prime Fitness MH19',
  brand_slogan TEXT DEFAULT 'BECOME THE BEST VERSION OF YOU THE PRIME VERSION',
  public_slug TEXT DEFAULT 'primefitnessmh19',
  city TEXT NOT NULL DEFAULT 'Jalgaon',
  phone TEXT NOT NULL DEFAULT '+91 94222 19019',
  email TEXT NOT NULL DEFAULT 'primefitnessjalgaon@gmail.com',
  address TEXT NOT NULL DEFAULT 'Saawariya godown Front of Makra tower , near Vikas dudh federation , Shivaji Nagar , Jalgaon, Jalgaon 425001',
  timings TEXT NOT NULL DEFAULT '5:00 AM – 10:00 AM | 4:30 PM – 10:00 PM',
  facility_size TEXT NOT NULL DEFAULT '4000+ SQ.FT.',
  disciplines TEXT NOT NULL DEFAULT 'Strength · Cardio · HYROX · Powerlifting',
  logo_url TEXT,
  banner_url TEXT,
  announcements TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS brand_slogan TEXT;
ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS public_slug TEXT;
ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS facility_size TEXT;
ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS disciplines TEXT;
ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS announcements TEXT;

ALTER TABLE public.gym_settings ENABLE ROW LEVEL SECURITY;

-- Underlying table: Strictly restricted to authenticated staff and owners
-- Direct table queries by public / anon are FORBIDDEN
DROP POLICY IF EXISTS "Public can view gym settings" ON public.gym_settings;
DROP POLICY IF EXISTS "Staff and owners can view gym settings" ON public.gym_settings;
CREATE POLICY "Staff and owners can view gym settings"
  ON public.gym_settings FOR SELECT TO authenticated
  USING (public.is_owner() OR public.has_role('staff'));

DROP POLICY IF EXISTS "Staff and owners can manage gym settings" ON public.gym_settings;
CREATE POLICY "Staff and owners can manage gym settings"
  ON public.gym_settings FOR ALL TO authenticated
  USING (public.is_owner() OR public.has_role('staff'))
  WITH CHECK (public.is_owner() OR public.has_role('staff'));

DROP TRIGGER IF EXISTS trg_gym_settings_updated_at ON public.gym_settings;
CREATE TRIGGER trg_gym_settings_updated_at
  BEFORE UPDATE ON public.gym_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Safe Public Projection View: Dedicated endpoint for public website visitors
CREATE OR REPLACE VIEW public.public_gym_settings
WITH (security_invoker = false)
AS
  SELECT id, gym_name, brand_slogan, public_slug, city, phone, email, address, timings, facility_size, disciplines, logo_url, banner_url, announcements
  FROM public.gym_settings;

-- Idempotent seed for gym settings: does not overwrite owner-modified configuration
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
  '+91 94222 19019',
  'primefitnessjalgaon@gmail.com',
  'Saawariya godown Front of Makra tower , near Vikas dudh federation , Shivaji Nagar , Jalgaon, Jalgaon 425001',
  '5:00 AM – 10:00 AM | 4:30 PM – 10:00 PM',
  '4000+ SQ.FT.',
  'Strength · Cardio · HYROX · Powerlifting',
  'Prime Fitness MH19 — Jalgaon''s Premier 4000+ Sq.Ft. Commercial Training Facility'
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 12. COMPREHENSIVE SQL PRIVILEGES & SECURITY HARDENING
-- ------------------------------------------------------------------------------

-- 1. Revoke public/anon privileges on private tables
REVOKE ALL ON public.profiles FROM public, anon;
REVOKE ALL ON public.members FROM public, anon;
REVOKE ALL ON public.payments FROM public, anon;
REVOKE ALL ON public.checkins FROM public, anon;
REVOKE ALL ON public.trainers FROM public, anon;
REVOKE ALL ON public.gym_settings FROM public, anon;
REVOKE ALL ON SEQUENCE public.member_code_seq FROM public, anon;

-- 2. Restrict enquiries table: anon can only INSERT leads, never read/update/delete
REVOKE ALL ON public.enquiries FROM public, anon;
GRANT INSERT ON public.enquiries TO anon;

-- 3. Grant authenticated & service_role access to application tables (RLS enforced)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packages TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO authenticated, service_role;
GRANT SELECT, INSERT, DELETE ON public.payments TO authenticated, service_role; -- No update on payments
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkins TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enquiries TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainers TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_settings TO authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.member_code_seq TO authenticated, service_role;

-- 4. Public reads on intentionally public resources
REVOKE ALL ON public.public_trainers FROM public;
GRANT SELECT ON public.public_trainers TO anon, authenticated;

REVOKE ALL ON public.public_gym_settings FROM public;
GRANT SELECT ON public.public_gym_settings TO anon, authenticated;

GRANT SELECT ON public.packages TO anon;
GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.challenges TO anon;

-- 5. Helper function execution permissions
REVOKE ALL ON FUNCTION public.is_owner() FROM public;
GRANT EXECUTE ON FUNCTION public.is_owner() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_role(text) FROM public;
GRANT EXECUTE ON FUNCTION public.has_role(text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.protect_profile_fields() FROM public, anon;
REVOKE ALL ON FUNCTION public.set_current_timestamp_updated_at() FROM public, anon;
REVOKE ALL ON FUNCTION public.set_member_code() FROM public, anon;
REVOKE ALL ON FUNCTION public.update_member_status() FROM public, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon;

-- ==============================================================================
-- SECURE OWNER PROVISIONING INSTRUCTIONS (ADMINISTRATOR-CONTROLLED):
-- ==============================================================================
-- STEP 1: Execute this migration in the Supabase Dashboard -> SQL Editor.
-- STEP 2: In Supabase Dashboard -> Authentication -> Users, invite or create the user:
--         Email: pranavsonawane1328@gmail.com
-- STEP 3: Ensure the user confirms their email (or click "Confirm User" in Supabase Auth UI).
-- STEP 4: In the SQL Editor, execute the administrative owner provisioning procedure:
--         SELECT public.provision_owner('pranavsonawane1328@gmail.com');
-- STEP 5: Verify that the account is active and owner-privileged:
--         SELECT id, email, role, is_active FROM public.profiles WHERE email = 'pranavsonawane1328@gmail.com';
-- ==============================================================================
