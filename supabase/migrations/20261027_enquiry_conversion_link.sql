-- ==============================================================================
-- PRIME FITNESS MH19 GYM MANAGEMENT PLATFORM
-- MIGRATION: 20261027 - ENQUIRY CONVERSION LINK & MEMBER AUDIT
-- ==============================================================================
--
-- PURPOSE:
-- Adds optional 'member_id' and 'converted_at' columns to public.enquiries so that
-- converted leads maintain a foreign key reference to their corresponding public.members
-- record in Supabase.
--
-- SAFETY ASSURANCES:
-- 1. Uses ADD COLUMN IF NOT EXISTS (idempotent, safe to run multiple times).
-- 2. Uses ON DELETE SET NULL to preserve enquiry history if a member is ever purged.
-- 3. Does not alter RLS policies or remove any existing data.
-- 4. Re-confirms explicit permissions for authenticated staff/owners.
-- ==============================================================================

-- 1. Add optional member_id and converted_at columns to public.enquiries
ALTER TABLE public.enquiries 
  ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;

-- 2. Create index for fast lookups between enquiries and converted members
CREATE INDEX IF NOT EXISTS idx_enquiries_member_id ON public.enquiries(member_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_converted_at ON public.enquiries(converted_at);

-- 3. Confirm table privileges for authenticated staff and owners
GRANT SELECT, INSERT, UPDATE ON public.enquiries TO authenticated, service_role;
