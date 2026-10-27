import React, { useState, useEffect } from 'react';
import { TrainerRecord } from '../../types/database.types';
import {
  getTrainers,
  saveTrainer,
  updateTrainer,
  deleteTrainer,
} from '../../services/gymPlatformService';
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
  Edit2,
  Trash2,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export const TrainersAdminView: React.FC = () => {
  const [trainers, setTrainers] = useState<TrainerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<TrainerRecord | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('Senior Strength & Conditioning Coach');
  const [specialty, setSpecialty] = useState('Powerlifting & Barbell Mechanics');
  const [phone, setPhone] = useState('+91 98220 ');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [activeMembersCount, setActiveMembersCount] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getTrainers();
      setTrainers(list);
    } catch (err: any) {
      console.error('Failed to load trainers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingTrainer(null);
    setName('');
    setRole('Senior Strength & Conditioning Coach');
    setSpecialty('Powerlifting Mechanics & HYROX');
    setPhone('+91 94222 19019');
    setEmail('coach@primefitness.in');
    setBio('');
    setActiveMembersCount(0);
    setIsActive(true);
    setErrorNotice(null);
    setIsModalOpen(true);
  };

  const openEditModal = (t: TrainerRecord) => {
    setEditingTrainer(t);
    setName(t.name);
    setRole(t.role);
    setSpecialty(t.specialty);
    setPhone(t.phone);
    setEmail(t.email);
    setBio(t.bio || '');
    setActiveMembersCount(t.active_members_count || 0);
    setIsActive(t.is_active);
    setErrorNotice(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setErrorNotice(null);

    try {
      if (editingTrainer) {
        // Edit existing trainer
        const res = await updateTrainer(editingTrainer.id, {
          name: name.trim(),
          role: role.trim(),
          specialty: specialty.trim(),
          phone: phone.trim(),
          email: email.trim(),
          active_members_count: Number(activeMembersCount) || 0,
          is_active: isActive,
          bio: bio.trim() || undefined,
        });

        if (res.success) {
          setSuccessNotice(`✓ Updated coach ${name.trim()} in public.trainers.`);
          setIsModalOpen(false);
          await loadData();
          setTimeout(() => setSuccessNotice(null), 4000);
        } else {
          setErrorNotice(res.error || 'Failed to update trainer in Supabase.');
        }
      } else {
        // Add new trainer
        const res = await saveTrainer({
          name: name.trim(),
          role: role.trim(),
          specialty: specialty.trim(),
          phone: phone.trim(),
          email: email.trim(),
          active_members_count: Number(activeMembersCount) || 0,
          is_active: isActive,
          bio: bio.trim() || undefined,
        });

        if (res.success) {
          setSuccessNotice(`✓ Created coach ${name.trim()} in public.trainers.`);
          setIsModalOpen(false);
          await loadData();
          setTimeout(() => setSuccessNotice(null), 4000);
        } else {
          setErrorNotice(res.error || 'Failed to add trainer to Supabase.');
        }
      }
    } catch (err: any) {
      console.error('Trainer form submission error:', err);
      setErrorNotice(err?.message || 'Error saving trainer record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (t: TrainerRecord) => {
    const updatedStatus = !t.is_active;
    const res = await updateTrainer(t.id, { is_active: updatedStatus });
    if (res.success) {
      setTrainers((prev) =>
        prev.map((item) => (item.id === t.id ? { ...item, is_active: updatedStatus } : item))
      );
      setSuccessNotice(`✓ Coach ${t.name} set to ${updatedStatus ? 'Active' : 'Off-duty'}.`);
      setTimeout(() => setSuccessNotice(null), 3000);
    } else {
      alert(res.error || 'Failed to update trainer status.');
    }
  };

  const handleDelete = async (t: TrainerRecord) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete coach "${t.name}" from the coaching roster? This action will permanently remove their record from public.trainers.`
    );
    if (!confirmed) return;

    const res = await deleteTrainer(t.id);
    if (res.success) {
      setTrainers((prev) => prev.filter((item) => item.id !== t.id));
      setSuccessNotice(`✓ Deleted coach ${t.name} from public.trainers.`);
      setTimeout(() => setSuccessNotice(null), 3000);
    } else {
      alert(res.error || 'Failed to delete trainer from Supabase.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#f36b22]/10 border border-[#f36b22]/30 text-[10px] font-mono text-[#f36b22] uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Coaching Staff & Floor Roster</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Target: public.trainers
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-white">
            Trainer Roster & Floor Availability
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage strength coaches, assigned client athletes, contact credentials, and public website display.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#181b24] hover:bg-[#222634] text-neutral-300 text-xs font-bold uppercase rounded-lg border border-neutral-700 transition-colors cursor-pointer"
            title="Refresh trainer list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#f36b22]' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f36b22] hover:bg-[#d95614] text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer shadow-md shadow-[#f36b22]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Trainer Profile</span>
          </button>
        </div>
      </div>

      {successNotice && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Trainers Grid */}
      {loading && trainers.length === 0 ? (
        <div className="p-16 text-center text-neutral-400 text-xs flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 text-[#f36b22] animate-spin" />
          <span>Loading trainers from Supabase...</span>
        </div>
      ) : trainers.length === 0 ? (
        <div className="bg-[#14161d] border border-neutral-800 rounded-xl p-12 text-center text-neutral-500 text-xs">
          No coaches found in roster. Click "Add Trainer Profile" to add the first coach.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {trainers.map((t) => (
            <div
              key={t.id}
              className={`bg-[#14161d] border rounded-xl p-5 flex flex-col justify-between space-y-4 transition-all ${
                t.is_active ? 'border-neutral-800 hover:border-neutral-700' : 'border-neutral-900 opacity-60'
              }`}
            >
              <div>
                {/* Status & Member Count Top Bar */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => handleToggleStatus(t)}
                    className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border cursor-pointer transition-colors ${
                      t.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
                    }`}
                    title="Click to toggle floor availability"
                  >
                    {t.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{t.is_active ? 'Active on Floor' : 'Off-duty'}</span>
                  </button>

                  <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#f36b22]" />
                    <span>{t.active_members_count || 0} Athletes</span>
                  </span>
                </div>

                {/* Trainer Name & Role */}
                <h3 className="font-headline font-black text-lg text-white uppercase tracking-tight">
                  {t.name}
                </h3>
                <p className="text-xs font-semibold text-[#f36b22] mt-0.5 mb-2">
                  {t.role}
                </p>

                {/* Info List */}
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
                  <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed font-sans line-clamp-3">
                    {t.bio}
                  </p>
                )}
              </div>

              {/* Action Buttons: Edit, Toggle, Delete */}
              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                <span className="text-[10px] text-neutral-500 font-mono">
                  Floor Verified
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(t)}
                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    title="Edit Coach Details"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-neutral-300" />
                  </button>

                  <button
                    onClick={() => handleDelete(t)}
                    className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Delete Coach"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add / Edit Trainer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#14161d] border border-neutral-800 rounded-xl w-full max-w-lg p-6 relative shadow-2xl">
            <div className="border-t-2 border-[#f36b22] absolute top-0 left-0 right-0 rounded-t-xl" />
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h3 className="font-headline font-black text-lg text-white uppercase tracking-tight">
                {editingTrainer ? `Edit Coach Profile: ${editingTrainer.name}` : 'Add Trainer Profile'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorNotice && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorNotice}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-neutral-300 mb-1">Trainer Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AMIT PATIL"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">Coaching Title / Role *</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Powerlifting & Strength Coach"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">Discipline Specialty *</label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="e.g. Squat Lockout, HYROX, Fat Loss"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white font-mono focus:border-[#f36b22] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Official Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Assigned Client Count</label>
                  <input
                    type="number"
                    min="0"
                    value={activeMembersCount}
                    onChange={(e) => setActiveMembersCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Floor Status</label>
                  <select
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    className="w-full px-3.5 py-2.5 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white font-mono"
                  >
                    <option value="true">Active on Floor (Published)</option>
                    <option value="false">Off-duty / Hidden</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">Bio & Accreditations</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="State medals, certification credentials, coaching philosophy..."
                  className="w-full px-3.5 py-2.5 bg-[#0e1014] border border-neutral-700/80 rounded-lg text-white focus:border-[#f36b22] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-700 rounded-lg text-neutral-300 hover:bg-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#f36b22] hover:bg-[#d95614] disabled:opacity-50 text-white font-bold uppercase rounded-lg cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#f36b22]/20"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingTrainer ? 'Update Coach' : 'Save Coach Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
