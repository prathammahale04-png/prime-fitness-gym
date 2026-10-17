import React from 'react';
import { PRIME_GYM_DATA } from '../data/primeGymData';

interface AntiqueArtOfBodyProps {
  onLearnMore: () => void;
}

export const AntiqueArtOfBody: React.FC<AntiqueArtOfBodyProps> = ({ onLearnMore }) => {
  return (
    <section id="about" className="py-16 sm:py-20 lg:py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Bold Headline & Signature Orange Wireframe Box */}
          <div className="lg:col-span-6 relative">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-headline font-black text-neutral-900 tracking-tight leading-[1.1] uppercase mb-6 sm:mb-8">
              YOUR BODY IS<br />A WORK OF ART
            </h2>

            {/* Signature Orange Rectangular Border Frame */}
            <div className="border-2 border-[#f36b22] p-5 sm:p-8 lg:p-10 relative bg-white/60 backdrop-blur-xs max-w-lg">
              <p className="text-neutral-700 text-xs sm:text-sm leading-relaxed mb-6">
                Small but regular workout effort leads you to beauty and self-confidence. Set your own routine and conditions of training, choose the program that boosts your results. Take the chance to get proud of yourself. Let your body feel the way of perfection.
              </p>

              {/* Gym Discipline Chips */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-200/80 mb-6 text-xs text-neutral-800">
                <div>
                  <span className="font-headline font-bold text-neutral-900 block text-[11px] uppercase tracking-wider text-[#f36b22]">
                    FACILITY
                  </span>
                  <span>{PRIME_GYM_DATA.facilitySize}</span>
                </div>
                <div>
                  <span className="font-headline font-bold text-neutral-900 block text-[11px] uppercase tracking-wider text-[#f36b22]">
                    TIMINGS
                  </span>
                  <span>{PRIME_GYM_DATA.timings}</span>
                </div>
                <div className="col-span-2 pt-1">
                  <span className="font-headline font-bold text-neutral-900 block text-[11px] uppercase tracking-wider text-[#f36b22]">
                    PROGRAMS
                  </span>
                  <span>{PRIME_GYM_DATA.disciplines}</span>
                </div>
              </div>

              <button
                onClick={onLearnMore}
                className="inline-block text-xs font-headline font-bold uppercase tracking-[0.2em] text-[#f36b22] hover:text-[#d95614] border-b border-[#f36b22] pb-0.5 transition-colors cursor-pointer"
              >
                READ MORE
              </button>
            </div>
          </div>

          {/* Right Column: Woman Planking on Clean White Floor */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative max-w-lg w-full">
              <img
                src="/src/assets/images/athletic_woman_workout_1792235872529.jpg"
                alt="Athletic Fitness Training at Prime Fitness"
                className="w-full h-auto object-contain max-h-[500px]"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Far Right: Vertical Rail Indicator from Reference Image */}
          <div className="hidden xl:flex lg:col-span-1 flex-col items-center justify-center gap-4 text-xs font-headline tracking-widest text-neutral-400">
            <div className="flex flex-col items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
              <div className="flex items-center gap-1.5 -rotate-90 origin-center whitespace-nowrap my-6 text-[10px] font-bold tracking-[0.2em] text-neutral-700">
                <span>ABOUT</span>
                <span className="w-2 h-2 rounded-full bg-[#f36b22]" />
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
