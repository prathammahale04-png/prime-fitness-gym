-- ==============================================================================
-- PRIME FITNESS MH19 GYM MANAGEMENT PLATFORM
-- MIGRATION: 001 - AUTHENTICATION, PROFILES & ROLE-BASED ACCESS CONTROL (RBAC)
-- Created: October 2026
-- ==============================================================================

-- 1. Create custom enum type for gym administrative roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('owner', 'staff', 'trainer');
  END IF;
END $$;

-- 2. Create public.profiles table linked to Supabase auth.users
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

-- Index for fast lookup by role and status
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Helper Security Functions (SECURITY DEFINER to avoid recursion)
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

-- 5. Row Level Security Policies for profiles

-- Drop existing policies if they exist to allow idempotent migration runs
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owners and staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own personal info" ON public.profiles;
DROP POLICY IF EXISTS "Only owners can update roles and active status" ON public.profiles;

-- Policy A: An authenticated user can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy B: Owners and active staff can view all gym staff profiles
CREATE POLICY "Owners and staff can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_owner() OR public.has_role('staff'));

-- Policy C: Users can edit their own contact details (name, phone, avatar)
CREATE POLICY "Users can update their own personal info"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Non-owners cannot elevate their own role or toggle active state
    AND (
      public.is_owner() OR (
        role = (SELECT role FROM public.profiles WHERE id = auth.uid())
        AND is_active = (SELECT is_active FROM public.profiles WHERE id = auth.uid())
      )
    )
  );

-- Policy D: Only owners can update any profile or modify roles
CREATE POLICY "Only owners can update roles and active status"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- 6. Trigger to automatically provision a profile row when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- Check if this is the very first user in the database
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

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
    COALESCE(new.raw_user_meta_data->>'full_name', 'Gym Staff'),
    new.raw_user_meta_data->>'phone',
    -- The first created user can automatically be owner, all subsequent users default to 'staff'
    CASE WHEN is_first_user THEN 'owner'::public.app_role ELSE 'staff'::public.app_role END,
    true
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Trigger to keep updated_at in sync
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

-- ==============================================================================
-- INSTRUCTIONS FOR FIRST OWNER INITIALIZATION:
-- 1. Create a user via Supabase Dashboard -> Authentication -> Users.
-- 2. If the user was not the first user, run the following SQL to assign Owner role:
--    UPDATE public.profiles SET role = 'owner', is_active = true WHERE email = 'your-email@example.com';
-- ==============================================================================
