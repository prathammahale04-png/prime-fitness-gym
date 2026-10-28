import React, { useState, useEffect } from 'react';
import { PRIME_GYM_DATA } from '../../data/primeGymData';
import { useAuth } from '../../contexts/AuthContext';
import { gymService } from '../../services/gymService';
import { GymSettings } from '../../types/gym';
import {
  Building2,
  Copy,
  Check,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Save,
  ShieldCheck,
  AlertCircle,
  Dumbbell,
  Layers,
  Image,
  Megaphone,
} from 'lucide-react';

export const InstitutionSettingsView: React.FC = () => {
  const { user, profile } = useAuth();

  const [gymName, setGymName] = useState(PRIME_GYM_DATA.brandName);
  const [brandSlogan, setBrandSlogan] = useState('BECOME THE BEST VERSION OF YOU THE PRIME VERSION');
  const [publicSlug, setPublicSlug] = useState('primefitnessmh19');
  const [city, setCity] = useState(PRIME_GYM_DATA.city);
  const [phone, setPhone] = useState(PRIME_GYM_DATA.phone);
  const [email, setEmail] = useState(PRIME_GYM_DATA.email);
  const [address, setAddress] = useState(PRIME_GYM_DATA.fullAddress);
  const [timings, setTimings] = useState(PRIME_GYM_DATA.timings);
  const [facilitySize, setFacilitySize] = useState(PRIME_GYM_DATA.facilitySize);
  const [disciplines, setDisciplines] = useState(PRIME_GYM_DATA.disciplines);
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [announcements, setAnnouncements] = useState('');

  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    gymService.getSettings().then((s: GymSettings) => {
      if (isMounted && s) {
        if (s.gym_name) setGymName(s.gym_name);
        if (s.brand_slogan) setBrandSlogan(s.brand_slogan);
        if (s.public_slug) setPublicSlug(s.public_slug);
        if (s.city) setCity(s.city);
        if (s.phone) setPhone(s.phone);
        if (s.email) setEmail(s.email);
        if (s.address) setAddress(s.address);
        if (s.timings) setTimings(s.timings);
        if (s.facility_size) setFacilitySize(s.facility_size);
        if (s.disciplines) setDisciplines(s.disciplines);
        if (s.logo_url) setLogoUrl(s.logo_url);
        if (s.banner_url) setBannerUrl(s.banner_url);
        if (s.announcements) setAnnouncements(s.announcements);
      }
    });
    return () => {
      isMounted = false;
    };
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
    setErrorMessage(null);
    try {
      await gymService.updateSettings({
        gym_name: gymName.trim(),
        brand_slogan: brandSlogan.trim(),
        public_slug: publicSlug.trim(),
        city: city.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        timings: timings.trim(),
        facility_size: facilitySize.trim(),
        disciplines: disciplines.trim(),
        logo_url: logoUrl.trim() || undefined,
        banner_url: bannerUrl.trim() || undefined,
        announcements: announcements.trim() || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setErrorMessage(err?.message || 'Failed to update gym settings in database.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#f36b22]/10 border border-[#f36b22]/30 text-[10px] font-mono text-[#f36b22] uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Facility Configuration & Public Presence</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-headline font-black text-white uppercase tracking-tight">
            Institution Settings
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage your Prime Fitness MH19 facility profile, public listing, operating hours, and contact details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#171920] border border-neutral-800 rounded-lg text-xs font-mono text-neutral-300">
            <ShieldCheck className="w-3.5 h-3.5 text-[#f36b22]" />
            <span>Target: public.gym_settings</span>
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Your Public Link Card */}
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
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#252833] hover:bg-[#2d3240] text-xs text-white rounded-lg transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Institution Profile Card */}
      <div className="bg-[#181a20] border border-neutral-800 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-5 border-b border-neutral-800">
          <div className="w-10 h-10 rounded-lg bg-[#252833] flex items-center justify-center text-neutral-300">
            <Building2 className="w-5 h-5 text-[#f36b22]" />
          </div>
          <div>
            <h3 className="text-base font-headline font-bold text-white uppercase tracking-tight">
              Institution Profile & Public Listing
            </h3>
            <p className="text-xs text-neutral-400">
              Changes saved here update the verified base table and display on the public website.
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Cover / Banner Image Preview & Input */}
          <div className="space-y-2">
            <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300">
              Cover / Banner Image
            </label>
            <div className="relative w-full h-40 sm:h-48 rounded-xl overflow-hidden border border-neutral-700 bg-gradient-to-r from-[#211636] via-[#1a142e] to-[#26173a] flex items-center justify-center p-6 text-center shadow-lg">
              {bannerUrl ? (
                <img
                  src={bannerUrl}
                  alt="Gym Banner"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <>
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,#ffffff_1px,transparent_1px)] bg-[size:1.5rem_1.5rem]" />
                  <div className="relative z-10 flex flex-col items-center">
                    <h4 className="text-xl sm:text-2xl font-headline font-black text-white tracking-wider uppercase drop-shadow-md">
                      {gymName}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#f36b22] uppercase mt-1">
                      {brandSlogan}
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="pt-1">
              <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                Custom Banner Image URL (Optional)
              </label>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://example.com/prime-banner.jpg"
                className="w-full px-3.5 py-2 bg-[#121317] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300">
              Gym Brand Logo URL
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#211636] to-[#120d20] border border-neutral-700 flex items-center justify-center shrink-0 shadow-md overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Dumbbell className="w-7 h-7 text-[#f36b22]" />
                )}
              </div>
              <div className="flex-1 w-full">
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/prime-logo.png"
                  className="w-full px-3.5 py-2 bg-[#121317] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none font-mono"
                />
                <p className="text-[10px] font-mono text-neutral-500 mt-1">
                  Square format recommended · Displays on public headers, receipts, and invoices.
                </p>
              </div>
            </div>
          </div>

          {/* Core Profile Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Institution / Gym Name *
              </label>
              <input
                type="text"
                required
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#121317] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Brand Slogan / Tagline *
              </label>
              <input
                type="text"
                required
                value={brandSlogan}
                onChange={(e) => setBrandSlogan(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#121317] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                City / Region *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#121317] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Public Slug *
              </label>
              <input
                type="text"
                required
                value={publicSlug}
                onChange={(e) => setPublicSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="w-full px-3.5 py-2.5 bg-[#121317] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Contact Phone / WhatsApp *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#121317] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Official Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#121317] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Operating Timings *
              </label>
              <input
                type="text"
                required
                value={timings}
                onChange={(e) => setTimings(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#121317] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Facility Size *
              </label>
              <input
                type="text"
                required
                value={facilitySize}
                onChange={(e) => setFacilitySize(e.target.value)}
                placeholder="e.g. 4000+ SQ.FT."
                className="w-full px-3.5 py-2.5 bg-[#121317] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Disciplines & Programs *
            </label>
            <input
              type="text"
              required
              value={disciplines}
              onChange={(e) => setDisciplines(e.target.value)}
              placeholder="e.g. Strength · Cardio · HYROX · Powerlifting"
              className="w-full px-3.5 py-2.5 bg-[#121317] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Physical Location / Full Address *
            </label>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#121317] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Public Announcements & Bulletins
            </label>
            <textarea
              rows={2}
              value={announcements}
              onChange={(e) => setAnnouncements(e.target.value)}
              placeholder="e.g. Special weekend HYROX boot camp or holiday timings..."
              className="w-full px-3.5 py-2.5 bg-[#121317] border border-neutral-700/80 rounded-lg text-white text-xs focus:border-[#f36b22] focus:outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-neutral-800">
            <span className="text-[11px] font-mono text-neutral-400">
              {saved ? (
                <span className="text-emerald-400 font-bold">✓ Changes saved successfully to public.gym_settings</span>
              ) : (
                'All updates write directly to Supabase with staff authentication.'
              )}
            </span>

            <button
              type="submit"
              disabled={saving || profile?.role !== 'owner'}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#f36b22] hover:bg-[#d95614] disabled:opacity-50 text-white text-xs font-headline font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-md shadow-[#f36b22]/20"
              title={profile?.role !== 'owner' ? 'Only gym owners can update facility settings' : undefined}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving to Database...' : profile?.role !== 'owner' ? 'Owner Role Required' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
