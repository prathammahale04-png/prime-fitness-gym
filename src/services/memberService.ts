import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
      // In offline mode without Supabase, provide initial demo data; when Supabase is configured, empty cache on logout
      return isSupabaseConfigured() ? [] : INITIAL_MEMBERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : (isSupabaseConfigured() ? [] : INITIAL_MEMBERS);
  } catch {
    return isSupabaseConfigured() ? [] : INITIAL_MEMBERS;
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

export async function getMembers(filters?: {
  search?: string;
  status?: string;
}): Promise<{ members: Member[]; isLive: boolean; error?: string }> {
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

  // 1. Check for active Supabase Auth session before querying the private members table
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  const session = sessionData?.session;

  if (sessionErr || !session?.user) {
    // Unauthenticated request: do NOT dispatch anon query to private table
    return {
      members: applyFilters(getLocalMembers()),
      isLive: false,
      error: sessionErr
        ? `Authentication session error: ${sessionErr.message}`
        : 'Not authenticated. Showing cached records. Sign in as Admin to sync live data.',
    };
  }

  // 2. Check for expired session token
  if (session.expires_at && session.expires_at * 1000 < Date.now()) {
    return {
      members: applyFilters(getLocalMembers()),
      isLive: false,
      error: 'Authentication session expired. Please sign in again to sync live member data.',
    };
  }

  try {
    let query = supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      const term = filters.search.trim();
      query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,member_code.ilike.%${term}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Error fetching members from DB, falling back to local cache:', error.message);
      let local = getLocalMembers();
      return {
        members: applyFilters(local),
        isLive: false,
        error: error.code === '42501'
          ? 'Database permission error: authenticated session not recognized by database.'
          : error.message,
      };
    }

    // Update member statuses automatically based on expiry
    const today = new Date().toISOString().split('T')[0];
    const updatedMembers: Member[] = (data as Member[]).map(m => {
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
    saveLocalMembers(updatedMembers);

    return { members: applyFilters(updatedMembers), isLive: true };
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
  pkg: MembershipPackage
): Promise<{ success: boolean; data?: Member; error?: string }> {
  const startDate = input.start_date || new Date().toISOString().split('T')[0];
  const expiryDate = calculateExpiryDate(startDate, pkg.duration_days);
  const balanceDue = input.balance_due !== undefined ? input.balance_due : Math.max(0, pkg.price - input.amount_paid);

  const today = new Date().toISOString().split('T')[0];
  const status: MemberStatus = expiryDate < today ? 'expired' : 'active';

  const memberPayload = {
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
    amount_paid: input.amount_paid,
    balance_due: balanceDue,
    notes: input.notes ? input.notes.trim() : null,
  };

  if (!isSupabaseConfigured()) {
    const localMember: Member = {
      ...memberPayload,
      id: 'local-' + Date.now(),
      member_code: 'PF-' + Math.floor(1000 + Math.random() * 9000),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const current = getLocalMembers();
    current.unshift(localMember);
    saveLocalMembers(current);
    return { success: true, data: localMember };
  }

  // Check auth session before inserting into private table
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;
  if (!session?.user) {
    return {
      success: false,
      error: 'Authentication required. Please sign in as Admin to add members to the database.',
    };
  }
  if (session.expires_at && session.expires_at * 1000 < Date.now()) {
    return {
      success: false,
      error: 'Authentication session expired. Please sign in again.',
    };
  }

  try {
    const { data, error } = await supabase
      .from('members')
      .insert([memberPayload])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const newMember = data as Member;
    const current = getLocalMembers();
    current.unshift(newMember);
    saveLocalMembers(current);

    return { success: true, data: newMember };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save member.' };
  }
}

export async function renewMember(
  memberId: string,
  pkg: MembershipPackage,
  startDateStr: string,
  amountPaid: number
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
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;
  if (!session?.user) {
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
    const { error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', memberId);

    if (error) {
      return { success: false, error: error.message };
    }

    const list = getLocalMembers();
    const idx = list.findIndex(m => m.id === memberId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      saveLocalMembers(list);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleMemberDeactivate(
  memberId: string,
  currentStatus: string
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
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;
  if (!session?.user) {
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
    const { error } = await supabase
      .from('members')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', memberId);

    if (error) return { success: false, error: error.message };

    const list = getLocalMembers();
    const idx = list.findIndex(m => m.id === memberId);
    if (idx !== -1) {
      list[idx].status = newStatus;
      saveLocalMembers(list);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
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
    const { error } = await supabase
      .from('members')
      .update({ phone: trimmedPhone, updated_at: new Date().toISOString() })
      .eq('id', memberId);

    if (error) {
      return { success: false, error: error.message };
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
    return { success: false, error: err.message };
  }
}

