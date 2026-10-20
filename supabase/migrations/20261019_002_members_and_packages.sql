-- ==============================================================================
-- PRIME FITNESS MH19 GYM MANAGEMENT PLATFORM
-- MIGRATION: 002 - PACKAGES & MEMBER MANAGEMENT
-- Created: October 2026
-- ==============================================================================

-- 1. Create Packages Table
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

-- Enable RLS for Packages
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active packages" ON public.packages;
CREATE POLICY "Anyone can view active packages"
  ON public.packages
  FOR SELECT
  TO public, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Staff and owners can manage packages" ON public.packages;
CREATE POLICY "Staff and owners can manage packages"
  ON public.packages
  FOR ALL
  TO authenticated
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

-- 2. Create Members Table
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

-- Enable RLS for Members
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff and owners can view members" ON public.members;
CREATE POLICY "Staff and owners can view members"
  ON public.members
  FOR SELECT
  TO authenticated
  USING (public.is_owner() OR public.has_role('staff'));

DROP POLICY IF EXISTS "Staff and owners can insert members" ON public.members;
CREATE POLICY "Staff and owners can insert members"
  ON public.members
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner() OR public.has_role('staff'));

DROP POLICY IF EXISTS "Staff and owners can update members" ON public.members;
CREATE POLICY "Staff and owners can update members"
  ON public.members
  FOR UPDATE
  TO authenticated
  USING (public.is_owner() OR public.has_role('staff'))
  WITH CHECK (public.is_owner() OR public.has_role('staff'));

-- Only owners can delete members
DROP POLICY IF EXISTS "Only owners can delete members" ON public.members;
CREATE POLICY "Only owners can delete members"
  ON public.members
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- 3. Automatic Member Code Sequence Generator
CREATE SEQUENCE IF NOT EXISTS member_code_seq START WITH 1001;

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

-- 4. Automatic Expiry Status Synchronizer
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
