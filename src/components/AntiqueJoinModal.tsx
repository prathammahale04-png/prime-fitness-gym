import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, MessageCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { PRIME_GYM_DATA, PRICING_PLANS, PricingPlan } from '../data/primeGymData';
import { getActivePackages, mapPackageToPricingPlan } from '../services/packageService';
import { addEnquiry } from '../services/gymPlatformService';

interface AntiqueJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan?: PricingPlan | null;
  availablePlans?: PricingPlan[];
}

export const AntiqueJoinModal: React.FC<AntiqueJoinModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  availablePlans,
}) => {
  const [mounted, setMounted] = useState(false);
  const [plansList, setPlansList] = useState<PricingPlan[]>(availablePlans || PRICING_PLANS);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [planId, setPlanId] = useState(selectedPlan?.id || 'trial');
  const [timeSlot, setTimeSlot] = useState('morning');
  const [discipline, setDiscipline] = useState('Strength & Powerlifting');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedPackage, setSubmittedPackage] = useState('');
  const [error, setError] = useState('');

  const prevScrollYRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedPlan) {
      setPlanId(selectedPlan.id);
    } else {
      setPlanId('trial');
    }
  }, [selectedPlan]);

  // Keep plans list synchronized with live active packages
  useEffect(() => {
    if (availablePlans && availablePlans.length > 0) {
      setPlansList(availablePlans);
    } else if (isOpen) {
      getActivePackages().then((res) => {
        if (res.packages && res.packages.length > 0) {
          setPlansList(res.packages.map(mapPackageToPricingPlan));
        }
      }).catch((err) => {
        console.warn('Modal failed to load active packages:', err);
      });
    }
  }, [availablePlans, isOpen]);

  // Lock background scroll and capture scroll position when open, restore on close
  useEffect(() => {
    if (!isOpen) return;

    // Record exact current scroll position before locking
    const currentScrollY = window.scrollY;
    prevScrollYRef.current = currentScrollY;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar disappearance to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
      // Restore previous scroll position immediately
      window.scrollTo({ top: prevScrollYRef.current, behavior: 'instant' });
    };
  }, [isOpen, isSubmitting]);

  const handleReset = () => {
    setSubmitted(false);
    setError('');
    setIsSubmitting(false);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      handleReset();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError('Please provide your full name (minimum 2 characters).');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address (e.g. name@example.com) or leave it blank.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    // Resolve human-readable package label and source
    let packageName = 'Free 1-Day Trial Pass';
    let leadSource = 'Website Trial Pass';
    if (planId !== 'trial') {
      const matched = plansList.find((p) => p.id === planId) || (selectedPlan?.id === planId ? selectedPlan : null);
      if (matched) {
        packageName = `${matched.durationNumber} ${matched.durationUnit} (₹ ${matched.price})`;
      } else {
        packageName = planId;
      }
      leadSource = 'Website Membership Registration';
    }

    const timingLabel =
      timeSlot === 'morning' ? 'Morning (5:00 AM – 10:00 AM)' : 'Evening (4:30 PM – 10:00 PM)';
    const notes = `Preferred Slot: ${timingLabel} | Focus: ${discipline}`;

    try {
      const res = await addEnquiry({
        full_name: trimmedName,
        phone: cleanPhone,
        email: email.trim() || null,
        source: leadSource,
        interested_package: packageName,
        status: 'new',
        notes,
        follow_up_date: new Date().toISOString().split('T')[0],
      });

      if (!res.success) {
        setError(res.error || 'Database submission failed. Please verify your connection or message us directly.');
        setIsSubmitting(false);
        return;
      }

      // Success verified by database
      setSubmittedPackage(packageName);
      setSubmitted(true);
      setIsSubmitting(false);
    } catch (err: any) {
      console.error('Registration submission error:', err);
      setError(err?.message || 'Network error submitting registration. Please try again or chat on WhatsApp.');
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto overscroll-contain"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-modal-title"
    >
      <div
        className="relative w-full max-w-lg bg-white p-5 sm:p-8 lg:p-10 shadow-2xl border-t-4 border-[#f36b22] text-neutral-900 my-auto max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleReset}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div>
            <div className="mb-6">
              <span className="text-[11px] font-headline font-bold uppercase tracking-[0.2em] text-[#f36b22] block mb-1">
                PRIME FITNESS | JALGAON
              </span>
              <h3 id="join-modal-title" className="text-xl sm:text-2xl font-headline font-black uppercase text-neutral-900">
                {planId === 'trial' ? 'CLAIM FREE TRIAL PASS' : 'MEMBERSHIP REGISTRATION'}
              </h3>
              <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed font-editorial">
                Join our 4000+ Sq.Ft. premier facility in Shivaji Nagar. Strength, Cardio, HYROX & Powerlifting.
              </p>
            </div>

            {error && (
              <div className="p-3 mb-4 text-xs text-red-700 bg-red-50 border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-headline font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Patil"
                  className="w-full p-3 border border-neutral-300 focus:outline-none focus:border-[#f36b22] text-neutral-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-headline font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Mobile / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98220 12345"
                    className="w-full p-3 border border-neutral-300 focus:outline-none focus:border-[#f36b22] text-neutral-900 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-headline font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Email Address <span className="text-neutral-400 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full p-3 border border-neutral-300 focus:outline-none focus:border-[#f36b22] text-neutral-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-headline font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Select Plan
                  </label>
                  <select
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="w-full p-3 border border-neutral-300 focus:outline-none focus:border-[#f36b22] bg-white text-neutral-900 font-medium"
                  >
                    <option value="trial">Free 1-Day Trial Session</option>
                    {plansList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.durationNumber} {p.durationUnit} — ₹ {p.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-headline font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Preferred Timing
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full p-3 border border-neutral-300 focus:outline-none focus:border-[#f36b22] bg-white text-neutral-900 font-medium"
                  >
                    <option value="morning">Morning (5:00 AM – 10:00 AM)</option>
                    <option value="evening">Evening (4:30 PM – 10:00 PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-headline font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Primary Workout Focus
                </label>
                <select
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                  className="w-full p-3 border border-neutral-300 focus:outline-none focus:border-[#f36b22] bg-white text-neutral-900 font-medium"
                >
                  <option value="Strength & Powerlifting">Strength & Powerlifting</option>
                  <option value="HYROX & Functional Cardio">HYROX & Functional Cardio</option>
                  <option value="Fat Loss & Transformation">Fat Loss & Transformation</option>
                  <option value="General Fitness & Muscle Building">General Fitness & Muscle Building</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 text-xs font-headline font-bold uppercase tracking-[0.2em] text-white transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                    isSubmitting
                      ? 'bg-neutral-400 cursor-not-allowed'
                      : 'bg-[#f36b22] hover:bg-[#d95614] shadow-md shadow-[#f36b22]/20'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>SUBMITTING REGISTRATION...</span>
                    </>
                  ) : (
                    <span>CONFIRM & REGISTER</span>
                  )}
                </button>
                <p className="text-[11px] text-neutral-500 text-center mt-2.5">
                  Saawariya godown, Front of Makra tower, Shivaji Nagar, Jalgaon
                </p>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-4 sm:py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono uppercase tracking-wider mb-2 font-bold">
              ✓ Registration Logged to Gym Pipeline
            </div>

            <h3 className="text-xl font-headline font-black uppercase text-neutral-900 mb-1.5">
              REGISTRATION RECEIVED!
            </h3>
            <p className="text-xs text-neutral-600 font-editorial mb-4 max-w-sm mx-auto leading-relaxed">
              Welcome <strong className="text-neutral-900">{name}</strong>! Your registration for{' '}
              <strong className="text-[#f36b22]">{submittedPackage}</strong> has been saved. Our coaching team will reach out on{' '}
              <strong className="text-neutral-900">{phone}</strong> before your arrival.
            </p>

            <div className="bg-neutral-50 p-3.5 border border-neutral-200 text-xs mb-5 text-left space-y-1">
              <p className="font-bold text-neutral-900">📍 PRIME FITNESS | JALGAON</p>
              <p className="text-neutral-600">Saawariya godown, Front of Makra tower, Shivaji Nagar</p>
              <p className="text-neutral-600">⏰ Hours: {PRIME_GYM_DATA.timings}</p>
              <p className="text-neutral-600">📞 Phone: {PRIME_GYM_DATA.phone}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
              <a
                href={`https://wa.me/919422219019?text=Hello%20Prime%20Fitness%20Jalgaon,%20my%20name%20is%20${encodeURIComponent(
                  name
                )}%20and%20I%20just%20registered%20for%20${encodeURIComponent(submittedPackage)}.`}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-5 text-xs font-headline font-bold uppercase tracking-[0.15em] text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
              <button
                onClick={handleReset}
                className="py-3 px-5 text-xs font-headline font-bold uppercase tracking-[0.15em] text-neutral-800 border border-neutral-300 hover:border-neutral-900 cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
