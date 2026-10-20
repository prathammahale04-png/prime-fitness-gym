import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminSection } from '../../types/database.types';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  QrCode,
  BarChart3,
  Calendar,
  UserCheck,
  MessageSquare,
  Trophy,
  Settings,
  Layers,
  X,
  Headphones,
  LogOut,
  ExternalLink,
  Flame,
} from 'lucide-react';

interface AdminSidebarProps {
  currentSection: AdminSection;
  onSelectSection: (section: AdminSection) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onViewWebsite?: () => void;
}

interface NavItem {
  id: AdminSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'packages', label: 'Packages', icon: Layers },
  { id: 'billing', label: 'Billing & Sales', icon: CreditCard },
  { id: 'checkin', label: 'Check-in', icon: QrCode },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'trainers', label: 'Trainers', icon: UserCheck },
  { id: 'enquiries', label: 'Enquiries', icon: MessageSquare },
  { id: 'challenges', label: 'Challenges', icon: Trophy },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentSection,
  onSelectSection,
  isOpenMobile,
  onCloseMobile,
  onViewWebsite,
}) => {
  const { user, profile, signOut } = useAuth();
  const ownerEmail = profile?.email || user?.email || 'pranavsonawane1328@gmail.com';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#111216] border-r border-neutral-800/90 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Lockup (Matches FitNexus-style Prime Fitness identity) */}
        <div className="p-4 border-b border-neutral-800/90 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f36b22] to-[#c84e0e] flex items-center justify-center text-white shadow-md shadow-[#f36b22]/20">
                <Flame className="w-4 h-4 fill-white" />
              </div>
              <div>
                <span className="font-headline font-black text-sm text-white uppercase tracking-tight block leading-none">
                  PRIME FITNESS
                </span>
                <span className="text-[10px] font-mono text-[#f36b22] uppercase tracking-wider">
                  MH19 · PORTAL
                </span>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-2.5 py-1.5 bg-[#171920] border border-neutral-800 rounded-lg flex items-center justify-between text-xs">
            <span className="text-neutral-400 truncate max-w-[140px] text-[11px] font-mono">
              {ownerEmail}
            </span>
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold">
              OWNER
            </span>
          </div>
        </div>

        {/* Navigation Items (The 11 Modules) */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-500">
            Operations
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#f36b22] text-white font-bold shadow-md shadow-[#f36b22]/20'
                    : 'text-neutral-300 hover:text-white hover:bg-[#181a22]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/30 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions: View Website, Support, Sign out */}
        <div className="p-3 border-t border-neutral-800/90 space-y-1 text-xs">
          {onViewWebsite && (
            <button
              onClick={onViewWebsite}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-neutral-400 hover:text-white hover:bg-[#181a22] rounded-lg transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-[#f36b22]" />
              <span>Public Website</span>
            </button>
          )}

          <button
            onClick={() => alert('Prime Fitness MH19 Support Desk: +91 98220 12345 (Shivaji Nagar, Jalgaon)')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-neutral-400 hover:text-white hover:bg-[#181a22] rounded-lg transition-colors cursor-pointer"
          >
            <Headphones className="w-4 h-4 text-neutral-400" />
            <span>Help & Support</span>
          </button>

          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
