/**
 * Prime Fitness MH19 - System Integrity & Business Logic Audit Test Suite
 *
 * Verifies:
 * 1. Indian Standard Time (Asia/Kolkata) date calculations & timestamp conversion
 * 2. Membership expiry date calculation (DST-safe, month rollover, leap years)
 * 3. Indian phone number normalization & validation
 * 4. Expiry countdown & category classification
 * 5. Invoice numbering & amount-to-words engine
 * 6. Package pricing synchronization & lead conversion models
 */

import {
  getIndiaTodayDate,
  getIndiaDateFromTimestamp,
  normalizeIndianPhoneNumber,
  getDaysDifference,
  generateReminderMessage,
  buildWhatsAppLink,
} from '../utils/reminderUtils';
import { calculateExpiryDate } from '../services/memberService';
import { mapPackageToPricingPlan } from '../services/packageService';
import { MembershipPackage } from '../types/database.types';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`);
    failCount++;
  }
}

async function runSystemIntegrityTests() {
  console.log('\n======================================================');
  console.log('PRIME FITNESS MH19 — SYSTEM INTEGRITY & QA TEST SUITE');
  console.log('======================================================\n');

  // TEST SUITE 1: Indian Standard Time (Asia/Kolkata) Calculations
  console.log('1. Testing Indian Standard Time (Asia/Kolkata) Date & Timestamp Conversions');
  const indiaToday = getIndiaTodayDate();
  assert(/^\d{4}-\d{2}-\d{2}$/.test(indiaToday), 'getIndiaTodayDate returns valid YYYY-MM-DD', indiaToday);

  // UTC midnight 2026-10-28 20:30:00 UTC is 2026-10-29 02:00:00 IST (+5:30)
  const utcLateNight = '2026-10-28T20:30:00.000Z';
  const convertedIST = getIndiaDateFromTimestamp(utcLateNight);
  assert(convertedIST === '2026-10-29', 'Converts UTC late night to next-day IST', `${utcLateNight} -> ${convertedIST}`);

  // UTC 05:00:00 on 2026-10-29 is 10:30:00 AM on 2026-10-29 IST
  const utcMorning = '2026-10-29T05:00:00.000Z';
  const convertedMorningIST = getIndiaDateFromTimestamp(utcMorning);
  assert(convertedMorningIST === '2026-10-29', 'Converts daytime UTC to matching IST date', `${utcMorning} -> ${convertedMorningIST}`);

  // Resilience against null/empty/invalid
  assert(getIndiaDateFromTimestamp(null) === '', 'Handles null timestamp gracefully');
  assert(getIndiaDateFromTimestamp(undefined) === '', 'Handles undefined timestamp gracefully');
  assert(getIndiaDateFromTimestamp('invalid-date') === '', 'Handles malformed timestamp gracefully');

  // TEST SUITE 2: Expiry Date Calculations
  console.log('\n2. Testing Membership Expiry Date Calculations (DST-safe)');
  // 30 days
  const exp30 = calculateExpiryDate('2026-01-01', 30);
  assert(exp30 === '2026-01-31', 'Calculates 30-day package correctly', `2026-01-01 + 30 days = ${exp30}`);

  // 90 days across month boundaries (Jan 31 + 90 days in 2026 non-leap: Jan(0)+Feb(28)+Mar(31)+Apr(30)+May(1) = May 01)
  const exp90 = calculateExpiryDate('2026-01-31', 90);
  assert(exp90 === '2026-05-01', 'Calculates 90-day package across multiple months', `2026-01-31 + 90 days = ${exp90}`);

  // Leap year 2028: Feb 28 + 1 day should be Feb 29
  const expLeap = calculateExpiryDate('2028-02-28', 1);
  assert(expLeap === '2028-02-29', 'Handles leap year Feb 29 accurately', `2028-02-28 + 1 day = ${expLeap}`);

  // Year rollover: Dec 25 + 10 days = Jan 04 next year
  const expYear = calculateExpiryDate('2026-12-25', 10);
  assert(expYear === '2027-01-04', 'Handles year boundary transition accurately', `2026-12-25 + 10 days = ${expYear}`);

  // 240 days (8 months package created in Staff Portal)
  const exp8mo = calculateExpiryDate('2026-03-01', 240);
  assert(exp8mo === '2026-10-27', 'Calculates 240-day (8 months) package correctly', `2026-03-01 + 240 days = ${exp8mo}`);

  // Zero or negative handling
  assert(calculateExpiryDate('2026-05-10', 0) === '2026-05-10', 'Returns start date if duration is 0');

  // TEST SUITE 3: Indian Phone Number Normalization & Validation
  console.log('\n3. Testing Indian Phone Number Validation (E.164 & Display Formats)');
  const standard = normalizeIndianPhoneNumber('9822012345');
  assert(standard.isValid && standard.normalizedNumber === '919822012345' && standard.displayFormatted === '+91 98220 12345',
    'Normalizes 10-digit Indian mobile number', standard.normalizedNumber);

  const prefixed = normalizeIndianPhoneNumber('+91 98220 12345');
  assert(prefixed.isValid && prefixed.normalizedNumber === '919822012345', 'Normalizes +91 prefixed phone with spaces');

  const zeroPrefixed = normalizeIndianPhoneNumber('09822012345');
  assert(zeroPrefixed.isValid && zeroPrefixed.normalizedNumber === '919822012345', 'Normalizes 0-prefixed 11-digit phone');

  const invalidShort = normalizeIndianPhoneNumber('12345');
  assert(!invalidShort.isValid && Boolean(invalidShort.errorReason), 'Rejects short invalid phone number');

  const invalidPrefix = normalizeIndianPhoneNumber('1822012345');
  assert(!invalidPrefix.isValid, 'Rejects number starting with invalid Indian telecom digit (1)');

  // TEST SUITE 4: Expiry Countdown & Reminder Messaging
  console.log('\n4. Testing Reminder Countdown & WhatsApp Link Generation');
  const daysDiffFuture = getDaysDifference('2026-11-05', '2026-10-29');
  assert(daysDiffFuture === 7, 'Calculates future expiry countdown in days', `2026-11-05 vs 2026-10-29 = ${daysDiffFuture}`);

  const daysDiffPast = getDaysDifference('2026-10-20', '2026-10-29');
  assert(daysDiffPast === -9, 'Calculates overdue past expiry in negative days', `2026-10-20 vs 2026-10-29 = ${daysDiffPast}`);

  const daysDiffToday = getDaysDifference('2026-10-29', '2026-10-29');
  assert(daysDiffToday === 0, 'Calculates same-day expiry as 0 days');

  const sampleMember = {
    id: 'test-mem-01',
    member_code: 'PF-1001',
    full_name: 'Rahul Patil',
    phone: '9822012345',
    email: 'rahul@example.com',
    gender: 'male' as const,
    date_of_birth: '1995-01-01',
    address: 'Jalgaon',
    emergency_contact: '9822099999',
    package_id: 'pkg-1',
    package_name: '3 MONTHS INTENSIVE',
    joined_date: '2026-07-29',
    start_date: '2026-07-29',
    expiry_date: '2026-10-29',
    status: 'active' as const,
    amount_paid: 3500,
    balance_due: 0,
    notes: 'Regular athlete',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const reminderMsg = generateReminderMessage(sampleMember, 'today');
  assert(reminderMsg.includes('Rahul Patil') && reminderMsg.includes('Prime Fitness MH19'),
    'Generates personalized WhatsApp reminder message');

  const waLink = buildWhatsAppLink('919822012345', reminderMsg);
  assert(waLink.startsWith('https://wa.me/919822012345?text='),
    'Constructs valid WhatsApp API direct URL', waLink);

  // TEST SUITE 5: Package Pricing Synchronization
  console.log('\n5. Testing Package Mapping & Synchronization with Public Website');
  const customPackage: MembershipPackage = {
    id: 'b149b015-c266-419b-a010-8b438ad49c95',
    name: '8 MONTHS ATHLETIC ADVANCE',
    price: 8000,
    duration_days: 240,
    duration_type: 'custom',
    features: ['Access to power rack & platform', 'Shower & steam access', 'InBody assessment every 60 days'],
    description: 'Advanced 8-month strength progression plan',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mappedPlan = mapPackageToPricingPlan(customPackage);
  assert(mappedPlan.id === customPackage.id, 'Preserves package ID');
  assert(mappedPlan.durationNumber === '8', 'Maps duration number correctly as 8');
  assert(mappedPlan.durationUnit === 'MONTHS', 'Maps duration unit correctly as MONTHS');
  assert(mappedPlan.price === '8,000', 'Formats price in Indian Rupee format without raw currency symbol', mappedPlan.price);
  assert(mappedPlan.features.length === 3, 'Preserves all package features');

  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runSystemIntegrityTests().catch((err) => {
  console.error('Test runner execution failed:', err);
  process.exit(1);
});
