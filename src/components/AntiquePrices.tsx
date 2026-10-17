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
    <section id="prices" className="py-16 sm:py-20 lg:py-24 bg-white text-neutral-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        {/* Section Heading */}
        <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-headline font-black tracking-tight uppercase mb-4 text-neutral-900">
            OUR PRICES
          </h2>
          <div className="flex items-center justify-center gap-3 text-xs font-headline font-semibold text-neutral-500">
            <span>Currency:</span>
            <button
              onClick={() => setCurrency('INR')}
              className={`px-2.5 py-1 text-xs font-bold rounded-none cursor-pointer transition-colors ${
                currency === 'INR' ? 'bg-[#f36b22] text-white' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              INR (₹)
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-1 text-xs font-bold rounded-none cursor-pointer transition-colors ${
                currency === 'USD' ? 'bg-[#f36b22] text-white' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              USD ($)
            </button>
          </div>
        </div>

        {/* 4 Pricing Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PRICING_PLANS.map((plan) => {
            const isFeatured = plan.highlighted;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between p-6 sm:p-8 lg:p-10 transition-all text-center ${
                  isFeatured
                    ? 'border-2 border-[#f36b22] shadow-xl bg-white z-10'
                    : 'border border-neutral-300 hover:border-neutral-400 bg-white'
                }`}
              >
                <div>
                  {/* Circular Number Indicator: ( 1 ) or ( 3 ) */}
                  <div className="flex justify-center mb-4">
                    <div
                      className={`w-12 h-12 rounded-full border flex items-center justify-center text-sm font-headline font-bold ${
                        isFeatured
                          ? 'border-[#f36b22] text-[#f36b22]'
                          : 'border-neutral-400 text-neutral-800'
                      }`}
                    >
                      {plan.durationNumber}
                    </div>
                  </div>

                  {/* Duration Label */}
                  <h3
                    className={`text-xs font-headline font-bold uppercase tracking-[0.2em] mb-6 sm:mb-8 ${
                      isFeatured ? 'text-[#f36b22]' : 'text-neutral-800'
                    }`}
                  >
                    {plan.durationUnit}
                  </h3>

                  {/* Features List in Italic Typography */}
                  <div className="space-y-3 mb-8 sm:mb-10 font-editorial text-xs text-neutral-600 leading-relaxed min-h-[auto] sm:min-h-[140px] flex flex-col justify-center">
                    {plan.features.map((feature, idx) => (
                      <p key={idx}>{feature}</p>
                    ))}
                  </div>
                </div>

                {/* Price & Buy Button */}
                <div className="pt-6 border-t border-neutral-100">
                  <div className="font-headline font-black text-2xl sm:text-3xl text-neutral-900 mb-4 tracking-tight">
                    {getPriceDisplay(plan)}
                  </div>

                  <button
                    onClick={() => onSelectPlan(plan)}
                    className="inline-flex items-center justify-center min-h-[44px] px-6 text-xs font-headline font-bold uppercase tracking-[0.25em] text-[#f36b22] hover:text-[#d95614] border-b border-transparent hover:border-[#f36b22] transition-colors cursor-pointer py-1"
                  >
                    BUY
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
