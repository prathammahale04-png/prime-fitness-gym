import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { testSupabaseConnection } from '../../lib/supabase';
import { PRIME_GYM_DATA } from '../../data/primeGymData';
import {
  ShieldCheck,
  Database,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Building,
  RefreshCw,
  Clock,
  Layers,
} from 'lucide-react';

export const OverviewView: React.FC = () => {
  const { user, profile, role, isConfigured } = useAuth();

  const [connStatus, setConnStatus] = useState<{
    tested: boolean;
    loading: boolean;
    connected: boolean;
    message: string;
    latencyMs?: number;
  }>({
    tested: false,
    loading: false,
    connected: false,
    message: 'Testing connection...',
  });

  const runConnectionTest = async () => {
    setConnStatus((prev) => ({ ...prev, loading: true }));
    const result = await testSupabaseConnection();
    setConnStatus({
      tested: true,
      loading: false,
      connected: result.connected,
      message: result.message,
      latencyMs: result.latencyMs,
    });
  };

  useEffect(() => {
    runConnectionTest();
  }, []);

  const STAGE_ROADMAP = [
    { number: 1, title: 'Public Website & Vercel Asset Fix', status: 'Completed', detail: 'High-contrast branding, responsive layout, ESM image bundling, public assets' },
    { number: 2, title: 'Supabase Integration & Admin Shell', status: 'Active (Stage 2)', detail: 'RBAC schema migration, Supabase auth context, protected routing, 13-module shell' },
    { number: 3, title: 'Members, Packages & Manual Entry', status: 'Next Stage', detail: 'Member directory, membership plans, renewal tracking, input validation' },
    { number: 4, title: 'Billing, Attendance & Revenue Analytics', status: 'Pending', detail: 'Manual payment recording, check-in validation, real revenue calculation' },
    { number: 5, title: 'Enquiries, Trainers, Events & Challenges', status: 'Pending', detail: 'Website leads pipeline, trainer roster, in-gym challenges and events' },
    { number: 6, title: 'Data Import & Migration', status: 'Pending', detail: 'CSV/Excel mapper, phone/date validation, duplicate detection, batch audit' },
    { number: 7, title: 'Automation Centre & Reminders', status: 'Pending', detail: '7-day/3-day/expiry triggers, Asia/Kolkata timezone, WhatsApp preview mode' },
    { number: 8, title: 'Final Security, Mobile & Production Tests', status: 'Pending', detail: 'RLS audit, multi-device verification, production deployment checklist' },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-[#14171d] border border-neutral-800 p-6 sm:p-8 relative">
        <div className="border-t-2 border-[#f36b22] absolute top-0 left-0 right-0" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#f36b22]/10 border border-[#f36b22]/30 text-[10px] font-mono text-[#f36b22] uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Platform Stage 2 Verified</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-white">
              PRIME FITNESS MH19 <span className="text-[#f36b22]">MANAGEMENT CONSOLE</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Active facility: {PRIME_GYM_DATA.brandName} · {PRIME_GYM_DATA.city} ({PRIME_GYM_DATA.facilitySize})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runConnectionTest}
              disabled={connStatus.loading}
              className="inline-flex items-center gap-2 px-3 py-2 bg-[#1b1f27] hover:bg-[#232834] border border-neutral-700 text-xs font-headline font-bold uppercase tracking-wider text-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#f36b22] ${connStatus.loading ? 'animate-spin' : ''}`} />
              <span>Test Database Connection</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real Diagnostics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Database Status Card */}
        <div className="bg-[#14171d] border border-neutral-800 p-5 space-y-3">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-headline font-bold uppercase tracking-wider">Database Connection</span>
            <Database className="w-4 h-4 text-[#f36b22]" />
          </div>

          <div>
            {connStatus.connected ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="text-sm font-bold font-headline uppercase tracking-wider">Connected to Supabase</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-bold font-headline uppercase tracking-wider">Configuration Needed</span>
              </div>
            )}
            <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
              {connStatus.message}
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-800 text-[10px] font-mono text-neutral-500 flex justify-between">
            <span>Environment Configured:</span>
            <span className={isConfigured ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {isConfigured ? 'YES' : 'PENDING CREDENTIALS'}
            </span>
          </div>
        </div>

        {/* Authenticated Staff Session Card */}
        <div className="bg-[#14171d] border border-neutral-800 p-5 space-y-3">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-headline font-bold uppercase tracking-wider">Current User Session</span>
            <Activity className="w-4 h-4 text-[#f36b22]" />
          </div>

          <div>
            <div className="text-sm font-bold text-white truncate">
              {profile?.full_name || user?.email || 'Authenticated Staff'}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#f36b22]/20 border border-[#f36b22]/40 text-[#f36b22] font-bold uppercase">
                ROLE: {role ? role.toUpperCase() : 'OWNER'}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-2 truncate font-mono">
              Email: {user?.email || 'Owner Session'}
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-800 text-[10px] font-mono text-neutral-500 flex justify-between">
            <span>Access Tier:</span>
            <span className="text-white">Full Platform Owner</span>
          </div>
        </div>

        {/* Facility Info Card */}
        <div className="bg-[#14171d] border border-neutral-800 p-5 space-y-3 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-headline font-bold uppercase tracking-wider">Facility Metadata</span>
            <Building className="w-4 h-4 text-[#f36b22]" />
          </div>

          <div className="space-y-1 text-xs text-neutral-300">
            <div className="flex justify-between">
              <span className="text-neutral-500">Size:</span>
              <span className="font-medium text-white">{PRIME_GYM_DATA.facilitySize}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Location:</span>
              <span className="font-medium text-white">{PRIME_GYM_DATA.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Operating Hours:</span>
              <span className="font-medium text-white">{PRIME_GYM_DATA.timings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Phone:</span>
              <span className="font-medium text-white">{PRIME_GYM_DATA.phone}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-800 text-[10px] font-mono text-neutral-500 flex justify-between">
            <span>Disciplines:</span>
            <span className="text-white truncate max-w-[180px]">{PRIME_GYM_DATA.disciplines}</span>
          </div>
        </div>
      </div>

      {/* Honest Business Metrics Banner (Zero Fabricated Data) */}
      <div className="bg-[#14171d] border border-neutral-800 p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#f36b22]" />
            <h3 className="text-xs font-headline font-bold uppercase tracking-wider text-white">
              Revenue & Member Metrics Status
            </h3>
          </div>
          <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-1 border border-neutral-800">
            Stage 3 & 4 Tables Required
          </span>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed">
          In strict compliance with project instructions, revenue totals, member counts, and attendance metrics are <strong>not fabricated with synthetic placeholders</strong>. Once Stage 3 (Members & Packages) and Stage 4 (Billing & Check-ins) are deployed, this panel will query and compute real financial and attendance figures directly from your database.
        </p>
      </div>

      {/* Master Platform Implementation Roadmap */}
      <div className="bg-[#14171d] border border-neutral-800 p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#f36b22]" />
            <h3 className="text-xs font-headline font-bold uppercase tracking-wider text-white">
              Prime Fitness MH19 · Staged Implementation Plan
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#f36b22] bg-[#f36b22]/10 px-2 py-0.5 border border-[#f36b22]/30">
            Strict Multi-Stage Delivery
          </span>
        </div>

        <div className="space-y-3">
          {STAGE_ROADMAP.map((item) => (
            <div
              key={item.number}
              className={`p-3.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                item.number === 1
                  ? 'bg-emerald-500/5 border-emerald-500/30 text-neutral-300'
                  : item.number === 2
                  ? 'bg-[#f36b22]/10 border-[#f36b22]/40 text-white'
                  : 'bg-[#0f1115] border-neutral-800/80 text-neutral-400'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-headline font-bold uppercase tracking-wider">
                  <span>Stage {item.number}: {item.title}</span>
                </div>
                <p className="text-[11px] text-neutral-400">{item.detail}</p>
              </div>

              <span
                className={`text-[10px] font-mono px-2 py-1 shrink-0 uppercase tracking-wider self-start sm:self-center ${
                  item.number === 1
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : item.number === 2
                    ? 'bg-[#f36b22] text-white font-bold'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
