import React, { useState, useEffect } from 'react';
import { PRIME_GYM_DATA } from '../../data/primeGymData';
import { useAuth } from '../../contexts/AuthContext';
import { gymService } from '../../services/gymService';
import {
  Building2,
  Copy,
  Check,
  Upload,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Save,
  ShieldCheck,
} from 'lucide-react';

export const InstitutionSettingsView: React.FC = () => {
  const { user, profile } = useAuth();

  const [gymName, setGymName] = useState(PRIME_GYM_DATA.brandName);
  const [slogan, setSlogan] = useState('BECOME THE BEST VERSION OF YOU THE PRIME VERSION');
  const [publicSlug, setPublicSlug] = useState('primefitnessmh19');
  const [phone, setPhone] = useState(PRIME_GYM_DATA.phone);
  const [email, setEmail] = useState('pranavsonawane1328@gmail.com');
  const [address, setAddress] = useState(PRIME_GYM_DATA.fullAddress);
  const [timings, setTimings] = useState(PRIME_GYM_DATA.timings);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    gymService.getSettings().then(s => {
      if (isMounted && s) {
        if (s.gym_name) setGymName(s.gym_name);
        if (s.phone) setPhone(s.phone);
        if (s.email) setEmail(s.email);
        if (s.address) setAddress(s.address);
        if (s.timings) setTimings(s.timings);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const publicUrl = `www.fitnexus.net/i/${publicSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${publicUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await gymService.updateSettings({
        gym_name: gymName,
        phone,
        email,
        address,
        timings,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.warn('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-headline font-black text-white uppercase tracking-tight">
          Institution Settings
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Manage your institution profile and preferences.
        </p>
      </div>

      {/* Your Public Link Card (Matching reference photo) */}
      <div className="bg-[#181a20] border border-neutral-800 rounded-xl p-5 sm:p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs text-neutral-400 font-medium block">
              Your public link
            </span>
            <span className="text-sm font-mono text-white font-medium">
              {publicUrl}
            </span>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                const newSlug = prompt('Enter new public slug:', publicSlug);
                if (newSlug) setPublicSlug(newSlug.toLowerCase().trim());
              }}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#252833] hover:bg-[#2d3240] text-xs text-white rounded-lg transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Institution Profile Card (Matching reference photo) */}
      <div className="bg-[#181a20] border border-neutral-800 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-5 border-b border-neutral-800">
          <div className="w-10 h-10 rounded-lg bg-[#252833] flex items-center justify-center text-neutral-300">
            <Building2 className="w-5 h-5 text-[#f36b22]" />
          </div>
          <div>
            <h3 className="text-base font-headline font-bold text-white uppercase tracking-tight">
              Institution Profile
            </h3>
            <p className="text-xs text-neutral-400">
              Manage your fitness center profile and public listing.
            </p>
          </div>
        </div>

        {/* Section: PUBLIC PROFILE */}
        <div className="space-y-6">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 block">
            PUBLIC PROFILE
          </span>

          {/* Cover / Banner Image (Recreating the exact red/purple Prime Fitness Banner from the reference photo) */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-neutral-300">
              Cover / Banner Image
            </label>
            <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden border border-dashed border-neutral-700 bg-gradient-to-r from-[#211636] via-[#1a142e] to-[#26173a] flex items-center justify-center p-6 text-center shadow-lg">
              {/* Background Barbell plates watermark */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,#ffffff_1px,transparent_1px)] bg-[size:1.5rem_1.5rem]" />

              <div className="relative z-10 flex flex-col items-center">
                {/* Flexing Muscular Torso Silhouette in Glowing Orange/Red */}
                <div className="relative mb-2">
                  <svg viewBox="0 0 100 100" className="w-16 h-16 text-[#f36b22] drop-shadow-[0_0_15px_rgba(243,107,34,0.8)]" fill="currentColor">
                    <path d="M50 15 C45 15 42 19 40 23 C38 27 34 27 28 25 C23 23 18 27 19 33 C20 38 25 43 31 43 C35 43 38 40 40 37 C42 41 45 43 50 43 C55 43 58 41 60 37 C62 40 65 43 69 43 C75 43 80 38 81 33 C82 27 77 23 72 25 C66 27 62 27 60 23 C58 19 55 15 50 15 Z" />
                    <path d="M38 45 C35 52 35 65 42 80 C44 83 47 85 50 85 C53 85 56 83 58 80 C65 65 65 52 62 45 Z" />
                  </svg>
                </div>

                {/* Typography from reference photo */}
                <h4 className="text-xl sm:text-2xl font-headline font-black text-white tracking-wider uppercase drop-shadow-md">
                  PRIME <span className="text-[#f36b22]">FITNESS</span>
                </h4>
                <p className="text-[10px] sm:text-[11px] font-mono tracking-widest text-neutral-300 uppercase mt-1">
                  BECOME THE BEST VERSION OF YOU THE PRIME VERSION
                </p>
              </div>
            </div>
            <p className="text-[10px] text-neutral-500 font-mono">
              Landscape image — max 5 MB · JPEG, PNG or WebP · min 1200x400px recommended
            </p>
          </div>

          {/* Fitness Center Logo */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-neutral-300">
              Fitness Center Logo
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#211636] to-[#120d20] border border-neutral-700 flex flex-col items-center justify-center p-2 text-center shrink-0 shadow-md">
                <svg viewBox="0 0 100 100" className="w-8 h-8 text-[#f36b22] drop-shadow-sm mb-1" fill="currentColor">
                  <path d="M50 15 C45 15 42 19 40 23 C38 27 34 27 28 25 C23 23 18 27 19 33 C20 38 25 43 31 43 C35 43 38 40 40 37 C42 41 45 43 50 43 C55 43 58 41 60 37 C62 40 65 43 69 43 C75 43 80 38 81 33 C82 27 77 23 72 25 C66 27 62 27 60 23 C58 19 55 15 50 15 Z" />
                </svg>
                <span className="text-[8px] font-headline font-black text-white uppercase tracking-tighter">
                  PRIME FITNESS
                </span>
              </div>
              <div className="text-xs text-neutral-400 space-y-1">
                <p>Your logo appears on your public fitness center page, event booking pages, and member receipts. Square format works best.</p>
                <p className="text-[10px] font-mono text-neutral-500">Square · max 2 MB</p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Institution / Gym Name *
              </label>
              <input
                type="text"
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#121317] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Brand Slogan / Tagline
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#121317] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#121317] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Owner Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#121317] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={timings}
                  onChange={(e) => setTimings(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#121317] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Facility Size
                </label>
                <input
                  type="text"
                  value={PRIME_GYM_DATA.facilitySize}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-[#0f1013] border border-neutral-800 rounded-lg text-neutral-400 text-xs cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Physical Location / Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#121317] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
              <span className="text-[11px] text-neutral-500 font-mono">
                {saved ? '✓ Changes saved to institution profile' : 'All changes update your public listing'}
              </span>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#f36b22] hover:bg-[#d95614] disabled:opacity-50 text-white text-xs font-headline font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
