import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Member, MemberInput, MembershipPackage, MemberStatus } from '../types/database.types';

// Fallback in-memory/localStorage cache for offline or pre-migration testing
const LOCAL_STORAGE_KEY = 'primefitness_mh19_members_cache';

function getLocalMembers(): Member[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
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
  if (!isSupabaseConfigured()) {
    let list = getLocalMembers();
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(m => m.full_name.toLowerCase().includes(q) || m.phone.includes(q) || m.member_code.toLowerCase().includes(q));
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter(m => m.status === filters.status);
    }
    return { members: list, isLive: false };
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
      return { members: local, isLive: false, error: error.message };
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

    return { members: updatedMembers, isLive: true };
  } catch (err: any) {
    return { members: getLocalMembers(), isLive: false, error: err.message };
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

  try {
    const { data, error } = await supabase
      .from('members')
      .insert([memberPayload])
      .select()
      .single();

    if (error) {
      // If table doesn't exist yet, save locally
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
      return { success: true, data: localMember, error: 'Saved locally. Run migration 002 in Supabase to sync to database.' };
    }

    return { success: true, data: data as Member };
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

  try {
    const { error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', memberId);

    if (error) {
      const list = getLocalMembers();
      const idx = list.findIndex(m => m.id === memberId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        saveLocalMembers(list);
      }
      return { success: true, error: 'Updated locally.' };
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

  try {
    const { error } = await supabase
      .from('members')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', memberId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
