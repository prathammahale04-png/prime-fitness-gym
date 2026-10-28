import { supabase, isSupabaseConfigured, getAuthenticatedClient } from '../lib/supabase';
import { Member, MemberInput, MembershipPackage, MemberStatus } from '../types/database.types';

// Fallback in-memory/localStorage cache for offline or pre-migration testing
const LOCAL_STORAGE_KEY = 'primefitness_mh19_members_cache';

const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem-001',
    member_code: 'PF-1001',
    full_name: 'Rahul Patil',
    phone: '9822012345',
    email: 'rahul.patil@example.com',
    gender: 'male',
    date_of_birth: '1996-05-12',
    address: 'Near Old B.J. Market, Shivaji Nagar, Jalgaon',
    emergency_contact: '9822099999',
    package_id: 'default-pkg-2',
    package_name: '3 MONTHS INTENSIVE',
    joined_date: '2026-07-25',
    start_date: '2026-07-25',
    expiry_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    status: 'active',
    amount_paid: 3500,
    balance_due: 0,
    notes: 'Regular morning strength slot athlete',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mem-002',
    member_code: 'PF-1002',
    full_name: 'Pooja Kulkarni',
    phone: '9422234567',
    email: 'pooja.k@example.com',
    gender: 'female',
    date_of_birth: '1998-11-20',
    address: 'Prabhat Chowk, Jalgaon',
    emergency_contact: '9422200000',
    package_id: 'default-pkg-1',
    package_name: '1 MONTH STANDARD',
    joined_date: '2026-09-21',
    start_date: '2026-09-21',
    expiry_date: new Date().toISOString().split('T')[0],
    status: 'active',
    amount_paid: 1500,
    balance_due: 0,
    notes: 'Cardio & functional mobility training',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mem-003',
    member_code: 'PF-1003',
    full_name: 'Vikram Joshi',
    phone: '9822567890',
    email: 'vikram.j@example.com',
    gender: 'male',
    date_of_birth: '1992-03-15',
    address: 'Ring Road, Jalgaon',
    emergency_contact: '9822511111',
    package_id: 'default-pkg-3',
    package_name: '6 MONTHS ATHLETIC',
    joined_date: '2026-04-15',
    start_date: '2026-04-15',
    expiry_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    status: 'active',
    amount_paid: 6000,
    balance_due: 0,
    notes: 'HYROX conditioning athlete',
    created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function clearMemberCache(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear member cache:', err);
  }
}

function getLocalMembers(): Member[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return INITIAL_MEMBERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_MEMBERS;
  } catch {
    return INITIAL_MEMBERS;
  }
}

function saveLocalMembers(members: Member[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(members));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}

function isValidUUID(str: string | null | undefined): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
}

export function calculateExpiryDate(startDateStr: string, durationDays: number): string {
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  const expiry = new Date(start);
  expiry.setDate(expiry.getDate() + durationDays);
  return expiry.toISOString().split('T')[0];
}

export async function getMembers(
  filters?: {
    search?: string;
    status?: string;
  },
  sessionOverride?: any
): Promise<{
  members: Member[];
  isLive: boolean;
  error?: string;
  isCachedFallback?: boolean;
  notice?: string;
}> {
  const applyFilters = (list: Member[]) => {
    let res = list;
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      res = res.filter(m =>
        m.full_name.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.member_code.toLowerCase().includes(q)
      );
    }
    if (filters?.status && filters.status !== 'all') {
      res = res.filter(m => m.status === filters.status);
    }
    return res;
  };

  // If Supabase is not configured, operate purely in local cache mode
  if (!isSupabaseConfigured()) {
    return { members: applyFilters(getLocalMembers()), isLive: false };
  }

  // 1. Resolve active Supabase Auth session
  let session = sessionOverride;
  if (!session) {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) {
      console.warn('Session retrieval error:', sessionErr.message);
    }
    session = sessionData?.session;
  }

  if (!session?.user) {
    // Unauthenticated request: do NOT dispatch anon query to private table
    return {
      members: applyFilters(getLocalMembers()),
      isLive: false,
      error: 'Not authenticated. Showing cached records. Sign in as Admin to sync live data.',
    };
  }

  // 2. Check for expired session token, attempt refresh if possible
  if (session.expires_at && session.expires_at * 1000 < Date.now()) {
    try {
      const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
      if (refreshErr || !refreshData?.session) {
        return {
          members: applyFilters(getLocalMembers()),
          isLive: false,
          error: 'Authentication session expired. Please sign in again to sync live member data.',
        };
      }
      session = refreshData.session;
    } catch {
      return {
        members: applyFilters(getLocalMembers()),
        isLive: false,
        error: 'Authentication session expired. Please sign in again to sync live member data.',
      };
    }
  }

  // 3. Obtain client with explicit Bearer Authorization header using authenticated JWT
  const client = getAuthenticatedClient(session.access_token);

  // 4. Diagnostic check on session & profiles table (strictly safe, no credentials logged)
  let profileRoleStatus = 'unverified';
  try {
    const { data: profileRow, error: profileErr } = await client
      .from('profiles')
      .select('id, role, is_active')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profileRow) {
      profileRoleStatus = `Role: ${profileRow.role} (${profileRow.is_active ? 'Active' : 'Inactive'})`;
    } else if (profileErr) {
      profileRoleStatus = `Profile query notice: ${profileErr.code || profileErr.message}`;
    } else {
      profileRoleStatus = 'No profile record found in public.profiles';
    }
  } catch (diagErr: any) {
    profileRoleStatus = `Profile check network error: ${diagErr?.message || 'unknown'}`;
  }

  console.info('[MemberSync Diagnostic]', {
    authenticated: true,
    userIdPrefix: session.user?.id ? session.user.id.substring(0, 8) + '...' : 'none',
    hasAccessToken: Boolean(session.access_token),
    tokenLength: session.access_token ? session.access_token.length : 0,
    expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'none',
    profileStatus: profileRoleStatus,
  });

  try {
    // Query full member list so we can detect whether the remote table is empty or populated
    const { data, error } = await client
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching members from DB, falling back to local cache:', error);
      const local = getLocalMembers();
      return {
        members: applyFilters(local),
        isLive: false,
        error: `Supabase query error (${error.code || 'unknown'}): ${error.message}${error.hint ? ' - Hint: ' + error.hint : ''} [Auth: authenticated, ${profileRoleStatus}]`,
      };
    }

    const liveRecords = (data as Member[]) || [];

    // If remote table returned 0 rows, check if local cache has preserved member records
    if (liveRecords.length === 0) {
      const local = getLocalMembers();
      if (local.length > 0) {
        console.info('[MemberSync] Live Supabase query returned 0 rows. Preserving and displaying local cached records.', {
          cachedCount: local.length,
          profileStatus: profileRoleStatus,
        });
        return {
          members: applyFilters(local),
          isLive: true,
          isCachedFallback: true,
          notice: `Live Supabase connected. Remote members table has 0 records; displaying ${local.length} preserved cached member records.`,
        };
      }
    }

    // Live records present in Supabase!
    const today = new Date().toISOString().split('T')[0];
    const updatedMembers: Member[] = liveRecords.map(m => {
      if (m.status !== 'inactive') {
        const isExpired = m.expiry_date < today;
        return {
          ...m,
          status: (isExpired ? 'expired' : 'active') as MemberStatus,
        };
      }
      return m;
    });

    // Update local cache with freshly fetched verified live records
    if (updatedMembers.length > 0) {
      saveLocalMembers(updatedMembers);
    }

    return {
      members: applyFilters(updatedMembers),
      isLive: true,
      isCachedFallback: false,
    };
  } catch (err: any) {
    return {
      members: applyFilters(getLocalMembers()),
      isLive: false,
      error: err?.message || 'Unexpected network error fetching members.',
    };
  }
}

export async function addMember(
  input: MemberInput,
  pkg: MembershipPackage,
  sessionOverride?: any
): Promise<{ success: boolean; data?: Member; error?: string }> {
  const startDate = input.start_date || new Date().toISOString().split('T')[0];
  const expiryDate = calculateExpiryDate(startDate, pkg.duration_days);
  const balanceDue = input.balance_due !== undefined ? input.balance_due : Math.max(0, pkg.price - input.amount_paid);

  const today = new Date().toISOString().split('T')[0];
  const status: MemberStatus = expiryDate < today ? 'expired' : 'active';

  // Fallback for offline mode when Supabase is completely unconfigured
  if (!isSupabaseConfigured()) {
    const localMember: Member = {
      id: 'local-' + Date.now(),
      member_code: 'PF-' + Math.floor(1000 + Math.random() * 9000),
      full_name: input.full_name.trim(),
      phone: input.phone.trim(),
      email: input.email ? input.email.trim() : null,
      gender: input.gender || null,
      date_of_birth: input.date_of_birth || null,
      address: input.address ? input.address.trim() : null,
      emergency_contact: input.emergency_contact ? input.emergency_contact.trim() : null,
      package_id: isValidUUID(pkg.id) ? pkg.id : null,
      package_name: pkg.name,
      joined_date: startDate,
      start_date: startDate,
      expiry_date: expiryDate,
      status,
      amount_paid: Number(input.amount_paid) || 0,
      balance_due: balanceDue,
      notes: input.notes ? input.notes.trim() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const current = getLocalMembers();
    current.unshift(localMember);
    saveLocalMembers(current);
    return { success: true, data: localMember };
  }

  // 1. Resolve active authenticated session
  let session = sessionOverride;
  if (!session) {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) {
      console.warn('Session retrieval error:', sessionErr.message);
    }
    session = sessionData?.session;
  }

  if (!session?.user || !session.access_token) {
    return {
      success: false,
      error: 'Authentication required. Please sign in as staff or owner to add members.',
    };
  }

  if (session.expires_at && session.expires_at * 1000 < Date.now()) {
    try {
      const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
      if (refreshErr || !refreshData?.session) {
        return {
          success: false,
          error: 'Authentication session expired. Please sign in again.',
        };
      }
      session = refreshData.session;
    } catch {
      return {
        success: false,
        error: 'Authentication session expired. Please sign in again.',
      };
    }
  }

  try {
    const client = getAuthenticatedClient(session.access_token);

    // 2. Resolve true package UUID if pkg.id is a placeholder (e.g. 'default-pkg-2')
    let resolvedPackageId: string | null = isValidUUID(pkg.id) ? pkg.id : null;
    if (!resolvedPackageId && pkg.name) {
      try {
        const { data: dbPkgs } = await client
          .from('packages')
          .select('id, name')
          .ilike('name', pkg.name.trim());
        if (dbPkgs && dbPkgs.length > 0) {
          resolvedPackageId = dbPkgs[0].id;
        }
      } catch (e) {
        console.warn('Package UUID resolution notice:', e);
      }
    }

    // 3. Calculate collision-free next member_code (e.g. PF-1004) to avoid sequence collision with PF-1001/1002/1003
    let maxNum = 1000;
    try {
      const { data: existingCodes } = await client
        .from('members')
        .select('member_code');

      if (existingCodes && existingCodes.length > 0) {
        for (const row of existingCodes) {
          if (row.member_code) {
            const match = row.member_code.match(/PF-(\d+)/i);
            if (match && match[1]) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > maxNum) {
                maxNum = num;
              }
            }
          }
        }
      }
    } catch (codeErr) {
      console.warn('Failed to query existing member codes from DB:', codeErr);
    }

    // Also compare against local cache to guarantee uniqueness across all sources
    const local = getLocalMembers();
    for (const m of local) {
      const match = m.member_code?.match(/PF-(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextMemberCode = `PF-${maxNum + 1}`;

    // 4. Construct payload strictly matching public.members schema
    const memberPayload = {
      member_code: nextMemberCode,
      full_name: input.full_name.trim(),
      phone: input.phone.trim(),
      email: input.email ? input.email.trim() : null,
      gender: input.gender || null,
      date_of_birth: input.date_of_birth || null,
      address: input.address ? input.address.trim() : null,
      emergency_contact: input.emergency_contact ? input.emergency_contact.trim() : null,
      package_id: resolvedPackageId,
      package_name: pkg.name,
      joined_date: startDate,
      start_date: startDate,
      expiry_date: expiryDate,
      status,
      amount_paid: Number(input.amount_paid) || 0,
      balance_due: balanceDue,
      notes: input.notes ? input.notes.trim() : null,
      created_by: session.user.id,
    };

    console.info('[AddMember] Attempting insert into Supabase:', {
      member_code: nextMemberCode,
      full_name: memberPayload.full_name,
      package_name: memberPayload.package_name,
      package_id: memberPayload.package_id,
      user_id: session.user.id,
    });

    // 5. Execute insert with authenticated client
    const { data, error } = await client
      .from('members')
      .insert([memberPayload])
      .select()
      .single();

    if (error) {
      console.error('[AddMember Error]', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return {
        success: false,
        error: `Supabase insert failed (${error.code || 'unknown'}): ${error.message}${error.hint ? ' - ' + error.hint : ''}`,
      };
    }

    const newMember = data as Member;
    console.info('[AddMember Success] Created member in Supabase:', newMember.id, newMember.member_code);

    // Update local cache with newly created verified member
    const currentList = getLocalMembers();
    const filtered = currentList.filter(m => m.id !== newMember.id && m.member_code !== newMember.member_code);
    filtered.unshift(newMember);
    saveLocalMembers(filtered);

    return { success: true, data: newMember };
  } catch (err: any) {
    console.error('[AddMember Exception]', err);
    return {
      success: false,
      error: err?.message || 'Unexpected network error inserting member into Supabase.',
    };
  }
}

export async function renewMember(
  memberId: string,
  pkg: MembershipPackage,
  startDateStr: string,
  amountPaid: number,
  sessionOverride?: any
): Promise<{ success: boolean; error?: string }> {
  const expiryDate = calculateExpiryDate(startDateStr, pkg.duration_days);
  const balanceDue = Math.max(0, pkg.price - amountPaid);
  const status: MemberStatus = expiryDate < new Date().toISOString().split('T')[0] ? 'expired' : 'active';

  const updates = {
    package_id: isValidUUID(pkg.id) ? pkg.id : null,
    package_name: pkg.name,
    start_date: startDateStr,
    expiry_date: expiryDate,
    status,
    amount_paid: amountPaid,
    balance_due: balanceDue,
    updated_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    const list = getLocalMembers();
    const idx = list.findIndex(m => m.id === memberId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      saveLocalMembers(list);
    }
    return { success: true };
  }

  // Check auth session before updating private table
  let session = sessionOverride;
  if (!session) {
    const { data: sessionData } = await supabase.auth.getSession();
    session = sessionData?.session;
  }
  if (!session?.user || !session.access_token) {
    return {
      success: false,
      error: 'Authentication required. Please sign in as Admin to renew memberships.',
    };
  }
  if (session.expires_at && session.expires_at * 1000 < Date.now()) {
    return {
      success: false,
      error: 'Authentication session expired. Please sign in again.',
    };
  }

  try {
    if (isValidUUID(memberId)) {
      const client = getAuthenticatedClient(session.access_token);
      const { error } = await client
        .from('members')
        .update(updates)
        .eq('id', memberId);

      if (error) {
        console.error('Database renew returned error:', error.message);
        return { success: false, error: `Database update failed: ${error.message}` };
      }
    }

    const list = getLocalMembers();
    const idx = list.findIndex(m => m.id === memberId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      saveLocalMembers(list);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to renew member.' };
  }
}

export async function toggleMemberDeactivate(
  memberId: string,
  currentStatus: string,
  sessionOverride?: any
): Promise<{ success: boolean; error?: string }> {
  const newStatus: MemberStatus = currentStatus === 'inactive' ? 'active' : 'inactive';

  if (!isSupabaseConfigured()) {
    const list = getLocalMembers();
    const idx = list.findIndex(m => m.id === memberId);
    if (idx !== -1) {
      list[idx].status = newStatus;
      saveLocalMembers(list);
    }
    return { success: true };
  }

  // Check auth session before updating private table
  let session = sessionOverride;
  if (!session) {
    const { data: sessionData } = await supabase.auth.getSession();
    session = sessionData?.session;
  }
  if (!session?.user || !session.access_token) {
    return {
      success: false,
      error: 'Authentication required. Please sign in as Admin to change member status.',
    };
  }
  if (session.expires_at && session.expires_at * 1000 < Date.now()) {
    return {
      success: false,
      error: 'Authentication session expired. Please sign in again.',
    };
  }

  try {
    if (isValidUUID(memberId)) {
      const client = getAuthenticatedClient(session.access_token);
      const { error } = await client
        .from('members')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', memberId);

      if (error) {
        console.error('Database status toggle returned error:', error.message);
        return { success: false, error: `Database status update failed: ${error.message}` };
      }
    }

    const list = getLocalMembers();
    const idx = list.findIndex(m => m.id === memberId);
    if (idx !== -1) {
      list[idx].status = newStatus;
      saveLocalMembers(list);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to toggle status.' };
  }
}

export async function updateMemberPhone(
  memberId: string,
  newPhone: string
): Promise<{ success: boolean; error?: string }> {
  const trimmedPhone = newPhone.trim();

  if (!isSupabaseConfigured()) {
    const list = getLocalMembers();
    const idx = list.findIndex(m => m.id === memberId);
    if (idx !== -1) {
      list[idx].phone = trimmedPhone;
      list[idx].updated_at = new Date().toISOString();
      saveLocalMembers(list);
    }
    return { success: true };
  }

  // Check auth session before attempting update on private members table
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  const session = sessionData?.session;
  if (sessionErr || !session?.user) {
    return {
      success: false,
      error: 'Authentication required. Please sign in to update member phone numbers in the database.',
    };
  }

  if (session.expires_at && session.expires_at * 1000 < Date.now()) {
    return {
      success: false,
      error: 'Authentication session expired. Please log in again to update member phone numbers.',
    };
  }

  try {
    const client = getAuthenticatedClient(session.access_token);
    const { error } = await client
      .from('members')
      .update({ phone: trimmedPhone, updated_at: new Date().toISOString() })
      .eq('id', memberId);

    if (error) {
      console.warn('Database phone update failed, preserving locally:', error.message);
      const list = getLocalMembers();
      const idx = list.findIndex(m => m.id === memberId);
      if (idx !== -1) {
        list[idx].phone = trimmedPhone;
        list[idx].updated_at = new Date().toISOString();
        saveLocalMembers(list);
      }
      return { success: true, error: `Updated locally (${error.message})` };
    }

    const list = getLocalMembers();
    const idx = list.findIndex(m => m.id === memberId);
    if (idx !== -1) {
      list[idx].phone = trimmedPhone;
      list[idx].updated_at = new Date().toISOString();
      saveLocalMembers(list);
    }

    return { success: true };
  } catch (err: any) {
    const list = getLocalMembers();
    const idx = list.findIndex(m => m.id === memberId);
    if (idx !== -1) {
      list[idx].phone = trimmedPhone;
      list[idx].updated_at = new Date().toISOString();
      saveLocalMembers(list);
    }
    return { success: true, error: `Updated locally (${err?.message || 'Network error'})` };
  }
}

export interface MemberSyncResult {
  success: boolean;
  count: number;
  succeeded: string[];
  failed: { code: string; name: string; error: string }[];
  skipped: string[];
  error?: string;
}

/**
 * Safely uploads local cached members to the remote Supabase database.
 * This is executed ONLY upon explicit staff/owner confirmation, and does not insert dummy rows.
 */
export async function syncCachedMembersToDatabase(): Promise<MemberSyncResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;
  if (!session?.user || !session.access_token) {
    return {
      success: false,
      count: 0,
      succeeded: [],
      failed: [],
      skipped: [],
      error: 'Authentication required. Please sign in as staff or owner to sync members.',
    };
  }

  const local = getLocalMembers();
  if (local.length === 0) {
    return { success: true, count: 0, succeeded: [], failed: [], skipped: [] };
  }

  try {
    const client = getAuthenticatedClient(session.access_token);

    // 1. Fetch live packages to match real UUIDs for package_id if local package_id is a mock string
    let livePackages: { id: string; name: string }[] = [];
    try {
      const { data: pkgData } = await client.from('packages').select('id, name');
      if (pkgData) {
        livePackages = pkgData;
      }
    } catch (e) {
      console.warn('Failed to fetch packages for UUID mapping:', e);
    }

    // 2. Query existing members to detect existing records and prevent duplicates on double-click/retry
    const existingMap = new Map<string, string>(); // member_code -> id
    try {
      const { data: existingData } = await client.from('members').select('id, member_code');
      if (existingData) {
        existingData.forEach((row: any) => {
          if (row.member_code) {
            existingMap.set(row.member_code.toUpperCase(), row.id);
          }
        });
      }
    } catch (e) {
      console.warn('Failed to query existing members:', e);
    }

    const succeeded: string[] = [];
    const skipped: string[] = [];
    const failed: { code: string; name: string; error: string }[] = [];
    const updatedLocalMembers = [...local];

    // 3. Process each member individually to handle partial failures and report precise status
    for (let i = 0; i < local.length; i++) {
      const m = local[i];
      const codeKey = (m.member_code || '').toUpperCase();

      // Resolve package UUID
      let resolvedPackageId: string | null = null;
      if (isValidUUID(m.package_id)) {
        resolvedPackageId = m.package_id;
      } else if (m.package_name && livePackages.length > 0) {
        const match = livePackages.find(
          p => p.name.trim().toLowerCase() === m.package_name?.trim().toLowerCase()
        );
        if (match) {
          resolvedPackageId = match.id;
        }
      }

      const payload: any = {
        member_code: m.member_code,
        full_name: m.full_name,
        phone: m.phone,
        email: m.email || null,
        gender: m.gender || null,
        date_of_birth: m.date_of_birth || null,
        address: m.address || null,
        emergency_contact: m.emergency_contact || null,
        package_id: resolvedPackageId,
        package_name: m.package_name || null,
        joined_date: m.joined_date,
        start_date: m.start_date,
        expiry_date: m.expiry_date,
        status: m.status,
        amount_paid: m.amount_paid || 0,
        balance_due: m.balance_due || 0,
        notes: m.notes || null,
        created_by: session.user.id,
      };

      const existingId = existingMap.get(codeKey);

      if (existingId) {
        // Record already exists in Supabase: update with verified fields to prevent duplicates
        const { data: updateData, error: updateErr } = await client
          .from('members')
          .update(payload)
          .eq('id', existingId)
          .select()
          .maybeSingle();

        if (updateErr) {
          failed.push({
            code: m.member_code,
            name: m.full_name,
            error: updateErr.message,
          });
        } else {
          skipped.push(m.member_code);
          if (updateData) {
            updatedLocalMembers[i] = updateData as Member;
          }
        }
      } else {
        // Record does not exist: perform clean insert
        const { data: insertData, error: insertErr } = await client
          .from('members')
          .insert([payload])
          .select()
          .single();

        if (insertErr) {
          failed.push({
            code: m.member_code,
            name: m.full_name,
            error: insertErr.message,
          });
        } else {
          succeeded.push(m.member_code);
          if (insertData) {
            updatedLocalMembers[i] = insertData as Member;
          }
        }
      }
    }

    // Save updated local cache reflecting canonical DB UUIDs for all successfully synced members
    saveLocalMembers(updatedLocalMembers);

    if (failed.length > 0) {
      return {
        success: false,
        count: succeeded.length,
        succeeded,
        failed,
        skipped,
        error: `Partial upload failure: ${failed.length} member(s) failed (${failed.map(f => `${f.code} [${f.name}]: ${f.error}`).join('; ')}). ${succeeded.length} succeeded, ${skipped.length} already existed.`,
      };
    }

    return {
      success: true,
      count: succeeded.length,
      succeeded,
      failed: [],
      skipped,
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      succeeded: [],
      failed: [],
      skipped: [],
      error: err?.message || 'Unexpected network error during member sync.',
    };
  }
}

/* =========================================================================
   ENQUIRY TO MEMBER CONVERSION ENGINE
========================================================================= */

export function matchPackageFromEnquiry(
  interestedPackage: string | null | undefined,
  packages: MembershipPackage[]
): MembershipPackage | null {
  if (!packages || packages.length === 0) return null;
  if (!interestedPackage) return packages[0];

  const raw = interestedPackage.toLowerCase().trim();

  // 1. Exact match on package name
  const exact = packages.find(p => p.name.toLowerCase() === raw);
  if (exact) return exact;

  // 2. Substring match on package name
  const nameMatch = packages.find(p =>
    raw.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(raw)
  );
  if (nameMatch) return nameMatch;

  // 3. Year / 12 months match
  if (raw.includes('12 month') || raw.includes('1 year') || raw.includes('yearly') || raw.includes('annual')) {
    const pkg = packages.find(p => p.duration_days >= 350 || p.duration_type === 'yearly');
    if (pkg) return pkg;
  }

  // 4. 6 months match
  if (raw.includes('6 month') || raw.includes('half')) {
    const pkg = packages.find(p => (p.duration_days >= 170 && p.duration_days <= 190) || p.duration_type === 'half_yearly');
    if (pkg) return pkg;
  }

  // 5. 3 months match
  if (raw.includes('3 month') || raw.includes('quarter')) {
    const pkg = packages.find(p => (p.duration_days >= 80 && p.duration_days <= 100) || p.duration_type === 'quarterly');
    if (pkg) return pkg;
  }

  // 6. 1 month / standard / trial
  if (raw.includes('1 month') || raw.includes('monthly') || raw.includes('standard') || raw.includes('trial')) {
    const pkg = packages.find(p => (p.duration_days >= 25 && p.duration_days <= 35) || p.duration_type === 'monthly');
    if (pkg) return pkg;
  }

  // 7. Price matching (e.g., if label has "1500" or "3500" or "3800" or "6000")
  for (const p of packages) {
    const priceDigits = p.price.toString();
    if (raw.includes(priceDigits)) return p;
  }

  return packages[0];
}

export interface ConvertEnquiryParams {
  enquiryId: string;
  fullName: string;
  phone: string;
  email?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  dateOfBirth?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  packageId?: string | null;
  packageName: string;
  durationDays: number;
  packagePrice: number;
  startDate?: string;
  amountPaid: number;
  balanceDue?: number;
  paymentMethod?: 'cash' | 'upi' | 'card' | 'bank_transfer';
  paymentReference?: string | null;
  recordPayment?: boolean;
  notes?: string | null;
  sessionOverride?: any;
}

export async function convertEnquiryToMember(
  params: ConvertEnquiryParams
): Promise<{ success: boolean; data?: Member; isLive: boolean; error?: string }> {
  const startDate = params.startDate || new Date().toISOString().split('T')[0];
  const durationDays = params.durationDays > 0 ? params.durationDays : 30;
  const expiryDate = calculateExpiryDate(startDate, durationDays);
  const balanceDue = params.balanceDue !== undefined ? params.balanceDue : Math.max(0, params.packagePrice - params.amountPaid);
  const today = new Date().toISOString().split('T')[0];
  const status: MemberStatus = expiryDate < today ? 'expired' : 'active';

  // Fallback for offline mode when Supabase is completely unconfigured
  if (!isSupabaseConfigured()) {
    const localMember: Member = {
      id: 'local-' + Date.now(),
      member_code: 'PF-' + Math.floor(1000 + Math.random() * 9000),
      full_name: params.fullName.trim(),
      phone: params.phone.trim(),
      email: params.email ? params.email.trim() : null,
      gender: params.gender || null,
      date_of_birth: params.dateOfBirth || null,
      address: params.address ? params.address.trim() : null,
      emergency_contact: params.emergencyContact ? params.emergencyContact.trim() : null,
      package_id: isValidUUID(params.packageId) ? params.packageId! : null,
      package_name: params.packageName,
      joined_date: startDate,
      start_date: startDate,
      expiry_date: expiryDate,
      status,
      amount_paid: Number(params.amountPaid) || 0,
      balance_due: balanceDue,
      notes: params.notes ? params.notes.trim() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const currentMembers = getLocalMembers();
    currentMembers.unshift(localMember);
    saveLocalMembers(currentMembers);

    // Update local enquiries cache
    try {
      const enqCacheKey = 'primefitness_enquiries_cache';
      const rawEnq = localStorage.getItem(enqCacheKey);
      if (rawEnq) {
        const enqList = JSON.parse(rawEnq);
        if (Array.isArray(enqList)) {
          const idx = enqList.findIndex((e: any) => e.id === params.enquiryId);
          if (idx !== -1) {
            enqList[idx].status = 'converted';
            enqList[idx].notes = `${enqList[idx].notes || ''} [Converted to Member ${localMember.member_code} on ${startDate}]`.trim();
            localStorage.setItem(enqCacheKey, JSON.stringify(enqList));
          }
        }
      }
    } catch (e) {
      console.warn('Local enquiry cache update error:', e);
    }

    // Update local payments cache if payment recorded
    if (params.recordPayment && params.amountPaid > 0) {
      try {
        const payCacheKey = 'primefitness_payments_cache';
        const rawPay = localStorage.getItem(payCacheKey);
        const payList = rawPay ? JSON.parse(rawPay) : [];
        if (Array.isArray(payList)) {
          payList.unshift({
            id: 'pay-local-' + Date.now(),
            receipt_number: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            member_id: localMember.id,
            member_name: localMember.full_name,
            amount: params.amountPaid,
            payment_method: params.paymentMethod || 'upi',
            reference_id: params.paymentReference || null,
            payment_date: startDate,
            notes: `Initial membership payment for ${params.packageName}`,
            created_at: new Date().toISOString(),
          });
          localStorage.setItem(payCacheKey, JSON.stringify(payList));
        }
      } catch (e) {
        console.warn('Local payments cache update error:', e);
      }
    }

    try {
      window.dispatchEvent(new CustomEvent('primefitness:data-changed', {
        detail: { type: 'member-converted', member: localMember, enquiryId: params.enquiryId },
      }));
    } catch {
      // ignore
    }

    return { success: true, data: localMember, isLive: false };
  }

  // 1. Resolve active authenticated session
  let session = params.sessionOverride;
  if (!session) {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) {
      console.warn('Session retrieval error:', sessionErr.message);
    }
    session = sessionData?.session;
  }

  if (!session?.user || !session.access_token) {
    return {
      success: false,
      isLive: false,
      error: 'Authentication required. Please sign in as staff or owner to convert leads to members.',
    };
  }

  if (session.expires_at && session.expires_at * 1000 < Date.now()) {
    try {
      const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
      if (refreshErr || !refreshData?.session) {
        return {
          success: false,
          isLive: false,
          error: 'Authentication session expired. Please sign in again.',
        };
      }
      session = refreshData.session;
    } catch {
      return {
        success: false,
        isLive: false,
        error: 'Authentication session expired. Please sign in again.',
      };
    }
  }

  try {
    const client = getAuthenticatedClient(session.access_token);

    // 2. Concurrency & duplicate conversion check: Check if enquiry is already converted
    const { data: currentEnq, error: checkEnqErr } = await client
      .from('enquiries')
      .select('id, status, full_name, notes')
      .eq('id', params.enquiryId)
      .maybeSingle();

    if (checkEnqErr) {
      console.warn('Enquiry status verification notice:', checkEnqErr.message);
    }

    if (currentEnq && currentEnq.status === 'converted') {
      return {
        success: false,
        isLive: true,
        error: `This enquiry for "${currentEnq.full_name}" has already been converted to a member. Duplicate conversion was blocked.`,
      };
    }

    // 3. Resolve genuine package UUID
    let resolvedPackageId: string | null = isValidUUID(params.packageId) ? params.packageId! : null;
    if (!resolvedPackageId && params.packageName) {
      try {
        const { data: dbPkgs } = await client
          .from('packages')
          .select('id, name')
          .ilike('name', params.packageName.trim());
        if (dbPkgs && dbPkgs.length > 0) {
          resolvedPackageId = dbPkgs[0].id;
        }
      } catch (e) {
        console.warn('Package UUID resolution notice:', e);
      }
    }

    // 4. Calculate collision-free unique member code with retry support
    let maxNum = 1000;
    try {
      const { data: existingCodes } = await client
        .from('members')
        .select('member_code');

      if (existingCodes && existingCodes.length > 0) {
        for (const row of existingCodes) {
          if (row.member_code) {
            const match = row.member_code.match(/PF-(\d+)/i);
            if (match && match[1]) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > maxNum) {
                maxNum = num;
              }
            }
          }
        }
      }
    } catch (codeErr) {
      console.warn('Failed to query existing member codes from DB:', codeErr);
    }

    // Compare with local cache as well
    const local = getLocalMembers();
    for (const m of local) {
      const match = m.member_code?.match(/PF-(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    // 5. Insert member with automatic retry if unique member_code collision occurs
    let newMember: Member | null = null;
    let insertAttempt = 0;
    let currentCodeNum = maxNum + 1;
    let lastError: any = null;

    while (insertAttempt < 3 && !newMember) {
      insertAttempt++;
      const candidateCode = `PF-${currentCodeNum}`;

      const memberPayload = {
        member_code: candidateCode,
        full_name: params.fullName.trim(),
        phone: params.phone.trim(),
        email: params.email ? params.email.trim() : null,
        gender: params.gender || null,
        date_of_birth: params.dateOfBirth || null,
        address: params.address ? params.address.trim() : null,
        emergency_contact: params.emergencyContact ? params.emergencyContact.trim() : null,
        package_id: resolvedPackageId,
        package_name: params.packageName,
        joined_date: startDate,
        start_date: startDate,
        expiry_date: expiryDate,
        status,
        amount_paid: Number(params.amountPaid) || 0,
        balance_due: balanceDue,
        notes: params.notes ? params.notes.trim() : null,
        created_by: session.user.id,
      };

      const { data, error } = await client
        .from('members')
        .insert([memberPayload])
        .select()
        .single();

      if (error) {
        lastError = error;
        // Check if collision is on member_code (code 23505)
        if (error.code === '23505' && (error.message?.includes('member_code') || error.details?.includes('member_code'))) {
          currentCodeNum++;
          continue;
        } else {
          // If error is for another reason (e.g. RLS or permissions), break immediately
          break;
        }
      }

      if (data) {
        newMember = data as Member;
      }
    }

    if (!newMember) {
      console.error('[ConvertEnquiry Error]', lastError);
      return {
        success: false,
        isLive: true,
        error: `Failed to create member in Supabase (${lastError?.code || 'unknown'}): ${lastError?.message || 'Database insert rejected'}${lastError?.hint ? ' - ' + lastError.hint : ''}`,
      };
    }

    // 6. Record payment receipt if requested and amountPaid > 0
    if (params.recordPayment && params.amountPaid > 0) {
      try {
        const paymentPayload = {
          receipt_number: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          member_id: isValidUUID(newMember.id) ? newMember.id : null,
          member_name: newMember.full_name,
          amount: Number(params.amountPaid),
          payment_method: params.paymentMethod || 'upi',
          reference_id: params.paymentReference ? params.paymentReference.trim() : null,
          payment_date: startDate,
          notes: `Membership fee for ${params.packageName} (Converted from Enquiry)`,
          recorded_by: session.user.id,
        };

        const { error: payErr } = await client
          .from('payments')
          .insert([paymentPayload]);

        if (payErr) {
          console.warn('Payment record creation notice:', payErr.message);
        } else {
          // Also update local payments cache
          try {
            const payCacheKey = 'primefitness_payments_cache';
            const rawPay = localStorage.getItem(payCacheKey);
            const payList = rawPay ? JSON.parse(rawPay) : [];
            if (Array.isArray(payList)) {
              payList.unshift({
                ...paymentPayload,
                id: 'pay-db-' + Date.now(),
                created_at: new Date().toISOString(),
              });
              localStorage.setItem(payCacheKey, JSON.stringify(payList));
            }
          } catch {
            // ignore
          }
        }
      } catch (payEx) {
        console.warn('Payment insert exception:', payEx);
      }
    }

    // 7. Update enquiry status to 'converted' with link to new member
    const conversionStamp = `[Converted to Member ${newMember.member_code} (${newMember.full_name}) on ${startDate}]`;
    const existingNotes = currentEnq?.notes || params.notes || '';
    const updatedNotes = existingNotes ? `${existingNotes} | ${conversionStamp}` : conversionStamp;

    try {
      // First attempt: update status, updated_at, notes, and member_id / converted_at
      const { error: enqUpdateErr } = await client
        .from('enquiries')
        .update({
          status: 'converted',
          notes: updatedNotes,
          member_id: isValidUUID(newMember.id) ? newMember.id : null,
          converted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.enquiryId);

      if (enqUpdateErr) {
        // If column member_id or converted_at is missing from remote schema, fallback to standard update
        console.warn('Extended enquiry update notice:', enqUpdateErr.message);
        await client
          .from('enquiries')
          .update({
            status: 'converted',
            notes: updatedNotes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', params.enquiryId);
      }
    } catch (enqEx) {
      console.warn('Enquiry status update exception:', enqEx);
    }

    // 8. Update local storage caches for instant zero-lag UI updates across tabs
    const currentMembers = getLocalMembers();
    const filtered = currentMembers.filter(m => m.id !== newMember!.id && m.member_code !== newMember!.member_code);
    filtered.unshift(newMember);
    saveLocalMembers(filtered);

    try {
      const enqCacheKey = 'primefitness_enquiries_cache';
      const rawEnq = localStorage.getItem(enqCacheKey);
      if (rawEnq) {
        const enqList = JSON.parse(rawEnq);
        if (Array.isArray(enqList)) {
          const idx = enqList.findIndex((e: any) => e.id === params.enquiryId);
          if (idx !== -1) {
            enqList[idx].status = 'converted';
            enqList[idx].notes = updatedNotes;
            localStorage.setItem(enqCacheKey, JSON.stringify(enqList));
          }
        }
      }
    } catch {
      // ignore
    }

    try {
      window.dispatchEvent(new CustomEvent('primefitness:data-changed', {
        detail: { type: 'member-converted', member: newMember, enquiryId: params.enquiryId },
      }));
    } catch {
      // ignore
    }

    return { success: true, data: newMember, isLive: true };
  } catch (err: any) {
    console.error('[ConvertEnquiry Exception]', err);
    return {
      success: false,
      isLive: false,
      error: err?.message || 'Unexpected network error converting enquiry to member.',
    };
  }
}




