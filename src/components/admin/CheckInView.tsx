import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Member, CheckInRecord } from '../../types/database.types';
import { getMembers } from '../../services/memberService';
import { getCheckIns, recordCheckIn } from '../../services/gymPlatformService';
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  UserX,
  History,
  Sparkles,
  Phone,
  Flame,
} from 'lucide-react';

export const CheckInView: React.FC = () => {
  const { session, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [checkins, setCheckins] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchedMember, setMatchedMember] = useState<Member | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [mRes, cRes] = await Promise.all([
      getMembers(undefined, session),
      getCheckIns(session),
    ]);
    setMembers(mRes.members);
    setCheckins(cRes);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, session?.user?.id]);

  // Today's date in YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayCheckIns = useMemo(() => {
    return checkins.filter(c => c.checked_in_at.startsWith(todayStr));
  }, [checkins, todayStr]);

  // Search logic for instant auto-complete
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return members.filter(
      m =>
        m.full_name.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.member_code.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [members, searchQuery]);

  const handleSelectMember = (m: Member) => {
    setMatchedMember(m);
    setSearchQuery('');
    setSuccessNotice(null);
  };

  // Detect if selected member has already checked in on the same date
  const alreadyCheckedInToday = useMemo(() => {
    if (!matchedMember) return null;
    return checkins.find(
      c =>
        c.checked_in_at.startsWith(todayStr) &&
        (c.member_id === matchedMember.id || c.member_code === matchedMember.member_code)
    );
  }, [matchedMember, checkins, todayStr]);

  const handleConfirmCheckIn = async (override: boolean = false, isSecondSession: boolean = false) => {
    if (!matchedMember) return;

    setIsSubmitting(true);
    let note = 'Daily Entrance Verification';
    if (isSecondSession) {
      note = 'Second Workout of Day (Duplicate Approved)';
    } else if (override) {
      note = 'Expired Membership Override Approval';
    }

    const res = await recordCheckIn(matchedMember, note, session);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessNotice(`✓ ${matchedMember.full_name} (${matchedMember.member_code}) checked in successfully!`);
      setMatchedMember(null);
      await loadData();
      setTimeout(() => setSuccessNotice(null), 4000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#f36b22]/10 border border-[#f36b22]/30 text-[10px] font-mono text-[#f36b22] uppercase tracking-wider mb-1">
            <QrCode className="w-3.5 h-3.5" />
            <span>Attendance & Check-in Console</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-white">
            Daily Attendance & Check-in
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Rapid front-desk attendance logging with instant membership validity verification.
          </p>
        </div>

        {/* Live Counter */}
        <div className="bg-[#14161d] border border-neutral-800 rounded-xl px-4 py-2 flex items-center gap-3">
          <Flame className="w-5 h-5 text-[#f36b22]" />
          <div>
            <span className="text-[10px] text-neutral-400 font-mono uppercase block">Total Today</span>
            <span className="text-xl font-headline font-black text-white">{todayCheckIns.length} Athletes</span>
          </div>
        </div>
      </div>

      {successNotice && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium text-sm">{successNotice}</span>
        </div>
      )}

      {/* Main Check-in Action Station */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Rapid Search & Verification Card */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#14161d] border border-neutral-800 rounded-xl p-6 space-y-4">
            <h3 className="font-headline font-bold text-sm text-white uppercase tracking-wider">
              Scan / Search Member
            </h3>

            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type member name, phone (e.g. 98220), or ID (PF-1001)..."
                className="w-full pl-10 pr-4 py-3 bg-[#0e1014] border border-neutral-700/80 rounded-xl text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-[#f36b22]"
              />

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#181a24] border border-neutral-700 rounded-xl shadow-2xl z-20 overflow-hidden divide-y divide-neutral-800">
                  {searchResults.map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMember(m)}
                      className="w-full text-left p-3 hover:bg-[#202432] transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-white text-xs">{m.full_name}</div>
                        <div className="text-[11px] font-mono text-neutral-400">
                          {m.phone} · {m.member_code}
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded ${
                          m.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {m.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Verification Card for Selected Member */}
            {matchedMember ? (
              <div className="p-5 bg-[#181a24] border border-neutral-700 rounded-xl space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs text-[#f36b22] font-bold block">
                      {matchedMember.member_code}
                    </span>
                    <h4 className="text-xl font-headline font-black text-white">
                      {matchedMember.full_name}
                    </h4>
                    <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-neutral-500" />
                      <span>{matchedMember.phone}</span>
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider ${
                      matchedMember.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}
                  >
                    {matchedMember.status === 'active' ? '✓ VALID ACCESS' : '⚠ EXPIRED'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-[#0e1014] rounded-lg text-xs font-mono">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">PACKAGE</span>
                    <span className="text-white font-bold">{matchedMember.package_name || 'Standard'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">EXPIRY DATE</span>
                    <span className={matchedMember.status === 'expired' ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {matchedMember.expiry_date}
                    </span>
                  </div>
                </div>

                {matchedMember.balance_due > 0 && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Member has outstanding balance: <strong>₹{matchedMember.balance_due}</strong></span>
                  </div>
                )}

                {/* Duplicate Check-in Notice */}
                {alreadyCheckedInToday && (
                  <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-lg text-xs text-amber-300 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-white">Already Checked In Today</span>
                      <p className="text-[11px] text-amber-200/90 leading-relaxed mt-0.5">
                        Logged today at {new Date(alreadyCheckedInToday.checked_in_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ({alreadyCheckedInToday.notes || 'Workout Session'}).
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={() =>
                      handleConfirmCheckIn(
                        matchedMember.status === 'expired',
                        Boolean(alreadyCheckedInToday)
                      )
                    }
                    disabled={isSubmitting}
                    className={`w-full sm:flex-1 py-3 text-white font-headline font-black uppercase text-xs tracking-wider rounded-lg transition-colors cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
                      alreadyCheckedInToday
                        ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                        : matchedMember.status === 'expired'
                        ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                        : 'bg-[#f36b22] hover:bg-[#d95614] shadow-[#f36b22]/20'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? 'Verifying...'
                        : alreadyCheckedInToday
                        ? 'Log 2nd Workout Today (Pass Duplicate)'
                        : matchedMember.status === 'expired'
                        ? 'Override & Approve Expired Entry'
                        : 'Confirm Check-in'}
                    </span>
                  </button>

                  <button
                    onClick={() => setMatchedMember(null)}
                    className="w-full sm:w-auto px-4 py-3 border border-neutral-700 rounded-lg text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-xl space-y-1">
                <QrCode className="w-8 h-8 mx-auto text-neutral-700 mb-2" />
                <p>Type a member's name or scan their member ID to verify gym access.</p>
                <p className="text-[10px] text-neutral-600 font-mono">Quick keyboard navigation supported</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Today's Check-in Feed */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#14161d] border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-headline font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-[#f36b22]" />
                <span>Today's Activity Log</span>
              </h3>
              <span className="text-[10px] font-mono text-neutral-400">
                {checkins.length} Total Logs
              </span>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {checkins.map(c => {
                const timeStr = new Date(c.checked_in_at).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={c.id}
                    className="p-3 bg-[#0e1014] border border-neutral-800/80 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white text-xs">{c.member_name}</div>
                      <div className="text-[10px] font-mono text-neutral-500">
                        {c.member_code} · {c.notes || 'Workout Session'}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-[11px] text-[#f36b22] block font-bold">
                        {timeStr}
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400 uppercase">
                        Verified
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
