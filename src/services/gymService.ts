import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Member,
  Package,
  Payment,
  CheckIn,
  Trainer,
  Enquiry,
  GymEvent,
  Challenge,
  GymSettings,
} from '../types/gym';
import { PRIME_GYM_DATA, TRAINERS as INITIAL_TRAINERS, PRICING_PLANS } from '../data/primeGymData';

// Initial Seed Data aligned with real Prime Fitness MH19 parameters
const INITIAL_PACKAGES: Package[] = [
  {
    id: 'pkg_1m',
    name: '1 Month Membership',
    duration_type: 'monthly',
    duration_days: 30,
    price: 1500,
    description: 'Standard single month training access',
    benefits: ['Full 4000+ Sq.Ft. gym access', 'Free weight & power cages', 'Cardio deck access', 'Locker & changing room'],
    disciplines: 'Strength · Cardio · Free Weights',
    is_active: true,
  },
  {
    id: 'pkg_3m',
    name: '3 Months Prime Athlete',
    duration_type: 'quarterly',
    duration_days: 90,
    price: 3600,
    description: 'Most popular quarterly conditioning program',
    benefits: ['All 1-month plan benefits', 'Quarterly body composition check', 'Custom workout plan draft', 'Free guest pass (1/month)'],
    disciplines: 'Strength · Cardio · HYROX · Turf',
    is_active: true,
  },
  {
    id: 'pkg_6m',
    name: '6 Months Performance',
    duration_type: 'half_yearly',
    duration_days: 180,
    price: 6500,
    description: 'Medium-term athletic transformation tier',
    benefits: ['All 3-months plan benefits', 'Monthly progress review', 'Recovery lounge access', 'Discounts on Prime workshops'],
    disciplines: 'Full Facility Access · HYROX Focus',
    is_active: true,
  },
  {
    id: 'pkg_12m',
    name: '1 Year Elite Membership',
    duration_type: 'yearly',
    duration_days: 365,
    price: 11000,
    description: 'Maximum value annual athletic commitment',
    benefits: ['Unlimited facility access 365 days', 'Complimentary personal training consultation', 'Hydration station access', '2 Months membership freeze option'],
    disciplines: 'All Disciplines · Priority Cage Booking',
    is_active: true,
  },
];

const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem_01',
    member_code: 'PF-1001',
    full_name: 'Rohit Sharma',
    phone: '9822012345',
    email: 'rohit.sharma@example.com',
    gender: 'Male',
    emergency_contact: '9822012340',
    address: 'Ring Road, Jalgaon',
    status: 'active',
    package_id: 'pkg_3m',
    package_name: '3 Months Prime Athlete',
    membership_start_date: '2026-09-01',
    membership_end_date: '2026-11-30',
    notes: 'Powerlifting focus, prefers evening slot',
  },
  {
    id: 'mem_02',
    member_code: 'PF-1002',
    full_name: 'Pooja Patil',
    phone: '9423198765',
    email: 'pooja.patil@example.com',
    gender: 'Female',
    emergency_contact: '9423198700',
    address: 'Shivaji Nagar, Jalgaon',
    status: 'active',
    package_id: 'pkg_6m',
    package_name: '6 Months Performance',
    membership_start_date: '2026-06-15',
    membership_end_date: '2026-12-15',
    notes: 'HYROX conditioning and sprint turf',
  },
  {
    id: 'mem_03',
    member_code: 'PF-1003',
    full_name: 'Suresh Chaudhari',
    phone: '9765432109',
    email: 'suresh.c@example.com',
    gender: 'Male',
    status: 'expiring_soon',
    package_id: 'pkg_1m',
    package_name: '1 Month Membership',
    membership_start_date: '2026-09-22',
    membership_end_date: '2026-10-22',
    notes: 'Follow up for 3-month renewal',
  },
  {
    id: 'mem_04',
    member_code: 'PF-1004',
    full_name: 'Anjali Deshmukh',
    phone: '9158098712',
    email: 'anjali.d@example.com',
    gender: 'Female',
    status: 'expired',
    package_id: 'pkg_1m',
    package_name: '1 Month Membership',
    membership_start_date: '2026-08-10',
    membership_end_date: '2026-09-10',
    notes: 'Out of town, sent renewal message',
  },
];

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay_01',
    member_id: 'mem_01',
    member_name: 'Rohit Sharma',
    member_phone: '9822012345',
    package_id: 'pkg_3m',
    package_name: '3 Months Prime Athlete',
    amount: 3600,
    payment_date: '2026-09-01',
    payment_method: 'UPI',
    reference_no: 'UPI-7890123456',
    notes: 'GPay payment received',
    recorded_by: 'Owner',
  },
  {
    id: 'pay_02',
    member_id: 'mem_02',
    member_name: 'Pooja Patil',
    member_phone: '9423198765',
    package_id: 'pkg_6m',
    package_name: '6 Months Performance',
    amount: 6500,
    payment_date: '2026-06-15',
    payment_method: 'Card',
    reference_no: 'POS-45678',
    notes: 'Swipe at desk',
    recorded_by: 'Owner',
  },
  {
    id: 'pay_03',
    member_id: 'mem_03',
    member_name: 'Suresh Chaudhari',
    member_phone: '9765432109',
    package_id: 'pkg_1m',
    package_name: '1 Month Membership',
    amount: 1500,
    payment_date: '2026-09-22',
    payment_method: 'Cash',
    reference_no: 'RCP-1042',
    notes: 'Cash payment front desk',
    recorded_by: 'Staff',
  },
];

const INITIAL_CHECKINS: CheckIn[] = [
  {
    id: 'chk_01',
    member_id: 'mem_01',
    member_name: 'Rohit Sharma',
    member_phone: '9822012345',
    checkin_time: new Date(Date.now() - 3600000 * 2).toISOString(),
    checkin_type: 'manual',
    status: 'valid',
  },
  {
    id: 'chk_02',
    member_id: 'mem_02',
    member_name: 'Pooja Patil',
    member_phone: '9423198765',
    checkin_time: new Date(Date.now() - 3600000 * 4).toISOString(),
    checkin_type: 'manual',
    status: 'valid',
  },
];

const INITIAL_SETTINGS: GymSettings = {
  id: 'prime_fitness_main',
  gym_name: 'Prime Fitness MH19',
  city: PRIME_GYM_DATA.city,
  phone: PRIME_GYM_DATA.phone,
  email: PRIME_GYM_DATA.email,
  address: PRIME_GYM_DATA.fullAddress,
  timings: PRIME_GYM_DATA.timings,
  facility_size: PRIME_GYM_DATA.facilitySize,
  disciplines: PRIME_GYM_DATA.disciplines,
  announcements: 'Morning slot batch 6:00 AM - 7:30 AM currently operating at peak energy. Powerlifting deadlift platforms reserved for evening workshop this Saturday.',
};

const INITIAL_EVENTS: GymEvent[] = [
  {
    id: 'evt_01',
    title: 'MH19 Raw Deadlift Showdown',
    event_date: '2026-11-15',
    event_time: '5:30 PM - 8:30 PM',
    location: 'Heavy Lifting Arena, Prime Fitness Jalgaon',
    description: 'In-house strength competition across weight categories. Max pull 3 attempts.',
    max_participants: 30,
    registered_count: 14,
    is_published: true,
  },
  {
    id: 'evt_02',
    title: 'HYROX Sled & Erg Masterclass',
    event_date: '2026-11-28',
    event_time: '6:30 AM - 8:00 AM',
    location: 'Functional Turf & Erg Deck',
    description: 'Prowler sled technique, ski erg pacing, and lactic threshold management.',
    max_participants: 25,
    registered_count: 19,
    is_published: true,
  },
];

const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'chg_01',
    title: '30-Day Heavy Metal Consistency',
    start_date: '2026-10-01',
    end_date: '2026-10-31',
    description: 'Log at least 20 workout check-ins within the calendar month.',
    rules: 'Minimum 45 minutes session, logged at front-desk.',
    participants_count: 42,
    is_active: true,
  },
  {
    id: 'chg_02',
    title: '5,000m Ergometer Time Trial',
    start_date: '2026-10-15',
    end_date: '2026-11-15',
    description: 'Fastest 5k row on the commercial air erg deck. Top 3 athletes receive Prime merchandise.',
    rules: 'Verified by a certified trainer.',
    participants_count: 18,
    is_active: true,
  },
];

const INITIAL_ENQUIRIES: Enquiry[] = [
  {
    id: 'enq_01',
    full_name: 'Gaurav Mahajan',
    phone: '9890123456',
    email: 'gaurav.m@gmail.com',
    plan_interest: '3 Months Prime Athlete',
    source: 'Website Trial Pass',
    status: 'new',
    notes: 'Interested in personal training for fat loss',
    follow_up_date: '2026-10-20',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'enq_02',
    full_name: 'Sneha Kulkarni',
    phone: '9766012345',
    email: 'sneha.k@gmail.com',
    plan_interest: '1 Month Membership',
    source: 'Direct Walk-in',
    status: 'contacted',
    notes: 'Called on Oct 18, visiting this evening for trial workout',
    follow_up_date: '2026-10-19',
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

// Helper to interact with Local Storage safely
function getStore<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(`pf_${key}`);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function setStore<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`pf_${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn(`Storage write failed for ${key}:`, e);
  }
}

// Check if database tables exist in Supabase
let supabaseTablesExist: boolean | null = null;

export async function checkSupabaseSchemaStatus(): Promise<{
  configured: boolean;
  tablesReady: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      tablesReady: false,
      message: 'Supabase credentials not configured in environment variables.',
    };
  }

  try {
    const { error } = await supabase.from('packages').select('id').limit(1);
    if (error) {
      supabaseTablesExist = false;
      return {
        configured: true,
        tablesReady: false,
        message: `Tables pending in Supabase (${error.message}). Run migration in SQL Editor.`,
      };
    }

    supabaseTablesExist = true;
    return {
      configured: true,
      tablesReady: true,
      message: 'Supabase tables are active and connected.',
    };
  } catch (err: any) {
    supabaseTablesExist = false;
    return {
      configured: true,
      tablesReady: false,
      message: err.message || 'Could not verify Supabase schema.',
    };
  }
}

export const GymService = {
  // --- PACKAGES ---
  async getPackages(): Promise<Package[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('packages').select('*').order('price', { ascending: true });
        if (!error && data && data.length > 0) {
          return data as Package[];
        }
      } catch (err) {
        console.warn('Supabase getPackages failed, using local store:', err);
      }
    }
    return getStore<Package[]>('packages', INITIAL_PACKAGES);
  },

  async savePackage(pkg: Omit<Package, 'id'> & { id?: string }): Promise<Package> {
    const id = pkg.id || `pkg_${Date.now().toString(36)}`;
    const newPkg: Package = { ...pkg, id, is_active: pkg.is_active ?? true };

    // 1. Save to local store
    const list = getStore<Package[]>('packages', INITIAL_PACKAGES);
    const existingIndex = list.findIndex((p) => p.id === id);
    if (existingIndex >= 0) {
      list[existingIndex] = newPkg;
    } else {
      list.push(newPkg);
    }
    setStore('packages', list);

    // 2. Persist to Supabase if available
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('packages').upsert(newPkg);
      } catch (e) {
        console.warn('Supabase package upsert pending schema:', e);
      }
    }
    return newPkg;
  },

  async togglePackageStatus(id: string): Promise<boolean> {
    const list = getStore<Package[]>('packages', INITIAL_PACKAGES);
    const item = list.find((p) => p.id === id);
    if (item) {
      item.is_active = !item.is_active;
      setStore('packages', list);
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('packages').update({ is_active: item.is_active }).eq('id', id);
        } catch (e) {
          console.warn('Supabase toggle error:', e);
        }
      }
      return item.is_active;
    }
    return false;
  },

  // --- MEMBERS ---
  async getMembers(): Promise<Member[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('members').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as Member[];
        }
      } catch (err) {
        console.warn('Supabase getMembers fallback:', err);
      }
    }
    const members = getStore<Member[]>('members', INITIAL_MEMBERS);
    // Calculate dynamic days remaining
    const today = new Date().toISOString().split('T')[0];
    return members.map((m) => {
      const end = new Date(m.membership_end_date);
      const now = new Date(today);
      const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
      let computedStatus: Member['status'] = m.status;
      if (m.status !== 'inactive') {
        if (diffDays <= 0) computedStatus = 'expired';
        else if (diffDays <= 7) computedStatus = 'expiring_soon';
        else computedStatus = 'active';
      }
      return {
        ...m,
        status: computedStatus,
        days_remaining: diffDays,
      };
    });
  },

  async saveMember(member: Omit<Member, 'id'> & { id?: string }): Promise<Member> {
    const id = member.id || `mem_${Date.now().toString(36)}`;
    const member_code = member.member_code || `PF-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullMember: Member = {
      ...member,
      id,
      member_code,
      status: member.status || 'active',
    };

    const list = getStore<Member[]>('members', INITIAL_MEMBERS);
    const existingIndex = list.findIndex((m) => m.id === id);
    if (existingIndex >= 0) {
      list[existingIndex] = fullMember;
    } else {
      list.unshift(fullMember);
    }
    setStore('members', list);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('members').upsert(fullMember);
      } catch (e) {
        console.warn('Supabase member upsert pending schema:', e);
      }
    }
    return fullMember;
  },

  async deactivateMember(id: string): Promise<void> {
    const list = getStore<Member[]>('members', INITIAL_MEMBERS);
    const item = list.find((m) => m.id === id);
    if (item) {
      item.status = 'inactive';
      setStore('members', list);
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('members').update({ status: 'inactive' }).eq('id', id);
        } catch (e) {
          console.warn('Supabase deactivate error:', e);
        }
      }
    }
  },

  // --- BILLING & PAYMENTS ---
  async getPayments(): Promise<Payment[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('payments').select('*').order('payment_date', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as Payment[];
        }
      } catch (err) {
        console.warn('Supabase getPayments fallback:', err);
      }
    }
    return getStore<Payment[]>('payments', INITIAL_PAYMENTS);
  },

  async recordPayment(payment: Omit<Payment, 'id'> & { id?: string }): Promise<Payment> {
    const id = payment.id || `pay_${Date.now().toString(36)}`;
    const newPayment: Payment = {
      ...payment,
      id,
      payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    const list = getStore<Payment[]>('payments', INITIAL_PAYMENTS);
    list.unshift(newPayment);
    setStore('payments', list);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('payments').insert(newPayment);
      } catch (e) {
        console.warn('Supabase payment insert pending schema:', e);
      }
    }
    return newPayment;
  },

  // --- CHECK-INS ---
  async getCheckIns(): Promise<CheckIn[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('checkins').select('*').order('checkin_time', { ascending: false }).limit(50);
        if (!error && data && data.length > 0) {
          return data as CheckIn[];
        }
      } catch (err) {
        console.warn('Supabase getCheckIns fallback:', err);
      }
    }
    return getStore<CheckIn[]>('checkins', INITIAL_CHECKINS);
  },

  async recordCheckIn(member: Member): Promise<{ success: boolean; message: string; checkIn?: CheckIn }> {
    const list = getStore<CheckIn[]>('checkins', INITIAL_CHECKINS);
    const today = new Date().toDateString();

    // Prevent duplicate check-ins for the same member on the same calendar day
    const alreadyCheckedIn = list.some((c) => {
      return c.member_id === member.id && new Date(c.checkin_time).toDateString() === today;
    });

    if (alreadyCheckedIn) {
      return {
        success: false,
        message: `${member.full_name} has already checked in today.`,
      };
    }

    const checkinStatus: CheckIn['status'] =
      member.status === 'expired'
        ? 'expired_membership'
        : member.status === 'expiring_soon'
        ? 'warning'
        : 'valid';

    const newCheckIn: CheckIn = {
      id: `chk_${Date.now().toString(36)}`,
      member_id: member.id,
      member_name: member.full_name,
      member_phone: member.phone,
      checkin_time: new Date().toISOString(),
      checkin_type: 'manual',
      status: checkinStatus,
      notes: member.status === 'expired' ? 'Membership expired! Front desk renewal required.' : undefined,
    };

    list.unshift(newCheckIn);
    setStore('checkins', list);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('checkins').insert(newCheckIn);
      } catch (e) {
        console.warn('Supabase checkin insert pending schema:', e);
      }
    }

    return {
      success: true,
      message: `Check-in recorded for ${member.full_name}.`,
      checkIn: newCheckIn,
    };
  },

  // --- TRAINERS ---
  async getTrainers(): Promise<Trainer[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('trainers').select('*').order('display_order', { ascending: true });
        if (!error && data && data.length > 0) {
          return data as Trainer[];
        }
      } catch (err) {
        console.warn('Supabase getTrainers fallback:', err);
      }
    }
    const seed: Trainer[] = INITIAL_TRAINERS.map((t, idx) => ({
      id: t.id,
      name: t.name,
      role: t.role,
      specialty: t.specialty,
      phone: '+91 94222 78910',
      bio: t.bio,
      image_url: t.image,
      is_active: true,
      display_order: idx + 1,
    }));
    return getStore<Trainer[]>('trainers', seed);
  },

  async saveTrainer(trainer: Omit<Trainer, 'id'> & { id?: string }): Promise<Trainer> {
    const id = trainer.id || `trn_${Date.now().toString(36)}`;
    const fullTrainer: Trainer = { ...trainer, id, is_active: trainer.is_active ?? true };

    const list = getStore<Trainer[]>('trainers', []);
    const idx = list.findIndex((t) => t.id === id);
    if (idx >= 0) {
      list[idx] = fullTrainer;
    } else {
      list.push(fullTrainer);
    }
    setStore('trainers', list);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('trainers').upsert(fullTrainer);
      } catch (e) {
        console.warn('Supabase trainer upsert error:', e);
      }
    }
    return fullTrainer;
  },

  // --- ENQUIRIES ---
  async getEnquiries(): Promise<Enquiry[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as Enquiry[];
        }
      } catch (err) {
        console.warn('Supabase getEnquiries fallback:', err);
      }
    }
    return getStore<Enquiry[]>('enquiries', INITIAL_ENQUIRIES);
  },

  async saveEnquiry(enquiry: Omit<Enquiry, 'id'> & { id?: string }): Promise<Enquiry> {
    const id = enquiry.id || `enq_${Date.now().toString(36)}`;
    const fullEnquiry: Enquiry = {
      ...enquiry,
      id,
      status: enquiry.status || 'new',
      created_at: enquiry.created_at || new Date().toISOString(),
    };

    const list = getStore<Enquiry[]>('enquiries', INITIAL_ENQUIRIES);
    const idx = list.findIndex((e) => e.id === id);
    if (idx >= 0) {
      list[idx] = fullEnquiry;
    } else {
      list.unshift(fullEnquiry);
    }
    setStore('enquiries', list);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('enquiries').upsert(fullEnquiry);
      } catch (e) {
        console.warn('Supabase enquiry upsert error:', e);
      }
    }
    return fullEnquiry;
  },

  // --- EVENTS ---
  async getEvents(): Promise<GymEvent[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: true });
        if (!error && data && data.length > 0) {
          return data as GymEvent[];
        }
      } catch (err) {
        console.warn('Supabase getEvents fallback:', err);
      }
    }
    return getStore<GymEvent[]>('events', INITIAL_EVENTS);
  },

  async saveEvent(evt: Omit<GymEvent, 'id'> & { id?: string }): Promise<GymEvent> {
    const id = evt.id || `evt_${Date.now().toString(36)}`;
    const fullEvent: GymEvent = {
      ...evt,
      id,
      registered_count: evt.registered_count || 0,
      is_published: evt.is_published ?? true,
      created_at: evt.created_at || new Date().toISOString(),
    };

    const list = getStore<GymEvent[]>('events', INITIAL_EVENTS);
    const idx = list.findIndex((e) => e.id === id);
    if (idx >= 0) {
      list[idx] = fullEvent;
    } else {
      list.push(fullEvent);
    }
    setStore('events', list);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('events').upsert(fullEvent);
      } catch (e) {
        console.warn('Supabase event upsert error:', e);
      }
    }
    return fullEvent;
  },

  // --- CHALLENGES ---
  async getChallenges(): Promise<Challenge[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('challenges').select('*').order('start_date', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as Challenge[];
        }
      } catch (err) {
        console.warn('Supabase getChallenges fallback:', err);
      }
    }
    return getStore<Challenge[]>('challenges', INITIAL_CHALLENGES);
  },

  async saveChallenge(chg: Omit<Challenge, 'id'> & { id?: string }): Promise<Challenge> {
    const id = chg.id || `chg_${Date.now().toString(36)}`;
    const fullChallenge: Challenge = {
      ...chg,
      id,
      participants_count: chg.participants_count || 0,
      is_active: chg.is_active ?? true,
    };

    const list = getStore<Challenge[]>('challenges', INITIAL_CHALLENGES);
    const idx = list.findIndex((c) => c.id === id);
    if (idx >= 0) {
      list[idx] = fullChallenge;
    } else {
      list.push(fullChallenge);
    }
    setStore('challenges', list);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('challenges').upsert(fullChallenge);
      } catch (e) {
        console.warn('Supabase challenge upsert error:', e);
      }
    }
    return fullChallenge;
  },

  // --- GYM SETTINGS ---
  async getSettings(): Promise<GymSettings> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('gym_settings').select('*').eq('id', 'prime_fitness_main').maybeSingle();
        if (!error && data) {
          return data as GymSettings;
        }
        // Fallback to public projection view if base table is restricted to staff/owners
        const { data: pubData, error: pubErr } = await supabase.from('public_gym_settings').select('*').eq('id', 'prime_fitness_main').maybeSingle();
        if (!pubErr && pubData) {
          return pubData as GymSettings;
        }
      } catch (err) {
        console.warn('Supabase getSettings fallback:', err);
      }
    }
    return getStore<GymSettings>('settings', INITIAL_SETTINGS);
  },

  async updateSettings(settings: Partial<GymSettings>): Promise<GymSettings> {
    const current = getStore<GymSettings>('settings', INITIAL_SETTINGS);
    const updated: GymSettings = {
      ...current,
      ...settings,
      updated_at: new Date().toISOString(),
    };
    setStore('settings', updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('gym_settings').upsert(updated);
      } catch (e) {
        console.warn('Supabase settings update error:', e);
      }
    }
    return updated;
  },
};

export const gymService = GymService;
