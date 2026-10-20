-- ==============================================================================
-- PRIME FITNESS MH19 GYM MANAGEMENT PLATFORM
-- MIGRATION: 002 - COMPLETE COMMERCIAL GYM SCHEMA
-- ==============================================================================

-- 1. Profiles & Roles (if not already created)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('owner', 'staff', 'trainer');
  END IF;
END $$;

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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Membership Packages Table
CREATE TABLE IF NOT EXISTS public.packages (
  id TEXT PRIMARY KEY DEFAULT ('pkg_' || substr(md5(random()::text), 1, 8)),
  name TEXT NOT NULL,
  duration_type TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'quarterly', 'half_yearly', 'yearly', 'custom'
  duration_days INTEGER NOT NULL DEFAULT 30,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  description TEXT,
  benefits TEXT[] DEFAULT '{}',
  disciplines TEXT DEFAULT 'Strength · Cardio',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- 3. Members Table
CREATE TABLE IF NOT EXISTS public.members (
  id TEXT PRIMARY KEY DEFAULT ('mem_' || substr(md5(random()::text), 1, 8)),
  member_code TEXT UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  gender TEXT,
  emergency_contact TEXT,
  address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'expiring_soon', 'inactive'
  package_id TEXT REFERENCES public.packages(id) ON DELETE SET NULL,
  membership_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  membership_end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_members_phone ON public.members(phone);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- 4. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY DEFAULT ('pay_' || substr(md5(random()::text), 1, 8)),
  member_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  package_id TEXT REFERENCES public.packages(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'UPI', -- 'UPI', 'Cash', 'Card', 'Net Banking'
  reference_no TEXT,
  notes TEXT,
  recorded_by TEXT DEFAULT 'Owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_member ON public.payments(member_id);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 5. Daily Check-ins Table
CREATE TABLE IF NOT EXISTS public.checkins (
  id TEXT PRIMARY KEY DEFAULT ('chk_' || substr(md5(random()::text), 1, 8)),
  member_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  checkin_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  checkin_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'qr', 'biometric'
  status TEXT NOT NULL DEFAULT 'valid', -- 'valid', 'expired_membership', 'warning'
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_checkins_time ON public.checkins(checkin_time);
CREATE INDEX IF NOT EXISTS idx_checkins_member ON public.checkins(member_id);
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- 6. Trainers Table
CREATE TABLE IF NOT EXISTS public.trainers (
  id TEXT PRIMARY KEY DEFAULT ('trn_' || substr(md5(random()::text), 1, 8)),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  specialty TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  bio TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;

-- 7. Enquiries / Leads Table
CREATE TABLE IF NOT EXISTS public.enquiries (
  id TEXT PRIMARY KEY DEFAULT ('enq_' || substr(md5(random()::text), 1, 8)),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  plan_interest TEXT,
  source TEXT DEFAULT 'Website Modal',
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'converted', 'closed'
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries(status);
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- 8. Events Table
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY DEFAULT ('evt_' || substr(md5(random()::text), 1, 8)),
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT,
  location TEXT DEFAULT 'Prime Fitness Arena, Shivaji Nagar',
  description TEXT,
  max_participants INTEGER DEFAULT 50,
  registered_count INTEGER DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 9. Fitness Challenges Table
CREATE TABLE IF NOT EXISTS public.challenges (
  id TEXT PRIMARY KEY DEFAULT ('chg_' || substr(md5(random()::text), 1, 8)),
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  rules TEXT,
  participants_count INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- 10. Gym Settings Table
CREATE TABLE IF NOT EXISTS public.gym_settings (
  id TEXT PRIMARY KEY DEFAULT 'prime_fitness_main',
  gym_name TEXT NOT NULL DEFAULT 'Prime Fitness MH19',
  city TEXT NOT NULL DEFAULT 'Jalgaon',
  phone TEXT NOT NULL DEFAULT '+91 94222 78910',
  email TEXT NOT NULL DEFAULT 'primefitnessjalgaon@gmail.com',
  address TEXT NOT NULL DEFAULT 'Prime Fitness, Near Shivaji Nagar Overbridge, Jalgaon, Maharashtra 425001',
  timings TEXT NOT NULL DEFAULT '5:00 AM – 10:00 AM | 4:30 PM – 10:00 PM',
  facility_size TEXT NOT NULL DEFAULT '4000+ SQ.FT.',
  disciplines TEXT NOT NULL DEFAULT 'Strength · Cardio · HYROX · Powerlifting',
  announcements TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.gym_settings ENABLE ROW LEVEL SECURITY;

-- 11. Row Level Security Policies (Allow Authenticated Staff/Owners Full Access)
DO $$
DECLARE
  tbl text;
  tbls text[] := ARRAY['profiles', 'packages', 'members', 'payments', 'checkins', 'trainers', 'enquiries', 'events', 'challenges', 'gym_settings'];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated staff can read %I" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated staff can manage %I" ON public.%I;', tbl, tbl);
    
    EXECUTE format('CREATE POLICY "Authenticated staff can read %I" ON public.%I FOR SELECT TO authenticated USING (true);', tbl, tbl);
    EXECUTE format('CREATE POLICY "Authenticated staff can manage %I" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;

-- Also allow public website visitors to read active packages, trainers, events, and insert enquiries
DROP POLICY IF EXISTS "Public can view active packages" ON public.packages;
CREATE POLICY "Public can view active packages" ON public.packages FOR SELECT TO anon USING (is_active = true);

DROP POLICY IF EXISTS "Public can view active trainers" ON public.trainers;
CREATE POLICY "Public can view active trainers" ON public.trainers FOR SELECT TO anon USING (is_active = true);

DROP POLICY IF EXISTS "Public can view published events" ON public.events;
CREATE POLICY "Public can view published events" ON public.events FOR SELECT TO anon USING (is_published = true);

DROP POLICY IF EXISTS "Public can submit enquiries" ON public.enquiries;
CREATE POLICY "Public can submit enquiries" ON public.enquiries FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view gym settings" ON public.gym_settings;
CREATE POLICY "Public can view gym settings" ON public.gym_settings FOR SELECT TO anon USING (true);
