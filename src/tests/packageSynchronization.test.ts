/**
 * Automated Verification Test Suite for Package Synchronization
 * Prime Fitness MH19 Public Website <-> Staff Portal
 */

import { getActivePackages, formatPackageDuration, mapPackageToPricingPlan } from '../services/packageService';
import { MembershipPackage } from '../types/database.types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('--- TEST SUITE 1: Duration Formatting & Field Mapping ---');

  const testPkg1Month: MembershipPackage = {
    id: 'test-1',
    name: '1 MONTH STANDARD',
    duration_days: 30,
    duration_type: 'monthly',
    price: 1500,
    description: 'Full gym access',
    features: ['Access', 'Coaching'],
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const formatted1 = formatPackageDuration(testPkg1Month);
  assert(formatted1.durationNumber === '1', '1 month durationNumber is "1"');
  assert(formatted1.durationUnit === 'MONTH', '1 month durationUnit is "MONTH"');

  const mapped1 = mapPackageToPricingPlan(testPkg1Month);
  assert(mapped1.price === '1,500', '1 month price formatted as "1,500"');
  assert(mapped1.highlighted === false, '1 month is not highlighted');

  const testPkg3Month: MembershipPackage = {
    id: 'test-3',
    name: '3 MONTHS INTENSIVE',
    duration_days: 90,
    duration_type: 'quarterly',
    price: 3500,
    description: 'Quarterly cycle',
    features: ['Turf', 'Diet'],
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const mapped3 = mapPackageToPricingPlan(testPkg3Month);
  assert(mapped3.durationNumber === '3', '3 months durationNumber is "3"');
  assert(mapped3.durationUnit === 'MONTHS', '3 months durationUnit is "MONTHS"');
  assert(mapped3.highlighted === true, '3 months is highlighted (MOST POPULAR)');

  const testPkg8Month: MembershipPackage = {
    id: 'test-8',
    name: '8 months',
    duration_days: 240,
    duration_type: 'monthly',
    price: 8000,
    description: null,
    features: ['Full 4000+ Sq.Ft. gym access', 'General floor supervision'],
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const formatted8 = formatPackageDuration(testPkg8Month);
  assert(formatted8.durationNumber === '8', '8 months durationNumber is "8"');
  assert(formatted8.durationUnit === 'MONTHS', '8 months durationUnit is "MONTHS"');

  const mapped8 = mapPackageToPricingPlan(testPkg8Month);
  assert(mapped8.price === '8,000', '8 months price formatted as "8,000"');
  assert(mapped8.features.length === 2, '8 months preserves features array from DB');

  console.log('\n--- TEST SUITE 2: Live Supabase Public Packages Query ---');

  const result = await getActivePackages();
  assert(result.isLive === true, 'Active packages loaded from live Supabase');
  assert(result.packages.length >= 4, `Live packages count (${result.packages.length}) >= 4`);

  // Verify that the user's new "8 months" package is present
  const userNewPackage = result.packages.find((p) => p.name.toLowerCase().includes('8 month'));
  assert(Boolean(userNewPackage), 'New "8 months" package created in Staff Portal exists in live packages');

  if (userNewPackage) {
    assert(userNewPackage.price === 8000, 'New package price is ₹8,000');
    assert(userNewPackage.duration_days === 240, 'New package duration_days is 240');
    assert(userNewPackage.is_active === true, 'New package is_active is true');

    const mappedUserPkg = mapPackageToPricingPlan(userNewPackage);
    assert(mappedUserPkg.durationNumber === '8', 'Mapped durationNumber is "8"');
    assert(mappedUserPkg.durationUnit === 'MONTHS', 'Mapped durationUnit is "MONTHS"');
    assert(mappedUserPkg.price === '8,000', 'Mapped price is "8,000"');
    console.log(`[VERIFIED] User's package "${userNewPackage.name}" maps to: ( ${mappedUserPkg.durationNumber} ) ${mappedUserPkg.durationUnit} — ₹ ${mappedUserPkg.price}`);
  }

  // Verify that ALL packages returned have is_active === true
  const allActive = result.packages.every((p) => p.is_active === true);
  assert(allActive, 'All returned packages strictly have is_active === true');

  console.log(`\n========================================`);
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
