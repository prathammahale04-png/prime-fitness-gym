import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PaymentRecord, PaymentMethod, Member, MembershipPackage } from '../../types/database.types';
import { getPayments, recordPayment } from '../../services/gymPlatformService';
import { getMembers } from '../../services/memberService';
import { getPackages } from '../../services/packageService';
import { InvoiceModal } from './InvoiceModal';
import {
  CreditCard,
  Plus,
  Search,
  IndianRupee,
  CheckCircle2,
  Calendar,
  X,
  Printer,
  Smartphone,
  Banknote,
  Building,
  ShieldCheck,
  AlertCircle,
  FileText,
  ExternalLink,
} from 'lucide-react';

export const BillingView: React.FC = () => {
  const { session, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [packages, setPackages] = useState<MembershipPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentMethod>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoicePayment, setSelectedInvoicePayment] = useState<PaymentRecord | null>(null);

  // Form states
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [customMemberName, setCustomMemberName] = useState('');
  const [amount, setAmount] = useState<number>(1500);
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [referenceId, setReferenceId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [paymentsRes, membersRes, packagesRes] = await Promise.all([
      getPayments(),
      getMembers(undefined, session),
      getPackages(),
    ]);
    setPayments(paymentsRes);
    setMembers(membersRes.members);
    setPackages(packagesRes.packages);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, session?.user?.id]);

  // Persistent URL synchronization for invoice viewing and printing across page refreshes
  const handleOpenInvoice = useCallback((payment: PaymentRecord) => {
    setSelectedInvoicePayment(payment);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('invoice', payment.receipt_number);
      window.history.pushState({ invoice: payment.receipt_number }, '', url.toString());
    } catch {
      // fallback
    }
  }, []);

  const handleCloseInvoice = useCallback(() => {
    setSelectedInvoicePayment(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('invoice');
      window.history.pushState({}, '', url.toString());
    } catch {
      // fallback
    }
  }, []);

  // Resolve persistent invoice from URL query parameter on page load and browser navigation
  useEffect(() => {
    const handleUrlInvoice = () => {
      const params = new URLSearchParams(window.location.search);
      const invoiceRef = params.get('invoice');
      if (!invoiceRef) {
        setSelectedInvoicePayment(null);
        return;
      }
      if (payments.length > 0) {
        const found = payments.find(
          p => p.receipt_number.toLowerCase() === invoiceRef.toLowerCase() || p.id === invoiceRef
        );
        if (found) {
          setSelectedInvoicePayment(found);
        } else {
          setErrorMsg(`Invoice record with reference "${invoiceRef}" could not be located in transaction history.`);
        }
      }
    };

    handleUrlInvoice();

    window.addEventListener('popstate', handleUrlInvoice);
    return () => window.removeEventListener('popstate', handleUrlInvoice);
  }, [payments]);

  const handleOpenRecord = (member?: Member) => {
    if (member) {
      setSelectedMemberId(member.id);
      setCustomMemberName(member.full_name);
      setAmount(member.balance_due > 0 ? member.balance_due : 1500);
    } else {
      setSelectedMemberId('');
      setCustomMemberName('');
      setAmount(1500);
    }
    setMethod('upi');
    setReferenceId('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleMemberSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mId = e.target.value;
    setSelectedMemberId(mId);
    const m = members.find(mem => mem.id === mId);
    if (m) {
      setCustomMemberName(m.full_name);
      if (m.balance_due > 0) setAmount(m.balance_due);
    } else {
      setCustomMemberName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!selectedMemberId && !customMemberName.trim()) || amount <= 0) {
      setErrorMsg('Please enter a valid member name and payment amount.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const m = members.find(mem => mem.id === selectedMemberId);
    const memberName = m ? m.full_name : customMemberName.trim();

    const res = await recordPayment({
      member_id: selectedMemberId || null,
      member_name: memberName,
      amount: Number(amount),
      payment_method: method,
      reference_id: referenceId.trim() || null,
      payment_date: paymentDate,
      notes: notes.trim() || null,
    });

    setIsSubmitting(false);

    if (res.success && res.data) {
      if (!res.isLive) {
        setStorageWarning('Note: Payment was recorded in local browser storage because Supabase migration 003 has not yet been applied in your Supabase project. To sync across devices, run migration 003 in Supabase SQL Editor.');
      } else {
        setStorageWarning(null);
      }
      setIsModalOpen(false);
      handleOpenInvoice(res.data);
      await loadData();
    } else {
      setErrorMsg(res.error || 'Failed to record payment.');
    }
  };

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchSearch =
        p.member_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.reference_id && p.reference_id.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchMethod = methodFilter === 'all' || p.payment_method === methodFilter;
      return matchSearch && matchMethod;
    });
  }, [payments, searchQuery, methodFilter]);

  // Totals breakdown
  const metrics = useMemo(() => {
    const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const upiTotal = payments.filter(p => p.payment_method === 'upi').reduce((sum, p) => sum + Number(p.amount), 0);
    const cashTotal = payments.filter(p => p.payment_method === 'cash').reduce((sum, p) => sum + Number(p.amount), 0);
    const totalDues = members.reduce((sum, m) => sum + Number(m.balance_due || 0), 0);
    return { totalCollected, upiTotal, cashTotal, totalDues };
  }, [payments, members]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#f36b22]/10 border border-[#f36b22]/30 text-[10px] font-mono text-[#f36b22] uppercase tracking-wider mb-1">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Billing & Revenue Module</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-white">
            Billing, Invoices & Sales Records
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Record verified membership transactions, generate customer receipts, and track fee balances.
          </p>
        </div>

        <button
          onClick={() => handleOpenRecord()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#f36b22] hover:bg-[#d95614] text-white text-xs font-headline font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-lg shadow-[#f36b22]/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* Storage Warning Banner */}
      {storageWarning && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <span className="font-bold text-amber-300">Local Cache Mode: </span>
            {storageWarning}
          </div>
          <button
            onClick={() => setStorageWarning(null)}
            className="text-amber-400 hover:text-white text-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#14161d] border border-neutral-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-neutral-400 font-medium">Total Collections</span>
          <div className="text-2xl font-headline font-black text-white">
            ₹{metrics.totalCollected.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Real recorded payments</span>
        </div>

        <div className="bg-[#14161d] border border-neutral-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-neutral-400 font-medium">UPI & Digital</span>
          <div className="text-2xl font-headline font-black text-emerald-400">
            ₹{metrics.upiTotal.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">UPI / POS / Cards</span>
        </div>

        <div className="bg-[#14161d] border border-neutral-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-neutral-400 font-medium">Cash Collected</span>
          <div className="text-2xl font-headline font-black text-neutral-200">
            ₹{metrics.cashTotal.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Front desk cash</span>
        </div>

        <div className="bg-[#14161d] border border-neutral-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-amber-400 font-medium">Outstanding Balances</span>
          <div className="text-2xl font-headline font-black text-amber-400">
            ₹{metrics.totalDues.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-amber-500/80 font-mono">Uncollected member dues</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#14161d] border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Method filter pills */}
        <div className="flex items-center gap-1 bg-[#0e1014] p-1 rounded-lg border border-neutral-800 self-start sm:self-auto">
          {(['all', 'upi', 'cash', 'card', 'bank_transfer'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded-md transition-colors cursor-pointer ${
                methodFilter === m
                  ? 'bg-[#f36b22] text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {m.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search receipt #, member name, or reference..."
            className="w-full pl-9 pr-4 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-[#f36b22]"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#14161d] border border-neutral-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-neutral-400 text-xs font-mono">
            Loading transaction ledger...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 text-xs">
            No payment transactions found matching the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-[#0e1014] text-[10px] font-mono uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Invoice / Receipt #</th>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference ID</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 text-right">Invoice & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {filteredPayments.map(p => {
                  return (
                    <tr key={p.id} className="hover:bg-[#181a24] transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-[#f36b22] font-bold">
                        <button
                          type="button"
                          onClick={() => handleOpenInvoice(p)}
                          className="hover:underline focus:outline-hidden text-left cursor-pointer inline-flex items-center gap-1 text-[#f36b22]"
                          title="Click to view and print official tax invoice"
                        >
                          <span>{p.receipt_number}</span>
                          <ExternalLink className="w-3 h-3 opacity-60 hover:opacity-100" />
                        </button>
                      </td>
                      <td className="py-3 px-4 font-medium text-white">
                        {p.member_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-400">
                        {p.payment_date}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-[#1e2330] border border-neutral-700 text-neutral-300">
                          {p.payment_method.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-400 truncate max-w-[140px]">
                        {p.reference_id || '—'}
                      </td>
                      <td className="py-3 px-4 font-bold text-white text-sm">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenInvoice(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1b1f2b] hover:bg-[#f36b22] text-neutral-200 hover:text-white border border-neutral-700/80 hover:border-[#f36b22] rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
                          title="View & Print Official A4 Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View / Print Invoice</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#14161d] border border-neutral-800 rounded-xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl">
            <div className="border-t-2 border-[#f36b22] absolute top-0 left-0 right-0 rounded-t-xl" />

            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h3 className="font-headline font-black text-lg text-white uppercase tracking-tight">
                Record Payment Transaction
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Select Registered Member (or type name below)
                </label>
                <select
                  value={selectedMemberId}
                  onChange={handleMemberSelect}
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none"
                >
                  <option value="">-- Choose Member or Manual Entry --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.member_code}) — {m.package_name || 'Standard'} {m.balance_due > 0 ? `[₹${m.balance_due} Due]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedMemberId && (
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Member Name (Manual) *
                  </label>
                  <input
                    type="text"
                    value={customMemberName}
                    onChange={(e) => setCustomMemberName(e.target.value)}
                    placeholder="e.g. Rahul Patil"
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Amount Received (₹ INR) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#f36b22] font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      min={1}
                      required
                      className="w-full pl-8 pr-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Payment Method *
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none"
                  >
                    <option value="upi">UPI / QR Code</option>
                    <option value="cash">Cash (Front Desk)</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="bank_transfer">Net Banking / NEFT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Transaction / Reference ID
                  </label>
                  <input
                    type="text"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    placeholder="e.g. UPI Ref / Cheque No"
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Quarterly membership renewal installment"
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-700 rounded-lg text-neutral-300 text-xs font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#f36b22] hover:bg-[#d95614] text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official A4 Print-Ready Tax Invoice Modal */}
      {selectedInvoicePayment && (
        <InvoiceModal
          payment={selectedInvoicePayment}
          member={
            members.find(
              m => (selectedInvoicePayment.member_id && m.id === selectedInvoicePayment.member_id) ||
                   m.full_name.trim().toLowerCase() === selectedInvoicePayment.member_name.trim().toLowerCase()
            ) || null
          }
          packageDetails={(() => {
            const mem = members.find(
              m => (selectedInvoicePayment.member_id && m.id === selectedInvoicePayment.member_id) ||
                   m.full_name.trim().toLowerCase() === selectedInvoicePayment.member_name.trim().toLowerCase()
            );
            if (!mem) return null;
            return packages.find(
              pkg => (mem.package_id && pkg.id === mem.package_id) ||
                     (mem.package_name && pkg.name.trim().toLowerCase() === mem.package_name.trim().toLowerCase())
            ) || null;
          })()}
          onClose={handleCloseInvoice}
        />
      )}
    </div>
  );
};
