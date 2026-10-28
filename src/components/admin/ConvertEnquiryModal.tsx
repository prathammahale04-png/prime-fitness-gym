import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { EnquiryRecord, MembershipPackage, Member, PaymentMethod } from '../../types/database.types';
import {
  calculateExpiryDate,
  matchPackageFromEnquiry,
  convertEnquiryToMember,
} from '../../services/memberService';
import {
  X,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  User,
  Tag,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface ConvertEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiry: EnquiryRecord | null;
  packages: MembershipPackage[];
  onSuccess: (newMember: Member) => void;
  onNavigateToMembers?: (leadData?: any) => void;
}

export const ConvertEnquiryModal: React.FC<ConvertEnquiryModalProps> = ({
  isOpen,
  onClose,
  enquiry,
  packages,
  onSuccess,
  onNavigateToMembers,
}) => {
  const { session } = useAuth();

  // Form states pre-filled from enquiry
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [selectedPkgId, setSelectedPkgId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [paymentReference, setPaymentReference] = useState('');
  const [recordPaymentReceipt, setRecordPaymentReceipt] = useState(true);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Status and submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdMember, setCreatedMember] = useState<Member | null>(null);

  // When an enquiry is provided or changes, prefill all data
  useEffect(() => {
    if (enquiry && isOpen) {
      setFullName(enquiry.full_name || '');
      setPhone(enquiry.phone || '');
      setEmail(enquiry.email || '');
      setStartDate(new Date().toISOString().split('T')[0]);
      setGender('male');
      setEmergencyContact('');
      setAddress('');
      setPaymentMethod('upi');
      setPaymentReference('');
      setRecordPaymentReceipt(true);
      setFormError(null);
      setCreatedMember(null);

      // Pre-match package based on enquiry's interested_package
      const matched = matchPackageFromEnquiry(enquiry.interested_package, packages);
      if (matched) {
        setSelectedPkgId(matched.id);
        setAmountPaid(matched.price);
      } else if (packages.length > 0) {
        setSelectedPkgId(packages[0].id);
        setAmountPaid(packages[0].price);
      }

      // Pre-fill notes with source and original details
      const sourcePrefix = enquiry.source ? `[Source: ${enquiry.source}]` : '';
      const interestedPrefix = enquiry.interested_package ? `[Selected Plan: ${enquiry.interested_package}]` : '';
      const leadNotes = enquiry.notes || '';
      const combinedNotes = [sourcePrefix, interestedPrefix, leadNotes].filter(Boolean).join(' ');
      setNotes(combinedNotes);
    }
  }, [enquiry, isOpen, packages]);

  // Find active selected package
  const activePackage = useMemo(() => {
    return packages.find((p) => p.id === selectedPkgId) || packages[0];
  }, [packages, selectedPkgId]);

  // Handle package selection change to auto-update suggested payment
  const handlePackageChange = (pkgId: string) => {
    setSelectedPkgId(pkgId);
    const chosen = packages.find((p) => p.id === pkgId);
    if (chosen) {
      setAmountPaid(chosen.price);
    }
  };

  // Real-time calculated expiry date
  const calculatedExpiry = useMemo(() => {
    if (!activePackage) return '';
    return calculateExpiryDate(startDate, activePackage.duration_days);
  }, [startDate, activePackage]);

  // Real-time calculated balance due
  const calculatedBalanceDue = useMemo(() => {
    if (!activePackage) return 0;
    return Math.max(0, activePackage.price - (amountPaid || 0));
  }, [activePackage, amountPaid]);

  if (!isOpen || !enquiry) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setFormError('Member full name is required (minimum 2 characters).');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!activePackage) {
      setFormError('Please select a valid membership package.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await convertEnquiryToMember({
        enquiryId: enquiry.id,
        fullName: trimmedName,
        phone: cleanPhone,
        email: email.trim() || null,
        gender,
        address: address.trim() || null,
        emergencyContact: emergencyContact.trim() || null,
        packageId: activePackage.id,
        packageName: activePackage.name,
        durationDays: activePackage.duration_days,
        packagePrice: activePackage.price,
        startDate,
        amountPaid: Number(amountPaid) || 0,
        balanceDue: calculatedBalanceDue,
        paymentMethod,
        paymentReference: paymentReference.trim() || null,
        recordPayment: recordPaymentReceipt,
        notes: notes.trim() || null,
        sessionOverride: session,
      });

      if (!res.success || !res.data) {
        setFormError(res.error || 'Failed to convert lead into gym member record.');
        setIsSubmitting(false);
        return;
      }

      // Member successfully created in Supabase
      setCreatedMember(res.data);
      onSuccess(res.data);
    } catch (err: any) {
      console.error('Enquiry conversion error:', err);
      setFormError(err?.message || 'Unexpected network error during conversion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setCreatedMember(null);
    setFormError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#14161d] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8 text-neutral-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0e1014] border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#f36b22]/15 border border-[#f36b22]/40 flex items-center justify-center text-[#f36b22]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-headline font-black uppercase tracking-tight text-white flex items-center gap-2">
                <span>Convert Lead to Active Member</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Automatic Supabase membership registration & billing ledger sync
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800/60 transition-colors cursor-pointer disabled:opacity-50"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Screen */}
        {createdMember ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
                Member Activated Successfully
              </span>
              <h4 className="text-2xl font-headline font-black uppercase text-white tracking-tight">
                {createdMember.member_code} — {createdMember.full_name}
              </h4>
              <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                Lead status updated to <span className="text-emerald-400 font-bold uppercase">Converted</span> and
                registered into live Supabase <code className="text-neutral-300">public.members</code>.
              </p>
            </div>

            {/* Quick Summary Card */}
            <div className="bg-[#0e1014] border border-neutral-800/80 rounded-xl p-4 text-left grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">Package</span>
                <span className="font-bold text-white uppercase">{createdMember.package_name || 'Standard'}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">Valid Until</span>
                <span className="font-mono text-emerald-400 font-bold">{createdMember.expiry_date}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">Amount Paid</span>
                <span className="font-mono font-bold text-white">₹ {createdMember.amount_paid.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">Balance Due</span>
                <span className={`font-mono font-bold ${createdMember.balance_due > 0 ? 'text-amber-400' : 'text-neutral-400'}`}>
                  ₹ {createdMember.balance_due.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">Mobile</span>
                <span className="font-mono text-neutral-300">{createdMember.phone}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">Database Status</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                  <ShieldCheck className="w-3 h-3" /> Live Synced
                </span>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {onNavigateToMembers && (
                <button
                  onClick={() => {
                    handleClose();
                    onNavigateToMembers({
                      fullName: createdMember.full_name,
                      phone: createdMember.phone,
                    });
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#f36b22] hover:bg-[#d95614] text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer shadow-lg flex items-center justify-center gap-2"
                >
                  <span>View in Members Directory</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleClose}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#1e222d] hover:bg-[#282d3c] text-neutral-300 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer border border-neutral-700"
              >
                Done (Stay in Leads)
              </button>
            </div>
          </div>
        ) : (
          /* Pre-filled Conversion Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Lead Context Banner */}
            <div className="bg-[#0e1014] border border-neutral-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-[#f36b22]/15 text-[#f36b22] border border-[#f36b22]/30 rounded font-mono text-[10px] uppercase font-bold">
                  Lead #{enquiry.id.substring(0, 8)}
                </span>
                <span className="text-neutral-400">Source:</span>
                <span className="font-bold text-neutral-200">{enquiry.source || 'Website'}</span>
                <span className="text-neutral-600">•</span>
                <span className="text-neutral-400">Expressed Interest:</span>
                <span className="font-bold text-white bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700">
                  {enquiry.interested_package || 'General Inquiry'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-neutral-500">
                Received: {new Date(enquiry.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </span>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Member Details */}
            <div className="space-y-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#f36b22] font-bold">
                1. Member Identity & Contact
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Full Name <span className="text-[#f36b22]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Patil"
                      className="w-full pl-9 pr-3 py-2 bg-[#0e1014] border border-neutral-700 focus:border-[#f36b22] focus:outline-none rounded-lg text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Phone Number (10 Digits) <span className="text-[#f36b22]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9822012345"
                      className="w-full pl-9 pr-3 py-2 bg-[#0e1014] border border-neutral-700 focus:border-[#f36b22] focus:outline-none rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. member@example.com"
                      className="w-full pl-9 pr-3 py-2 bg-[#0e1014] border border-neutral-700 focus:border-[#f36b22] focus:outline-none rounded-lg text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Gender
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['male', 'female', 'other'] as const).map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => setGender(g)}
                        className={`py-2 text-xs font-bold uppercase rounded-lg border transition-colors cursor-pointer ${
                          gender === g
                            ? 'bg-[#f36b22]/20 border-[#f36b22] text-[#f36b22]'
                            : 'bg-[#0e1014] border-neutral-700 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Package & Membership Schedule */}
            <div className="space-y-4 pt-2 border-t border-neutral-800/80">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#f36b22] font-bold">
                2. Membership Package & Validity
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Select Package <span className="text-[#f36b22]">*</span>
                  </label>
                  <select
                    value={selectedPkgId}
                    onChange={(e) => handlePackageChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700 focus:border-[#f36b22] focus:outline-none rounded-lg text-xs text-white uppercase font-bold cursor-pointer"
                  >
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} — {pkg.duration_days} Days (₹ {pkg.price.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Membership Start Date <span className="text-[#f36b22]">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#0e1014] border border-neutral-700 focus:border-[#f36b22] focus:outline-none rounded-lg text-xs text-white font-mono cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Expiry Date Calculation Card */}
              {activePackage && (
                <div className="p-3 bg-[#0e1014] border border-neutral-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                      Calculated Validity ({activePackage.duration_days} Days)
                    </span>
                    <span className="font-mono text-emerald-400 font-bold text-sm">
                      {calculatedExpiry ? `Expires: ${calculatedExpiry}` : 'Calculating...'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase text-neutral-500 block">Package Rate</span>
                    <span className="font-mono text-white font-bold text-sm">
                      ₹ {activePackage.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Payment & Dues Section */}
            <div className="space-y-4 pt-2 border-t border-neutral-800/80">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#f36b22] font-bold">
                3. Initial Payment & Ledger
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Amount Paid Now (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700 focus:border-[#f36b22] focus:outline-none rounded-lg text-xs text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700 focus:border-[#f36b22] focus:outline-none rounded-lg text-xs text-white uppercase font-bold cursor-pointer"
                  >
                    <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="cash">Cash Counter</option>
                    <option value="card">Card / POS</option>
                    <option value="bank_transfer">Bank Transfer / IMPS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Balance Due (₹)
                  </label>
                  <div
                    className={`px-3 py-2 bg-[#0e1014] border rounded-lg text-xs font-mono font-bold flex items-center justify-between ${
                      calculatedBalanceDue > 0
                        ? 'border-amber-500/40 text-amber-400'
                        : 'border-neutral-700 text-emerald-400'
                    }`}
                  >
                    <span>₹ {calculatedBalanceDue.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] uppercase font-normal">
                      {calculatedBalanceDue > 0 ? 'Pending' : 'Fully Paid'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Transaction / Reference ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g. UPI/284910284920"
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700 focus:border-[#f36b22] focus:outline-none rounded-lg text-xs text-white font-mono"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-5">
                  <input
                    type="checkbox"
                    id="recordPaymentCheck"
                    checked={recordPaymentReceipt}
                    onChange={(e) => setRecordPaymentReceipt(e.target.checked)}
                    className="w-4 h-4 rounded text-[#f36b22] focus:ring-[#f36b22] bg-[#0e1014] border-neutral-700 cursor-pointer"
                  />
                  <label htmlFor="recordPaymentCheck" className="text-xs text-neutral-300 cursor-pointer">
                    Issue formal receipt & log in Billing Ledger
                  </label>
                </div>
              </div>
            </div>

            {/* Notes & Extra Info */}
            <div className="space-y-4 pt-2 border-t border-neutral-800/80">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#f36b22] font-bold">
                4. Lead Context & Member Notes
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                  Athlete Profile Notes / Slot / Discipline Focus
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Preferred Morning 6 AM slot • Focus: Powerlifting & Strength"
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700 focus:border-[#f36b22] focus:outline-none rounded-lg text-xs text-white"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold uppercase rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#f36b22] hover:bg-[#d95614] text-white text-xs font-bold uppercase rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Registering Member in Supabase...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Confirm & Register Member</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
