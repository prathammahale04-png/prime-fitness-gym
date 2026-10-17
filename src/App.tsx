/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AntiqueHeader } from './components/AntiqueHeader';
import { AntiqueHero } from './components/AntiqueHero';
import { AntiqueArtOfBody } from './components/AntiqueArtOfBody';
import { AntiqueTrainers } from './components/AntiqueTrainers';
import { AntiquePrices } from './components/AntiquePrices';
import { AntiqueJoinContact } from './components/AntiqueJoinContact';
import { AntiqueFooter } from './components/AntiqueFooter';
import { AntiqueJoinModal } from './components/AntiqueJoinModal';
import { PricingPlan } from './data/primeGymData';

export default function App() {
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenJoin = () => {
    setSelectedPlan(null);
    setIsJoinOpen(true);
  };

  const handleSelectPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setIsJoinOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans selection:bg-[#f36b22] selection:text-white">
      {/* Header: Spartan Helmet + PRIME FITNESS, Nav: ABOUT · TRAINERS · PRICES · CONTACTS */}
      <AntiqueHeader
        onNavigate={scrollTo}
        onOpenJoin={handleOpenJoin}
      />

      <main className="flex-1">
        {/* Section 1: Hero ("BUILD YOUR BODY" giant background watermark, B&W athletic physique) */}
        <AntiqueHero
          onReadMore={() => scrollTo('about')}
        />

        {/* Section 2: "YOUR BODY IS A WORK OF ART" (Orange border box, core workout athlete, vertical dots) */}
        <AntiqueArtOfBody
          onLearnMore={() => scrollTo('prices')}
        />

        {/* Section 3: "WE ARE HERE TO GUIDE YOU" (Solid black background, 5 trainers, orange highlighted card) */}
        <AntiqueTrainers />

        {/* Section 4: "OUR PRICES" (4 vertical pricing cards, 3-months highlighted in orange border) */}
        <AntiquePrices
          onSelectPlan={handleSelectPlan}
        />

        {/* Section 5: "WELCOME TO JOIN!" (Dark map of Jalgaon Shivaji Nagar + floating white contact card) */}
        <AntiqueJoinContact
          onOpenJoin={handleOpenJoin}
        />
      </main>

      {/* Clean Footer */}
      <AntiqueFooter
        onNavigate={scrollTo}
      />

      {/* Interactive Registration & Trial Pass Modal */}
      <AntiqueJoinModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        selectedPlan={selectedPlan}
      />
    </div>
  );
}
