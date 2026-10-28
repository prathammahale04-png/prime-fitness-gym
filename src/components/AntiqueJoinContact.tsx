import React from 'react';
import { PRIME_GYM_DATA } from '../data/primeGymData';
import { MapPin, Phone, Mail, Clock, ArrowUpRight, MessageCircle } from 'lucide-react';
import { useGsapAnimation } from '../hooks/useGsapAnimation';
import { gsap } from '../utils/gsapSetup';

interface AntiqueJoinContactProps {
  onOpenJoin: () => void;
}

export const AntiqueJoinContact: React.FC<AntiqueJoinContactProps> = ({ onOpenJoin }) => {
  const sectionRef = useGsapAnimation<HTMLElement>((_ctx) => {

    // Title line reveal
    gsap.from('.contact-title-line', {
      scrollTrigger: {
        trigger: '.contact-title-wrapper',
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
    });

    // Parallax on map canvas
    gsap.to('.contact-map-canvas', {
      scrollTrigger: {
        trigger: '.contact-map-container',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
      yPercent: 12,
      ease: 'none',
    });

    // Floating card upward reveal
    gsap.from('.contact-floating-card', {
      scrollTrigger: {
        trigger: '.contact-floating-card',
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
      y: 60,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
    });
  });

  return (
    <section id="contacts" ref={sectionRef} className="pt-20 sm:pt-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 mb-12 sm:mb-16 contact-title-wrapper text-center">
        <div className="overflow-hidden">
          <h2 className="contact-title-line text-3xl sm:text-4xl lg:text-5xl font-headline font-black tracking-tight uppercase text-neutral-900">
            WELCOME TO JOIN!
          </h2>
        </div>
        <p className="text-neutral-500 font-editorial text-xs sm:text-sm mt-3 max-w-lg mx-auto">
          Visit our flagship Shivaji Nagar facility or connect with our head coaches directly on WhatsApp.
        </p>
      </div>

      {/* Map Graphic with Floating White Information Card */}
      <div className="contact-map-container relative min-h-[560px] w-full bg-[#181a1f] overflow-hidden flex items-center justify-center lg:justify-end">
        {/* Dark Styled Map Canvas Background with Parallax */}
        <div className="contact-map-canvas absolute inset-0 z-0 opacity-80 pointer-events-none scale-105">
          <svg className="w-full h-full object-cover" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="street-grid" width="120" height="120" patternUnits="userSpaceOnUse">
                <path d="M 120 0 L 0 0 0 120" fill="none" stroke="#2a2e37" strokeWidth="2" />
                <path d="M 60 0 L 60 120 M 0 60 L 120 60" fill="none" stroke="#22262f" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#16181d" />
            <rect width="100%" height="100%" fill="url(#street-grid)" />
            {/* Arterial River / Road lines */}
            <path d="M-50 180 Q 300 240, 600 120 T 1400 320" fill="none" stroke="#333842" strokeWidth="8" />
            <path d="M 250 -50 L 380 600" fill="none" stroke="#f36b22" strokeWidth="2" opacity="0.3" />
            <path d="M 700 -50 L 580 600" fill="none" stroke="#383d47" strokeWidth="4" />
          </svg>

          {/* Map Location Pin for Jalgaon Shivaji Nagar */}
          <div className="absolute top-[42%] left-[30%] sm:left-[42%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#f36b22] animate-ping opacity-30" />
              <div className="w-11 h-11 rounded-full bg-[#f36b22] text-white flex items-center justify-center shadow-[0_0_25px_rgba(243,107,34,0.7)] relative z-10">
                <MapPin className="w-5 h-5 fill-white text-[#f36b22]" />
              </div>
            </div>
            <div className="mt-2.5 px-3.5 py-1 bg-neutral-900/95 text-white text-[10px] font-headline font-bold uppercase tracking-wider border border-neutral-700 shadow-xl whitespace-nowrap">
              PRIME FITNESS · SHIVAJI NAGAR
            </div>
          </div>
        </div>

        {/* Floating White Contact Card */}
        <div className="contact-floating-card relative z-10 w-full max-w-lg mx-4 sm:mx-6 lg:mr-24 my-10 sm:my-14 bg-white p-6 sm:p-10 shadow-2xl border-t-4 border-[#f36b22]">
          <div className="space-y-5 sm:space-y-6 text-xs text-neutral-800">
            {/* Address */}
            <div className="grid grid-cols-12 gap-3 pb-4 sm:pb-5 border-b border-neutral-100">
              <span className="col-span-4 sm:col-span-3 font-headline font-bold uppercase tracking-[0.15em] text-neutral-900">
                ADDRESS
              </span>
              <div className="col-span-8 sm:col-span-9 leading-relaxed text-neutral-600">
                <p className="font-semibold text-neutral-900">Saawariya godown, Front of Makra tower,</p>
                <p>near Vikas dudh federation, Shivaji Nagar,</p>
                <p>Jalgaon, Maharashtra 425001</p>
              </div>
            </div>

            {/* Timings */}
            <div className="grid grid-cols-12 gap-3 pb-4 sm:pb-5 border-b border-neutral-100">
              <span className="col-span-4 sm:col-span-3 font-headline font-bold uppercase tracking-[0.15em] text-neutral-900">
                TIMINGS
              </span>
              <div className="col-span-8 sm:col-span-9 text-neutral-700 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#f36b22] shrink-0" />
                <span>{PRIME_GYM_DATA.timings}</span>
              </div>
            </div>

            {/* Phone */}
            <div className="grid grid-cols-12 gap-3 pb-4 sm:pb-5 border-b border-neutral-100">
              <span className="col-span-4 sm:col-span-3 font-headline font-bold uppercase tracking-[0.15em] text-neutral-900">
                PHONE
              </span>
              <div className="col-span-8 sm:col-span-9">
                <a
                  href={`tel:${PRIME_GYM_DATA.phone}`}
                  className="font-semibold text-neutral-900 hover:text-[#f36b22] transition-colors inline-flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-[#f36b22]" />
                  <span>{PRIME_GYM_DATA.phone}</span>
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="grid grid-cols-12 gap-3 pb-4 sm:pb-5 border-b border-neutral-100">
              <span className="col-span-4 sm:col-span-3 font-headline font-bold uppercase tracking-[0.15em] text-neutral-900">
                E-MAIL
              </span>
              <div className="col-span-8 sm:col-span-9">
                <a
                  href={`mailto:${PRIME_GYM_DATA.email}`}
                  className="text-neutral-600 hover:text-[#f36b22] transition-colors inline-flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{PRIME_GYM_DATA.email}</span>
                </a>
              </div>
            </div>

            {/* Socials */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <span className="col-span-4 sm:col-span-3 font-headline font-bold uppercase tracking-[0.15em] text-neutral-900">
                SOCIALS
              </span>
              <div className="col-span-8 sm:col-span-9 flex items-center gap-4 text-neutral-500">
                <a
                  href={PRIME_GYM_DATA.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#f36b22] transition-colors font-headline font-bold text-xs"
                >
                  Instagram
                </a>
                <span className="text-neutral-300">·</span>
                <a
                  href="https://wa.me/919422219019"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#f36b22] transition-colors font-headline font-bold text-xs flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onOpenJoin}
              className="flex-1 py-3 px-4 text-xs font-headline font-bold uppercase tracking-[0.2em] text-white bg-[#f36b22] hover:bg-[#d95614] transition-all duration-200 text-center cursor-pointer shadow-md shadow-[#f36b22]/20 hover:shadow-lg"
            >
              CLAIM TRIAL PASS
            </button>
            <a
              href="https://maps.google.com/?q=Saawariya+godown+Shivaji+Nagar+Jalgaon"
              target="_blank"
              rel="noreferrer"
              className="py-3 px-4 text-xs font-headline font-bold uppercase tracking-[0.2em] text-neutral-800 border border-neutral-300 hover:border-neutral-900 transition-colors flex items-center justify-center gap-1.5 group/dir"
            >
              <span>DIRECTIONS</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/dir:translate-x-0.5 group-hover/dir:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
