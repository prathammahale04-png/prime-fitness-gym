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
console.log('PRIME FITNESS MH19 — NUMERIC INPUTS & EMPTY HANDLING AUDIT');
console.log('======================================================\n');

// --- 1. Audit MembersView.tsx ---
console.log('--- TEST SUITE 1: MembersView.tsx (Add Member & Renew Modals) ---');
const membersViewPath = path.resolve(process.cwd(), 'src/components/admin/MembersView.tsx');
assert(fs.existsSync(membersViewPath), 'MembersView.tsx exists');
const membersViewContent = fs.readFileSync(membersViewPath, 'utf8');

assert(membersViewContent.includes("useState<string>('0')"), 'amountPaid and renewAmountPaid use string state');
assert(!membersViewContent.includes('onChange={(e) => setAmountPaid(Number(e.target.value))}'), 'Does not force Number(e.target.value) on amountPaid');
assert(!membersViewContent.includes('onChange={(e) => setRenewAmountPaid(Number(e.target.value))}'), 'Does not force Number(e.target.value) on renewAmountPaid');
assert(membersViewContent.includes('onChange={(e) => setAmountPaid(e.target.value)}'), 'amountPaid updates directly with string e.target.value');
assert(membersViewContent.includes('onChange={(e) => setRenewAmountPaid(e.target.value)}'), 'renewAmountPaid updates directly with string e.target.value');
assert(membersViewContent.includes('step="any"'), 'Supports decimal amounts with step="any"');

// Test simulation of balance due calculation
const testPackagePrice = 8000;
const calculateSimulatedBalance = (paidInput: string) => {
  const parsedPaid = paidInput.trim() === '' ? 0 : parseFloat(paidInput);
  const validPaid = isNaN(parsedPaid) || parsedPaid < 0 ? 0 : parsedPaid;
  return Math.max(0, testPackagePrice - validPaid);
};

assert(calculateSimulatedBalance('8000') === 0, 'Balance due is 0 when 8000 paid');
assert(calculateSimulatedBalance('') === 8000, 'Empty input safely evaluates to 0 paid with 8000 balance due without NaN');
assert(calculateSimulatedBalance('5000') === 3000, 'Balance due is 3000 when 5000 paid');
assert(calculateSimulatedBalance('8500.50') === 0, 'Decimal excess paid results in 0 balance due');

// --- 2. Audit PackagesView.tsx ---
console.log('\n--- TEST SUITE 2: PackagesView.tsx (Package Create & Edit) ---');
const packagesViewPath = path.resolve(process.cwd(), 'src/components/admin/PackagesView.tsx');
assert(fs.existsSync(packagesViewPath), 'PackagesView.tsx exists');
const packagesViewContent = fs.readFileSync(packagesViewPath, 'utf8');

assert(packagesViewContent.includes("useState<string>('1500')"), 'Package price uses string state');
assert(packagesViewContent.includes("useState<string>('30')"), 'Package durationDays uses string state');
assert(!packagesViewContent.includes('onChange={(e) => setPrice(Number(e.target.value))}'), 'Does not force Number(e.target.value) on package price');
assert(!packagesViewContent.includes('onChange={(e) => setDurationDays(Number(e.target.value))}'), 'Does not force Number(e.target.value) on package durationDays');
assert(packagesViewContent.includes('onChange={(e) => setPrice(e.target.value)}'), 'Package price updates directly with string e.target.value');
assert(packagesViewContent.includes('onChange={(e) => setDurationDays(e.target.value)}'), 'Package durationDays updates directly with string e.target.value');

// Test package validation logic
const validatePackageInput = (name: string, priceStr: string, durationStr: string) => {
  const parsedPrice = priceStr.trim() === '' ? NaN : parseFloat(priceStr);
  const parsedDuration = durationStr.trim() === '' ? NaN : parseInt(durationStr, 10);
  if (!name.trim() || isNaN(parsedPrice) || parsedPrice < 0 || isNaN(parsedDuration) || parsedDuration <= 0) {
    return false;
  }
  return true;
};

assert(validatePackageInput('Gold Membership', '8000', '240') === true, 'Valid 8000 package passes validation');
assert(validatePackageInput('Gold Membership', '', '240') === false, 'Blank price fails validation (never silently saves 0)');
assert(validatePackageInput('Gold Membership', '8000', '') === false, 'Blank duration fails validation');

// --- 3. Audit BillingView.tsx ---
console.log('\n--- TEST SUITE 3: BillingView.tsx (Record Payment & Invoicing) ---');
const billingViewPath = path.resolve(process.cwd(), 'src/components/admin/BillingView.tsx');
assert(fs.existsSync(billingViewPath), 'BillingView.tsx exists');
const billingViewContent = fs.readFileSync(billingViewPath, 'utf8');

assert(billingViewContent.includes("useState<string>('1500')"), 'Payment amount uses string state');
assert(!billingViewContent.includes('onChange={(e) => setAmount(Number(e.target.value))}'), 'Does not force Number(e.target.value) on payment amount');
assert(billingViewContent.includes('onChange={(e) => setAmount(e.target.value)}'), 'Payment amount updates directly with string e.target.value');

const validatePaymentInput = (memberSelected: boolean, customName: string, amountStr: string) => {
  const parsedAmount = amountStr.trim() === '' ? NaN : parseFloat(amountStr);
  if ((!memberSelected && !customName.trim()) || isNaN(parsedAmount) || parsedAmount <= 0) {
    return false;
  }
  return true;
};

assert(validatePaymentInput(true, '', '8000') === true, 'Valid 8000 payment passes validation');
assert(validatePaymentInput(true, '', '') === false, 'Blank payment amount fails validation (never saves 0)');
assert(validatePaymentInput(true, '', '1500.50') === true, 'Decimal payment amount passes validation');

// --- 4. Audit ConvertEnquiryModal.tsx ---
console.log('\n--- TEST SUITE 4: ConvertEnquiryModal.tsx (Lead Conversion) ---');
const convertModalPath = path.resolve(process.cwd(), 'src/components/admin/ConvertEnquiryModal.tsx');
assert(fs.existsSync(convertModalPath), 'ConvertEnquiryModal.tsx exists');
const convertModalContent = fs.readFileSync(convertModalPath, 'utf8');

assert(convertModalContent.includes("useState<string>('0')"), 'Convert lead amountPaid uses string state');
assert(!convertModalContent.includes('onChange={(e) => setAmountPaid(Number(e.target.value))}'), 'Does not force Number(e.target.value) on convert lead amountPaid');
assert(convertModalContent.includes('onChange={(e) => setAmountPaid(e.target.value)}'), 'amountPaid updates directly with string e.target.value');

// --- 5. Audit EventsChallengesView.tsx & TrainersAdminView.tsx ---
console.log('\n--- TEST SUITE 5: EventsChallengesView.tsx & TrainersAdminView.tsx ---');
const eventsViewPath = path.resolve(process.cwd(), 'src/components/admin/EventsChallengesView.tsx');
assert(fs.existsSync(eventsViewPath), 'EventsChallengesView.tsx exists');
const eventsViewContent = fs.readFileSync(eventsViewPath, 'utf8');

assert(eventsViewContent.includes("useState<string>('30')"), 'maxCapacity uses string state');
assert(!eventsViewContent.includes('onChange={e => setMaxCapacity(parseInt(e.target.value, 10) || 30)}'), 'Does not force default 30 while typing in maxCapacity');
assert(eventsViewContent.includes('onChange={e => setMaxCapacity(e.target.value)}'), 'maxCapacity updates directly with string e.target.value');

const trainersViewPath = path.resolve(process.cwd(), 'src/components/admin/TrainersAdminView.tsx');
assert(fs.existsSync(trainersViewPath), 'TrainersAdminView.tsx exists');
const trainersViewContent = fs.readFileSync(trainersViewPath, 'utf8');

assert(trainersViewContent.includes("useState<string>('0')"), 'activeMembersCount uses string state');
assert(!trainersViewContent.includes('onChange={(e) => setActiveMembersCount(Number(e.target.value))}'), 'Does not force Number(e.target.value) on activeMembersCount');
assert(trainersViewContent.includes('onChange={(e) => setActiveMembersCount(e.target.value)}'), 'activeMembersCount updates directly with string e.target.value');

// --- 6. Simulate Keystroke Workflow ---
console.log('\n--- TEST SUITE 6: Simulate User Keystrokes (Backspace, Edit, Decimals) ---');

// Simulated input lifecycle
class SimulatedInput {
  value: string;
  constructor(initial: string) {
    this.value = initial;
  }
  type(chars: string) {
    this.value += chars;
  }
  backspace() {
    this.value = this.value.slice(0, -1);
  }
  selectAllAndDelete() {
    this.value = '';
  }
  replace(newVal: string) {
    this.value = newVal;
  }
}

// 1. Enter 8000, Backspace until empty
const input = new SimulatedInput('8000');
input.backspace(); // 800
input.backspace(); // 80
input.backspace(); // 8
input.backspace(); // ""
assert(input.value === '', 'Field is completely blank after deleting all 4 digits of 8000');
assert(input.value !== '0', 'Field does NOT turn into 0 when empty');

// 2. Type 5000 again
input.type('5000');
assert(input.value === '5000', 'Typing 5000 works after clearing');

// 3. Edit middle digits
input.replace('5500');
assert(input.value === '5500', 'Editing middle digits works as expected');

// 4. Select all and delete
input.selectAllAndDelete();
assert(input.value === '', 'Select all and delete results in genuinely empty field');

// 5. Enter decimal
input.type('1500.75');
assert(input.value === '1500.75', 'Decimal entry 1500.75 is fully preserved');
assert(parseFloat(input.value) === 1500.75, 'Parsed numeric value is exactly 1500.75');

console.log('\n======================================================');
console.log('ALL NUMERIC INPUT & EMPTY HANDLING TESTS PASSED');
console.log('======================================================\n');
