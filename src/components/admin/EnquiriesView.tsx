import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { EnquiryRecord, EnquiryStatus, MembershipPackage, Member } from '../../types/database.types';
import { getEnquiries, addEnquiry, updateEnquiryStatus } from '../../services/gymPlatformService';
import { getPackages } from '../../services/packageService';
import { ConvertEnquiryModal } from './ConvertEnquiryModal';
import { getIndiaTodayDate } from '../../utils/reminderUtils';
import {
  MessageSquare,
  Plus,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  X,
  Clock,
  ArrowRight,
  ExternalLink,
  UserCheck,
  RefreshCw,
  Database,
  AlertCircle,
} from 'lucide-react';

export interface LeadConvertData {
  fullName: string;
  phone?: string;
  email?: string | null;
  packageName?: string | null;
  notes?: string | null;
  mode?: 'add' | 'view';
}

interface EnquiriesViewProps {
  onNavigateToMembers?: (leadData?: LeadConvertData) => void;
}

export const EnquiriesView: React.FC<EnquiriesViewProps> = ({ onNavigateToMembers }) => {
  const { session } = useAuth();
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [packages, setPackages] = useState<MembershipPackage[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | EnquiryStatus>('all');
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [convertingEnquiry, setConvertingEnquiry] = useState<EnquiryRecord | null>(null);
  const [successToast, setSuccessToast] = useState<{ code: string; name: string; phone?: string } | null>(null);

  // Form states for manual walk-in lead creation
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('Website Trial Pass');
  const [plan, setPlan] = useState('3 MONTHS INTENSIVE');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState(getIndiaTodayDate());
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [res, pkgRes] = await Promise.all([
        getEnquiries(session),
        getPackages(session),
      ]);
      setEnquiries(res.enquiries);
      setIsLive(res.isLive);
      setPackages(pkgRes.packages.filter((p) => p.is_active));
      if (res.error) {
        setFetchError(res.error);
      }
    } catch (err: any) {
      console.error('Error fetching enquiries:', err);
      setFetchError(err?.message || 'Error loading enquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || isSubmittingManual) return;

    setIsSubmittingManual(true);
    try {
      const res = await addEnquiry(
        {
          full_name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          source,
          interested_package: plan,
          status: 'new',
          notes: notes.trim() || null,
          follow_up_date: followUpDate,
        },
        session
      );

      if (res.success) {
        setIsModalOpen(false);
        setName('');
        setPhone('');
        setEmail('');
        setNotes('');
        setFormError(null);
        await loadData();
      } else {
        setFormError(res.error || 'Failed to save lead record.');
      }
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleStatusChange = async (id: string, status: EnquiryStatus) => {
    if (status === 'converted') {
      const target = enquiries.find((e) => e.id === id);
      if (target) {
        setConvertingEnquiry(target);
        return;
      }
    }
    await updateEnquiryStatus(id, status, undefined, session);
    await loadData();
  };

  const handleWhatsAppChat = (e: EnquiryRecord) => {
    const cleanPhone = e.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const text = `Hi ${e.full_name}, thank you for registering with Prime Fitness MH19 Jalgaon regarding our ${e.interested_package || 'membership'} programs! How can we assist you with getting started?`;
    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredEnquiries = enquiries.filter(
    (e) => statusFilter === 'all' || e.status === statusFilter
  );

  // Tab count badges
  const counts = {
    all: enquiries.length,
    new: enquiries.filter((e) => e.status === 'new').length,
    contacted: enquiries.filter((e) => e.status === 'contacted').length,
    converted: enquiries.filter((e) => e.status === 'converted').length,
    closed: enquiries.filter((e) => e.status === 'closed').length,
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#f36b22]/10 border border-[#f36b22]/30 text-[10px] font-mono text-[#f36b22] uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Lead Generation & Registration Pipeline</span>
            </div>
            {isLive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Supabase Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Local Cache Mode
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-white">
            Prospective Leads & Registrations
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time public website registrations, free trial passes, walk-ins, and conversion to active gym members.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#181b24] hover:bg-[#222634] text-neutral-300 text-xs font-bold uppercase rounded-lg border border-neutral-700 transition-colors cursor-pointer"
            title="Refresh lead records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#f36b22]' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f36b22] hover:bg-[#d95614] text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>New Walk-in / Lead</span>
          </button>
        </div>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Member <strong className="text-white font-mono">{successToast.code}</strong> ({successToast.name}) was successfully created in Supabase!
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToMembers && (
              <button
                onClick={() =>
                  onNavigateToMembers({
                    fullName: successToast.name,
                    phone: successToast.phone,
                    mode: 'view',
                  })
                }
                className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white rounded font-bold uppercase text-[10px] transition-colors cursor-pointer"
              >
                View in Directory
              </button>
            )}
            <button
              onClick={() => setSuccessToast(null)}
              className="p-1 text-emerald-400 hover:text-white rounded hover:bg-emerald-500/20 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {fetchError && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Filter Tabs with Live Badges */}
      <div className="flex items-center gap-1.5 bg-[#14161d] p-1.5 rounded-lg border border-neutral-800 self-start flex-wrap">
        {(
          [
            { id: 'all', label: 'All Registrations', count: counts.all },
            { id: 'new', label: 'New Leads', count: counts.new },
            { id: 'contacted', label: 'Contacted', count: counts.contacted },
            { id: 'converted', label: 'Converted', count: counts.converted },
            { id: 'closed', label: 'Closed', count: counts.closed },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === tab.id
                ? 'bg-[#f36b22] text-white font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                statusFilter === tab.id
                  ? 'bg-black/30 text-white font-bold'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Leads Table */}
      <div className="bg-[#14161d] border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        {loading && enquiries.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#f36b22] animate-spin" />
            <span>Loading registrations from Supabase...</span>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 text-xs">
            No registration records found in this category.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-[#0e1014] text-[10px] font-mono uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Prospective Member</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Interested In</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Follow-up</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {filteredEnquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-[#181a24] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{enq.full_name}</div>
                      {enq.notes && (
                        <div className="text-[11px] text-neutral-400 truncate max-w-[240px]" title={enq.notes}>
                          {enq.notes}
                        </div>
                      )}
                      <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        Received: {new Date(enq.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-neutral-200 flex items-center gap-1.5 font-semibold">
                        <Phone className="w-3 h-3 text-[#f36b22]" />
                        <span>{enq.phone}</span>
                      </div>
                      {enq.email && (
                        <div className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-2.5 h-2.5 text-neutral-500" />
                          <span>{enq.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-bold text-white uppercase text-[11px]">
                      <span className="px-2 py-0.5 bg-neutral-800/80 rounded border border-neutral-700 text-[#f36b22]">
                        {enq.interested_package || 'General Inquiry'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-neutral-400 font-mono text-[11px]">
                      {enq.source}
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={enq.status}
                        onChange={(e) => handleStatusChange(enq.id, e.target.value as EnquiryStatus)}
                        className={`text-[10px] font-mono uppercase px-2 py-1 rounded border bg-[#0e1014] cursor-pointer focus:outline-none font-bold ${
                          enq.status === 'new'
                            ? 'text-blue-400 border-blue-500/40 bg-blue-500/5'
                            : enq.status === 'contacted'
                            ? 'text-amber-400 border-amber-500/40 bg-amber-500/5'
                            : enq.status === 'converted'
                            ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/5'
                            : 'text-neutral-500 border-neutral-700'
                        }`}
                      >
                        <option value="new">NEW LEAD</option>
                        <option value="contacted">CONTACTED</option>
                        <option value="converted">CONVERTED</option>
                        <option value="closed">CLOSED</option>
                      </select>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-400">
                      {enq.follow_up_date || '—'}
                    </td>

                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleWhatsAppChat(enq)}
                        className="px-2.5 py-1 bg-[#25d366]/10 hover:bg-[#25d366]/20 text-[#25d366] text-[10px] font-bold uppercase rounded border border-[#25d366]/30 transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>WhatsApp</span>
                      </button>

                      {enq.status === 'converted' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase rounded inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>
                              {enq.notes?.match(/PF-(\d+)/i)
                                ? `PF-${enq.notes?.match(/PF-(\d+)/i)![1]}`
                                : 'Converted'}
                            </span>
                          </span>
                          {onNavigateToMembers && (
                            <button
                              onClick={() =>
                                onNavigateToMembers({
                                  fullName: enq.full_name,
                                  phone: enq.phone,
                                  packageName: enq.interested_package,
                                })
                              }
                              className="px-2 py-1 bg-[#1e222d] hover:bg-[#282d3c] text-neutral-300 hover:text-white text-[10px] font-bold uppercase rounded border border-neutral-700 transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="View member record in directory"
                            >
                              <span>View Member</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setConvertingEnquiry(enq)}
                          className="px-2.5 py-1 bg-[#f36b22]/20 hover:bg-[#f36b22] text-[#f36b22] hover:text-white text-[10px] font-bold uppercase rounded border border-[#f36b22]/40 transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
                          title="Convert lead to active Supabase gym member"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Convert</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: New Walk-in Lead */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#14161d] border border-neutral-800 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
            <div className="border-t-2 border-[#f36b22] absolute top-0 left-0 right-0 rounded-t-xl" />
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h3 className="font-headline font-black text-lg text-white uppercase tracking-tight">
                Record New Lead / Trial Pass
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-300 text-xs rounded-lg flex items-center justify-between">
                  <span>{formError}</span>
                  <button type="button" onClick={() => setFormError(null)} className="text-red-400 hover:text-white">✕</button>
                </div>
              )}
              <div>
                <label className="block font-medium text-neutral-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anand Shinde"
                  required
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98220..."
                    required
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white font-mono focus:border-[#f36b22] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="anand@example.com"
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Lead Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none"
                  >
                    <option value="Website Trial Pass">Website Trial Pass</option>
                    <option value="Website Membership Registration">Website Membership Registration</option>
                    <option value="Walk-in Visit">Walk-in Visit</option>
                    <option value="Instagram / Social">Instagram / Social</option>
                    <option value="Member Referral">Member Referral</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Interested In</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none"
                  >
                    <option value="1 MONTH STANDARD">1 MONTH STANDARD</option>
                    <option value="3 MONTHS INTENSIVE">3 MONTHS INTENSIVE</option>
                    <option value="6 MONTHS ATHLETIC">6 MONTHS ATHLETIC</option>
                    <option value="12 MONTHS PRIME PRO">12 MONTHS PRIME PRO</option>
                    <option value="Free 1-Day Trial Pass">Free 1-Day Trial Pass</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">Follow-up Target Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">Notes / Athlete Goals</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Goals: Fat loss, heavy deadlifts, timings preferred..."
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-700 rounded-lg text-neutral-300 cursor-pointer hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-5 py-2 bg-[#f36b22] text-white font-bold rounded-lg hover:bg-[#d95614] cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingManual && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Lead</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Lead to Active Member Modal */}
      <ConvertEnquiryModal
        isOpen={Boolean(convertingEnquiry)}
        onClose={() => setConvertingEnquiry(null)}
        enquiry={convertingEnquiry}
        packages={packages}
        onSuccess={(newMember) => {
          setSuccessToast({
            code: newMember.member_code,
            name: newMember.full_name,
            phone: newMember.phone,
          });
          loadData();
        }}
        onNavigateToMembers={onNavigateToMembers}
      />
    </div>
  );
};
