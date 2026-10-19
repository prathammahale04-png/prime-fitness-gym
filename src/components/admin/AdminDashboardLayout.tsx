import React, { useState } from 'react';
import { AdminSection } from '../../types/database.types';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { OverviewView } from './OverviewView';
import { StagePlaceholder } from './StagePlaceholder';

interface AdminDashboardLayoutProps {
  onViewWebsite: () => void;
}

export const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({ onViewWebsite }) => {
  const [currentSection, setCurrentSection] = useState<AdminSection>('overview');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#0d0f12] text-neutral-100 flex selection:bg-[#f36b22] selection:text-white">
      {/* Sidebar (Desktop Persistent & Mobile Drawer) */}
      <AdminSidebar
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* Main Body (Offset by sidebar on desktop) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <AdminHeader
          currentSection={currentSection}
          onOpenMobileSidebar={() => setIsOpenMobile(true)}
          onViewWebsite={onViewWebsite}
        />

        <main className="flex-1 overflow-y-auto bg-[#0d0f12]">
          {currentSection === 'overview' ? (
            <OverviewView />
          ) : (
            <StagePlaceholder section={currentSection} />
          )}
        </main>
      </div>
    </div>
  );
};
