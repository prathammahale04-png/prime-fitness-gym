import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, MessageCircle } from 'lucide-react';
import { PRIME_GYM_DATA, PRICING_PLANS, PricingPlan } from '../data/primeGymData';

interface AntiqueJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan?: PricingPlan | null;
}

export const AntiqueJoinModal: React.FC<AntiqueJoinModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [planId, setPlanId] = useState(selectedPlan?.id || 'trial');
  const [timeSlot, setTimeSlot] = useState('morning');
  const [discipline, setDiscipline] = useState('Strength & Powerlifting');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedPlan) {
      setPlanId(selectedPlan.id);
    } else {
      setPlanId('trial');
    }
  }, [selectedPlan]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your name.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white p-5 sm:p-8 lg:p-10 shadow-2xl border-t-4 border-[#f36b22] text-neutral-900 my-4 sm:my-8">
        <button
          onClick={handleReset}
          className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-900 transition-colors"
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
              <h3 className="text-2xl font-headline font-black uppercase text-neutral-900">
                {planId === 'trial' ? 'CLAIM FREE TRIAL PASS' : 'MEMBERSHIP REGISTRATION'}
              </h3>
              <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed font-editorial">
                Join our 4000+ Sq.Ft. facility in Shivaji Nagar. Strength, Cardio, HYROX & Powerlifting.
              </p>
            </div>

            {error && (
              <div className="p-3 mb-4 text-xs text-red-600 bg-red-50 border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-headline font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Patil"
                  className="w-full p-3 border border-neutral-300 focus:outline-none focus:border-[#f36b22] text-neutral-900"
                />
              </div>

              <div>
                <label className="block font-headline font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Mobile Number / WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98XXX XXXXX"
                  className="w-full p-3 border border-neutral-300 focus:outline-none focus:border-[#f36b22] text-neutral-900"
                />
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
                    {PRICING_PLANS.map((p) => (
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
                  Primary Focus
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
                  className="w-full py-4 text-xs font-headline font-bold uppercase tracking-[0.2em] text-white bg-[#f36b22] hover:bg-[#d95614] transition-colors cursor-pointer"
                >
                  CONFIRM & REGISTER
                </button>
                <p className="text-[11px] text-neutral-500 text-center mt-2.5">
                  Saawariya godown, Front of Makra tower, Shivaji Nagar, Jalgaon
                </p>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-headline font-black uppercase text-neutral-900 mb-2">
              REGISTRATION RECEIVED!
            </h3>
            <p className="text-xs text-neutral-600 font-editorial mb-6 max-w-sm mx-auto">
              Welcome {name}! Your pass has been issued for Prime Fitness Jalgaon. Our coaching team will connect on {phone} before your arrival.
            </p>

            <div className="bg-neutral-50 p-4 border border-neutral-200 text-xs mb-6 text-left space-y-1">
              <p className="font-bold text-neutral-900">📍 PRIME FITNESS | JALGAON</p>
              <p className="text-neutral-600">Saawariya godown, Front of Makra tower, Shivaji Nagar</p>
              <p className="text-neutral-600">⏰ Hours: {PRIME_GYM_DATA.timings}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`https://wa.me/919422219019?text=Hello%20Prime%20Fitness%20Jalgaon,%20my%20name%20is%20${encodeURIComponent(
                  name
                )}%20and%20I%20just%20registered%20for%20a%20pass.`}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-5 text-xs font-headline font-bold uppercase tracking-[0.15em] text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
              <button
                onClick={handleReset}
                className="py-3 px-5 text-xs font-headline font-bold uppercase tracking-[0.15em] text-neutral-800 border border-neutral-300 hover:border-neutral-900"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
