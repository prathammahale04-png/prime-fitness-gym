import { supabase, isSupabaseConfigured, getAuthenticatedClient } from '../lib/supabase';
import { MembershipPackage } from '../types/database.types';
import { PricingPlan } from '../data/primeGymData';

export const DEFAULT_PACKAGES: MembershipPackage[] = [
  {
    id: 'default-pkg-1',
    name: '1 MONTH STANDARD',
    duration_days: 30,
    duration_type: 'monthly',
    price: 1500,
    description: 'Full gym access with machine and free weight coaching',
    features: ['Full 4000+ Sq.Ft. gym access', 'General floor supervision', 'Locker & changing room', 'Basic fitness assessment'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-pkg-2',
    name: '3 MONTHS INTENSIVE',
    duration_days: 90,
    duration_type: 'quarterly',
    price: 3500,
    description: 'Our most popular progressive overload quarterly cycle',
    features: ['Full 4000+ Sq.Ft. gym access', 'Dedicated workout routine card', 'Body composition tracking', 'HYROX conditioning turf access', 'Diet consultation guideline'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-pkg-3',
    name: '6 MONTHS ATHLETIC',
    duration_days: 180,
    duration_type: 'half_yearly',
    price: 6000,
    description: 'Comprehensive strength and body composition transformation',
    features: ['Full 4000+ Sq.Ft. gym access', 'Bi-weekly body measurement audits', 'Advanced progressive overload planning', 'Full conditioning & turf access', 'Priority personal trainer slot booking'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-pkg-4',
    name: '12 MONTHS PRIME PRO',
    duration_days: 365,
    duration_type: 'yearly',
    price: 10000,
    description: 'The ultimate annual discipline commitment with prime perks',
    features: ['Full 4000+ Sq.Ft. unlimited gym access', 'Complete physique & mobility blueprint', 'Quarterly goal assessment with head coach', 'Zero freeze fees (up to 30 days pause)', 'Complimentary Prime Fitness athlete shaker'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

async function getClient(sessionOverride?: any) {
  if (sessionOverride?.access_token) {
    return getAuthenticatedClient(sessionOverride.access_token);
  }
  const { data } = await supabase.auth.getSession();
  if (data?.session?.access_token) {
    return getAuthenticatedClient(data.session.access_token);
  }
  return supabase;
}

// High-performance In-Memory Cache with Stale-While-Revalidate (SWR)
let memoryPackagesCache: { packages: MembershipPackage[]; isLive: boolean; timestamp: number } | null = null;
let memoryActivePackagesCache: { packages: MembershipPackage[]; isLive: boolean; timestamp: number } | null = null;
const PACKAGE_CACHE_TTL_MS = 45000; // 45 seconds TTL

export function invalidatePackageCache(): void {
  memoryPackagesCache = null;
  memoryActivePackagesCache = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('primefitness:data-changed'));
  }
}

export async function getPackages(sessionOverride?: any, forceRefresh: boolean = false): Promise<{ packages: MembershipPackage[]; isLive: boolean }> {
  if (!forceRefresh && memoryPackagesCache && Date.now() - memoryPackagesCache.timestamp < PACKAGE_CACHE_TTL_MS) {
    return { packages: memoryPackagesCache.packages, isLive: memoryPackagesCache.isLive };
  }

  if (!isSupabaseConfigured()) {
    return { packages: DEFAULT_PACKAGES, isLive: false };
  }

  try {
    const client = await getClient(sessionOverride);
    const { data, error } = await client
      .from('packages')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      console.warn('Packages fetch error, using defaults:', error.message);
      return { packages: DEFAULT_PACKAGES, isLive: false };
    }

    if (!data || data.length === 0) {
      memoryPackagesCache = { packages: DEFAULT_PACKAGES, isLive: true, timestamp: Date.now() };
      return { packages: DEFAULT_PACKAGES, isLive: true };
    }

    const result = { packages: data as MembershipPackage[], isLive: true };
    memoryPackagesCache = { ...result, timestamp: Date.now() };
    return result;
  } catch (err) {
    console.warn('Failed to load packages from database:', err);
    return { packages: DEFAULT_PACKAGES, isLive: false };
  }
}

export function formatPackageDuration(pkg: MembershipPackage): { durationNumber: string; durationUnit: string } {
  const days = pkg.duration_days;
  const name = pkg.name || '';

  // Match leading number and duration word (e.g. "8 months", "1 MONTH", "12 MONTHS")
  const match = name.match(/^(\d+)\s*(month|months|year|years|day|days)/i);
  if (match) {
    const num = match[1];
    const rawUnit = match[2].toUpperCase();
    let unit = rawUnit;
    if (num === '1') {
      unit = rawUnit.replace(/S$/, '');
    } else if (!rawUnit.endsWith('S')) {
      unit = `${rawUnit}S`;
    }
    return {
      durationNumber: num,
      durationUnit: unit,
    };
  }

  if (days >= 365 || pkg.duration_type === 'yearly') {
    const years = Math.round(days / 365) || 1;
    return {
      durationNumber: String(years),
      durationUnit: years === 1 ? 'YEAR' : 'YEARS',
    };
  }

  if (days >= 30) {
    const months = Math.round(days / 30);
    return {
      durationNumber: String(months),
      durationUnit: months === 1 ? 'MONTH' : 'MONTHS',
    };
  }

  return {
    durationNumber: String(days),
    durationUnit: days === 1 ? 'DAY' : 'DAYS',
  };
}

export function mapPackageToPricingPlan(pkg: MembershipPackage): PricingPlan {
  const { durationNumber, durationUnit } = formatPackageDuration(pkg);

  const isHighlighted =
    pkg.duration_days === 90 ||
    pkg.duration_type === 'quarterly' ||
    pkg.name.toLowerCase().includes('3 month') ||
    pkg.name.toLowerCase().includes('intensive');

  return {
    id: pkg.id,
    durationNumber,
    durationUnit,
    price: pkg.price.toLocaleString('en-IN'),
    highlighted: isHighlighted,
    features: Array.isArray(pkg.features) && pkg.features.length > 0
      ? pkg.features
      : [
          'Full 4000+ Sq.Ft. gym access',
          'Strength & Cardio deck workouts',
          'HYROX & functional turf zone',
          'Coach consultation & form check',
        ],
  };
}

export async function getActivePackages(forceRefresh: boolean = false): Promise<{ packages: MembershipPackage[]; isLive: boolean }> {
  if (!forceRefresh && memoryActivePackagesCache && Date.now() - memoryActivePackagesCache.timestamp < PACKAGE_CACHE_TTL_MS) {
    return { packages: memoryActivePackagesCache.packages, isLive: memoryActivePackagesCache.isLive };
  }

  if (!isSupabaseConfigured()) {
    return { packages: DEFAULT_PACKAGES.filter((p) => p.is_active), isLive: false };
  }

  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      console.warn('Active packages fetch error, using defaults:', error.message);
      return { packages: DEFAULT_PACKAGES.filter((p) => p.is_active), isLive: false };
    }

    if (!data || data.length === 0) {
      memoryActivePackagesCache = { packages: DEFAULT_PACKAGES.filter((p) => p.is_active), isLive: true, timestamp: Date.now() };
      return { packages: DEFAULT_PACKAGES.filter((p) => p.is_active), isLive: true };
    }

    const result = { packages: data as MembershipPackage[], isLive: true };
    memoryActivePackagesCache = { ...result, timestamp: Date.now() };
    return result;
  } catch (err) {
    console.warn('Failed to load active packages from database:', err);
    return { packages: DEFAULT_PACKAGES.filter((p) => p.is_active), isLive: false };
  }
}

export async function createPackage(
  pkg: Omit<MembershipPackage, 'id' | 'created_at'>,
  sessionOverride?: any
): Promise<{ success: boolean; data?: MembershipPackage; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database not configured in environment variables.' };
  }

  try {
    const client = await getClient(sessionOverride);
    const { data, error } = await client
      .from('packages')
      .insert([pkg])
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    invalidatePackageCache();
    return { success: true, data: data as MembershipPackage };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create package' };
  }
}

export async function updatePackage(
  id: string,
  updates: Partial<Omit<MembershipPackage, 'id' | 'created_at'>>,
  sessionOverride?: any
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database not configured in environment variables.' };
  }

  try {
    const client = await getClient(sessionOverride);
    const { error } = await client
      .from('packages')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    invalidatePackageCache();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update package' };
  }
}

export async function togglePackageActive(
  id: string,
  currentStatus: boolean,
  sessionOverride?: any
): Promise<{ success: boolean; error?: string }> {
  return updatePackage(id, { is_active: !currentStatus }, sessionOverride);
}
