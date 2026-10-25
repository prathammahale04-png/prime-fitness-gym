import React, { useState } from 'react';
import { AdminSection } from '../../types/database.types';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { OverviewView } from './OverviewView';
import { MembersView } from './MembersView';
import { PackagesView } from './PackagesView';
import { BillingView } from './BillingView';
import { CheckInView } from './CheckInView';
import { AnalyticsView } from './AnalyticsView';
import { EventsChallengesView } from './EventsChallengesView';
import { TrainersAdminView } from './TrainersAdminView';
import { EnquiriesView, LeadConvertData } from './EnquiriesView';
import { InstitutionSettingsView } from './InstitutionSettingsView';
import { MembershipRemindersView } from './MembershipRemindersView';

interface AdminDashboardLayoutProps {
  onViewWebsite: () => void;
}

export const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({ onViewWebsite }) => {
  const [currentSection, setCurrentSection] = useState<AdminSection>('overview');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [convertLeadData, setConvertLeadData] = useState<LeadConvertData | null>(null);

  return (
    <div className="min-h-screen bg-[#0d0e12] text-neutral-100 flex selection:bg-[#f36b22] selection:text-white">
      {/* Persistent Collapsible Sidebar */}
      <AdminSidebar
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        onViewWebsite={onViewWebsite}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <AdminHeader
          currentSection={currentSection}
          onOpenMobileSidebar={() => setIsOpenMobile(true)}
          onViewWebsite={onViewWebsite}
        />

        <main className="flex-1 overflow-y-auto bg-[#0d0e12]">
          {currentSection === 'overview' && (
            <OverviewView onNavigateSection={setCurrentSection} />
          )}
          {currentSection === 'members' && (
            <MembersView
              initialMemberData={convertLeadData}
              onClearInitialData={() => setConvertLeadData(null)}
            />
          )}
          {currentSection === 'packages' && (
            <PackagesView />
          )}
          {currentSection === 'billing' && (
            <BillingView />
          )}
          {currentSection === 'checkin' && (
            <CheckInView />
          )}
          {currentSection === 'analytics' && (
            <AnalyticsView />
          )}
          {currentSection === 'events' && (
            <EventsChallengesView initialTab="events" />
          )}
          {currentSection === 'trainers' && (
            <TrainersAdminView />
          )}
          {currentSection === 'enquiries' && (
            <EnquiriesView
              onNavigateToMembers={(leadData) => {
                if (leadData) setConvertLeadData(leadData);
                setCurrentSection('members');
              }}
            />
          )}
          {currentSection === 'challenges' && (
            <EventsChallengesView initialTab="challenges" />
          )}
          {currentSection === 'reminders' && (
            <MembershipRemindersView onNavigateSection={setCurrentSection} />
          )}
          {currentSection === 'settings' && (
            <InstitutionSettingsView />
          )}
        </main>
      </div>
    </div>
  );
};
