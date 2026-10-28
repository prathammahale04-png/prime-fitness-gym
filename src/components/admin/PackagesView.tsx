import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MembershipPackage, PackageDurationType } from '../../types/database.types';
import { getPackages, createPackage, togglePackageActive, updatePackage } from '../../services/packageService';
import {
  Layers,
  Plus,
  CheckCircle2,
  Clock,
  IndianRupee,
  Edit2,
  Power,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const PackagesView: React.FC = () => {
  const { session, profile, loading: authLoading } = useAuth();
  const canManagePackages = profile?.role === 'owner' || profile?.role === 'staff';
  const [packages, setPackages] = useState<MembershipPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<MembershipPackage | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [durationType, setDurationType] = useState<PackageDurationType>('monthly');
  const [durationDays, setDurationDays] = useState(30);
  const [price, setPrice] = useState(1500);
  const [description, setDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadPackages = async () => {
    setLoading(true);
    const res = await getPackages(session);
    setPackages(res.packages);
    setIsLive(res.isLive);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) {
      loadPackages();
    }
  }, [authLoading, session?.user?.id]);

  const handleOpenAdd = () => {
    setEditingPkg(null);
    setName('');
    setDurationType('monthly');
    setDurationDays(30);
    setPrice(1500);
    setDescription('');
    setFeaturesText('Full 4000+ Sq.Ft. gym access\nGeneral floor supervision\nLocker & changing room');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg: MembershipPackage) => {
    setEditingPkg(pkg);
    setName(pkg.name);
    setDurationType(pkg.duration_type);
    setDurationDays(pkg.duration_days);
    setPrice(pkg.price);
    setDescription(pkg.description || '');
    setFeaturesText(pkg.features.join('\n'));
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleDurationTypeChange = (type: PackageDurationType) => {
    setDurationType(type);
    if (type === 'monthly') setDurationDays(30);
    else if (type === 'quarterly') setDurationDays(90);
    else if (type === 'half_yearly') setDurationDays(180);
    else if (type === 'yearly') setDurationDays(365);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price < 0 || durationDays <= 0) {
      setErrorMsg('Please fill in valid package name, price, and duration.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const features = featuresText
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    if (editingPkg) {
      const res = await updatePackage(
        editingPkg.id,
        {
          name: name.trim(),
          duration_type: durationType,
          duration_days: Number(durationDays),
          price: Number(price),
          description: description.trim() || null,
          features,
        },
        session
      );

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to update package.');
      } else {
        setIsModalOpen(false);
        await loadPackages();
      }
    } else {
      const res = await createPackage(
        {
          name: name.trim(),
          duration_type: durationType,
          duration_days: Number(durationDays),
          price: Number(price),
          description: description.trim() || null,
          features,
          is_active: true,
        },
        session
      );

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create package.');
      } else {
        setIsModalOpen(false);
        await loadPackages();
      }
    }
    setIsSubmitting(false);
  };

  const handleToggle = async (pkg: MembershipPackage) => {
    await togglePackageActive(pkg.id, pkg.is_active, session);
    await loadPackages();
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#f36b22]/10 border border-[#f36b22]/30 text-[10px] font-mono text-[#f36b22] uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Stage 3 · Packages Module</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-white">
            Membership Packages & Plans
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure gym subscription tiers, pricing, duration, and included facilities.
          </p>
        </div>

        {canManagePackages ? (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#f36b22] hover:bg-[#d95614] text-white text-xs font-headline font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-[#f36b22]/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Package</span>
          </button>
        ) : (
          <span className="text-[11px] font-mono text-neutral-500 bg-[#161820] border border-neutral-800 px-3 py-1.5 self-start sm:self-auto">
            View-Only Access (Owner / Staff can modify)
          </span>
        )}
      </div>

      {/* Package Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-neutral-400 text-xs font-mono">
          Loading membership packages...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {packages.map((pkg) => {
            const isHighlighted = pkg.duration_type === 'quarterly';

            return (
              <div
                key={pkg.id}
                className={`bg-[#14171d] border relative flex flex-col justify-between transition-all ${
                  isHighlighted
                    ? 'border-[#f36b22] shadow-xl shadow-[#f36b22]/10'
                    : 'border-neutral-800'
                } ${!pkg.is_active ? 'opacity-60' : ''}`}
              >
                {/* Active/Inactive Ribbon */}
                <div className="p-5 pb-0 flex items-center justify-between">
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 uppercase tracking-wider font-bold ${
                      pkg.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {pkg.is_active ? 'Active' : 'Archived'}
                  </span>

                  <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#f36b22]" />
                    {pkg.duration_days} Days
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-headline font-black text-base text-white uppercase tracking-tight mb-2">
                    {pkg.name}
                  </h3>

                  <div className="flex items-baseline gap-1 my-3 text-white">
                    <span className="text-xs text-[#f36b22] font-headline font-bold">₹</span>
                    <span className="text-3xl font-headline font-black tracking-tight">
                      {pkg.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono uppercase">
                      / {pkg.duration_type.replace('_', ' ')}
                    </span>
                  </div>

                  {pkg.description && (
                    <p className="text-[11px] text-neutral-400 mb-4 leading-relaxed">
                      {pkg.description}
                    </p>
                  )}

                  {/* Included features */}
                  <div className="space-y-2 mt-auto pt-3 border-t border-neutral-800/80">
                    {pkg.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-neutral-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#f36b22] shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action Controls */}
                {canManagePackages && (
                  <div className="p-4 bg-[#0f1115] border-t border-neutral-800/80 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleOpenEdit(pkg)}
                      className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer text-[11px] font-headline font-bold uppercase tracking-wider"
                    >
                      <Edit2 className="w-3 h-3 text-[#f36b22]" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleToggle(pkg)}
                      className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer text-[11px] font-headline font-bold uppercase tracking-wider ${
                        pkg.is_active
                          ? 'text-neutral-400 hover:text-amber-400'
                          : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{pkg.is_active ? 'Archive' : 'Activate'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Package Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#14171d] border border-neutral-800 w-full max-w-lg p-6 sm:p-8 relative shadow-2xl">
            <div className="border-t-2 border-[#f36b22] absolute top-0 left-0 right-0" />

            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h3 className="font-headline font-black text-lg text-white uppercase tracking-tight">
                {editingPkg ? 'Edit Membership Package' : 'Create New Package'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Package Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 3 MONTHS INTENSIVE"
                  required
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700 text-white text-xs focus:border-[#f36b22] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Duration Tier
                  </label>
                  <select
                    value={durationType}
                    onChange={(e) => handleDurationTypeChange(e.target.value as PackageDurationType)}
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700 text-white text-xs focus:border-[#f36b22] focus:outline-none"
                  >
                    <option value="monthly">Monthly (30 Days)</option>
                    <option value="quarterly">Quarterly (90 Days)</option>
                    <option value="half_yearly">Half Yearly (180 Days)</option>
                    <option value="yearly">Yearly (365 Days)</option>
                    <option value="custom">Custom Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Days Active *
                  </label>
                  <input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700 text-white text-xs focus:border-[#f36b22] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Fee Amount (₹ INR) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#f36b22] font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    min={0}
                    step={100}
                    required
                    className="w-full pl-8 pr-3 py-2 bg-[#0e1014] border border-neutral-700 text-white text-xs focus:border-[#f36b22] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Brief Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Progressive overload quarterly cycle"
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700 text-white text-xs focus:border-[#f36b22] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Included Features (One per line)
                </label>
                <textarea
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  rows={4}
                  placeholder="Full 4000+ Sq.Ft. access&#10;Locker & shower facilities"
                  className="w-full px-3 py-2 bg-[#0e1014] border border-neutral-700 text-white text-xs focus:border-[#f36b22] focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-700 text-neutral-300 text-xs font-headline font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#f36b22] hover:bg-[#d95614] text-white text-xs font-headline font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingPkg ? 'Update Package' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
