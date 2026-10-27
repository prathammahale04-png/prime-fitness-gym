-- ==============================================================================
-- PRIME FITNESS MH19 GYM PLATFORM - SECURITY HARDENING MIGRATION
-- File: /supabase/migrations/20261026_lockdown_public_views.sql
--
-- TARGET OBJECTS:
--   1. public.public_gym_settings (VIEW)
--   2. public.public_trainers (VIEW)
--
-- PURPOSE:
--   Removes all mutation privileges (INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER)
--   from 'anon', 'authenticated', and 'public' on public projection views.
--   Preserves read-only (SELECT) access for public website visitors.
--
-- SAFETY & COMPLIANCE:
--   - Does NOT alter, drop, or recreate the views.
--   - Does NOT modify underlying tables (gym_settings, trainers, members, etc.).
--   - Does NOT modify any Row Level Security (RLS) policies.
--   - Does NOT require triggers or procedural functions.
-- ==============================================================================

-- 1. Revoke all privileges and grant options from anon, authenticated, and public
REVOKE ALL PRIVILEGES, GRANT OPTION FOR ALL PRIVILEGES
  ON public.public_gym_settings
  FROM anon, authenticated, public;

REVOKE ALL PRIVILEGES, GRANT OPTION FOR ALL PRIVILEGES
  ON public.public_trainers
  FROM anon, authenticated, public;

-- 2. Grant strictly SELECT access to anon and authenticated
GRANT SELECT ON public.public_gym_settings TO anon, authenticated;
GRANT SELECT ON public.public_trainers TO anon, authenticated;

-- 3. Document comment on both views
COMMENT ON VIEW public.public_gym_settings IS
  'Read-only public projection of gym contact and schedule settings. Mutations strictly forbidden.';

COMMENT ON VIEW public.public_trainers IS
  'Read-only public projection of active trainer profiles. Mutations strictly forbidden.';
