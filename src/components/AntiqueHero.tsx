import React from 'react';
import heroPanoramaImg from '../assets/images/antique_hero_panorama_bg_1792239521892.jpg';

interface AntiqueHeroProps {
  onReadMore?: () => void;
  onExplorePlans?: () => void;
}

export const AntiqueHero: React.FC<AntiqueHeroProps> = () => {
  return (
    <section
      id="hero"
      className="relative min-h-[70vh] sm:min-h-[85vh] lg:min-h-[92vh] bg-[#e6e8eb] pt-20 sm:pt-24 lg:pt-28 pb-8 sm:pb-12 lg:pb-16 flex items-center overflow-hidden w-full max-w-full"
    >
      {/* Background Panoramic Athlete Image — Anchored to top so the athlete's head and full body remain fully visible */}
      <div className="absolute inset-0 top-16 sm:top-20 lg:top-24 z-0 select-none pointer-events-none w-full h-[calc(100%-4rem)] sm:h-[calc(100%-5rem)] lg:h-[calc(100%-6rem)] overflow-hidden">
        <img
          src={heroPanoramaImg || "/images/antique_hero_panorama_bg_1792239521892.jpg"}
          alt="Prime Fitness Hero Athlete Background"
          className="w-full h-full object-cover object-[15%_top] sm:object-[left_top] lg:object-[left_top] filter brightness-100 contrast-105"
          referrerPolicy="no-referrer"
        />
        {/* Subtle, soft light gradient for pristine text readability without obscuring the background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-white/50 sm:via-transparent sm:to-white/40 lg:to-white/20" />
      </div>

      {/* Prominent "BUILD YOUR BODY" Typography — Fluid clamp scaling */}
      <div className="absolute inset-0 z-5 flex items-center justify-end pr-4 sm:pr-12 lg:pr-20 pointer-events-none select-none overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-12 flex justify-end">
          <div className="w-full sm:w-2/3 lg:w-1/2 text-left sm:pl-4 -mt-12 sm:-mt-28 lg:-mt-36">
            <h1 className="font-headline font-black text-[clamp(2.5rem,8.5vw,6.5rem)] tracking-tight uppercase leading-[0.9] select-none break-words">
              <span className="text-[#f36b22]">BUILD</span>
              <br />
              <span className="text-neutral-900">YOUR BODY</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Foreground Content Container — Responsive min-height and padding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-12 w-full relative z-10 py-6 sm:py-10 lg:py-12 min-h-[280px] sm:min-h-[420px] lg:min-h-[520px]" />
    </section>
  );
};
