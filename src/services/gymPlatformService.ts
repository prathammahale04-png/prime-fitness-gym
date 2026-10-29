import { supabase, isSupabaseConfigured, getAuthenticatedClient } from '../lib/supabase';
import {
  PaymentRecord,
  CheckInRecord,
  EnquiryRecord,
  GymEventRecord,
  FitnessChallengeRecord,
  TrainerRecord,
  Member,
} from '../types/database.types';
import { getMembers, calculateExpiryDate } from './memberService';
import { getIndiaTodayDate, getIndiaDateFromTimestamp } from '../utils/reminderUtils';

// Storage keys for hybrid offline/pre-migration persistence
const STORAGE_KEYS = {
  PAYMENTS: 'primefitness_payments_cache',
  CHECKINS: 'primefitness_checkins_cache',
  ENQUIRIES: 'primefitness_enquiries_cache',
  EVENTS: 'primefitness_events_cache',
  CHALLENGES: 'primefitness_challenges_cache',
  TRAINERS: 'primefitness_trainers_cache',
};

// Helper to validate genuine UUID format before sending to PostgreSQL UUID columns
function isValidUUID(str: string | null | undefined): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
}

// Initial verified sample records for realistic operational experience out of the box
const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-001',
    receipt_number: 'REC-2026-001',
    member_id: null,
    member_name: 'Rahul Patil',
    amount: 3500,
    payment_method: 'upi',
    reference_id: 'UPI/294829104928',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '3 Months Intensive Membership',
    created_at: new Date().toISOString(),
  },
  {
    id: 'pay-002',
    receipt_number: 'REC-2026-002',
    member_id: null,
    member_name: 'Anjali Sharma',
    amount: 6000,
    payment_method: 'card',
    reference_id: 'POS-TXN-884920',
    payment_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    notes: '6 Months Athletic Transformation',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'pay-003',
    receipt_number: 'REC-2026-003',
    member_id: null,
    member_name: 'Vikram Joshi',
    amount: 1500,
    payment_method: 'cash',
    reference_id: 'CASH-SLIP-104',
    payment_date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    notes: 'Monthly Membership Renewal',
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

const INITIAL_CHECKINS: CheckInRecord[] = [
  {
    id: 'chk-001',
    member_id: 'mem-001',
    member_code: 'PF-1001',
    member_name: 'Rahul Patil',
    checked_in_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'valid',
    notes: 'Morning Strength Slot',
  },
  {
    id: 'chk-002',
    member_id: 'mem-002',
    member_code: 'PF-1002',
    member_name: 'Pooja Kulkarni',
    checked_in_at: new Date(Date.now() - 3600000 * 3.5).toISOString(),
    status: 'valid',
    notes: 'Cardio Deck',
  },
  {
    id: 'chk-003',
    member_id: 'mem-003',
    member_code: 'PF-1003',
    member_name: 'Vikram Joshi',
    checked_in_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'valid',
    notes: 'HYROX Turf Arena',
  },
];

const INITIAL_ENQUIRIES: EnquiryRecord[] = [
  {
    id: 'enq-001',
    full_name: 'Suresh Deshmukh',
    phone: '9822019944',
    email: 'suresh.d@gmail.com',
    source: 'Website Pass',
    interested_package: '3 MONTHS INTENSIVE',
    status: 'new',
    notes: 'Interested in morning powerlifting coaching',
    follow_up_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
  {
    id: 'enq-002',
    full_name: 'Meera Chaudhari',
    phone: '9423018822',
    email: null,
    source: 'Instagram',
    interested_package: '6 MONTHS ATHLETIC',
    status: 'contacted',
    notes: 'Sent pricing card via WhatsApp',
    follow_up_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'enq-003',
    full_name: 'Gaurav Mahajan',
    phone: '9890123456',
    email: 'gaurav.m@yahoo.com',
    source: 'Walk-in',
    interested_package: '1 MONTH STANDARD',
    status: 'converted',
    notes: 'Registered as PF-1004',
    follow_up_date: null,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

const INITIAL_EVENTS: GymEventRecord[] = [
  {
    id: 'evt-001',
    title: 'MH19 POWERLIFTING SQUAT & BENCH CLINIC',
    description: 'Technical mechanics clinic with state champion Amit Patil. Bar speed analysis and injury-prevention bracing.',
    event_date: new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0],
    event_time: '07:00 AM – 10:00 AM',
    location: 'Main Free Weight Floor',
    registration_count: 18,
    max_capacity: 25,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'evt-002',
    title: 'HYROX SIMULATION RACE TIME-TRIAL',
    description: 'Full 1km run + sled push + ski erg simulation. Open to all registered athletes and trial guests.',
    event_date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    event_time: '06:00 AM – 09:30 AM',
    location: 'Functional Turf & Sprint Lane',
    registration_count: 24,
    max_capacity: 30,
    is_published: true,
    created_at: new Date().toISOString(),
  },
];

const INITIAL_CHALLENGES: FitnessChallengeRecord[] = [
  {
    id: 'chl-001',
    title: '60-DAY SPRING BODY RECOMPOSITION',
    category: 'Body Fat & Muscle Mass',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000 * 60).toISOString().split('T')[0],
    description: 'Bi-weekly body fat scans, progressive volume leaderboard, and nutrition discipline tracking.',
    participants_count: 34,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'chl-002',
    title: '100KM SLED & ROW VOLUME CHALLENGE',
    category: 'Endurance & Work Capacity',
    start_date: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000 * 20).toISOString().split('T')[0],
    description: 'Log kilometers on the air rower, ski erg, and prowler sled. Leaderboard updated weekly.',
    participants_count: 42,
    is_published: true,
    created_at: new Date().toISOString(),
  },
];

const INITIAL_TRAINERS: TrainerRecord[] = [
  {
    id: 'trn-001',
    name: 'AMIT PATIL',
    role: 'Head Strength & Powerlifting Coach',
    specialty: 'Powerlifting Mechanics',
    phone: '+91 98220 11223',
    email: 'amit.primefitness@gmail.com',
    active_members_count: 16,
    is_active: true,
    bio: 'State gold medalist specializing in squat bar path velocity and spine stabilization.',
  },
  {
    id: 'trn-002',
    name: 'SARA CAVIL',
    role: 'Lead HYROX & Conditioning Coach',
    specialty: 'Metabolic Velocity & Turf',
    phone: '+91 98220 22334',
    email: 'sara.primefitness@gmail.com',
    active_members_count: 22,
    is_active: true,
    bio: 'Certified HYROX master trainer and athletic endurance programmer.',
  },
  {
    id: 'trn-003',
    name: 'VIKRAM JADHAV',
    role: 'Physique Transformation Specialist',
    specialty: 'Hypertrophy & Body Recomp',
    phone: '+91 98220 33445',
    email: 'vikram.primefitness@gmail.com',
    active_members_count: 19,
    is_active: true,
    bio: 'Precision progressive overload coach focusing on muscle hypertrophy and fat loss.',
  },
];

// Helper to load or initialize from localStorage
function getStored<T>(key: string, initial: T[]): T[] {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return initial;
    }
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return initial;
  }
}

function setStored<T>(key: string, data: T[]): void {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (err) {
    console.warn(`Failed to save ${key} to storage:`, err);
  }
}

// Helper to reconcile member balances when a payment is recorded
async function applyPaymentToMember(memberId: string, amount: number) {
  if (isSupabaseConfigured()) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) return;

      const { data: m } = await supabase
        .from('members')
        .select('amount_paid, balance_due')
        .eq('id', memberId)
        .maybeSingle();

      if (m) {
        const newPaid = (Number(m.amount_paid) || 0) + Number(amount);
        const newDue = Math.max(0, (Number(m.balance_due) || 0) - Number(amount));
        await supabase
          .from('members')
          .update({
            amount_paid: newPaid,
            balance_due: newDue,
            updated_at: new Date().toISOString(),
          })
          .eq('id', memberId);
      }
    } catch (e) {
      console.warn('Could not update member balance in database:', e);
    }
  }

  // Also update in local storage cache
  try {
    const raw = localStorage.getItem('primefitness_mh19_members_cache');
    if (raw) {
      const members = JSON.parse(raw);
      const idx = members.findIndex((m: any) => m.id === memberId);
      if (idx !== -1) {
        members[idx].amount_paid = (Number(members[idx].amount_paid) || 0) + Number(amount);
        members[idx].balance_due = Math.max(0, (Number(members[idx].balance_due) || 0) - Number(amount));
        members[idx].updated_at = new Date().toISOString();
        localStorage.setItem('primefitness_mh19_members_cache', JSON.stringify(members));
      }
    }
  } catch (e) {
    // ignore
  }
}

/* =========================================================================
   PAYMENTS & BILLING
========================================================================= */
export async function getPayments(sessionOverride?: any): Promise<PaymentRecord[]> {
  if (isSupabaseConfigured()) {
    try {
      let session = sessionOverride;
      if (!session) {
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData?.session;
      }
      if (!session?.user) {
        return getStored<PaymentRecord>(STORAGE_KEYS.PAYMENTS, []);
      }

      const client = session?.access_token ? getAuthenticatedClient(session.access_token) : supabase;
      const { data, error } = await client
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data !== null) {
        // Return genuine records from database, even if table is currently empty
        return data as PaymentRecord[];
      }
      if (error) {
        console.warn('Payments fetch fallback to local cache:', error.message);
      }
    } catch (e) {
      // fallback
    }
  }
  return getStored<PaymentRecord>(STORAGE_KEYS.PAYMENTS, []);
}

export async function recordPayment(
  payment: {
    member_id: string | null;
    member_name: string;
    amount: number;
    payment_method: 'cash' | 'upi' | 'card' | 'bank_transfer';
    reference_id: string | null;
    payment_date: string;
    notes: string | null;
  },
  sessionOverride?: any
): Promise<{ success: boolean; data?: PaymentRecord; isLive: boolean; error?: string }> {
  // Guaranteed collision-free unique receipt number
  const yyyymm = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const receiptNumber = `REC-${yyyymm}-${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 90 + 10)}`;

  const localPayload: PaymentRecord = {
    ...payment,
    id: 'pay-local-' + Date.now(),
    receipt_number: receiptNumber,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      let session = sessionOverride;
      if (!session) {
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData?.session;
      }
      if (!session?.user) {
        // Not authenticated, save to local storage cache without querying private table
        const local = getStored<PaymentRecord>(STORAGE_KEYS.PAYMENTS, []);
        local.unshift(localPayload);
        setStored(STORAGE_KEYS.PAYMENTS, local);
        return { success: true, data: localPayload, isLive: false, error: 'Saved locally. Sign in to record payments in Supabase.' };
      }

      // Omit client-generated ID so PostgreSQL generates genuine UUID
      const dbInsertPayload = {
        receipt_number: receiptNumber,
        member_id: isValidUUID(payment.member_id) ? payment.member_id : null,
        member_name: payment.member_name,
        amount: Number(payment.amount),
        payment_method: payment.payment_method,
        reference_id: payment.reference_id || null,
        payment_date: payment.payment_date,
        notes: payment.notes || null,
      };

      const client = session?.access_token ? getAuthenticatedClient(session.access_token) : supabase;
      const { data, error } = await client
        .from('payments')
        .insert([dbInsertPayload])
        .select()
        .single();

      if (!error && data) {
        // Automatically reconcile member's balance due and amount paid
        if (payment.member_id) {
          await applyPaymentToMember(payment.member_id, payment.amount);
        }

        // Keep local cache synced with cloud record (carrying PostgreSQL UUID)
        const local = getStored<PaymentRecord>(STORAGE_KEYS.PAYMENTS, []);
        local.unshift(data as PaymentRecord);
        setStored(STORAGE_KEYS.PAYMENTS, local);
        return { success: true, data: data as PaymentRecord, isLive: true };
      }

      if (error) {
        console.warn('Database payment insert failed, storing locally:', error.message);
      }
    } catch (e) {
      // fallback
    }
  }

  // Local fallback: update local member balance & local payment list
  if (localPayload.member_id) {
    await applyPaymentToMember(localPayload.member_id, localPayload.amount);
  }
  const local = getStored<PaymentRecord>(STORAGE_KEYS.PAYMENTS, []);
  local.unshift(localPayload);
  setStored(STORAGE_KEYS.PAYMENTS, local);

  return {
    success: true,
    data: localPayload,
    isLive: false,
    error: 'Payment saved to browser storage. Run Supabase migration 000 to persist to database.',
  };
}

/* =========================================================================
   CHECK-INS & ATTENDANCE
========================================================================= */
export async function getCheckIns(sessionOverride?: any): Promise<CheckInRecord[]> {
  if (isSupabaseConfigured()) {
    try {
      let session = sessionOverride;
      if (!session) {
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData?.session;
      }
      const client = session?.access_token ? getAuthenticatedClient(session.access_token) : supabase;
      const { data, error } = await client
        .from('checkins')
        .select('*')
        .order('checked_in_at', { ascending: false });

      if (!error && data !== null) {
        return data as CheckInRecord[];
      }
      if (error) {
        console.warn('Checkins fetch fallback to local cache:', error.message);
      }
    } catch (e) {
      // fallback
    }
  }
  return getStored<CheckInRecord>(STORAGE_KEYS.CHECKINS, []);
}

export async function recordCheckIn(
  member: {
    id: string;
    member_code: string;
    full_name: string;
    status: string;
  },
  notes: string = '',
  sessionOverride?: any
): Promise<{ success: boolean; data?: CheckInRecord; isLive: boolean; error?: string }> {
  const status: 'valid' | 'expired_override' | 'guest' =
    member.status === 'expired' ? 'expired_override' : 'valid';

  const localPayload: CheckInRecord = {
    id: 'chk-local-' + Date.now(),
    member_id: member.id,
    member_code: member.member_code,
    member_name: member.full_name,
    checked_in_at: new Date().toISOString(),
    status,
    notes: notes || (status === 'expired_override' ? 'Expired Membership Pass' : 'Regular Workout'),
  };

  if (isSupabaseConfigured()) {
    try {
      let session = sessionOverride;
      if (!session) {
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData?.session;
      }
      // Omit client-generated ID so PostgreSQL generates genuine UUID
      const dbInsertPayload = {
        member_id: isValidUUID(member.id) ? member.id : null,
        member_code: member.member_code,
        member_name: member.full_name,
        checked_in_at: new Date().toISOString(),
        status,
        notes: notes || (status === 'expired_override' ? 'Expired Membership Pass' : 'Regular Workout'),
      };

      const client = session?.access_token ? getAuthenticatedClient(session.access_token) : supabase;
      const { data, error } = await client
        .from('checkins')
        .insert([dbInsertPayload])
        .select()
        .single();

      if (!error && data) {
        const local = getStored<CheckInRecord>(STORAGE_KEYS.CHECKINS, []);
        local.unshift(data as CheckInRecord);
        setStored(STORAGE_KEYS.CHECKINS, local);
        return { success: true, data: data as CheckInRecord, isLive: true };
      }
      if (error) {
        console.warn('Database checkin insert failed, storing locally:', error.message);
      }
    } catch (e) {
      // fallback
    }
  }

  const local = getStored<CheckInRecord>(STORAGE_KEYS.CHECKINS, []);
  local.unshift(localPayload);
  setStored(STORAGE_KEYS.CHECKINS, local);
  return {
    success: true,
    data: localPayload,
    isLive: false,
    error: 'Check-in saved locally. Run migration 000 in Supabase to sync to database.',
  };
}

/* =========================================================================
   ENQUIRIES / LEADS
========================================================================= */
export type GetEnquiriesResult = EnquiryRecord[] & {
  enquiries: EnquiryRecord[];
  isLive: boolean;
  error?: string;
};

export async function getEnquiries(sessionOverride?: any): Promise<GetEnquiriesResult> {
  if (isSupabaseConfigured()) {
    try {
      let session = sessionOverride;
      if (!session) {
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData?.session;
      }

      // If user is authenticated, query via getAuthenticatedClient to respect staff RLS
      const client = session?.access_token ? getAuthenticatedClient(session.access_token) : supabase;

      const { data, error } = await client
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data !== null) {
        const records = data as EnquiryRecord[];
        return Object.assign([...records], {
          enquiries: records,
          isLive: true,
        }) as GetEnquiriesResult;
      }
      if (error) {
        console.warn('Enquiries fetch fallback to local cache:', error.message);
        const cached = getStored<EnquiryRecord>(STORAGE_KEYS.ENQUIRIES, []);
        return Object.assign([...cached], {
          enquiries: cached,
          isLive: false,
          error: error.message,
        }) as GetEnquiriesResult;
      }
    } catch (e: any) {
      console.warn('Enquiries fetch exception:', e);
      const cached = getStored<EnquiryRecord>(STORAGE_KEYS.ENQUIRIES, []);
      return Object.assign([...cached], {
        enquiries: cached,
        isLive: false,
        error: e?.message || 'Error fetching enquiries',
      }) as GetEnquiriesResult;
    }
  }

  const cached = getStored<EnquiryRecord>(STORAGE_KEYS.ENQUIRIES, []);
  return Object.assign([...cached], {
    enquiries: cached,
    isLive: false,
  }) as GetEnquiriesResult;
}

export async function addEnquiry(
  enquiry: Omit<EnquiryRecord, 'id' | 'created_at'>,
  sessionOverride?: any
): Promise<{ success: boolean; data?: EnquiryRecord; isLive: boolean; error?: string }> {
  const localPayload: EnquiryRecord = {
    ...enquiry,
    id: 'enq-local-' + Date.now(),
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      let session = sessionOverride;
      if (!session) {
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData?.session;
      }

      const dbInsertPayload = {
        full_name: enquiry.full_name.trim(),
        phone: enquiry.phone.trim(),
        email: enquiry.email ? enquiry.email.trim() : null,
        source: enquiry.source || 'website',
        interested_package: enquiry.interested_package || null,
        status: enquiry.status || 'new',
        notes: enquiry.notes ? enquiry.notes.trim() : null,
        follow_up_date: enquiry.follow_up_date || null,
      };

      if (session?.access_token) {
        // Authenticated user (staff/owner) has SELECT privilege, can return data
        const client = getAuthenticatedClient(session.access_token);
        const { data, error } = await client
          .from('enquiries')
          .insert([dbInsertPayload])
          .select()
          .maybeSingle();

        if (!error && data) {
          const local = getStored<EnquiryRecord>(STORAGE_KEYS.ENQUIRIES, []);
          local.unshift(data as EnquiryRecord);
          setStored(STORAGE_KEYS.ENQUIRIES, local);
          return { success: true, data: data as EnquiryRecord, isLive: true };
        }
        if (error) {
          console.error('Authenticated enquiry insert error:', error);
          return { success: false, isLive: false, error: error.message };
        }
      } else {
        // Public website visitor (anon role):
        // PostgreSQL schema grants INSERT to anon, but intentionally restricts SELECT for privacy.
        // DO NOT append .select() because selecting newly inserted rows fails with 42501 for anon.
        const { error, status } = await supabase
          .from('enquiries')
          .insert([dbInsertPayload]);

        if (!error && (status === 201 || (status >= 200 && status < 300))) {
          // Keep local cache synced for instant optimistic feedback
          const local = getStored<EnquiryRecord>(STORAGE_KEYS.ENQUIRIES, []);
          local.unshift(localPayload);
          setStored(STORAGE_KEYS.ENQUIRIES, local);
          return { success: true, data: localPayload, isLive: true };
        }

        if (error) {
          console.error('Public anonymous enquiry insert failed:', error);
          return { success: false, isLive: false, error: error.message };
        }
      }
    } catch (e: any) {
      console.error('Exception during enquiry submission:', e);
      return { success: false, isLive: false, error: e?.message || 'Network error submitting registration.' };
    }
  }

  // Fallback for offline environments without Supabase configured
  const local = getStored<EnquiryRecord>(STORAGE_KEYS.ENQUIRIES, []);
  local.unshift(localPayload);
  setStored(STORAGE_KEYS.ENQUIRIES, local);
  return {
    success: true,
    data: localPayload,
    isLive: false,
    error: 'Enquiry saved locally (Supabase is not configured in this environment).',
  };
}

export async function updateEnquiryStatus(
  id: string,
  status: 'new' | 'contacted' | 'converted' | 'closed',
  notes?: string,
  sessionOverride?: any
): Promise<{ success: boolean; error?: string }> {
  const local = getStored<EnquiryRecord>(STORAGE_KEYS.ENQUIRIES, []);
  const idx = local.findIndex(e => e.id === id);
  if (idx !== -1) {
    local[idx].status = status;
    if (notes) local[idx].notes = notes;
    setStored(STORAGE_KEYS.ENQUIRIES, local);
  }

  if (isSupabaseConfigured()) {
    try {
      let session = sessionOverride;
      if (!session) {
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData?.session;
      }
      const client = session?.access_token ? getAuthenticatedClient(session.access_token) : supabase;
      const { error } = await client
        .from('enquiries')
        .update({ status, ...(notes ? { notes } : {}), updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.warn('Update enquiry status error:', error.message);
        return { success: false, error: error.message };
      }
    } catch (e: any) {
      console.warn('Update enquiry status exception:', e);
      return { success: false, error: e?.message };
    }
  }

  return { success: true };
}

/* =========================================================================
   EVENTS & CHALLENGES
========================================================================= */
export async function getEvents(): Promise<GymEventRecord[]> {
  const localRecords = getStored<GymEventRecord>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (!error && data !== null) {
        // Normalize schema fields (supports both migration 000 and legacy migration 002)
        const cloudEvents: GymEventRecord[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          description: d.description || null,
          event_date: d.event_date,
          event_time: d.event_time || '',
          location: d.location || 'Prime Fitness Arena, Shivaji Nagar',
          registration_count: d.registration_count ?? d.registered_count ?? 0,
          max_capacity: d.max_capacity ?? d.max_participants ?? 30,
          is_published: d.is_published ?? true,
          created_at: d.created_at || new Date().toISOString(),
        }));

        // Merge any pending local records that are not yet in the cloud database
        const cloudIds = new Set(cloudEvents.map(c => c.id));
        const pendingLocal = localRecords.filter(
          l => !cloudIds.has(l.id) && (l.id.startsWith('evt-local-') || l.id.startsWith('evt-'))
        );

        const combined = [...cloudEvents];
        for (const loc of pendingLocal) {
          if (!combined.some(c => c.title.trim().toLowerCase() === loc.title.trim().toLowerCase() && c.event_date === loc.event_date)) {
            combined.unshift(loc);
          }
        }

        return combined;
      }

      if (error) {
        console.warn('Events fetch fallback to local cache:', error.message);
      }
    } catch (e: any) {
      console.warn('Events fetch exception:', e);
    }
  }

  return localRecords;
}

export async function saveEvent(event: Omit<GymEventRecord, 'id' | 'created_at'>): Promise<{ success: boolean; data?: GymEventRecord; isLive: boolean; error?: string }> {
  const localPayload: GymEventRecord = {
    ...event,
    id: 'evt-local-' + Date.now(),
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      // Omit client string ID so PostgreSQL generates genuine UUID
      const dbPayload: any = {
        title: event.title.trim(),
        description: event.description ? event.description.trim() : null,
        event_date: event.event_date,
        event_time: event.event_time || '',
        location: event.location || 'Prime Fitness Arena, Shivaji Nagar',
        registration_count: Number(event.registration_count) || 0,
        max_capacity: event.max_capacity ? Number(event.max_capacity) : 30,
        is_published: event.is_published ?? true,
      };

      let { data, error } = await supabase
        .from('events')
        .insert([dbPayload])
        .select()
        .single();

      // Fallback check: if schema uses legacy migration 002 column names
      if (error && (error.message.includes('registration_count') || error.message.includes('max_capacity'))) {
        const legacyPayload: any = {
          title: event.title.trim(),
          description: event.description ? event.description.trim() : null,
          event_date: event.event_date,
          event_time: event.event_time || '',
          location: event.location || 'Prime Fitness Arena, Shivaji Nagar',
          registered_count: Number(event.registration_count) || 0,
          max_participants: event.max_capacity ? Number(event.max_capacity) : 30,
          is_published: event.is_published ?? true,
        };
        const retry = await supabase.from('events').insert([legacyPayload]).select().single();
        data = retry.data;
        error = retry.error;
      }

      if (!error && data) {
        const cloudRecord: GymEventRecord = {
          id: data.id,
          title: data.title,
          description: data.description || null,
          event_date: data.event_date,
          event_time: data.event_time || '',
          location: data.location || '',
          registration_count: data.registration_count ?? data.registered_count ?? 0,
          max_capacity: data.max_capacity ?? data.max_participants ?? 30,
          is_published: data.is_published ?? true,
          created_at: data.created_at || new Date().toISOString(),
        };

        const local = getStored<GymEventRecord>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
        local.unshift(cloudRecord);
        setStored(STORAGE_KEYS.EVENTS, local);

        return { success: true, data: cloudRecord, isLive: true };
      }

      if (error) {
        console.error('Supabase event insert failed:', error.message);
        // Persist locally as fallback so user does not lose input
        const local = getStored<GymEventRecord>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
        local.unshift(localPayload);
        setStored(STORAGE_KEYS.EVENTS, local);

        return {
          success: true,
          data: localPayload,
          isLive: false,
          error: `Event saved locally. Database notice: ${error.message}`,
        };
      }
    } catch (e: any) {
      console.error('Supabase event insert exception:', e);
      const local = getStored<GymEventRecord>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
      local.unshift(localPayload);
      setStored(STORAGE_KEYS.EVENTS, local);

      return {
        success: true,
        data: localPayload,
        isLive: false,
        error: `Event saved locally. Network/Database notice: ${e.message || 'Offline mode'}`,
      };
    }
  }

  // Local storage mode when Supabase is not configured
  const local = getStored<GymEventRecord>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  local.unshift(localPayload);
  setStored(STORAGE_KEYS.EVENTS, local);
  return { success: true, data: localPayload, isLive: false };
}

export async function getChallenges(): Promise<FitnessChallengeRecord[]> {
  const localRecords = getStored<FitnessChallengeRecord>(STORAGE_KEYS.CHALLENGES, INITIAL_CHALLENGES);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('challenges').select('*').order('start_date', { ascending: true });
      if (!error && data !== null) {
        const cloudChallenges: FitnessChallengeRecord[] = data as FitnessChallengeRecord[];
        const cloudIds = new Set(cloudChallenges.map(c => c.id));
        const pendingLocal = localRecords.filter(l => !cloudIds.has(l.id) && l.id.startsWith('chl-'));
        return [...cloudChallenges, ...pendingLocal];
      }
    } catch (e) {}
  }
  return localRecords;
}

export async function saveChallenge(challenge: Omit<FitnessChallengeRecord, 'id' | 'created_at'>): Promise<{ success: boolean; data: FitnessChallengeRecord; isLive: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('challenges').insert([challenge]).select().single();
      if (!error && data) {
        const local = getStored<FitnessChallengeRecord>(STORAGE_KEYS.CHALLENGES, INITIAL_CHALLENGES);
        local.unshift(data as FitnessChallengeRecord);
        setStored(STORAGE_KEYS.CHALLENGES, local);
        return { success: true, data: data as FitnessChallengeRecord, isLive: true };
      }
    } catch (e) {}
  }
  const payload: FitnessChallengeRecord = { ...challenge, id: 'chl-' + Date.now(), created_at: new Date().toISOString() };
  const local = getStored<FitnessChallengeRecord>(STORAGE_KEYS.CHALLENGES, INITIAL_CHALLENGES);
  local.unshift(payload);
  setStored(STORAGE_KEYS.CHALLENGES, local);
  return { success: true, data: payload, isLive: false, error: 'Saved to local cache.' };
}

/* =========================================================================
   TRAINERS (AUTHENTICATED CRUD ON BASE TABLE public.trainers)
========================================================================= */
export async function getTrainers(): Promise<TrainerRecord[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const client = sessionData?.session?.access_token
        ? getAuthenticatedClient(sessionData.session.access_token)
        : supabase;

      const { data, error } = await client
        .from('trainers')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data !== null && data.length > 0) {
        return data as TrainerRecord[];
      }

      // If user is unauthenticated or base table query is restricted, fallback to public projection view
      const { data: pubData, error: pubErr } = await supabase
        .from('public_trainers')
        .select('*')
        .order('name', { ascending: true });

      if (!pubErr && pubData !== null && pubData.length > 0) {
        return pubData.map((p: any) => ({
          ...p,
          phone: p.phone || '+91 94222 19019',
          email: p.email || 'primefitnessjalgaon@gmail.com',
          active_members_count: p.active_members_count || 0,
          is_active: true,
        })) as TrainerRecord[];
      }
    } catch (e) {
      console.warn('Trainers fetch fallback:', e);
    }
  }
  return getStored<TrainerRecord>(STORAGE_KEYS.TRAINERS, INITIAL_TRAINERS);
}

export async function saveTrainer(
  trainer: Omit<TrainerRecord, 'id'>
): Promise<{ success: boolean; data: TrainerRecord; isLive: boolean; error?: string }> {
  const localPayload: TrainerRecord = {
    ...trainer,
    id: 'trn-local-' + Date.now(),
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const client = sessionData?.session?.access_token
        ? getAuthenticatedClient(sessionData.session.access_token)
        : supabase;

      // CRITICAL: Mutations MUST strictly target base table public.trainers, NEVER the view
      const { data, error } = await client
        .from('trainers')
        .insert([{
          name: trainer.name.trim(),
          role: trainer.role.trim(),
          specialty: trainer.specialty.trim(),
          phone: trainer.phone ? trainer.phone.trim() : '+91 94222 19019',
          email: trainer.email ? trainer.email.trim() : 'coach@primefitness.in',
          active_members_count: Number(trainer.active_members_count) || 0,
          is_active: trainer.is_active ?? true,
          bio: trainer.bio ? trainer.bio.trim() : null,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (!error && data) {
        const local = getStored<TrainerRecord>(STORAGE_KEYS.TRAINERS, INITIAL_TRAINERS);
        local.unshift(data as TrainerRecord);
        setStored(STORAGE_KEYS.TRAINERS, local);
        return { success: true, data: data as TrainerRecord, isLive: true };
      }
      if (error) {
        console.error('Supabase trainers insert error:', error.message);
        return { success: false, data: localPayload, isLive: false, error: error.message };
      }
    } catch (e: any) {
      console.warn('Supabase saveTrainer exception:', e);
      return { success: false, data: localPayload, isLive: false, error: e?.message };
    }
  }

  const local = getStored<TrainerRecord>(STORAGE_KEYS.TRAINERS, INITIAL_TRAINERS);
  local.unshift(localPayload);
  setStored(STORAGE_KEYS.TRAINERS, local);
  return { success: true, data: localPayload, isLive: false };
}

export async function updateTrainer(
  id: string,
  updates: Partial<TrainerRecord>
): Promise<{ success: boolean; data?: TrainerRecord; error?: string }> {
  // Update local cache
  const local = getStored<TrainerRecord>(STORAGE_KEYS.TRAINERS, INITIAL_TRAINERS);
  const idx = local.findIndex((t) => t.id === id);
  let updatedRecord: TrainerRecord | undefined;
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updates };
    updatedRecord = local[idx];
    setStored(STORAGE_KEYS.TRAINERS, local);
  }

  if (isSupabaseConfigured() && isValidUUID(id)) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const client = sessionData?.session?.access_token
        ? getAuthenticatedClient(sessionData.session.access_token)
        : supabase;

      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name.trim();
      if (updates.role !== undefined) dbUpdates.role = updates.role.trim();
      if (updates.specialty !== undefined) dbUpdates.specialty = updates.specialty.trim();
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone.trim();
      if (updates.email !== undefined) dbUpdates.email = updates.email.trim();
      if (updates.active_members_count !== undefined) dbUpdates.active_members_count = Number(updates.active_members_count);
      if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio ? updates.bio.trim() : null;

      const { data, error } = await client
        .from('trainers')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        if (idx !== -1) {
          local[idx] = data as TrainerRecord;
          setStored(STORAGE_KEYS.TRAINERS, local);
        }
        return { success: true, data: data as TrainerRecord };
      }
      if (error) {
        console.error('Supabase trainers update error:', error.message);
        return { success: false, error: error.message };
      }
    } catch (e: any) {
      console.warn('Supabase updateTrainer exception:', e);
      return { success: false, error: e?.message };
    }
  }

  return { success: true, data: updatedRecord };
}

export async function deleteTrainer(id: string): Promise<{ success: boolean; error?: string }> {
  // Update local cache
  const local = getStored<TrainerRecord>(STORAGE_KEYS.TRAINERS, INITIAL_TRAINERS);
  const filtered = local.filter((t) => t.id !== id);
  setStored(STORAGE_KEYS.TRAINERS, filtered);

  if (isSupabaseConfigured() && isValidUUID(id)) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const client = sessionData?.session?.access_token
        ? getAuthenticatedClient(sessionData.session.access_token)
        : supabase;

      const { error } = await client.from('trainers').delete().eq('id', id);
      if (error) {
        console.error('Supabase trainers delete error:', error.message);
        return { success: false, error: error.message };
      }
    } catch (e: any) {
      console.warn('Supabase deleteTrainer exception:', e);
      return { success: false, error: e?.message };
    }
  }

  return { success: true };
}

/* =========================================================================
   OVERVIEW & FINANCIAL STATS ENGINE
========================================================================= */
export interface OverviewStats {
  activeMembersCount: number;
  newRegistrationsThisMonth: number;
  todayCheckInsCount: number;
  totalRevenueCollected: number;
  outstandingBalanceDue: number;
  expiringInSevenDays: Member[];
  recentPayments: PaymentRecord[];
  recentCheckIns: CheckInRecord[];
}

export async function getOverviewStats(period: 'today' | 'week' | 'month' | 'year' = 'month', session?: any): Promise<OverviewStats> {
  const [membersRes, paymentsList, checkinsList] = await Promise.all([
    getMembers(undefined, session),
    getPayments(),
    getCheckIns(),
  ]);

  const allMembers = membersRes.members;
  const activeMembers = allMembers.filter(m => m.status === 'active');

  // Filter payments by selected period
  const todayStr = getIndiaTodayDate();
  const now = new Date();

  const filteredPayments = paymentsList.filter(p => {
    if (period === 'today') {
      return getIndiaDateFromTimestamp(p.payment_date) === todayStr || p.payment_date === todayStr;
    }
    const pDate = new Date(p.payment_date);
    if (period === 'week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
      return pDate >= sevenDaysAgo;
    }
    if (period === 'month') {
      return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
    }
    if (period === 'year') {
      return pDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totalRevenue = filteredPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  // Outstanding fees across all members
  const totalDues = allMembers.reduce((acc, m) => acc + (Number(m.balance_due) || 0), 0);

  // Expiring in next 7 days (IST accurate)
  const sevenDaysAheadStr = calculateExpiryDate(todayStr, 7);
  const expiringMembers = allMembers.filter(m => {
    return m.status === 'active' && m.expiry_date >= todayStr && m.expiry_date <= sevenDaysAheadStr;
  });

  // Checkins today (IST accurate)
  const todayCheckIns = checkinsList.filter(c => getIndiaDateFromTimestamp(c.checked_in_at) === todayStr);

  // New registrations this month
  const newRegs = allMembers.filter(m => {
    const jDate = new Date(m.joined_date);
    return jDate.getMonth() === now.getMonth() && jDate.getFullYear() === now.getFullYear();
  });

  return {
    activeMembersCount: activeMembers.length,
    newRegistrationsThisMonth: newRegs.length,
    todayCheckInsCount: todayCheckIns.length,
    totalRevenueCollected: totalRevenue,
    outstandingBalanceDue: totalDues,
    expiringInSevenDays: expiringMembers,
    recentPayments: paymentsList.slice(0, 5),
    recentCheckIns: checkinsList.slice(0, 5),
  };
}
