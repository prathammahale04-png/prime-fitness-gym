import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Member, MembershipPackage } from '../../types/database.types';
import { getMembers, addMember, renewMember, toggleMemberDeactivate, calculateExpiryDate, updateMemberPhone, syncCachedMembersToDatabase } from '../../services/memberService';
import { getPackages } from '../../services/packageService';
import { recordPayment } from '../../services/gymPlatformService';
import { WhatsAppReminderModal } from './WhatsAppReminderModal';
import {
  normalizeIndianPhoneNumber,
  getDaysDifference,
  getIndiaTodayDate,
  generateReminderMessage,
  ReminderMemberItem,
} from '../../utils/reminderUtils';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Phone,
  Calendar,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
  CreditCard,
  UserCheck,
  UserX,
  Clock,
  Layers,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';

export interface InitialMemberPrefill {
  fullName?: string;
  phone?: string;
  email?: string | null;
  packageName?: string | null;
  notes?: string | null;
  mode?: 'add' | 'view';
}

interface MembersViewProps {
  initialMemberData?: InitialMemberPrefill | null;
  onClearInitialData?: () => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  initialMemberData,
  onClearInitialData,
}) => {
  const { session, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [packages, setPackages] = useState<MembershipPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isCachedFallback, setIsCachedFallback] = useState(false);
  const [isSyncingCached, setIsSyncingCached] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'inactive'>('all');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [reminderModalItem, setReminderModalItem] = useState<ReminderMemberItem | null>(null);

  // Add Member Form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [selectedPkgId, setSelectedPkgId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Renew Form
  const [renewPkgId, setRenewPkgId] = useState('');
  const [renewStartDate, setRenewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [renewAmountPaid, setRenewAmountPaid] = useState<number>(0);

  const loadData = async () => {
    setLoading(true);
    setSyncError(null);
    const [membersRes, pkgRes] = await Promise.all([
      getMembers({ search: searchQuery, status: statusFilter }, session),
      getPackages(),
    ]);
    setMembers(membersRes.members);
    setIsLive(membersRes.isLive);
    setIsCachedFallback(Boolean(membersRes.isCachedFallback));
    if (membersRes.error) {
      setSyncError(membersRes.error);
    } else if (membersRes.notice) {
      setSyncError(membersRes.notice);
    } else {
      setSyncError(null);
    }
    setPackages(pkgRes.packages.filter(p => p.is_active));
    if (pkgRes.packages.length > 0 && !selectedPkgId) {
      setSelectedPkgId(pkgRes.packages[0].id);
      setAmountPaid(pkgRes.packages[0].price);
    }
    setLoading(false);
  };

  const handleUploadCachedToDb = async () => {
    setIsSyncingCached(true);
    setSyncSuccessMsg(null);
    const res = await syncCachedMembersToDatabase();
    setIsSyncingCached(false);
    if (res.success) {
      const summaryParts = [];
      if (res.succeeded.length > 0) summaryParts.push(`Uploaded ${res.succeeded.length} (${res.succeeded.join(', ')})`);
      if (res.skipped.length > 0) summaryParts.push(`Already in database: ${res.skipped.join(', ')}`);
      setSyncSuccessMsg(`✓ Sync complete: ${summaryParts.join(' | ') || 'All records up to date.'}`);
      await loadData();
      setTimeout(() => setSyncSuccessMsg(null), 6000);
    } else {
      setSyncError(res.error || 'Failed to upload cached members to Supabase.');
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, session?.user?.id, session?.access_token, statusFilter]);

  // Listen for realtime conversion events across the application
  useEffect(() => {
    const handleDataChanged = () => {
      loadData();
    };
    window.addEventListener('primefitness:data-changed', handleDataChanged);
    return () => {
      window.removeEventListener('primefitness:data-changed', handleDataChanged);
    };
  }, [session]);

  // Handle prefilling from Enquiries "Convert" action or navigation
  useEffect(() => {
    if (initialMemberData) {
      if (initialMemberData.mode === 'view') {
        // If mode is view, filter the directory to this member without opening Add modal
        if (initialMemberData.fullName) {
          setSearchQuery(initialMemberData.fullName);
        } else if (initialMemberData.phone) {
          setSearchQuery(initialMemberData.phone);
        }
      } else {
        // Mode is add: prefill manual Add Member form
        if (initialMemberData.fullName) setFullName(initialMemberData.fullName);
        if (initialMemberData.phone) setPhone(initialMemberData.phone);
        if (initialMemberData.email) setEmail(initialMemberData.email);
        if (initialMemberData.notes) setNotes(initialMemberData.notes);
        if (initialMemberData.packageName && packages.length > 0) {
          const pkgMatch = packages.find(p =>
            initialMemberData.packageName!.toLowerCase().includes(p.name.toLowerCase()) ||
            p.name.toLowerCase().includes(initialMemberData.packageName!.toLowerCase())
          );
          if (pkgMatch) {
            setSelectedPkgId(pkgMatch.id);
            setAmountPaid(pkgMatch.price);
          }
        }
        setIsAddOpen(true);
      }
      if (onClearInitialData) onClearInitialData();
    }
  }, [initialMemberData, packages, onClearInitialData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Selected package object
  const activeSelectedPkg = useMemo(() => {
    return packages.find(p => p.id === selectedPkgId) || packages[0];
  }, [packages, selectedPkgId]);

  // Auto-calculated expiry date for Add Member
  const calculatedExpiry = useMemo(() => {
    if (!activeSelectedPkg) return '';
    return calculateExpiryDate(startDate, activeSelectedPkg.duration_days);
  }, [startDate, activeSelectedPkg]);

  // Auto-calculated balance due for Add Member
  const calculatedBalanceDue = useMemo(() => {
    if (!activeSelectedPkg) return 0;
    return Math.max(0, activeSelectedPkg.price - (amountPaid || 0));
  }, [activeSelectedPkg, amountPaid]);

  // Selected renew package object
  const activeRenewPkg = useMemo(() => {
    return packages.find(p => p.id === renewPkgId) || packages[0];
  }, [packages, renewPkgId]);

  const calculatedRenewExpiry = useMemo(() => {
    if (!activeRenewPkg) return '';
    return calculateExpiryDate(renewStartDate, activeRenewPkg.duration_days);
  }, [renewStartDate, activeRenewPkg]);

  const handleOpenAdd = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setGender('male');
    setStartDate(new Date().toISOString().split('T')[0]);
    if (packages.length > 0) {
      setSelectedPkgId(packages[0].id);
      setAmountPaid(packages[0].price);
    }
    setEmergencyContact('');
    setNotes('');
    setFormError(null);
    setIsAddOpen(true);
  };

  const handlePkgSelect = (pkgId: string) => {
    setSelectedPkgId(pkgId);
    const pkg = packages.find(p => p.id === pkgId);
    if (pkg) {
      setAmountPaid(pkg.price);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !activeSelectedPkg) {
      setFormError('Please enter full name, phone number, and select a package.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const res = await addMember(
      {
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        gender,
        package_id: activeSelectedPkg.id,
        start_date: startDate,
        amount_paid: Number(amountPaid),
        balance_due: calculatedBalanceDue,
        emergency_contact: emergencyContact.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      activeSelectedPkg,
      session
    );

    setIsSubmitting(false);

    if (!res.success) {
      setFormError(res.error || 'Failed to add member to database.');
      return;
    }

    // Automatically record initial fee in billing ledger if payment was collected
    if (res.data && Number(amountPaid) > 0) {
      try {
        await recordPayment({
          member_id: res.data.id,
          member_name: res.data.full_name,
          amount: Number(amountPaid),
          payment_method: 'cash',
          reference_id: 'REGISTRATION',
          payment_date: startDate,
          notes: `Registration payment for ${activeSelectedPkg.name}`,
        });
      } catch (payErr) {
        console.warn('Payment recording notice:', payErr);
      }
    }

    setSyncSuccessMsg(`✓ Member "${res.data?.full_name}" (${res.data?.member_code}) successfully added to database!`);
    setIsAddOpen(false);
    await loadData();
    setTimeout(() => setSyncSuccessMsg(null), 6000);
  };

  const handleOpenRenew = (m: Member) => {
    setSelectedMember(m);
    const defaultPkg = packages.find(p => p.id === m.package_id) || packages[0];
    if (defaultPkg) {
      setRenewPkgId(defaultPkg.id);
      setRenewAmountPaid(defaultPkg.price);
    }
    setRenewStartDate(new Date().toISOString().split('T')[0]);
    setIsRenewOpen(true);
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !activeRenewPkg) return;

    setIsSubmitting(true);
    const res = await renewMember(
      selectedMember.id,
      activeRenewPkg,
      renewStartDate,
      Number(renewAmountPaid),
      session
    );
    setIsSubmitting(false);

    if (res.success) {
      // Automatically record renewal payment in billing ledger
      if (Number(renewAmountPaid) > 0) {
        try {
          await recordPayment({
            member_id: selectedMember.id,
            member_name: selectedMember.full_name,
            amount: Number(renewAmountPaid),
            payment_method: 'cash',
            reference_id: 'RENEWAL',
            payment_date: renewStartDate,
            notes: `Renewal payment for ${activeRenewPkg.name}`,
          });
        } catch (payErr) {
          console.warn('Payment recording notice:', payErr);
        }
      }
      setSyncSuccessMsg(`✓ Membership renewed for "${selectedMember.full_name}"!`);
      setIsRenewOpen(false);
      await loadData();
      setTimeout(() => setSyncSuccessMsg(null), 5000);
    } else {
      setSyncError(res.error || 'Failed to renew membership.');
    }
  };

  const handleToggleDeactivate = async (m: Member) => {
    const res = await toggleMemberDeactivate(m.id, m.status, session);
    if (!res.success) {
      setSyncError(res.error || 'Failed to update member status.');
    } else {
      await loadData();
    }
  };

  const handleOpenWhatsAppReminder = (m: Member) => {
    const today = getIndiaTodayDate();
    const diff = getDaysDifference(m.expiry_date, today);
    const cat = diff === 0 ? 'today' : diff > 0 && diff <= 7 ? 'soon' : diff < 0 ? 'expired' : 'soon';
    const label =
      diff === 0
        ? 'Expires Today'
        : diff > 0
        ? `Expires in ${diff} days`
        : `Expired ${Math.abs(diff)} days ago`;
    const validation = normalizeIndianPhoneNumber(m.phone);
    const msg = generateReminderMessage(m, cat);
    setReminderModalItem({
      member: m,
      category: cat,
      daysDiff: diff,
      daysLabel: label,
      phoneValidation: validation,
      defaultMessage: msg,
    });
  };

  // Metrics summary
  const counts = useMemo(() => {
    const total = members.length;
    const active = members.filter(m => m.status === 'active').length;
    const expired = members.filter(m => m.status === 'expired').length;
    const inactive = members.filter(m => m.status === 'inactive').length;
    return { total, active, expired, inactive };
  }, [members]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#f36b22]/10 border border-[#f36b22]/30 text-[10px] font-mono text-[#f36b22] uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Stage 3 · Member Management</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-white">
            Member Registry & Profiles
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manual member registration, membership renewals, validity tracking, and contact registry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Data Source Mode Pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono border ${
              isLive
                ? isCachedFallback
                  ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                  : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLive
                  ? isCachedFallback
                    ? 'bg-amber-400'
                    : 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400'
              }`}
            />
            <span>
              {isLive
                ? isCachedFallback
                  ? 'Live Supabase · Cached Records'
                  : 'Live Supabase'
                : 'Offline Cache'}
            </span>
          </div>

          <button
            onClick={() => loadData()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#14161d] hover:bg-[#1a1d28] border border-neutral-800 rounded-lg text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh members"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#f36b22]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#f36b22] hover:bg-[#d95614] text-white text-xs font-headline font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-[#f36b22]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Member</span>
          </button>
        </div>
      </div>

      {/* Sync Status / Offline Notice Banner */}
      {(syncError || syncSuccessMsg) && (
        <div className={`p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border ${
          syncSuccessMsg
            ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
            : isLive
            ? 'bg-amber-950/30 border-amber-800/60 text-amber-300'
            : 'bg-neutral-900 border-neutral-800 text-neutral-300'
        }`}>
          <div className="flex items-start gap-2.5">
            {syncSuccessMsg ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <strong className="text-white block font-headline uppercase tracking-wider text-[11px] mb-0.5">
                {syncSuccessMsg
                  ? 'Supabase Sync Completed'
                  : isCachedFallback
                  ? 'Database Empty · Cached Fallback Active'
                  : isLive
                  ? 'Sync Notice'
                  : 'Data Source Notice'}
              </strong>
              <p className="text-neutral-300 leading-relaxed font-mono text-[11px]">
                {syncSuccessMsg || syncError}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isCachedFallback && !syncSuccessMsg && (
              <button
                onClick={handleUploadCachedToDb}
                disabled={isSyncingCached}
                className="px-3 py-1.5 bg-[#f36b22] hover:bg-[#d95614] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSyncingCached ? 'Uploading...' : 'Upload Cached to Supabase'}
              </button>
            )}
            <button
              onClick={() => loadData()}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
            >
              Retry Live Sync
            </button>
          </div>
        </div>
      )}

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#14171d] border border-neutral-800 p-3.5 flex items-center justify-between">
          <span className="text-xs text-neutral-400 font-headline uppercase">Total Members</span>
          <span className="text-lg font-headline font-black text-white">{counts.total}</span>
        </div>
        <div className="bg-[#14171d] border border-neutral-800 p-3.5 flex items-center justify-between">
          <span className="text-xs text-emerald-400 font-headline uppercase">Active</span>
          <span className="text-lg font-headline font-black text-emerald-400">{counts.active}</span>
        </div>
        <div className="bg-[#14171d] border border-neutral-800 p-3.5 flex items-center justify-between">
          <span className="text-xs text-amber-400 font-headline uppercase">Expired</span>
          <span className="text-lg font-headline font-black text-amber-400">{counts.expired}</span>
        </div>
        <div className="bg-[#14171d] border border-neutral-800 p-3.5 flex items-center justify-between">
          <span className="text-xs text-neutral-500 font-headline uppercase">Inactive</span>
          <span className="text-lg font-headline font-black text-neutral-400">{counts.inactive}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#14171d] border border-neutral-800 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-[#0e1014] p-1 border border-neutral-800 self-start sm:self-auto">
          {(['all', 'active', 'expired', 'inactive'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-xs font-headline font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                statusFilter === tab
                  ? 'bg-[#f36b22] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, or code (PF-1001)..."
            className="w-full pl-9 pr-16 py-2 bg-[#0e1014] border border-neutral-700 text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-[#f36b22]"
          />
          <button
            type="submit"
            className="absolute right-1 top-1 bottom-1 px-3 bg-[#1e232d] hover:bg-[#282e3b] text-neutral-300 text-[10px] font-headline font-bold uppercase tracking-wider cursor-pointer transition-colors"
          >
            Find
          </button>
        </form>
      </div>

      {/* Members Table */}
      <div className="bg-[#14171d] border border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-neutral-400 text-xs font-mono">
            Loading member directory...
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-8 h-8 text-neutral-600 mx-auto" />
            <h3 className="text-sm font-headline font-bold uppercase tracking-wider text-neutral-300">
              No Member Records Found
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'No members match the current search or status filter.'
                : 'Your member registry is currently empty. Click "Add New Member" to record your first member.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-[#0e1014] text-[10px] font-headline font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Balance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {members.map((m) => {
                  const isExpired = m.status === 'expired';
                  const isInactive = m.status === 'inactive';

                  return (
                    <tr key={m.id} className="hover:bg-[#181c24] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-headline font-bold text-white text-sm">
                          {m.full_name}
                        </div>
                        <span className="font-mono text-[10px] text-[#f36b22] uppercase tracking-wider">
                          {m.member_code}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-neutral-300">
                          <Phone className="w-3 h-3 text-[#f36b22]" />
                          <span>{m.phone}</span>
                        </div>
                        {m.email && (
                          <div className="text-[10px] text-neutral-500 truncate max-w-[150px]">
                            {m.email}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-headline font-bold uppercase text-white">
                          {m.package_name || 'Standard Plan'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-[11px] font-mono text-neutral-400">
                          <span>Start: {m.start_date}</span>
                        </div>
                        <div className={`text-[11px] font-mono font-bold ${isExpired ? 'text-red-400' : 'text-neutral-200'}`}>
                          <span>Expiry: {m.expiry_date}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 uppercase tracking-wider font-bold ${
                            m.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : isExpired
                              ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs">
                        {m.balance_due > 0 ? (
                          <span className="text-amber-400 font-bold">
                            ₹{m.balance_due.toLocaleString('en-IN')} Due
                          </span>
                        ) : (
                          <span className="text-neutral-500">Paid in Full</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsAppReminder(m)}
                          className="px-2 py-1 bg-[#25d366]/10 hover:bg-[#25d366]/20 text-[#25d366] text-[10px] font-semibold border border-[#25d366]/30 rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Send WhatsApp Expiry Reminder"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          onClick={() => handleOpenRenew(m)}
                          className="px-2.5 py-1 bg-[#1e232d] hover:bg-[#272d3b] text-neutral-200 hover:text-white text-[10px] font-headline font-bold uppercase tracking-wider border border-neutral-700 transition-colors cursor-pointer"
                        >
                          Renew
                        </button>

                        <button
                          onClick={() => handleToggleDeactivate(m)}
                          className={`p-1.5 transition-colors cursor-pointer border ${
                            isInactive
                              ? 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
                              : 'text-neutral-500 border-neutral-800 hover:text-amber-400 hover:border-amber-500/30'
                          }`}
                          title={isInactive ? 'Activate Member' : 'Deactivate Member'}
                        >
                          {isInactive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
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

      {/* Modal: Add New Member */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#14171d] border border-neutral-800 w-full max-w-xl p-6 sm:p-8 relative shadow-2xl my-8">
            <div className="border-t-2 border-[#f36b22] absolute top-0 left-0 right-0" />

            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h3 className="font-headline font-black text-lg text-white uppercase tracking-tight">
                Register New Gym Member
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Patil"
                    required
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700 text-white text-xs focus:border-[#f36b22] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Phone Number (10 Digits) *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9823012345"
                    required
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700 text-white text-xs focus:border-[#f36b22] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700 text-white text-xs focus:border-[#f36b22] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700 text-white text-xs focus:border-[#f36b22] focus:outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Package Selector */}
              <div>
                <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Membership Package *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {packages.map((pkg) => (
                    <button
                      type="button"
                      key={pkg.id}
                      onClick={() => handlePkgSelect(pkg.id)}
                      className={`p-3 text-left border transition-all cursor-pointer ${
                        selectedPkgId === pkg.id
                          ? 'bg-[#f36b22]/10 border-[#f36b22] text-white shadow-xs'
                          : 'bg-[#0e1014] border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="font-headline font-bold text-xs uppercase text-white truncate">
                        {pkg.name}
                      </div>
                      <div className="text-xs font-mono text-[#f36b22] mt-0.5">
                        ₹{pkg.price.toLocaleString('en-IN')} · {pkg.duration_days} Days
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates & Billing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700 text-white text-xs focus:border-[#f36b22] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Calculated Expiry Date
                  </label>
                  <div className="px-3 py-2 bg-[#0e1014] border border-neutral-800 text-emerald-400 text-xs font-mono font-bold flex items-center justify-between">
                    <span>{calculatedExpiry}</span>
                    <span className="text-[10px] text-neutral-500 font-normal">
                      +{activeSelectedPkg?.duration_days} Days
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Amount Paid Today (₹)
                  </label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    min={0}
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700 text-white text-xs focus:border-[#f36b22] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Balance Due (₹)
                  </label>
                  <div className={`px-3 py-2 bg-[#0e1014] border border-neutral-800 text-xs font-mono font-bold ${calculatedBalanceDue > 0 ? 'text-amber-400' : 'text-neutral-400'}`}>
                    ₹{calculatedBalanceDue.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Emergency Contact / Notes
                </label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. Father: 9822011223, Medical Notes"
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700 text-white text-xs focus:border-[#f36b22] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-neutral-700 text-neutral-300 text-xs font-headline font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#f36b22] hover:bg-[#d95614] text-white text-xs font-headline font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Renew Membership */}
      {isRenewOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#14171d] border border-neutral-800 w-full max-w-md p-6 relative shadow-2xl">
            <div className="border-t-2 border-[#f36b22] absolute top-0 left-0 right-0" />

            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div>
                <h3 className="font-headline font-black text-base text-white uppercase tracking-tight">
                  Renew Membership
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {selectedMember.full_name} ({selectedMember.member_code})
                </p>
              </div>
              <button
                onClick={() => setIsRenewOpen(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRenewSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Select Package
                </label>
                <select
                  value={renewPkgId}
                  onChange={(e) => {
                    setRenewPkgId(e.target.value);
                    const p = packages.find(pkg => pkg.id === e.target.value);
                    if (p) setRenewAmountPaid(p.price);
                  }}
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700 text-white text-xs focus:border-[#f36b22] focus:outline-none"
                >
                  {packages.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ₹{p.price} ({p.duration_days} days)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  New Start Date
                </label>
                <input
                  type="date"
                  value={renewStartDate}
                  onChange={(e) => setRenewStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700 text-white text-xs focus:border-[#f36b22] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  New Expiry Date
                </label>
                <div className="px-3 py-2 bg-[#0e1014] border border-neutral-800 text-emerald-400 text-xs font-mono font-bold">
                  {calculatedRenewExpiry}
                </div>
              </div>

              <div>
                <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  value={renewAmountPaid}
                  onChange={(e) => setRenewAmountPaid(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700 text-white text-xs focus:border-[#f36b22] focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsRenewOpen(false)}
                  className="px-4 py-2 border border-neutral-700 text-neutral-300 text-xs font-headline font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#f36b22] hover:bg-[#d95614] text-white text-xs font-headline font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Renewal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Expiry Reminder Modal */}
      {reminderModalItem && (
        <WhatsAppReminderModal
          item={reminderModalItem}
          onClose={() => setReminderModalItem(null)}
          onPhoneUpdated={async (memberId, newPhone) => {
            await updateMemberPhone(memberId, newPhone);
            await loadData();
          }}
        />
      )}
    </div>
  );
};
