import React, { useState } from 'react';
import { PRICING_PLANS, PricingPlan } from '../data/primeGymData';
import { useGsapAnimation } from '../hooks/useGsapAnimation';
import { gsap } from '../utils/gsapSetup';
import { ArrowRight, Check } from 'lucide-react';

interface AntiquePricesProps {
  onSelectPlan: (plan: PricingPlan) => void;
}

export const AntiquePrices: React.FC<AntiquePricesProps> = ({ onSelectPlan }) => {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  const getPriceDisplay = (plan: PricingPlan) => {
    if (currency === 'USD') {
      const usdMap: { [key: string]: string } = {
        'plan-1-month': '$ 24',
        'plan-3-months': '$ 64',
        'plan-6-months': '$ 124',
        'plan-1-year': '$ 244',
      };
      return usdMap[plan.id] || '$ 24';
    }
    return `₹ ${plan.price}`;
  };

  const sectionRef = useGsapAnimation<HTMLElement>((_ctx) => {

    // Header reveal
    gsap.from('.prices-heading-line', {
      scrollTrigger: {
        trigger: '.prices-heading-wrapper',
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
      y: 45,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
    });

    gsap.from('.prices-currency-switch', {
      scrollTrigger: {
        trigger: '.prices-heading-wrapper',
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
      opacity: 0,
      y: 15,
      duration: 0.7,
      delay: 0.2,
      ease: 'power2.out',
    });

    // Staggered pricing cards lift
    gsap.from('.pricing-card-item', {
      scrollTrigger: {
        trigger: '.pricing-cards-grid',
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
      y: 50,
      opacity: 0,
      stagger: 0.12,
      duration: 0.85,
      ease: 'power2.out',
      clearProps: 'transform,opacity',
    });
  });

  return (
    <section
      id="prices"
      ref={sectionRef}
      className="py-16 sm:py-24 lg:py-32 bg-white text-neutral-900 relative overflow-hidden"
    >
      {/* Subtle Background Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-neutral-100 rounded-full filter blur-3xl opacity-50 pointer-events-none -translate-y-1/2 translate-x-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
        {/* Section Heading */}
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-16 prices-heading-wrapper">
          <div className="overflow-hidden mb-3 sm:mb-4">
            <h2 className="prices-heading-line text-2xl sm:text-4xl lg:text-5xl font-headline font-black tracking-tight uppercase text-neutral-900">
              OUR PRICES
            </h2>
          </div>

          <p className="text-neutral-500 font-editorial text-xs sm:text-sm max-w-md mx-auto mb-6">
            Transparent, zero-hidden-fee memberships with complete locker room, shower, and bio-mechanical equipment access.
          </p>

          <div className="prices-currency-switch flex items-center justify-center gap-2 sm:gap-3 text-xs font-headline font-semibold text-neutral-500">
            <span className="text-[11px] sm:text-xs">Currency:</span>
            <div className="inline-flex bg-neutral-100 p-0.5 border border-neutral-200">
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                className={`px-3 py-1.5 text-xs font-bold rounded-none cursor-pointer transition-all duration-200 min-h-[34px] sm:min-h-0 ${
                  currency === 'INR'
                    ? 'bg-[#f36b22] text-white shadow-sm'
                    : 'bg-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                INR (₹)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1.5 text-xs font-bold rounded-none cursor-pointer transition-all duration-200 min-h-[34px] sm:min-h-0 ${
                  currency === 'USD'
                    ? 'bg-[#f36b22] text-white shadow-sm'
                    : 'bg-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                USD ($)
              </button>
            </div>
          </div>

          {currency === 'USD' && (
            <p className="mt-3 text-[11px] text-neutral-500 font-mono tracking-tight bg-neutral-50 border border-neutral-200 py-1.5 px-3 inline-block">
              * USD values are informational estimates for international members. All memberships and official invoices are billed in Indian Rupees (INR ₹).
            </p>
          )}
        </div>

        {/* 4 Pricing Cards: 1 column on mobile with compact cards, 2 col on tablet, 4 col on desktop */}
        <div className="pricing-cards-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch">
          {PRICING_PLANS.map((plan) => {
            const isFeatured = plan.highlighted;

            return (
              <div
                key={plan.id}
                className={`pricing-card-item group relative flex flex-col justify-between p-5 sm:p-8 lg:p-9 transition-all duration-300 text-left sm:text-center ${
                  isFeatured
                    ? 'border-2 border-[#f36b22] shadow-xl hover:shadow-2xl bg-white z-10 lg:-translate-y-2'
                    : 'border border-neutral-200 hover:border-neutral-400 hover:shadow-lg bg-white'
                }`}
              >
                {/* Featured Badge */}
                {isFeatured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-[#f36b22] text-white text-[9px] font-headline font-bold uppercase tracking-[0.2em] shadow-md whitespace-nowrap">
                    MOST POPULAR
                  </div>
                )}

                <div>
                  {/* Top Row on Mobile: Number + Name + Price (aligned horizontally on mobile, stacked on desktop) */}
                  <div className="flex sm:flex-col items-center sm:justify-center justify-between gap-3 mb-4 sm:mb-6 pb-3 sm:pb-0 border-b sm:border-b-0 border-neutral-100">
                    <div className="flex items-center sm:flex-col gap-2.5 sm:gap-0">
                      {/* Circular Number Indicator: ( 1 ) or ( 3 ) */}
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center text-xs sm:text-sm font-headline font-bold shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                          isFeatured
                            ? 'border-[#f36b22] text-[#f36b22] bg-[#f36b22]/5'
                            : 'border-neutral-300 text-neutral-800 bg-neutral-50'
                        }`}
                      >
                        {plan.durationNumber}
                      </div>

                      {/* Duration Label */}
                      <h3
                        className={`text-xs font-headline font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] sm:mt-3 ${
                          isFeatured ? 'text-[#f36b22]' : 'text-neutral-800'
                        }`}
                      >
                        {plan.durationNumber} {plan.durationUnit}
                      </h3>
                    </div>

                    {/* Price prominent on Mobile in header row */}
                    <div className="sm:hidden text-right">
                      <div className="font-headline font-black text-xl text-neutral-900 tracking-tight">
                        {getPriceDisplay(plan)}
                      </div>
                      <span className="text-[9px] text-[#f36b22] uppercase tracking-wider font-mono font-semibold block">
                        Direct Access
                      </span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 font-editorial text-xs text-neutral-600 leading-relaxed sm:min-h-[140px] flex flex-col justify-center">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-left">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isFeatured ? 'bg-[#f36b22]/10 text-[#f36b22]' : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          <Check className="w-2.5 h-2.5" />
                        </span>
                        <span className="text-neutral-700 text-[11px] sm:text-xs leading-snug sm:leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price & Buy Button */}
                <div className="pt-4 sm:pt-6 border-t border-neutral-100">
                  {/* Desktop Price Display */}
                  <div className="hidden sm:block font-headline font-black text-2xl sm:text-3xl text-neutral-900 mb-4 tracking-tight">
                    {getPriceDisplay(plan)}
                  </div>

                  <button
                    onClick={() => onSelectPlan(plan)}
                    className={`w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 text-xs font-headline font-bold uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer rounded-none group/btn ${
                      isFeatured
                        ? 'bg-[#f36b22] text-white hover:bg-[#d95614] shadow-md shadow-[#f36b22]/20'
                        : 'bg-neutral-900 text-white hover:bg-[#f36b22]'
                    }`}
                  >
                    <span>SELECT PLAN</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
