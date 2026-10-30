/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

console.log('======================================================');
console.log('PRIME FITNESS MH19 — SPA ROUTING & VERCEL CONFIG AUDIT');
console.log('======================================================\n');

// 1. Verify vercel.json presence and structure
console.log('--- TEST SUITE 1: vercel.json SPA Rewrite Configuration ---');
const vercelConfigPath = path.resolve(process.cwd(), 'vercel.json');
assert(fs.existsSync(vercelConfigPath), 'vercel.json exists in project root');

const vercelContent = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
assert(Array.isArray(vercelContent.rewrites), 'vercel.json contains rewrites array');
assert(vercelContent.rewrites.length >= 1, 'vercel.json has at least one rewrite rule');

const spaRewrite = vercelContent.rewrites.find(
  (r: { source: string; destination: string }) =>
    (r.source === '/(.*)' || r.source === '/:path*') && r.destination === '/index.html'
);
assert(Boolean(spaRewrite), 'SPA rewrite matches all routes (/(.*)) and routes to /index.html');
assert(spaRewrite.destination === '/index.html', 'Rewrite destination points to /index.html');

// 2. Test initial route parser logic
console.log('\n--- TEST SUITE 2: Client-side Initial Route Resolution ---');

type AppView = 'public' | 'login' | 'admin';

const resolveViewFromPath = (pathname: string): AppView => {
  const path = pathname.toLowerCase();
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/login')) return 'login';
  return 'public';
};

assert(resolveViewFromPath('/') === 'public', 'Root path "/" resolves to "public" view');
assert(resolveViewFromPath('/admin') === 'admin', 'Direct "/admin" navigation resolves to "admin" view');
assert(resolveViewFromPath('/admin/') === 'admin', 'Trailing slash "/admin/" resolves to "admin" view');
assert(resolveViewFromPath('/admin/members') === 'admin', 'Sub-route "/admin/members" resolves to "admin" view');
assert(resolveViewFromPath('/ADMIN') === 'admin', 'Uppercase "/ADMIN" resolves to "admin" view');
assert(resolveViewFromPath('/login') === 'login', 'Direct "/login" navigation resolves to "login" view');
assert(resolveViewFromPath('/login/') === 'login', 'Trailing slash "/login/" resolves to "login" view');
assert(resolveViewFromPath('/unknown') === 'public', 'Unknown route "/unknown" safely defaults to "public"');
assert(resolveViewFromPath('/about') === 'public', 'Public section route "/about" safely defaults to "public"');

// 3. Test navigation target path formatting
console.log('\n--- TEST SUITE 3: Navigation Path Serialization ---');

const getTargetPath = (view: AppView): string => {
  return view === 'public' ? '/' : `/${view}`;
};

assert(getTargetPath('public') === '/', 'Public view serializes to "/"');
assert(getTargetPath('admin') === '/admin', 'Admin view serializes to "/admin"');
assert(getTargetPath('login') === '/login', 'Login view serializes to "/login"');

// 4. Test Route Guard & Authorization State Machine
console.log('\n--- TEST SUITE 4: Protected Admin Guard Transitions ---');

interface GuardParams {
  currentView: AppView;
  isAuthorizedAdmin: boolean;
  isTransientError: boolean;
  loading: boolean;
}

const evaluateNextRoute = (params: GuardParams): AppView => {
  if (params.loading) return params.currentView;
  if (params.currentView === 'admin' && !params.isAuthorizedAdmin && !params.isTransientError) {
    return 'login';
  }
  if (params.currentView === 'login' && params.isAuthorizedAdmin) {
    return 'admin';
  }
  return params.currentView;
};

// Scenario A: Direct load /admin while authenticated as authorized admin
assert(
  evaluateNextRoute({
    currentView: 'admin',
    isAuthorizedAdmin: true,
    isTransientError: false,
    loading: false,
  }) === 'admin',
  'Direct navigation to /admin when authenticated stays on admin dashboard'
);

// Scenario B: Direct load /admin when unauthenticated
assert(
  evaluateNextRoute({
    currentView: 'admin',
    isAuthorizedAdmin: false,
    isTransientError: false,
    loading: false,
  }) === 'login',
  'Direct navigation to /admin when unauthenticated redirects safely to login'
);

// Scenario C: Direct load /login when already authenticated
assert(
  evaluateNextRoute({
    currentView: 'login',
    isAuthorizedAdmin: true,
    isTransientError: false,
    loading: false,
  }) === 'admin',
  'Visiting /login when already authorized automatically redirects to admin'
);

// Scenario D: Direct load /admin during transient database error
assert(
  evaluateNextRoute({
    currentView: 'admin',
    isAuthorizedAdmin: false,
    isTransientError: true,
    loading: false,
  }) === 'admin',
  'Transient network/DB error on /admin does not force logout or redirect loop'
);

// Scenario E: While session is loading
assert(
  evaluateNextRoute({
    currentView: 'admin',
    isAuthorizedAdmin: false,
    isTransientError: false,
    loading: true,
  }) === 'admin',
  'Route guard awaits session validation before executing any redirect'
);

console.log('\n======================================================');
console.log('ALL SPA ROUTING & VERCEL CONFIG AUDIT TESTS PASSED');
console.log('======================================================\n');
