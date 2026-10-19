import React from 'react';
import heroPanoramaImg from '../assets/images/antique_hero_panorama_bg_1792239521892.jpg';

interface AntiqueHeroProps {
  onReadMore?: () => void;
}

export const AntiqueHero: React.FC<AntiqueHeroProps> = () => {
  return (
    <section id="hero" className="relative min-h-[85vh] lg:min-h-[92vh] bg-[#e6e8eb] pt-24 lg:pt-28 flex items-center overflow-hidden">
      {/* Background Panoramic Athlete Image sent by user */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <img
          src={heroPanoramaImg || "/images/antique_hero_panorama_bg_1792239521892.jpg"}
          alt="Prime Fitness Hero Athlete Background"
          className="w-full h-full object-cover object-left lg:object-center filter brightness-100 contrast-105"
          referrerPolicy="no-referrer"
        />
        {/* Subtle, soft light gradient for pristine text readability without obscuring the background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/40 lg:to-white/20" />
      </div>

      {/* Prominent "BUILD YOUR BODY" Typography — Static without animation */}
      <div className="absolute inset-0 z-5 flex items-center justify-end pr-6 sm:pr-12 lg:pr-20 pointer-events-none select-none">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 flex justify-end">
          <div className="w-full lg:w-1/2 text-left lg:pl-4 -mt-24 sm:-mt-32 lg:-mt-36">
            <h1 className="font-headline font-black text-5xl sm:text-7xl lg:text-8xl tracking-tight text-neutral-300/80 uppercase leading-[0.9] select-none">
              BUILD<br />
              <span className="text-neutral-300/80">YOUR BODY</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Foreground Content Container */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 w-full relative z-10 py-12 min-h-[460px] lg:min-h-[520px]" />
    </section>
  );
};
