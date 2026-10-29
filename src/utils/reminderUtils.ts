import { Member } from '../types/database.types';

export type ExpiryCategory = 'today' | 'soon' | 'expired' | 'future_active' | 'invalid';

export interface PhoneValidationResult {
  isValid: boolean;
  normalizedNumber: string; // e.g. "919822012345"
  displayFormatted: string; // e.g. "+91 98220 12345"
  errorReason?: string;
}

export interface ReminderMemberItem {
  member: Member;
  category: 'today' | 'soon' | 'expired';
  daysDiff: number; // 0 for today, >0 for soon (days left), <0 for expired (days overdue)
  daysLabel: string; // e.g. "Expires Today", "3 days left", "5 days overdue"
  phoneValidation: PhoneValidationResult;
  defaultMessage: string;
}

/**
 * Returns current date in India (IST - Asia/Kolkata) formatted as 'YYYY-MM-DD'.
 */
export function getIndiaTodayDate(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Converts any UTC/ISO timestamp or date string to Indian Standard Time (Asia/Kolkata) 'YYYY-MM-DD'.
 */
export function getIndiaDateFromTimestamp(timestampStr: string | null | undefined): string {
  if (!timestampStr) return '';
  try {
    const d = new Date(timestampStr);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return timestampStr.split('T')[0] || '';
  }
}

/**
 * Calculates calendar day difference between expiry date and today.
 * Positive = future expiry, 0 = today, Negative = past / overdue.
 */
export function getDaysDifference(expiryDateStr: string, todayStr: string): number {
  if (!expiryDateStr || !todayStr) return 0;
  const eParts = expiryDateStr.split('-').map(Number);
  const tParts = todayStr.split('-').map(Number);
  if (eParts.length !== 3 || tParts.length !== 3) return 0;
  const [ey, em, ed] = eParts;
  const [ty, tm, td] = tParts;
  if (!ey || !em || !ed || !ty || !tm || !td) return 0;

  const expiryUtc = Date.UTC(ey, em - 1, ed);
  const todayUtc = Date.UTC(ty, tm - 1, td);
  const diffMs = expiryUtc - todayUtc;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Normalizes and validates Indian mobile phone numbers.
 * Valid numbers in India: 10 digits starting with 6, 7, 8, or 9.
 * Strips formatting, handles +91 prefix and leading 0.
 */
export function normalizeIndianPhoneNumber(rawPhone: string | null | undefined): PhoneValidationResult {
  if (!rawPhone || !rawPhone.trim()) {
    return {
      isValid: false,
      normalizedNumber: '',
      displayFormatted: '—',
      errorReason: 'Phone number is missing.',
    };
  }

  // Remove spaces, hyphens, brackets, and any non-digit characters
  let digits = rawPhone.replace(/\D/g, '');

  // Strip leading 0 if 11 digits (e.g. 09822012345)
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Strip leading 91 if 12 digits (e.g. 919822012345)
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }

  // Check 10-digit standard Indian mobile length
  if (digits.length !== 10) {
    return {
      isValid: false,
      normalizedNumber: digits,
      displayFormatted: rawPhone,
      errorReason: `Invalid length (${digits.length} digits). Indian mobile numbers require exactly 10 digits.`,
    };
  }

  // Validate starting digit (Indian mobile operators allocate 6, 7, 8, 9)
  if (!/^[6-9]/.test(digits)) {
    return {
      isValid: false,
      normalizedNumber: digits,
      displayFormatted: rawPhone,
      errorReason: `Invalid mobile starting digit ('${digits[0]}'). Indian mobile numbers must start with 6, 7, 8, or 9.`,
    };
  }

  const normalized = `91${digits}`;
  const display = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;

  return {
    isValid: true,
    normalizedNumber: normalized,
    displayFormatted: display,
  };
}

/**
 * Generates the official pre-filled WhatsApp message based on member data and expiry status.
 */
export function generateReminderMessage(
  member: Member,
  category: 'today' | 'soon' | 'expired'
): string {
  const name = member.full_name?.trim() || 'Valued Athlete';
  const pkgName = member.package_name?.trim() || 'Prime Fitness';
  const expiryDate = member.expiry_date;

  if (category === 'today') {
    return `Hi ${name}, this is Prime Fitness MH19. Your ${pkgName} membership expires today. Please contact us if you would like to renew. Thank you!`;
  }

  if (category === 'soon') {
    return `Hi ${name}, this is Prime Fitness MH19. Your ${pkgName} membership expires on ${expiryDate}. Please contact us if you would like to renew. Thank you!`;
  }

  // Expired
  return `Hi ${name}, this is Prime Fitness MH19. Your ${pkgName} membership has expired. Please contact us if you would like to renew. Thank you!`;
}

/**
 * Processes and filters member records into deduplicated, accurately categorized expiry reminder items.
 * Handles:
 * - Cancelled/inactive memberships (excluded)
 * - Missing or invalid expiry dates (excluded)
 * - Renewed memberships: ensures older expired records for the same member do not shadow a renewed active record
 * - Active memberships not expiring soon (>7 days ahead) (excluded)
 */
export function processExpiryReminders(members: Member[], todayStr: string = getIndiaTodayDate()): {
  items: ReminderMemberItem[];
  counts: {
    total: number;
    today: number;
    soon: number;
    expired: number;
  };
} {
  if (!members || members.length === 0) {
    return {
      items: [],
      counts: { total: 0, today: 0, soon: 0, expired: 0 },
    };
  }

  // Group members by unique identity (phone digits or member_code)
  // to ensure renewed memberships with multiple records select the latest record
  const memberGroups = new Map<string, Member[]>();

  for (const m of members) {
    // Exclude cancelled / inactive members
    if (m.status === 'inactive') {
      continue;
    }

    // Exclude records with missing or invalid expiry date
    if (!m.expiry_date || !/^\d{4}-\d{2}-\d{2}$/.test(m.expiry_date)) {
      continue;
    }

    const cleanPhone = (m.phone || '').replace(/\D/g, '');
    const code = (m.member_code || '').trim().toUpperCase();
    const groupKey = code ? `code_${code}` : cleanPhone ? `phone_${cleanPhone}` : `id_${m.id}`;

    if (!memberGroups.has(groupKey)) {
      memberGroups.set(groupKey, []);
    }
    memberGroups.get(groupKey)!.push(m);
  }

  const reminderItems: ReminderMemberItem[] = [];

  for (const [, group] of memberGroups) {
    // Pick the most recent record by expiry_date (and updated_at / created_at as tiebreaker)
    group.sort((a, b) => {
      if (a.expiry_date !== b.expiry_date) {
        return b.expiry_date.localeCompare(a.expiry_date);
      }
      return (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || '');
    });

    const activeRecord = group[0];
    const diff = getDaysDifference(activeRecord.expiry_date, todayStr);

    let category: 'today' | 'soon' | 'expired' | null = null;
    let daysLabel = '';

    if (diff === 0) {
      category = 'today';
      daysLabel = 'Expires Today';
    } else if (diff > 0 && diff <= 7) {
      category = 'soon';
      daysLabel = diff === 1 ? 'Expires Tomorrow' : `Expires in ${diff} days`;
    } else if (diff < 0) {
      category = 'expired';
      const absDiff = Math.abs(diff);
      daysLabel = absDiff === 1 ? 'Expired Yesterday' : `Expired ${absDiff} days ago`;
    } else {
      // diff > 7: Active membership not expiring soon — DO NOT show in reminder lists
      continue;
    }

    const phoneValidation = normalizeIndianPhoneNumber(activeRecord.phone);
    const defaultMessage = generateReminderMessage(activeRecord, category);

    reminderItems.push({
      member: activeRecord,
      category,
      daysDiff: diff,
      daysLabel,
      phoneValidation,
      defaultMessage,
    });
  }

  // Sort order:
  // 1. Expires today first (diff === 0)
  // 2. Expiring soon sorted ascending by days remaining (1 to 7)
  // 3. Expired sorted by most recently expired first
  reminderItems.sort((a, b) => {
    const priority = (cat: 'today' | 'soon' | 'expired') => {
      if (cat === 'today') return 1;
      if (cat === 'soon') return 2;
      return 3;
    };

    const prioDiff = priority(a.category) - priority(b.category);
    if (prioDiff !== 0) return prioDiff;

    if (a.category === 'soon') {
      return a.daysDiff - b.daysDiff; // Soonest first
    }
    if (a.category === 'expired') {
      return b.daysDiff - a.daysDiff; // Most recently expired first
    }
    return a.member.full_name.localeCompare(b.member.full_name);
  });

  const counts = {
    total: reminderItems.length,
    today: reminderItems.filter(i => i.category === 'today').length,
    soon: reminderItems.filter(i => i.category === 'soon').length,
    expired: reminderItems.filter(i => i.category === 'expired').length,
  };

  return {
    items: reminderItems,
    counts,
  };
}

/**
 * Builds the official WhatsApp web/app link.
 */
export function buildWhatsAppLink(normalizedNumber: string, message: string): string {
  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
}
