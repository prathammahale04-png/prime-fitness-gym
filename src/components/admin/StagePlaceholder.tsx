import React from 'react';
import { AdminSection } from '../../types/database.types';
import { Clock, ShieldAlert, CheckSquare, Sparkles } from 'lucide-react';

interface StagePlaceholderProps {
  section: AdminSection;
}

interface StageDetail {
  title: string;
  stageNumber: number;
  stageName: string;
  description: string;
  specifications: string[];
}

const STAGE_CONFIGS: Partial<Record<AdminSection, StageDetail>> = {
  members: {
    title: 'Member Directory & Management',
    stageNumber: 3,
    stageName: 'Stage 3: Members, Packages & Manual Entry',
    description: 'Centralized gym member registry supporting manual member additions, profile editing, search, filters, and membership status tracking.',
    specifications: [
      'Manual member registration with validation and duplicate prevention',
      'Active, expired, and upcoming renewal status indicators',
      'Soft deactivation preserving historical attendance and billing records',
      'Direct linking to assigned membership plans and payment history',
    ],
  },
  packages: {
    title: 'Membership Packages & Pricing',
    stageNumber: 3,
    stageName: 'Stage 3: Members, Packages & Manual Entry',
    description: 'Configurable gym package tiers with duration, pricing, discipline access, and active/inactive switches.',
    specifications: [
      'Custom duration plans (Monthly, Quarterly, Half-Yearly, Yearly, Custom Days)',
      'Preservation of historical subscription terms when package prices update',
      'Configurable inclusion of HYROX, Powerlifting, Strength, or Cardio zones',
      'Activation/Deactivation toggle without breaking existing memberships',
    ],
  },
  billing: {
    title: 'Billing, Invoicing & Sales Records',
    stageNumber: 4,
    stageName: 'Stage 4: Billing, Attendance & Revenue Analytics',
    description: 'Transaction recording, receipt generation, outstanding dues ledger, and payment method tracking.',
    specifications: [
      'Manual cash / UPI / bank transfer payment recording with reference IDs',
      'Explicit marking of manual vs gateway payments (zero false claims)',
      'Member-linked transaction history and downloadable receipts',
      'Duplicate payment prevention and outstanding balance ledger',
    ],
  },
  checkin: {
    title: 'Daily Attendance & Check-in Console',
    stageNumber: 4,
    stageName: 'Stage 4: Billing, Attendance & Revenue Analytics',
    description: 'Front-desk attendance check-in engine with instant membership validity verification.',
    specifications: [
      'Rapid manual check-in with member search and real-time validity check',
      'Prevention of accidental duplicate check-ins on the same day',
      'Staff attribution and timestamp logging for all entries',
      'Architecture prepared for secure QR code check-ins with server validation',
    ],
  },
  analytics: {
    title: 'Business Analytics & Revenue Reports',
    stageNumber: 4,
    stageName: 'Stage 4: Billing, Attendance & Revenue Analytics',
    description: 'Honest financial charts and membership metrics derived strictly from actual database records.',
    specifications: [
      'Daily, weekly, monthly, and yearly revenue collected filters',
      'Clear separation of cash collected vs outstanding dues and invoices',
      'Period-over-period growth calculations handling zero-revenue periods honestly',
      'Zero fabricated data or fake charts; honest empty states when records are missing',
    ],
  },
  events: {
    title: 'Gym Events & Community Workshops',
    stageNumber: 5,
    stageName: 'Stage 5: Enquiries, Trainers, Events & Challenges',
    description: 'Publish and manage in-gym lifting meets, workshops, seminars, and member events.',
    specifications: [
      'Create, edit, publish, and archive gym events',
      'Store event schedules, locations, descriptions, and registration caps',
      'Instant synchronization with public website event showcase',
      'Member participation tracking',
    ],
  },
  trainers: {
    title: 'Trainer Roster & Coaching Schedules',
    stageNumber: 5,
    stageName: 'Stage 5: Enquiries, Trainers, Events & Challenges',
    description: 'Manage personal trainers, strength coaches, certifications, bio text, and public website display.',
    specifications: [
      'Trainer profile management (specialties, certifications, bios, photos)',
      'Active/inactive availability switches',
      'Direct synchronization with public website trainers section',
      'Coaching assignment to members',
    ],
  },
  enquiries: {
    title: 'Website Leads & Enquiry Pipeline',
    stageNumber: 5,
    stageName: 'Stage 5: Enquiries, Trainers, Events & Challenges',
    description: 'Lead management pipeline capturing website trial pass requests and plan inquiries.',
    specifications: [
      'Direct capture of website modal leads into Supabase enquiries table',
      'Status tracking: New, Contacted, Converted, Closed',
      'Staff follow-up notes and contact timestamp records',
      'One-click conversion from lead to active gym member',
    ],
  },
  challenges: {
    title: 'Fitness Challenges & Leaderboards',
    stageNumber: 5,
    stageName: 'Stage 5: Enquiries, Trainers, Events & Challenges',
    description: 'Organize HYROX, powerlifting, fat-loss, and metabolic conditioning challenges.',
    specifications: [
      'Challenge builder with start dates, end dates, rules, and scoring metrics',
      'Participant registration and score tracking',
      'Public leaderboard publication switch',
      'Reward and completion certificate tracking',
    ],
  },
  automation: {
    title: 'Automation Centre & Expiry Reminders',
    stageNumber: 7,
    stageName: 'Stage 7: Reminder Engine & Messaging Integrations',
    description: 'Automated membership expiry warnings and WhatsApp community announcement broadcasts.',
    specifications: [
      'Rule engine: 7 days before, 3 days before, on expiry, and post-expiry follow-up',
      'Timezone-accurate execution for Asia/Kolkata (IST)',
      'Preview mode with test message dispatch before going live',
      'WhatsApp community announcement composer with preview and manual share fallback',
    ],
  },
  import: {
    title: 'Member Data Import & Migration',
    stageNumber: 6,
    stageName: 'Stage 6: Data Import & Migration',
    description: 'CSV and Excel data migration engine to transition member records from the gym’s prior software.',
    specifications: [
      'CSV upload with dynamic column mapping and row preview',
      'Validation of phone numbers, dates, and package mappings',
      'Duplicate detection and ambiguous match flagging for human review',
      'Batch logging and rollback safety without inflating current revenue',
    ],
  },
  settings: {
    title: 'System Settings & Security Audit',
    stageNumber: 8,
    stageName: 'Stage 8: Final Security, Mobile & Production Tests',
    description: 'Gym parameters, staff permissions, Supabase connectivity audits, and RLS validation.',
    specifications: [
      'Facility profile details (address, timings, phone, social handles)',
      'Staff account invitations and role assignments',
      'Supabase connection diagnostics and latency tests',
      'Security audit and RLS enforcement reports',
    ],
  },
};

export const StagePlaceholder: React.FC<StagePlaceholderProps> = ({ section }) => {
  const config = STAGE_CONFIGS[section];

  if (!config) {
    return (
      <div className="p-8 text-neutral-400">
        Section configuration pending.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Stage Badge & Title */}
      <div className="bg-[#14171d] border border-neutral-800 p-6 sm:p-8 relative">
        <div className="border-t-2 border-[#f36b22] absolute top-0 left-0 right-0" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-300 uppercase tracking-wider mb-3">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{config.stageName}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-white">
              {config.title}
            </h2>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0f1115] border border-neutral-700/80 text-xs font-mono text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-neutral-600" />
            <span>Honest Empty State · Zero Mock Data</span>
          </div>
        </div>

        <p className="mt-6 text-sm text-neutral-300 leading-relaxed">
          {config.description}
        </p>

        {/* Feature Specifications according to Master Prompt */}
        <div className="mt-8">
          <h3 className="text-xs font-headline font-bold uppercase tracking-wider text-neutral-400 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#f36b22]" />
            <span>Approved Architectural Specifications for this Module</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {config.specifications.map((spec, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-[#0e1014] border border-neutral-800/80 text-xs text-neutral-300 flex items-start gap-3"
              >
                <CheckSquare className="w-4 h-4 text-[#f36b22] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{spec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Notice */}
        <div className="mt-8 p-4 bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            In strict compliance with Stage 2 development guidelines, this screen will be activated in <strong>{config.stageName}</strong> with real database tables and server-side validation. No fabricated mock records or synthetic charts are displayed.
          </p>
        </div>
      </div>
    </div>
  );
};
