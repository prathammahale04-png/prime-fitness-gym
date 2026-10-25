import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Member, AdminSection } from '../../types/database.types';
import { getMembers, updateMemberPhone } from '../../services/memberService';
import {
  processExpiryReminders,
  ReminderMemberItem,
  getIndiaTodayDate,
} from '../../utils/reminderUtils';
import { WhatsAppReminderModal } from './WhatsAppReminderModal';
import {
  BellRing,
  Search,
  RefreshCw,
  Send,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Flame,
} from 'lucide-react';

interface MembershipRemindersViewProps {
  onNavigateSection?: (section: AdminSection) => void;
}

type TabType = 'all' | 'today' | 'soon' | 'expired';

export const MembershipRemindersView: React.FC<MembershipRemindersViewProps> = ({
  onNavigateSection,
}) => {
  const { session, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedReminder, setSelectedReminder] = useState<ReminderMemberItem | null>(null);

  // India local date standard (Asia/Kolkata)
  const todayStr = useMemo(() => getIndiaTodayDate(), []);

  // Format today's date for display
  const formattedToday = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date());
    } catch {
      return todayStr;
    }
  }, [todayStr]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getMembers(undefined, session);
      setMembers(res.members || []);
      setIsLive(res.isLive);
      if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch membership records.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Wait for authentication session to initialize before querying member records
  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, session?.user?.id, loadData]);

  // Process and categorize reminder items using real Supabase members
  const { items: allReminderItems, counts } = useMemo(() => {
    return processExpiryReminders(members, todayStr);
  }, [members, todayStr]);

  // Filter items by active tab and search query
  const filteredItems = useMemo(() => {
    return allReminderItems.filter(item => {
      // Tab filter
      if (activeTab === 'today' && item.category !== 'today') return false;
      if (activeTab === 'soon' && item.category !== 'soon') return false;
      if (activeTab === 'expired' && item.category !== 'expired') return false;

      // Search query filter (matches member name, phone, or member_code)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = item.member.full_name?.toLowerCase().includes(q);
        const phoneMatch = item.member.phone?.toLowerCase().includes(q);
        const codeMatch = item.member.member_code?.toLowerCase().includes(q);
        const pkgMatch = item.member.package_name?.toLowerCase().includes(q);
        return nameMatch || phoneMatch || codeMatch || pkgMatch;
      }

      return true;
    });
  }, [allReminderItems, activeTab, searchQuery]);

  // Handle phone number update from modal
  const handlePhoneUpdated = async (memberId: string, newPhone: string) => {
    await updateMemberPhone(memberId, newPhone);
    // Refresh members list so UI reflects the updated phone
    loadData();
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#25d366]/10 border border-[#25d366]/30 text-[10px] font-mono text-[#25d366] uppercase tracking-wider mb-1">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Prime Fitness MH19 · Retention Hub</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-white">
            Membership Expiry Reminders
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Free manual WhatsApp reminder dispatcher. Monitor memberships expiring today, in the next 7 days, and active expired members.
          </p>
        </div>

        {/* Header Right Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Data Source Mode Pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border ${
              isLive
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>{isLive ? 'Live Supabase' : 'Offline Cache'}</span>
          </div>

          {/* India Local Date Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14161d] border border-neutral-800 rounded-lg text-xs font-mono text-neutral-300">
            <Calendar className="w-3.5 h-3.5 text-[#f36b22]" />
            <span>{formattedToday}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#14161d] hover:bg-[#1a1d28] border border-neutral-800 rounded-lg text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh latest member data from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#f36b22]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Database Warning / Error State */}
      {errorMsg && (
        <div className={`p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border ${
          isLive ? 'bg-amber-950/30 border-amber-800/60 text-amber-300' : 'bg-neutral-900 border-neutral-800 text-neutral-300'
        }`}>
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-headline uppercase tracking-wider text-[11px] mb-0.5">
                {isLive ? 'Sync Notice' : 'Data Source Notice'}
              </strong>
              <p className="text-neutral-300 leading-relaxed">
                {errorMsg}
              </p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Expires Today */}
        <div
          onClick={() => setActiveTab('today')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'today'
              ? 'bg-[#181a24] border-rose-500 ring-1 ring-rose-500/50'
              : 'bg-[#14161d] border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[10px] font-headline font-bold uppercase tracking-wider text-rose-400">
              Expires Today
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-headline font-black text-white">
              {counts.today}
            </span>
            <span className="text-[11px] text-neutral-500">athletes</span>
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">
            {counts.today > 0 ? 'Urgent renewal required today' : 'No memberships ending today'}
          </p>
        </div>

        {/* Card 2: Expiring in 7 Days */}
        <div
          onClick={() => setActiveTab('soon')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'soon'
              ? 'bg-[#181a24] border-amber-500 ring-1 ring-amber-500/50'
              : 'bg-[#14161d] border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[10px] font-headline font-bold uppercase tracking-wider text-amber-400">
              Expiring Soon (1-7 Days)
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-headline font-black text-white">
              {counts.soon}
            </span>
            <span className="text-[11px] text-neutral-500">athletes</span>
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">
            {counts.soon > 0 ? 'Proactive renewal notices' : 'No upcoming expiries this week'}
          </p>
        </div>

        {/* Card 3: Expired */}
        <div
          onClick={() => setActiveTab('expired')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'expired'
              ? 'bg-[#181a24] border-neutral-600 ring-1 ring-neutral-500/50'
              : 'bg-[#14161d] border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[10px] font-headline font-bold uppercase tracking-wider text-neutral-300">
              Expired (Active Profiles)
            </span>
            <div className="w-7 h-7 rounded-lg bg-neutral-800/80 border border-neutral-700 flex items-center justify-center text-neutral-300">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-headline font-black text-white">
              {counts.expired}
            </span>
            <span className="text-[11px] text-neutral-500">athletes</span>
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">
            {counts.expired > 0 ? 'Overdue renewal follow-ups' : 'Zero expired active members'}
          </p>
        </div>

        {/* Card 4: Total Reminders Due */}
        <div
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-[#181a24] border-[#25d366] ring-1 ring-[#25d366]/50'
              : 'bg-[#14161d] border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[10px] font-headline font-bold uppercase tracking-wider text-[#25d366]">
              Total Reminders Due
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#25d366]/10 border border-[#25d366]/20 flex items-center justify-center text-[#25d366]">
              <BellRing className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-headline font-black text-white">
              {counts.total}
            </span>
            <span className="text-[11px] text-neutral-500">athletes</span>
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">
            {isLive ? 'Synced with live Supabase database' : 'Real cached member registry'}
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-[#14161d] border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#0e1014] p-1 rounded-lg border border-neutral-800">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#25d366] text-neutral-950 font-headline font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Reminders ({counts.total})
            </button>
            <button
              onClick={() => setActiveTab('today')}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-rose-500 text-white font-headline font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Expires Today ({counts.today})
            </button>
            <button
              onClick={() => setActiveTab('soon')}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors cursor-pointer ${
                activeTab === 'soon'
                  ? 'bg-amber-500 text-neutral-950 font-headline font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Expiring Soon ({counts.soon})
            </button>
            <button
              onClick={() => setActiveTab('expired')}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors cursor-pointer ${
                activeTab === 'expired'
                  ? 'bg-neutral-200 text-neutral-950 font-headline font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Expired ({counts.expired})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px] sm:min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search member name, phone or ID..."
              className="w-full bg-[#0e1014] border border-neutral-700/80 focus:border-[#25d366] pl-9 pr-3 py-2 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-hidden transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table / Member Reminder Cards */}
      <div className="bg-[#14161d] border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#25d366] animate-spin mx-auto" />
            <p className="text-xs text-neutral-400 font-mono">
              Loading verified member expiry data from database...
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#25d366]/10 border border-[#25d366]/20 flex items-center justify-center text-[#25d366] mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-headline font-bold text-base text-white uppercase tracking-tight">
              {searchQuery
                ? 'No matching reminder records found'
                : activeTab === 'today'
                ? 'No Memberships Expiring Today'
                : activeTab === 'soon'
                ? 'No Memberships Expiring in the Next 7 Days'
                : activeTab === 'expired'
                ? 'No Overdue Expired Memberships'
                : 'No Members Currently Requiring Expiry Reminders'}
            </h4>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              {searchQuery
                ? `No members found matching "${searchQuery}". Try searching with a different name or phone number.`
                : 'All gym athlete memberships are up to date and active beyond 7 days.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs text-white rounded-lg transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-[#0e1014] text-[10px] font-mono uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="py-3.5 px-4">Member Info</th>
                  <th className="py-3.5 px-4">Mobile / Contact</th>
                  <th className="py-3.5 px-4">Package</th>
                  <th className="py-3.5 px-4">Expiry Date</th>
                  <th className="py-3.5 px-4">Expiry Status</th>
                  <th className="py-3.5 px-4 text-right">WhatsApp Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {filteredItems.map(item => {
                  const m = item.member;
                  const isToday = item.category === 'today';
                  const isSoon = item.category === 'soon';
                  const isExpired = item.category === 'expired';

                  const badgeClass = isToday
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : isSoon
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700';

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-[#181a24] transition-colors ${
                        isToday ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Member Info */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-headline font-bold text-white text-xs block">
                            {m.full_name}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {m.member_code} · Joined {m.joined_date || m.start_date}
                          </span>
                        </div>
                      </td>

                      {/* Phone / Contact */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        {item.phoneValidation.isValid ? (
                          <div>
                            <span className="text-neutral-200 font-semibold block">
                              {item.phoneValidation.displayFormatted}
                            </span>
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-sans">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Valid Mobile</span>
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-rose-400 line-through block">
                              {m.phone || 'No phone'}
                            </span>
                            <span className="text-[10px] text-rose-400 font-sans flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                              <span>Needs 10-digit number</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Package */}
                      <td className="py-3.5 px-4">
                        <span className="text-white font-medium block">
                          {m.package_name || 'Standard Tier'}
                        </span>
                        {m.balance_due > 0 && (
                          <span className="text-[10px] font-mono text-amber-400">
                            Due: ₹{Number(m.balance_due).toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3.5 px-4 font-mono">
                        <span
                          className={`font-bold ${
                            isToday ? 'text-rose-400 text-sm' : isSoon ? 'text-amber-400' : 'text-neutral-400'
                          }`}
                        >
                          {m.expiry_date}
                        </span>
                      </td>

                      {/* Expiry Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-md border ${badgeClass}`}
                        >
                          {isToday && <Clock className="w-3 h-3 text-rose-400" />}
                          {isSoon && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                          <span>{item.daysLabel}</span>
                        </span>
                      </td>

                      {/* WhatsApp Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedReminder(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25d366]/15 hover:bg-[#25d366] text-[#25d366] hover:text-neutral-950 border border-[#25d366]/40 hover:border-[#25d366] rounded-lg text-xs font-headline font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                            title="Open WhatsApp Reminder Composer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Send WhatsApp Reminder</span>
                          </button>

                          {onNavigateSection && (
                            <button
                              type="button"
                              onClick={() => onNavigateSection('members')}
                              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                              title="Jump to Member Directory & Renewal"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Free Manual WhatsApp Reminder Modal */}
      {selectedReminder && (
        <WhatsAppReminderModal
          item={selectedReminder}
          onClose={() => setSelectedReminder(null)}
          onPhoneUpdated={handlePhoneUpdated}
        />
      )}
    </div>
  );
};
