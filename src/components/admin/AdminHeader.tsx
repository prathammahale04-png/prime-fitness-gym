import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminSection } from '../../types/database.types';
import { Menu, ExternalLink, LogOut, ShieldCheck, User } from 'lucide-react';

interface AdminHeaderProps {
  currentSection: AdminSection;
  onOpenMobileSidebar: () => void;
  onViewWebsite: () => void;
}

const SECTION_TITLES: Record<AdminSection, string> = {
  overview: 'System Overview & Diagnostics',
  members: 'Member Directory & Profiles',
  packages: 'Membership Packages & Plans',
  billing: 'Billing, Invoices & Sales Records',
  checkin: 'Daily Attendance & Check-in',
  analytics: 'Revenue & Membership Analytics',
  events: 'Gym Events & Workshops',
  trainers: 'Trainer Roster & Schedules',
  enquiries: 'Website Leads & Follow-ups',
  challenges: 'Fitness Challenges & Contests',
  automation: 'Automation Centre & Reminders',
  import: 'Member Data Import & Migration',
  settings: 'System Configuration & Security',
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentSection,
  onOpenMobileSidebar,
  onViewWebsite,
}) => {
  const { user, profile, role, signOut } = useAuth();

  const roleLabel = role ? role.toUpperCase() : 'STAFF';

  return (
    <header className="h-16 bg-[#14171d] border-b border-neutral-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-neutral-400 hover:text-white border border-neutral-800 bg-[#0e1014] cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Section Title */}
        <div>
          <h1 className="text-sm sm:text-base font-headline font-black uppercase tracking-tight text-white leading-none">
            {SECTION_TITLES[currentSection]}
          </h1>
          <p className="text-[10px] font-mono text-neutral-400 tracking-wider uppercase mt-1 hidden sm:block">
            PRIME FITNESS MH19 · SHIVAJI NAGAR, JALGAON
          </p>
        </div>
      </div>

      {/* Right Controls: Role, User, Website Link, Sign Out */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick Link to Public Website */}
        <button
          onClick={onViewWebsite}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 hover:text-white bg-[#1b1f27] hover:bg-[#222733] border border-neutral-700/80 transition-colors cursor-pointer"
          title="Open Public Gym Website"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#f36b22]" />
          <span>Public Website</span>
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-neutral-800">
          <div className="w-8 h-8 rounded-none bg-[#1e232d] border border-neutral-700 flex items-center justify-center text-neutral-300">
            <User className="w-4 h-4 text-[#f36b22]" />
          </div>
          <div className="hidden sm:block text-left">
            <span className="text-xs font-medium text-white block leading-tight truncate max-w-[140px]">
              {profile?.full_name || user?.email || 'Administrator'}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-[#f36b22]" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#f36b22]">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => signOut()}
          className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 border border-neutral-800 transition-colors cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
