import React, { useState } from 'react';
import { TRAINERS, Trainer } from '../data/primeGymData';
import { X, Award, ChevronRight } from 'lucide-react';
import { useGsapAnimation } from '../hooks/useGsapAnimation';
import { gsap } from '../utils/gsapSetup';

interface AntiqueTrainersProps {
  onSelectTrainer?: (trainer: Trainer) => void;
}

export const AntiqueTrainers: React.FC<AntiqueTrainersProps> = ({ onSelectTrainer }) => {
  // Default selected is Sara Cavil (index 1), matching the reference mockup!
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('trainer-2');
  const [activeMobileModal, setActiveMobileModal] = useState<Trainer | null>(null);

  const sectionRef = useGsapAnimation<HTMLElement>((_ctx) => {
    // 1. Heading line reveal
    gsap.fromTo(
      '.trainer-title-line',
      { yPercent: 110, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 1.0,
        stagger: 0.12,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: '#trainers',
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      }
    );

    // 2. Staggered trainer cards entrance
    gsap.fromTo(
      '.trainer-card-item',
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.trainer-grid-container',
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      }
    );
  });

  const handleTrainerClick = (trainer: Trainer) => {
    setSelectedTrainerId(trainer.id);
    if (onSelectTrainer) onSelectTrainer(trainer);

    // On mobile (< 640px), open the clean detail modal
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setActiveMobileModal(trainer);
    }
  };

  return (
    <section id="trainers" ref={sectionRef} className="py-12 sm:py-20 lg:py-28 bg-[#0a0a0a] text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        {/* Section Heading with Line-by-Line Reveal */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-headline font-black tracking-tight uppercase mb-3 sm:mb-4 text-white">
            <span className="block overflow-hidden">
              <span className="trainer-title-line block">WE ARE HERE TO GUIDE YOU</span>
            </span>
          </h2>
          <p className="font-editorial text-neutral-400 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
            Team of expert trainers are always here to guide and support you. Get professional tips on training scheme, intensity and healthy nutrition based on your individual abilities and preferences.
          </p>
          <p className="text-[10px] font-headline uppercase tracking-widest text-[#f36b22] mt-3 sm:hidden">
            Tap any coach for full biography
          </p>
        </div>

        {/* 5 Trainers Grid: Staggered Entrance and Micro-interaction Hovers */}
        <div className="trainer-grid-container grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3 lg:grid-cols-5 items-start">
          {TRAINERS.map((trainer) => {
            const isFeatured = trainer.id === selectedTrainerId;

            return (
              <div
                key={trainer.id}
                onClick={() => handleTrainerClick(trainer)}
                className={`trainer-card-item cursor-pointer transition-all duration-300 relative w-full group ${
                  isFeatured ? 'z-20 sm:-translate-y-2' : 'opacity-90 sm:opacity-75 sm:hover:opacity-100 z-10'
                }`}
              >
                {/* Image Container: 1:1 square on mobile for compact height, 3:4 portrait on desktop */}
                <div
                  className={`relative overflow-hidden aspect-square sm:aspect-[3/4] bg-neutral-900 transition-all duration-300 ${
                    isFeatured
                      ? 'border-2 border-[#f36b22] shadow-[0_0_20px_rgba(243,107,34,0.35)]'
                      : 'border border-neutral-800 group-hover:border-neutral-600'
                  }`}
                >
                  <picture className="w-full h-full block">
                    {trainer.imageWebp && <source srcSet={trainer.imageWebp} type="image/webp" />}
                    <img
                      src={trainer.image}
                      alt={trainer.name}
                      width={300}
                      height={400}
                      className="w-full h-full object-cover object-top filter grayscale contrast-125 transition-transform duration-700 ease-out group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>
                  {!isFeatured && (
                    <div className="absolute inset-0 bg-black/25 sm:bg-black/30 group-hover:bg-transparent transition-colors duration-300" />
                  )}
                  {/* Subtle active badge on mobile */}
                  {isFeatured && (
                    <div className="sm:hidden absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-[#f36b22] text-[8px] font-headline font-black uppercase tracking-wider text-white shadow-xs">
                      Active
                    </div>
                  )}
                </div>

                {/* Mobile Info Strip (Compact & Uniform Height) */}
                <div
                  className={`sm:hidden p-2 transition-colors border-b border-l border-r ${
                    isFeatured
                      ? 'bg-neutral-900 border-[#f36b22]'
                      : 'bg-[#0f1015] border-neutral-800/90'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-headline font-black text-xs uppercase tracking-tight text-white truncate">
                      {trainer.name}
                    </h3>
                    <ChevronRight className="w-3 h-3 text-[#f36b22] shrink-0 opacity-70" />
                  </div>
                  <p className="text-[10px] text-[#f36b22] font-semibold uppercase tracking-wider truncate mt-0.5">
                    {trainer.specialty}
                  </p>
                  <p className="text-[9px] text-neutral-400 uppercase tracking-tight truncate">
                    {trainer.role}
                  </p>
                </div>

                {/* Desktop Info View: Exact Original Design Preserved with Subtle Card Shadow */}
                {isFeatured ? (
                  <div className="hidden sm:block bg-white text-neutral-900 p-4 sm:p-5 shadow-2xl border-l-2 border-r-2 border-b-2 border-[#f36b22] -mt-[2px] transition-all">
                    <h3 className="font-headline font-black text-sm sm:text-base tracking-wider uppercase text-neutral-900">
                      {trainer.name}
                    </h3>
                    <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest mt-0.5">
                      {trainer.role}
                    </p>
                    <p className="text-[11px] text-neutral-600 font-editorial mt-2 line-clamp-2">
                      {trainer.bio}
                    </p>
                  </div>
                ) : (
                  <div className="hidden sm:block p-3 text-center">
                    <p className="font-headline font-bold text-xs uppercase tracking-wider text-neutral-300 group-hover:text-white transition-colors">
                      {trainer.name}
                    </p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
                      {trainer.specialty}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Detail Modal (Opens on tap on mobile without shifting page layout) */}
        {activeMobileModal && (
          <div
            className="sm:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end justify-center p-3 animate-fade-in"
            onClick={() => setActiveMobileModal(null)}
          >
            <div
              className="bg-[#12141a] border border-[#f36b22]/50 text-white w-full max-w-sm rounded-2xl p-4 shadow-2xl relative space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-[#f36b22] shrink-0">
                    <img
                      src={activeMobileModal.image}
                      alt={activeMobileModal.name}
                      className="w-full h-full object-cover object-top filter grayscale contrast-125"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-1 text-[9px] font-mono text-[#f36b22] uppercase tracking-wider">
                      <Award className="w-3 h-3" />
                      <span>Prime Coach</span>
                    </div>
                    <h4 className="font-headline font-black text-sm uppercase text-white tracking-wide truncate">
                      {activeMobileModal.name}
                    </h4>
                    <p className="text-[10px] text-neutral-300 uppercase font-medium truncate">
                      {activeMobileModal.specialty}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveMobileModal(null)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg bg-neutral-800/80 cursor-pointer shrink-0"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Role */}
              <div className="space-y-0.5">
                <span className="text-[9px] font-headline font-bold uppercase tracking-wider text-neutral-400">
                  Role & Specialization
                </span>
                <p className="text-xs text-[#f36b22] font-semibold">
                  {activeMobileModal.role}
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-0.5">
                <span className="text-[9px] font-headline font-bold uppercase tracking-wider text-neutral-400">
                  Biography & Qualifications
                </span>
                <p className="text-xs text-neutral-300 font-editorial leading-relaxed">
                  {activeMobileModal.bio}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setActiveMobileModal(null)}
                className="w-full py-2 bg-[#f36b22] hover:bg-[#d95614] text-white text-xs font-headline font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer mt-1"
              >
                Close Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
