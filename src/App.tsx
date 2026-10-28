/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AntiqueHeader } from './components/AntiqueHeader';
import { AntiqueHero } from './components/AntiqueHero';
import { AntiqueArtOfBody } from './components/AntiqueArtOfBody';
import { AntiqueFacilityStory } from './components/AntiqueFacilityStory';
import { AntiqueTrainers } from './components/AntiqueTrainers';
import { AntiquePrices } from './components/AntiquePrices';
import { AntiqueJoinContact } from './components/AntiqueJoinContact';
import { AntiqueFooter } from './components/AntiqueFooter';
import { AntiqueJoinModal } from './components/AntiqueJoinModal';
import { AdminLoginPage } from './components/auth/AdminLoginPage';
import { AdminDashboardLayout } from './components/admin/AdminDashboardLayout';
import { PricingPlan } from './data/primeGymData';
import { Shield } from 'lucide-react';

type AppView = 'public' | 'login' | 'admin';

function AppContent() {
  const { user, loading } = useAuth();

  // Determine initial view based on browser URL path
  const getInitialView = (): AppView => {
    const path = window.location.pathname.toLowerCase();
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/login')) return 'login';
    return 'public';
  };

  const [currentView, setCurrentView] = useState<AppView>(getInitialView);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);

  // Synchronize browser history and path
  const navigateTo = (view: AppView) => {
    setCurrentView(view);
    const targetPath = view === 'public' ? '/' : `/${view}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ view }, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.view) {
        setCurrentView(event.state.view);
      } else {
        const path = window.location.pathname.toLowerCase();
        if (path.startsWith('/admin')) setCurrentView('admin');
        else if (path.startsWith('/login')) setCurrentView('login');
        else setCurrentView('public');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Protected route enforcement
  useEffect(() => {
    if (!loading) {
      if (currentView === 'admin' && !user) {
        // Unauthenticated access to admin redirects to login
        navigateTo('login');
      } else if (currentView === 'login' && user) {
        // Authenticated users accessing login redirect to admin
        navigateTo('admin');
      }
    }
  }, [currentView, user, loading]);

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

  // Loading Screen for Auth Checking
  if (loading && currentView === 'admin') {
    return (
      <div className="min-h-screen bg-[#0d0f12] text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 bg-[#161920] border border-neutral-800 flex items-center justify-center text-[#f36b22] mb-4">
          <Shield className="w-6 h-6 animate-pulse" />
        </div>
        <p className="font-headline font-bold uppercase tracking-wider text-xs text-neutral-400">
          Verifying Security Credentials...
        </p>
      </div>
    );
  }

  // 1. Owner & Staff Login View
  if (currentView === 'login') {
    return (
      <div className="animate-view-fade min-h-screen">
        <AdminLoginPage
          onBackToWebsite={() => navigateTo('public')}
          onLoginSuccess={() => navigateTo('admin')}
        />
      </div>
    );
  }

  // 2. Protected Admin Dashboard View
  if (currentView === 'admin' && user) {
    return (
      <div className="animate-view-fade min-h-screen">
        <AdminDashboardLayout
          onViewWebsite={() => navigateTo('public')}
        />
      </div>
    );
  }

  // 3. Public Gym Website (Exact Working Design Preserved)
  return (
    <div className="animate-view-fade min-h-screen bg-white text-neutral-900 flex flex-col font-sans selection:bg-[#f36b22] selection:text-white">
      {/* Header: Spartan Helmet + PRIME FITNESS, Nav: ABOUT · FACILITY · TRAINERS · PRICES · CONTACTS */}
      <AntiqueHeader
        onNavigate={scrollTo}
        onOpenJoin={handleOpenJoin}
      />

      <main className="flex-1">
        {/* Section 1: Hero ("BUILD YOUR BODY" giant background watermark, panoramic athlete) */}
        <AntiqueHero
          onReadMore={() => scrollTo('about')}
          onExplorePlans={() => scrollTo('prices')}
        />

        {/* Section 2: "YOUR BODY IS A WORK OF ART" (Orange border box, core workout athlete, vertical dots) */}
        <AntiqueArtOfBody
          onLearnMore={() => scrollTo('prices')}
        />

        {/* Section 3: "THE PROVING GROUND" (Horizontal scroll storytelling of 4 training zones) */}
        <AntiqueFacilityStory
          onClaimPass={handleOpenJoin}
        />

        {/* Section 4: "WE ARE HERE TO GUIDE YOU" (Solid black background, 5 trainers, orange highlighted card) */}
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

      {/* Clean Footer with discrete Staff Portal link */}
      <AntiqueFooter
        onNavigate={scrollTo}
        onOpenStaffPortal={() => navigateTo('login')}
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

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
