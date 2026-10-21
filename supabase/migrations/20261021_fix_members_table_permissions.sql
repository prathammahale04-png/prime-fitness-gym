-- ==============================================================================
-- PRIME FITNESS MH19 GYM MANAGEMENT PLATFORM
-- TARGETED FIX: MEMBERS TABLE PERMISSIONS & ROLE-BASED ACCESS CONTROL (RBAC)
-- Created: October 21, 2026
--
-- PURPOSE:
-- Fixes PostgreSQL error "permission denied for table members" (SQLSTATE 42501).
--
-- ROOT CAUSE:
-- In Supabase PostgreSQL, creating tables under the 'postgres' role does not
-- automatically grant table privileges to the 'authenticated' role. If 'GRANT'
-- was omitted or 'REVOKE ALL FROM public' removed inherited access, PostgREST
-- rejects any query from authenticated staff/owners with "permission denied for table members".
--
-- SAFETY ASSURANCES:
-- 1. Does NOT drop or recreate public.members or delete any member records.
-- 2. Does NOT disable Row Level Security (RLS remains strictly enabled).
-- 3. Does NOT grant access to anonymous (anon) visitors.
-- 4. Uses existing public.is_owner() and public.has_role('staff') helper functions.
-- ==============================================================================

-- 1. Explicitly grant required SQL privileges on members table to authenticated and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO authenticated, service_role;

-- 2. Explicitly grant sequence access for member code generation (e.g. PF-1001)
GRANT USAGE, SELECT ON SEQUENCE public.member_code_seq TO authenticated, service_role;

-- 3. Strictly revoke any public and anon access to protect member PII
REVOKE ALL ON public.members FROM public, anon;
REVOKE ALL ON SEQUENCE public.member_code_seq FROM public, anon;

-- 4. Ensure Row Level Security (RLS) is active
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- 5. Re-apply clean, explicit RLS policies for authenticated owners and staff
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

-- 6. Guarantee that the designated owner profile is active in public.profiles
-- so that public.is_owner() returns TRUE when pranavsonawane1328@gmail.com logs in
DO $$
DECLARE
  v_owner_id uuid;
BEGIN
  SELECT id INTO v_owner_id
  FROM auth.users
  WHERE lower(email) = 'pranavsonawane1328@gmail.com';

  IF v_owner_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, role, is_active, updated_at)
    VALUES (
      v_owner_id,
      'pranavsonawane1328@gmail.com',
      'Prime Fitness Owner',
      'owner'::public.app_role,
      true,
      timezone('utc'::text, now())
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'owner'::public.app_role,
      is_active = true,
      updated_at = timezone('utc'::text, now());
  END IF;
END $$;
