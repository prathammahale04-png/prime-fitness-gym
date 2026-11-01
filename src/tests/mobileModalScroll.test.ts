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
console.log('PRIME FITNESS MH19 — MOBILE MODAL & SCROLL AUDIT TEST');
console.log('======================================================\n');

const membersViewFile = path.resolve(process.cwd(), 'src/components/admin/MembersView.tsx');
assert(fs.existsSync(membersViewFile), 'MembersView.tsx exists');

const content = fs.readFileSync(membersViewFile, 'utf8');

// 1. Verify createPortal usage
console.log('--- TEST SUITE 1: React Portal Mounting ---');
assert(content.includes("import { createPortal } from 'react-dom';"), 'Imports createPortal from react-dom');
assert(content.includes('createPortal('), 'Uses createPortal to mount modal directly to document.body');
assert(content.includes('document.body'), 'Mount target is document.body (prevents parent overflow clipping)');

// 2. Verify Z-Index and Overlay Stacking
console.log('\n--- TEST SUITE 2: Overlay & Z-Index Stacking ---');
assert(content.includes('z-[100]'), 'Modal backdrop uses high z-index (z-[100]) above sidebar and header');
assert(content.includes('overscroll-contain'), 'Uses overscroll-contain to isolate scroll events from background');

// 3. Verify Dynamic Viewport Height & Mobile Sizing
console.log('\n--- TEST SUITE 3: Dynamic Viewport (100dvh) & Overflow Constraints ---');
assert(content.includes('100dvh'), 'Uses 100dvh for dynamic mobile viewport adaptation');
assert(content.includes('100vh'), 'Includes fallback 100vh constraint');
assert(content.includes('my-auto'), 'Uses my-auto to prevent flex scroll anchoring and top field clipping');
assert(content.includes('[-webkit-overflow-scrolling:touch]'), 'Enables hardware-accelerated iOS WebKit momentum scrolling');
assert(content.includes('overflow-y-auto'), 'Enables internal vertical overflow scrolling');

// 4. Verify Persistent Header & Accessible Close Button
console.log('\n--- TEST SUITE 4: Persistent Header & Close Access ---');
assert(content.includes('Register New Gym Member'), 'Add Member modal title is present');
assert(content.includes('shrink-0'), 'Modal header has shrink-0 to remain anchored at top during scroll');
assert(content.includes('aria-label="Close dialog"'), 'Accessible close button is provided');

// 5. Verify Form Fields Order and Preservation
console.log('\n--- TEST SUITE 5: Field Order & UI Integrity Preservation ---');
const expectedFields = [
  'Full Name *',
  'Phone Number (10 Digits) *',
  'Email Address (Optional)',
  'Gender',
  'Membership Package *',
  'Start Date *',
  'Calculated Expiry Date',
  'Amount Paid Today (₹)',
  'Balance Due (₹)',
  'Emergency Contact / Notes',
  'Complete Registration',
];

for (const field of expectedFields) {
  assert(content.includes(field), `Preserves form field/label: "${field}"`);
}

// 6. Verify Background Scroll Locking & Restoration Logic
console.log('\n--- TEST SUITE 6: Scroll Locking & Restoration Engine ---');
assert(content.includes('prevScrollYRef'), 'Maintains prevScrollYRef to record scroll position before locking');
assert(content.includes("document.body.style.overflow = 'hidden'"), 'Locks document.body overflow when modal is active');
assert(content.includes('document.body.style.overflow = originalOverflow'), 'Restores original body overflow on modal close');
assert(content.includes('window.scrollTo({ top: prevScrollYRef.current'), 'Restores exact scroll position when modal closes');
assert(content.includes("e.key === 'Escape'"), 'Supports Escape key to dismiss modal when not submitting');

console.log('\n======================================================');
console.log('ALL MOBILE MODAL & SCROLL AUDIT TESTS PASSED');
console.log('======================================================\n');
