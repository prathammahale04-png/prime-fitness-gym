import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { OverviewStats, getOverviewStats } from '../../services/gymPlatformService';
import { testSupabaseConnection } from '../../lib/supabase';
import { PRIME_GYM_DATA } from '../../data/primeGymData';
import { AdminSection } from '../../types/database.types';
import { normalizeIndianPhoneNumber, buildWhatsAppLink, generateReminderMessage } from '../../utils/reminderUtils';
import {
  Users,
  CreditCard,
  QrCode,
  AlertTriangle,
  IndianRupee,
  Clock,
  TrendingUp,
  Share2,
  Calendar,
  CheckCircle2,
  Plus,
  RefreshCw,
  Phone,
  Flame,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Settings,
} from 'lucide-react';

interface OverviewViewProps {
  onNavigateSection?: (section: AdminSection) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigateSection }) => {
  const { session, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; latencyMs?: number }>({ connected: false });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [s, conn] = await Promise.all([
      getOverviewStats(period, session),
      testSupabaseConnection(),
    ]);
    setStats(s);
    setDbStatus({ connected: conn.connected, latencyMs: conn.latencyMs });
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, session?.user?.id, session?.access_token, period]);

  const handleSendReminder = (m: any) => {
    const validation = normalizeIndianPhoneNumber(m.phone);
    if (!validation.isValid) {
      if (onNavigateSection) {
        onNavigateSection('reminders');
      } else {
        alert(`Invalid phone number for ${m.full_name}: ${validation.errorReason}`);
      }
      return;
    }
    const text = generateReminderMessage(m, 'soon');
    const url = buildWhatsAppLink(validation.normalizedNumber, text);
    window.open(url, '_blank', 'noopener,noreferrer');
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header & Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#f36b22]/10 border border-[#f36b22]/30 text-[10px] font-mono text-[#f36b22] uppercase tracking-wider mb-1">
            <Flame className="w-3.5 h-3.5" />
            <span>PRIME FITNESS MH19 · OPERATIONS HUB</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-white">
            Gym Management Overview
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time financial collections, member registry counts, and daily attendance metrics.
          </p>
        </div>

        {/* Period Switcher & DB status */}
        <div className="flex items-center gap-3">
          {/* DB Indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-[#14161d] border border-neutral-800 rounded-lg text-[10px] font-mono text-neutral-400">
            <span className={`w-2 h-2 rounded-full ${dbStatus.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>{dbStatus.connected ? `DB: ${dbStatus.latencyMs}ms` : 'DB: Local'}</span>
          </div>

          <div className="flex items-center gap-1 bg-[#14161d] p-1 rounded-lg border border-neutral-800">
            {(['today', 'week', 'month', 'year'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors cursor-pointer ${
                  period === p
                    ? 'bg-[#f36b22] text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Members */}
        <div
          onClick={() => onNavigateSection && onNavigateSection('members')}
          className="bg-[#14161d] border border-neutral-800 hover:border-neutral-700 rounded-xl p-5 space-y-2 cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Active Members</span>
            <Users className="w-4 h-4 text-[#f36b22] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-headline font-black text-white">
            {stats ? stats.activeMembersCount : '—'}
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono pt-1 border-t border-neutral-800/80">
            <span className="text-emerald-400">+{stats?.newRegistrationsThisMonth || 0} this month</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-white" />
          </div>
        </div>

        {/* Today's Check-ins */}
        <div
          onClick={() => onNavigateSection && onNavigateSection('checkin')}
          className="bg-[#14161d] border border-neutral-800 hover:border-neutral-700 rounded-xl p-5 space-y-2 cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Today's Check-ins</span>
            <QrCode className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-headline font-black text-emerald-400">
            {stats ? stats.todayCheckInsCount : '—'}
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono pt-1 border-t border-neutral-800/80">
            <span>Morning & Evening slots</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-white" />
          </div>
        </div>

        {/* Collections */}
        <div
          onClick={() => onNavigateSection && onNavigateSection('billing')}
          className="bg-[#14161d] border border-neutral-800 hover:border-neutral-700 rounded-xl p-5 space-y-2 cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Recorded Collections</span>
            <CreditCard className="w-4 h-4 text-[#f36b22] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-headline font-black text-white">
            ₹{stats ? stats.totalRevenueCollected.toLocaleString('en-IN') : '0'}
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono pt-1 border-t border-neutral-800/80">
            <span className="text-emerald-400">Filter: {period.toUpperCase()}</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-white" />
          </div>
        </div>

        {/* Outstanding Dues */}
        <div
          onClick={() => onNavigateSection && onNavigateSection('members')}
          className="bg-[#14161d] border border-neutral-800 hover:border-neutral-700 rounded-xl p-5 space-y-2 cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium text-amber-400">Outstanding Balances</span>
            <AlertTriangle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-headline font-black text-amber-400">
            ₹{stats ? stats.outstandingBalanceDue.toLocaleString('en-IN') : '0'}
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono pt-1 border-t border-neutral-800/80">
            <span>Pending member dues</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-white" />
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="bg-[#14161d] border border-neutral-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-headline font-bold uppercase tracking-wider text-neutral-400">
          Quick Operations:
        </span>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateSection && onNavigateSection('checkin')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1e222d] hover:bg-[#282d3b] text-white text-xs font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fast Check-in</span>
          </button>

          <button
            onClick={() => onNavigateSection && onNavigateSection('billing')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1e222d] hover:bg-[#282d3b] text-white text-xs font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-[#f36b22]" />
            <span>Record Payment</span>
          </button>

          <button
            onClick={() => onNavigateSection && onNavigateSection('members')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1e222d] hover:bg-[#282d3b] text-white text-xs font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Register Member</span>
          </button>

          <button
            onClick={() => onNavigateSection && onNavigateSection('enquiries')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1e222d] hover:bg-[#282d3b] text-white text-xs font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>New Lead</span>
          </button>

          <button
            onClick={() => onNavigateSection && onNavigateSection('trainers')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1e222d] hover:bg-[#282d3b] text-white text-xs font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Coaching Staff</span>
          </button>

          <button
            onClick={() => onNavigateSection && onNavigateSection('settings')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1e222d] hover:bg-[#282d3b] text-white text-xs font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-neutral-300" />
            <span>Gym Settings</span>
          </button>
        </div>
      </div>

      {/* Main Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Expiring Memberships (Next 7 Days) */}
        <div className="lg:col-span-7 bg-[#14161d] border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="font-headline font-bold text-sm text-white uppercase tracking-wider">
                Expiring Memberships (Next 7 Days)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {stats?.expiringInSevenDays.length || 0} Expiring Soon
              </span>
              {onNavigateSection && (
                <button
                  type="button"
                  onClick={() => onNavigateSection('reminders')}
                  className="text-[11px] font-mono text-[#25d366] hover:underline flex items-center gap-1 cursor-pointer ml-1"
                >
                  <span>Reminders Hub →</span>
                </button>
              )}
            </div>
          </div>

          {!stats || stats.expiringInSevenDays.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p>No memberships are expiring within the next 7 days.</p>
              <p className="text-[10px] text-neutral-600 font-mono mt-1">All athlete accounts are up to date</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {stats.expiringInSevenDays.map(m => (
                <div
                  key={m.id}
                  className="p-3 bg-[#0e1014] border border-neutral-800 rounded-lg flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white text-xs">{m.full_name}</div>
                    <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-2 mt-0.5">
                      <span>{m.member_code}</span>
                      <span>·</span>
                      <span className="text-amber-400 font-bold">Expires: {m.expiry_date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSendReminder(m)}
                      className="px-2.5 py-1 bg-[#25d366]/10 hover:bg-[#25d366]/20 text-[#25d366] text-[10px] font-semibold rounded border border-[#25d366]/30 transition-colors cursor-pointer"
                    >
                      {copiedId === m.id ? 'Sent!' : 'WhatsApp'}
                    </button>
                    <button
                      onClick={() => onNavigateSection && onNavigateSection('members')}
                      className="px-2.5 py-1 bg-[#1e2330] hover:bg-[#272d3e] text-white text-[10px] font-semibold rounded border border-neutral-700 transition-colors cursor-pointer"
                    >
                      Renew
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Payments & Activity */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recent Payments Feed */}
          <div className="bg-[#14161d] border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-headline font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#f36b22]" />
                <span>Recent Payments</span>
              </h3>
              <button
                onClick={() => onNavigateSection && onNavigateSection('billing')}
                className="text-[11px] font-mono text-[#f36b22] hover:underline"
              >
                View Ledger →
              </button>
            </div>

            <div className="space-y-2">
              {stats?.recentPayments.map(p => (
                <div
                  key={p.id}
                  className="p-2.5 bg-[#0e1014] border border-neutral-800/80 rounded-lg flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white text-xs block">{p.member_name}</span>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">
                      {p.receipt_number} · {p.payment_method}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">
                    +₹{p.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Check-ins */}
          <div className="bg-[#14161d] border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-headline font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Recent Check-ins</span>
              </h3>
              <button
                onClick={() => onNavigateSection && onNavigateSection('checkin')}
                className="text-[11px] font-mono text-emerald-400 hover:underline"
              >
                Check-in Console →
              </button>
            </div>

            <div className="space-y-2">
              {stats?.recentCheckIns.map(c => (
                <div
                  key={c.id}
                  className="p-2.5 bg-[#0e1014] border border-neutral-800/80 rounded-lg flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white text-xs block">{c.member_name}</span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {c.member_code} · {c.notes || 'Workout'}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-400">
                    {new Date(c.checked_in_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
