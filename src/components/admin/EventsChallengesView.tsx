import React, { useState, useEffect } from 'react';
import { GymEventRecord, FitnessChallengeRecord } from '../../types/database.types';
import { getEvents, saveEvent, getChallenges, saveChallenge } from '../../services/gymPlatformService';
import {
  Calendar,
  Trophy,
  Plus,
  Share2,
  Check,
  X,
  Users,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface EventsChallengesViewProps {
  initialTab?: 'events' | 'challenges';
}

export const EventsChallengesView: React.FC<EventsChallengesViewProps> = ({ initialTab = 'events' }) => {
  const [activeTab, setActiveTab] = useState<'events' | 'challenges'>(initialTab);
  const [events, setEvents] = useState<GymEventRecord[]>([]);
  const [challenges, setChallenges] = useState<FitnessChallengeRecord[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Event form
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState('07:00 AM – 09:30 AM');
  const [eventLocation, setEventLocation] = useState('Prime Fitness Arena, Shivaji Nagar');
  const [maxCapacity, setMaxCapacity] = useState<number>(30);

  // Challenge form
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeCat, setChallengeCat] = useState('Body Recomposition');
  const [challengeDesc, setChallengeDesc] = useState('');
  const [challengeStart, setChallengeStart] = useState(new Date().toISOString().split('T')[0]);
  const [challengeEnd, setChallengeEnd] = useState(new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]);

  const loadData = async () => {
    const [eRes, cRes] = await Promise.all([getEvents(), getChallenges()]);
    setEvents(eRes);
    setChallenges(cRes);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleShareWhatsApp = (text: string, id: string) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      setModalError('Please enter an event title.');
      return;
    }

    setIsSubmittingEvent(true);
    setModalError(null);

    try {
      const res = await saveEvent({
        title: eventTitle.trim(),
        description: eventDesc.trim() || null,
        event_date: eventDate,
        event_time: eventTime,
        location: eventLocation,
        registration_count: 0,
        max_capacity: Number(maxCapacity) || 30,
        is_published: true,
      });

      if (!res.success) {
        setModalError(res.error || 'Failed to save event. Please check database permissions.');
        setIsSubmittingEvent(false);
        return;
      }

      if (res.error) {
        setStatusNotice(res.error);
        setTimeout(() => setStatusNotice(null), 8000);
      }

      setIsEventModalOpen(false);
      setEventTitle('');
      setEventDesc('');
      setModalError(null);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || 'An unexpected error occurred while saving the event.');
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeTitle.trim()) return;

    await saveChallenge({
      title: challengeTitle.trim(),
      category: challengeCat,
      start_date: challengeStart,
      end_date: challengeEnd,
      description: challengeDesc.trim() || null,
      participants_count: 0,
      is_published: true,
    });

    setIsChallengeModalOpen(false);
    setChallengeTitle('');
    setChallengeDesc('');
    await loadData();
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Status Notice Banner */}
      {statusNotice && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 font-mono text-[10px] uppercase font-bold rounded">Notice</span>
            <span>{statusNotice}</span>
          </div>
          <button onClick={() => setStatusNotice(null)} className="text-amber-400 hover:text-white cursor-pointer ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#f36b22]/10 border border-[#f36b22]/30 text-[10px] font-mono text-[#f36b22] uppercase tracking-wider mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>Community & Competitions</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-white">
            {activeTab === 'events' ? 'Gym Events & Workshops' : 'Fitness Challenges & Contests'}
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Publish lifting clinics, HYROX time-trials, and community fitness contests.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Tab selector */}
          <div className="flex items-center gap-1 bg-[#14161d] p-1 rounded-lg border border-neutral-800">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-[#f36b22] text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Events ({events.length})
            </button>
            <button
              onClick={() => setActiveTab('challenges')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'challenges'
                  ? 'bg-[#f36b22] text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Challenges ({challenges.length})
            </button>
          </div>

          <button
            onClick={() => (activeTab === 'events' ? setIsEventModalOpen(true) : setIsChallengeModalOpen(true))}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f36b22] hover:bg-[#d95614] text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'events' ? 'New Event' : 'New Challenge'}</span>
          </button>
        </div>
      </div>

      {/* Content Grid */}
      {activeTab === 'events' ? (
        events.length === 0 ? (
          <div className="py-16 text-center bg-[#14161d] border border-neutral-800 rounded-xl p-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#f36b22]/10 border border-[#f36b22]/30 flex items-center justify-center mx-auto text-[#f36b22]">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-headline font-bold text-white uppercase tracking-wider">No Events In List</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
              Create your first gym event or lifting clinic to engage members and community athletes.
            </p>
            <button
              onClick={() => setIsEventModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f36b22] hover:bg-[#d95614] text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Event</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {events.map(ev => {
            const shareText = `🔥 PRIME FITNESS MH19 EVENT ANNOUNCEMENT!\n\n🏆 ${ev.title}\n📅 Date: ${ev.event_date}\n⏰ Time: ${ev.event_time}\n🏢 Location: ${ev.location}\n\nJoin our athlete community. Contact front desk or visit primefitnessmh19 to register!`;

            return (
              <div
                key={ev.id}
                className="bg-[#14161d] border border-neutral-800 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-neutral-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-2">
                    <span className="flex items-center gap-1.5 text-[#f36b22]">
                      <Calendar className="w-3.5 h-3.5" />
                      {ev.event_date} · {ev.event_time}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">
                      Published
                    </span>
                  </div>

                  <h3 className="font-headline font-black text-base text-white uppercase tracking-tight mb-2">
                    {ev.title}
                  </h3>

                  <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                    {ev.description}
                  </p>

                  <div className="text-[11px] text-neutral-500 space-y-1 pt-2 border-t border-neutral-800 font-mono">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{ev.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{ev.registration_count} / {ev.max_capacity || 30} Registered Athletes</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Registration Open
                  </span>
                  <button
                    onClick={() => handleShareWhatsApp(shareText, ev.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25d366]/10 hover:bg-[#25d366]/20 text-[#25d366] text-xs font-semibold rounded-lg border border-[#25d366]/30 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copiedId === ev.id ? 'Shared!' : 'Share WhatsApp'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {challenges.map(ch => {
            const shareText = `⚡ PRIME FITNESS MH19 CHALLENGE ALERT!\n\n💪 ${ch.title}\n🎯 Category: ${ch.category}\n📅 Duration: ${ch.start_date} to ${ch.end_date}\n\nChallenge yourself to become the prime version of you. Register at Prime Fitness Shivaji Nagar!`;

            return (
              <div
                key={ch.id}
                className="bg-[#14161d] border border-neutral-800 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-neutral-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-2">
                    <span className="text-[#f36b22] font-semibold">{ch.category}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">
                      Active Contest
                    </span>
                  </div>

                  <h3 className="font-headline font-black text-base text-white uppercase tracking-tight mb-2">
                    {ch.title}
                  </h3>

                  <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                    {ch.description}
                  </p>

                  <div className="text-[11px] text-neutral-500 space-y-1 pt-2 border-t border-neutral-800 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{ch.start_date} → {ch.end_date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{ch.participants_count} Competitors on Leaderboard</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Leaderboard Active
                  </span>
                  <button
                    onClick={() => handleShareWhatsApp(shareText, ch.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25d366]/10 hover:bg-[#25d366]/20 text-[#25d366] text-xs font-semibold rounded-lg border border-[#25d366]/30 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copiedId === ch.id ? 'Shared!' : 'Share WhatsApp'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: New Event */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#14161d] border border-neutral-800 rounded-xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl">
            <div className="border-t-2 border-[#f36b22] absolute top-0 left-0 right-0 rounded-t-xl" />
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h3 className="font-headline font-black text-lg text-white uppercase tracking-tight">
                Create Gym Event / Workshop
              </h3>
              <button onClick={() => setIsEventModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="mt-5 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs flex items-center justify-between">
                  <span>{modalError}</span>
                  <button type="button" onClick={() => setModalError(null)} className="text-red-400 hover:text-white cursor-pointer ml-2">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div>
                <label className="block font-medium text-neutral-300 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  placeholder="e.g. MH19 SQUAT & BENCH CLINIC"
                  required
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Date *</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Time *</label>
                  <input
                    type="text"
                    value={eventTime}
                    onChange={e => setEventTime(e.target.value)}
                    placeholder="07:00 AM – 09:30 AM"
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">Location</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={e => setEventLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">Description</label>
                <textarea
                  value={eventDesc}
                  onChange={e => setEventDesc(e.target.value)}
                  rows={3}
                  placeholder="Details about coaching, schedule, and registration..."
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">Maximum Participant Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={maxCapacity}
                  onChange={e => setMaxCapacity(parseInt(e.target.value, 10) || 30)}
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  disabled={isSubmittingEvent}
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 border border-neutral-700 rounded-lg text-neutral-300 hover:text-white cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEvent}
                  className="px-5 py-2 bg-[#f36b22] hover:bg-[#d95614] disabled:opacity-50 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                >
                  {isSubmittingEvent ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <span>Publish Event</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Challenge */}
      {isChallengeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#14161d] border border-neutral-800 rounded-xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl">
            <div className="border-t-2 border-[#f36b22] absolute top-0 left-0 right-0 rounded-t-xl" />
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h3 className="font-headline font-black text-lg text-white uppercase tracking-tight">
                Create Fitness Challenge
              </h3>
              <button onClick={() => setIsChallengeModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChallenge} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-neutral-300 mb-1">Challenge Title *</label>
                <input
                  type="text"
                  value={challengeTitle}
                  onChange={e => setChallengeTitle(e.target.value)}
                  placeholder="e.g. 60-DAY FAT LOSS & BODY RECOMP"
                  required
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">Category</label>
                <select
                  value={challengeCat}
                  onChange={e => setChallengeCat(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none"
                >
                  <option value="Body Recomposition">Body Recomposition & Fat Loss</option>
                  <option value="Powerlifting & Strength">Powerlifting & Strength Total</option>
                  <option value="HYROX & Endurance">HYROX & Endurance Capacity</option>
                  <option value="Consistency & Check-ins">Attendance Consistency</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={challengeStart}
                    onChange={e => setChallengeStart(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={challengeEnd}
                    onChange={e => setChallengeEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">Rules & Scoring Details</label>
                <textarea
                  value={challengeDesc}
                  onChange={e => setChallengeDesc(e.target.value)}
                  rows={3}
                  placeholder="Scoring metrics, tracking frequency, prizes..."
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsChallengeModalOpen(false)}
                  className="px-4 py-2 border border-neutral-700 rounded-lg text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#f36b22] text-white font-bold rounded-lg hover:bg-[#d95614]"
                >
                  Launch Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
