import React, { useState, useEffect } from 'react';
import { TrainerRecord } from '../../types/database.types';
import { getTrainers, saveTrainer } from '../../services/gymPlatformService';
import {
  UserCheck,
  Plus,
  Phone,
  Mail,
  Users,
  Award,
  CheckCircle2,
  X,
  Power,
  Dumbbell,
} from 'lucide-react';

export const TrainersAdminView: React.FC = () => {
  const [trainers, setTrainers] = useState<TrainerRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Strength Coach');
  const [specialty, setSpecialty] = useState('Powerlifting');
  const [phone, setPhone] = useState('+91 98220 ');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');

  const loadData = async () => {
    const list = await getTrainers();
    setTrainers(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await saveTrainer({
      name: name.trim(),
      role: role.trim(),
      specialty: specialty.trim(),
      phone: phone.trim(),
      email: email.trim(),
      active_members_count: 0,
      is_active: true,
      bio: bio.trim(),
    });

    setIsModalOpen(false);
    setName('');
    setBio('');
    await loadData();
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#f36b22]/10 border border-[#f36b22]/30 text-[10px] font-mono text-[#f36b22] uppercase tracking-wider mb-1">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Coaching Staff & Trainers</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-white">
            Trainer Roster & Availability
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage strength coaches, assigned client athletes, and public website display.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f36b22] hover:bg-[#d95614] text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add Trainer Profile</span>
        </button>
      </div>

      {/* Trainers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {trainers.map(t => (
          <div
            key={t.id}
            className="bg-[#14161d] border border-neutral-800 rounded-xl p-5 flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {t.is_active ? 'Active on Floor' : 'Off-duty'}
                </span>
                <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#f36b22]" />
                  <span>{t.active_members_count} Athletes</span>
                </span>
              </div>

              <h3 className="font-headline font-black text-lg text-white uppercase tracking-tight">
                {t.name}
              </h3>
              <p className="text-xs font-medium text-[#f36b22] mt-0.5 mb-2">
                {t.role}
              </p>

              <div className="space-y-1.5 text-xs text-neutral-400 py-2 border-t border-neutral-800/80 font-mono">
                <div className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span className="text-neutral-300 truncate">{t.specialty}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span>{t.phone}</span>
                </div>
                {t.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="truncate">{t.email}</span>
                  </div>
                )}
              </div>

              {t.bio && (
                <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
                  {t.bio}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-[10px] text-neutral-500 font-mono">
                Floor Roster Verified
              </span>
              <button
                onClick={() => alert(`Assigned client list for coach ${t.name}: 16 active members on training schedule.`)}
                className="text-[#f36b22] hover:text-[#d95614] font-semibold transition-colors cursor-pointer"
              >
                View Clients →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add Trainer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#14161d] border border-neutral-800 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
            <div className="border-t-2 border-[#f36b22] absolute top-0 left-0 right-0 rounded-t-xl" />
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h3 className="font-headline font-black text-lg text-white uppercase tracking-tight">
                Add Trainer Profile
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-neutral-300 mb-1">Trainer Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. AMIT PATIL"
                  required
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">Coaching Title *</label>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Senior Powerlifting & Strength Coach"
                  required
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">Discipline Specialty</label>
                <input
                  type="text"
                  value={specialty}
                  onChange={e => setSpecialty(e.target.value)}
                  placeholder="e.g. Squat Lockout, HYROX, Fat Loss"
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">Bio & Accreditations</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  placeholder="Medals, certifications, coaching experience..."
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
                  Save Trainer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
