import React, { useState } from 'react';
import { TRAINERS, Trainer } from '../data/primeGymData';

interface AntiqueTrainersProps {
  onSelectTrainer?: (trainer: Trainer) => void;
}

export const AntiqueTrainers: React.FC<AntiqueTrainersProps> = ({ onSelectTrainer }) => {
  // Default selected is Sara Cavil (index 1), matching the reference mockup!
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('trainer-2');

  const handleTrainerClick = (trainer: Trainer) => {
    setSelectedTrainerId(trainer.id);
    if (onSelectTrainer) onSelectTrainer(trainer);
  };

  return (
    <section id="trainers" className="py-16 sm:py-20 lg:py-24 bg-[#0a0a0a] text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-headline font-black tracking-tight uppercase mb-4 text-white">
            WE ARE HERE TO GUIDE YOU
          </h2>
          <p className="font-editorial text-neutral-400 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
            Team of expert trainers are always here to guide and support you. Get professional tips on training scheme, intensity and healthy nutrition based on your individual abilities and preferences.
          </p>
          <p className="text-[10px] font-headline uppercase tracking-widest text-[#f36b22] mt-3 sm:hidden">
            ← Swipe to view trainers →
          </p>
        </div>

        {/* 5 Trainers: Swipeable track on mobile (< sm), 5-col grid on desktop (lg) */}
        <div className="flex sm:grid overflow-x-auto sm:overflow-visible pb-4 sm:pb-6 gap-4 sm:gap-6 sm:grid-cols-3 lg:grid-cols-5 items-start snap-x snap-mandatory scrollbar-none">
          {TRAINERS.map((trainer) => {
            const isFeatured = trainer.id === selectedTrainerId;

            return (
              <div
                key={trainer.id}
                onClick={() => handleTrainerClick(trainer)}
                className={`cursor-pointer transition-all duration-300 relative min-w-[220px] sm:min-w-0 shrink-0 sm:shrink snap-center ${
                  isFeatured ? 'z-20 sm:-translate-y-2' : 'opacity-75 hover:opacity-100 z-10'
                }`}
              >
                {/* Image Container with Signature Orange Border for the Featured Trainer */}
                <div
                  className={`relative overflow-hidden aspect-[3/4] bg-neutral-900 transition-all ${
                    isFeatured
                      ? 'border-2 border-[#f36b22] shadow-[0_0_25px_rgba(243,107,34,0.3)]'
                      : 'border border-neutral-800'
                  }`}
                >
                  <img
                    src={trainer.image}
                    alt={trainer.name}
                    className="w-full h-full object-cover filter grayscale contrast-125 transition-transform duration-500 hover:scale-105"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  {!isFeatured && (
                    <div className="absolute inset-0 bg-black/30 hover:bg-transparent transition-colors" />
                  )}
                </div>

                {/* White Info Card Dropdown (Appears directly beneath the featured trainer, matching reference image!) */}
                {isFeatured ? (
                  <div className="bg-white text-neutral-900 p-4 sm:p-5 shadow-2xl border-l-2 border-r-2 border-b-2 border-[#f36b22] -mt-[2px] transition-all">
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
                  <div className="p-3 text-center">
                    <p className="font-headline font-bold text-xs uppercase tracking-wider text-neutral-300">
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
      </div>
    </section>
  );
};
