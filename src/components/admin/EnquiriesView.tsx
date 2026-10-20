import React, { useState, useEffect } from 'react';
import { EnquiryRecord, EnquiryStatus } from '../../types/database.types';
import { getEnquiries, addEnquiry, updateEnquiryStatus } from '../../services/gymPlatformService';
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
} from 'lucide-react';

interface EnquiriesViewProps {
  onNavigateToMembers?: () => void;
}

export const EnquiriesView: React.FC<EnquiriesViewProps> = ({ onNavigateToMembers }) => {
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | EnquiryStatus>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('Website Trial Pass');
  const [plan, setPlan] = useState('3 MONTHS INTENSIVE');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    const data = await getEnquiries();
    setEnquiries(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    await addEnquiry({
      full_name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      source,
      interested_package: plan,
      status: 'new',
      notes: notes.trim() || null,
      follow_up_date: followUpDate,
    });

    setIsModalOpen(false);
    setName('');
    setPhone('');
    setNotes('');
    await loadData();
  };

  const handleStatusChange = async (id: string, status: EnquiryStatus) => {
    await updateEnquiryStatus(id, status);
    await loadData();
  };

  const handleWhatsAppChat = (e: EnquiryRecord) => {
    const cleanPhone = e.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const text = `Hi ${e.full_name}, thank you for reaching out to Prime Fitness MH19 Jalgaon regarding our ${e.interested_package || 'membership'} programs! How can we help you get started with your trial session?`;
    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredEnquiries = enquiries.filter(
    e => statusFilter === 'all' || e.status === statusFilter
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#f36b22]/10 border border-[#f36b22]/30 text-[10px] font-mono text-[#f36b22] uppercase tracking-wider mb-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Lead Generation Pipeline</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-white">
            Prospective Leads & Enquiries
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Capture prospective gym members, trial pass submissions, follow-up dates, and conversion notes.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#f36b22] hover:bg-[#d95614] text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Walk-in / Lead</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-[#14161d] p-1 rounded-lg border border-neutral-800 self-start">
        {(['all', 'new', 'contacted', 'converted', 'closed'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded-md transition-colors cursor-pointer ${
              statusFilter === tab
                ? 'bg-[#f36b22] text-white font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Leads Table */}
      <div className="bg-[#14161d] border border-neutral-800 rounded-xl overflow-hidden">
        {filteredEnquiries.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 text-xs">
            No enquiry records found in this category.
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
                {filteredEnquiries.map(enq => (
                  <tr key={enq.id} className="hover:bg-[#181a24] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{enq.full_name}</div>
                      {enq.notes && (
                        <div className="text-[11px] text-neutral-400 truncate max-w-[200px]">
                          {enq.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-neutral-300 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-[#f36b22]" />
                        <span>{enq.phone}</span>
                      </div>
                      {enq.email && <div className="text-[10px] text-neutral-500">{enq.email}</div>}
                    </td>

                    <td className="py-3 px-4 font-bold text-white uppercase text-[11px]">
                      {enq.interested_package || 'General Inquiry'}
                    </td>

                    <td className="py-3 px-4 text-neutral-400 font-mono text-[11px]">
                      {enq.source}
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={enq.status}
                        onChange={(e) => handleStatusChange(enq.id, e.target.value as EnquiryStatus)}
                        className={`text-[10px] font-mono uppercase px-2 py-1 rounded border bg-[#0e1014] cursor-pointer focus:outline-none ${
                          enq.status === 'new'
                            ? 'text-blue-400 border-blue-500/40'
                            : enq.status === 'contacted'
                            ? 'text-amber-400 border-amber-500/40'
                            : enq.status === 'converted'
                            ? 'text-emerald-400 border-emerald-500/40'
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

                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleWhatsAppChat(enq)}
                        className="px-2.5 py-1 bg-[#25d366]/10 hover:bg-[#25d366]/20 text-[#25d366] text-[10px] font-bold uppercase rounded border border-[#25d366]/30 transition-colors cursor-pointer"
                      >
                        WhatsApp
                      </button>

                      {enq.status !== 'converted' && onNavigateToMembers && (
                        <button
                          onClick={() => {
                            handleStatusChange(enq.id, 'converted');
                            onNavigateToMembers();
                          }}
                          className="px-2.5 py-1 bg-[#1e2330] hover:bg-[#272d3e] text-neutral-200 text-[10px] font-bold uppercase rounded border border-neutral-700 transition-colors cursor-pointer"
                          title="Register as Member"
                        >
                          Convert
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

      {/* Modal: New Enquiry */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#14161d] border border-neutral-800 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
            <div className="border-t-2 border-[#f36b22] absolute top-0 left-0 right-0 rounded-t-xl" />
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h3 className="font-headline font-black text-lg text-white uppercase tracking-tight">
                Record New Lead / Trial Pass
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-neutral-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
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
                    onChange={e => setPhone(e.target.value)}
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
                    onChange={e => setEmail(e.target.value)}
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
                    onChange={e => setSource(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none"
                  >
                    <option value="Website Trial Pass">Website Trial Pass</option>
                    <option value="Walk-in Visit">Walk-in Visit</option>
                    <option value="Instagram / Social">Instagram / Social</option>
                    <option value="Member Referral">Member Referral</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Interested In</label>
                  <select
                    value={plan}
                    onChange={e => setPlan(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none"
                  >
                    <option value="1 MONTH STANDARD">1 MONTH STANDARD</option>
                    <option value="3 MONTHS INTENSIVE">3 MONTHS INTENSIVE</option>
                    <option value="6 MONTHS ATHLETIC">6 MONTHS ATHLETIC</option>
                    <option value="12 MONTHS PRIME PRO">12 MONTHS PRIME PRO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">Follow-up Target Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">Notes / Athlete Goals</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Goals: Fat loss, heavy deadlifts, timings preferred..."
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-700 rounded-lg text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#f36b22] text-white font-bold rounded-lg hover:bg-[#d95614]"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
