import React, { useState } from 'react';
import { PRICING_PLANS, PricingPlan } from '../data/primeGymData';

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

  return (
    <section id="prices" className="py-12 sm:py-20 lg:py-24 bg-white text-neutral-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        {/* Section Heading */}
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-headline font-black tracking-tight uppercase mb-3 sm:mb-4 text-neutral-900">
            OUR PRICES
          </h2>
          <div className="flex items-center justify-center gap-2 sm:gap-3 text-xs font-headline font-semibold text-neutral-500">
            <span className="text-[11px] sm:text-xs">Currency:</span>
            <button
              onClick={() => setCurrency('INR')}
              className={`px-3 py-1.5 sm:py-1 text-xs font-bold rounded-none cursor-pointer transition-colors min-h-[36px] sm:min-h-0 ${
                currency === 'INR' ? 'bg-[#f36b22] text-white' : 'bg-neutral-100 sm:bg-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              INR (₹)
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 sm:py-1 text-xs font-bold rounded-none cursor-pointer transition-colors min-h-[36px] sm:min-h-0 ${
                currency === 'USD' ? 'bg-[#f36b22] text-white' : 'bg-neutral-100 sm:bg-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              USD ($)
            </button>
          </div>
        </div>

        {/* 4 Pricing Cards: 1 column on mobile with compact cards, 2 col on tablet, 4 col on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 items-stretch">
          {PRICING_PLANS.map((plan) => {
            const isFeatured = plan.highlighted;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between p-4 sm:p-8 lg:p-10 transition-all text-left sm:text-center ${
                  isFeatured
                    ? 'border-2 border-[#f36b22] shadow-xl bg-white z-10'
                    : 'border border-neutral-300 hover:border-neutral-400 bg-white'
                }`}
              >
                {/* Featured Badge on Mobile & Desktop */}
                {isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#f36b22] text-white text-[9px] font-headline font-bold uppercase tracking-[0.2em] shadow-sm whitespace-nowrap">
                    MOST POPULAR
                  </div>
                )}

                <div>
                  {/* Top Row on Mobile: Number + Name + Price (aligned horizontally on mobile, stacked on desktop) */}
                  <div className="flex sm:flex-col items-center sm:justify-center justify-between gap-3 mb-3 sm:mb-6 pb-2.5 sm:pb-0 border-b sm:border-b-0 border-neutral-100">
                    <div className="flex items-center sm:flex-col gap-2.5 sm:gap-0">
                      {/* Circular Number Indicator: ( 1 ) or ( 3 ) */}
                      <div
                        className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center text-xs sm:text-sm font-headline font-bold shrink-0 ${
                          isFeatured
                            ? 'border-[#f36b22] text-[#f36b22] bg-[#f36b22]/5'
                            : 'border-neutral-400 text-neutral-800'
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

                  {/* Features List in Clean, Readable Typography */}
                  <div className="space-y-1.5 sm:space-y-3 mb-4 sm:mb-10 font-editorial text-xs text-neutral-600 leading-relaxed sm:min-h-[140px] flex flex-col justify-center">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-[#f36b22] text-xs font-bold shrink-0 mt-0.5">•</span>
                        <span className="text-neutral-700 text-[11px] sm:text-xs leading-tight sm:leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price & Buy Button */}
                <div className="pt-3 sm:pt-6 border-t border-neutral-100">
                  {/* Desktop Price Display */}
                  <div className="hidden sm:block font-headline font-black text-2xl sm:text-3xl text-neutral-900 mb-4 tracking-tight">
                    {getPriceDisplay(plan)}
                  </div>

                  <button
                    onClick={() => onSelectPlan(plan)}
                    className={`w-full sm:w-auto inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 text-xs font-headline font-bold uppercase tracking-[0.2em] transition-all cursor-pointer rounded-none ${
                      isFeatured
                        ? 'bg-[#f36b22] text-white hover:bg-[#d95614] shadow-md shadow-[#f36b22]/20'
                        : 'bg-neutral-900 text-white sm:bg-transparent sm:text-[#f36b22] hover:bg-neutral-800 sm:hover:bg-transparent sm:hover:text-[#d95614] sm:border-b sm:border-transparent sm:hover:border-[#f36b22]'
                    }`}
                  >
                    SELECT PLAN
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
