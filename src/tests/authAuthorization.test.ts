/**
 * Safe local verification test script for Prime Fitness MH19 authorization logic
 */
import { isValidAppRole, AppRole, UserProfile } from '../types/database.types';

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

console.log('--- TEST SUITE 1: Role Validation (isValidAppRole) ---');
assert(isValidAppRole('owner') === true, "Allowed role 'owner' accepted");
assert(isValidAppRole('staff') === true, "Allowed role 'staff' accepted");
assert(isValidAppRole('trainer') === true, "Allowed role 'trainer' accepted");
assert(isValidAppRole('admin') === false, "Disallowed role 'admin' rejected");
assert(isValidAppRole('superuser') === false, "Disallowed role 'superuser' rejected");
assert(isValidAppRole(null) === false, "Null role rejected");
assert(isValidAppRole(undefined) === false, "Undefined role rejected");
assert(isValidAppRole('') === false, "Empty string role rejected");

console.log('\n--- TEST SUITE 2: isAuthorizedAdmin Rule ---');
const makeProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@primefitness.com',
  full_name: 'Test User',
  phone: '9422219019',
  role: 'owner',
  is_active: true,
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const isAuthorizedAdmin = (user: any, profile: UserProfile | null): boolean => {
  return Boolean(
    user &&
    profile &&
    profile.is_active === true &&
    isValidAppRole(profile.role)
  );
};

const fakeUser = { id: '00000000-0000-0000-0000-000000000001', email: 'test@primefitness.com' };

// 1. Authorized Owner
assert(isAuthorizedAdmin(fakeUser, makeProfile({ role: 'owner' })) === true, 'Authorized owner allowed');

// 2. Authorized Staff
assert(isAuthorizedAdmin(fakeUser, makeProfile({ role: 'staff' })) === true, 'Authorized staff allowed');

// 3. Authorized Trainer
assert(isAuthorizedAdmin(fakeUser, makeProfile({ role: 'trainer' })) === true, 'Authorized trainer allowed');

// 4. Inactive Profile
assert(isAuthorizedAdmin(fakeUser, makeProfile({ role: 'owner', is_active: false })) === false, 'Inactive owner rejected');

// 5. Invalid Role Profile
assert(isAuthorizedAdmin(fakeUser, makeProfile({ role: 'superuser' as any })) === false, 'Invalid role rejected');
assert(isAuthorizedAdmin(fakeUser, makeProfile({ role: null })) === false, 'Null role rejected');

// 6. Missing Profile (data is null)
assert(isAuthorizedAdmin(fakeUser, null) === false, 'Null profile rejected');

// 7. Unauthenticated visitor (no user)
assert(isAuthorizedAdmin(null, makeProfile({ role: 'owner' })) === false, 'Unauthenticated visitor rejected');

console.log('\n--- TEST SUITE 3: Profile Resolution Engine Simulation ---');

type ProfileResolution =
  | { status: 'authorized'; profile: UserProfile }
  | { status: 'unauthorized'; reason: 'missing_profile' | 'inactive' | 'invalid_role'; message: string }
  | { status: 'transient_error'; message: string };

function simulateResolveProfile(
  data: any,
  error: { message: string; code?: string } | null
): ProfileResolution {
  if (error) {
    return {
      status: 'transient_error',
      message: `Database communication error: ${error.message}. Please check your connection.`,
    };
  }
  if (!data) {
    return {
      status: 'unauthorized',
      reason: 'missing_profile',
      message: 'No administrative profile record exists for this user in the database.',
    };
  }
  if (data.is_active !== true) {
    return {
      status: 'unauthorized',
      reason: 'inactive',
      message: 'This account has been deactivated or is pending approval.',
    };
  }
  if (!isValidAppRole(data.role)) {
    return {
      status: 'unauthorized',
      reason: 'invalid_role',
      message: `This account has an unpermitted administrative role ('${data.role || 'none'}') in the database.`,
    };
  }
  return {
    status: 'authorized',
    profile: data as UserProfile,
  };
}

// Case A: Valid DB profile
const resA = simulateResolveProfile({ id: '1', role: 'owner', is_active: true }, null);
assert(resA.status === 'authorized', 'Valid DB row resolves to authorized');

// Case B: Confirmed Missing profile (data is null, error is null)
const resB = simulateResolveProfile(null, null);
assert(resB.status === 'unauthorized' && resB.reason === 'missing_profile', 'Confirmed missing row resolves to unauthorized missing_profile');

// Case C: Inactive profile
const resC = simulateResolveProfile({ id: '1', role: 'owner', is_active: false }, null);
assert(resC.status === 'unauthorized' && resC.reason === 'inactive', 'Inactive profile resolves to unauthorized inactive');

// Case D: Unexpected/unauthorized role
const resD = simulateResolveProfile({ id: '1', role: 'member', is_active: true }, null);
assert(resD.status === 'unauthorized' && resD.reason === 'invalid_role', 'Unexpected role resolves to unauthorized invalid_role');

// Case E: Transient network/server error
const resE = simulateResolveProfile(null, { message: 'Failed to fetch', code: 'PGRST301' });
assert(resE.status === 'transient_error', 'Network failure resolves to transient_error (session retained, no signout)');

console.log(`\nTOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
if (failed > 0) process.exit(1);
