-- ==============================================================================
-- PRIME FITNESS MH19 GYM MANAGEMENT PLATFORM
-- MIGRATION: 003 - BILLING, ATTENDANCE, ENQUIRIES, EVENTS & TRAINERS
-- Created: October 2026
-- ==============================================================================

-- 1. Create Payments / Billing Table
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

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff and owners can view payments" ON public.payments;
CREATE POLICY "Staff and owners can view payments"
  ON public.payments FOR SELECT TO authenticated
  USING (public.is_owner() OR public.has_role('staff'));

DROP POLICY IF EXISTS "Staff and owners can insert payments" ON public.payments;
CREATE POLICY "Staff and owners can insert payments"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (public.is_owner() OR public.has_role('staff'));

-- 2. Create Attendance / Check-ins Table
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

-- 3. Create Enquiries & Leads Table
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

-- 4. Create Gym Events Table
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

-- 5. Create Fitness Challenges Table
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

-- 6. Create Trainers Table
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

