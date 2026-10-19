import React from 'react';
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
  Zap,
  FileSpreadsheet,
  Settings,
  Layers,
  X,
  Shield,
} from 'lucide-react';

interface AdminSidebarProps {
  currentSection: AdminSection;
  onSelectSection: (section: AdminSection) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: AdminSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  stageBadge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, stageBadge: 'Live' },
  { id: 'members', label: 'Members', icon: Users, stageBadge: 'Stage 3' },
  { id: 'packages', label: 'Packages', icon: Layers, stageBadge: 'Stage 3' },
  { id: 'billing', label: 'Billing & Sales', icon: CreditCard, stageBadge: 'Stage 4' },
  { id: 'checkin', label: 'Check-in', icon: QrCode, stageBadge: 'Stage 4' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, stageBadge: 'Stage 4' },
  { id: 'events', label: 'Events', icon: Calendar, stageBadge: 'Stage 5' },
  { id: 'trainers', label: 'Trainers', icon: UserCheck, stageBadge: 'Stage 5' },
  { id: 'enquiries', label: 'Enquiries', icon: MessageSquare, stageBadge: 'Stage 5' },
  { id: 'challenges', label: 'Challenges', icon: Trophy, stageBadge: 'Stage 5' },
  { id: 'automation', label: 'Automation Centre', icon: Zap, stageBadge: 'Stage 7' },
  { id: 'import', label: 'Data Import', icon: FileSpreadsheet, stageBadge: 'Stage 6' },
  { id: 'settings', label: 'Settings', icon: Settings, stageBadge: 'Stage 8' },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentSection,
  onSelectSection,
  isOpenMobile,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#12151b] border-r border-neutral-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1a1e27] border border-neutral-700/80 flex items-center justify-center text-[#f36b22]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-headline font-black text-sm uppercase tracking-wider text-white block leading-none">
                PRIME FITNESS
              </span>
              <span className="text-[10px] font-mono text-[#f36b22] uppercase tracking-widest">
                MH19 · CONSOLE
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items (All 13 Modules) */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-headline font-bold uppercase tracking-wider text-neutral-500">
            Management Modules
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
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-headline font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-none ${
                  isActive
                    ? 'bg-[#f36b22] text-white shadow-md shadow-[#f36b22]/20'
                    : 'text-neutral-400 hover:text-white hover:bg-[#181c24]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.stageBadge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded-none uppercase tracking-normal ${
                      isActive
                        ? 'bg-black/30 text-white'
                        : item.stageBadge === 'Live'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {item.stageBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-neutral-800/80 bg-[#0e1014] text-[11px]">
          <div className="flex items-center justify-between text-neutral-400">
            <span>System Status</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
          <div className="mt-1 text-[10px] text-neutral-500 font-mono">
            Platform Stage: 2 of 8
          </div>
        </div>
      </aside>
    </>
  );
};
