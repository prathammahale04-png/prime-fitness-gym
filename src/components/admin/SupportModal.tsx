import React from 'react';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Clock,
  HelpCircle,
  MessageCircle,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#14161d] border border-neutral-800 rounded-2xl w-full max-w-xl relative shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Accent Bar */}
        <div className="h-1 bg-gradient-to-r from-[#f36b22] via-amber-500 to-[#f36b22] w-full" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f36b22]/15 border border-[#f36b22]/30 flex items-center justify-center text-[#f36b22] shrink-0">
              <Flame className="w-5 h-5 fill-[#f36b22]" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-base sm:text-lg text-white uppercase tracking-tight">
                Prime Fitness MH19 · Help & Support Desk
              </h3>
              <p className="text-xs text-neutral-400">
                Facility information, operations desk contacts, and administrative guide
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-neutral-300">
          {/* Direct Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="tel:+919422219019"
              className="p-3.5 bg-[#0e1014] border border-neutral-800 hover:border-[#f36b22]/60 rounded-xl transition-colors group flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">Direct Desk Calling</span>
                <span className="font-bold text-white text-xs block group-hover:text-[#f36b22] transition-colors">
                  +91 94222 19019
                </span>
                <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">Tap to call</span>
              </div>
            </a>

            <a
              href="https://wa.me/919422219019"
              target="_blank"
              rel="noreferrer"
              className="p-3.5 bg-[#0e1014] border border-neutral-800 hover:border-[#25d366]/60 rounded-xl transition-colors group flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-[#25d366]/10 text-[#25d366] border border-[#25d366]/20 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">Official WhatsApp</span>
                <span className="font-bold text-white text-xs block group-hover:text-[#25d366] transition-colors">
                  +91 94222 19019
                </span>
                <span className="text-[10px] text-[#25d366] font-mono mt-0.5 block">Chat with desk</span>
              </div>
            </a>

            <a
              href="mailto:primefitnessjalgaon@gmail.com"
              className="p-3.5 bg-[#0e1014] border border-neutral-800 hover:border-[#f36b22]/60 rounded-xl transition-colors group flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">Management Email</span>
                <span className="font-bold text-white text-xs block truncate group-hover:text-blue-400 transition-colors">
                  primefitnessjalgaon@gmail.com
                </span>
                <span className="text-[10px] text-blue-400 font-mono mt-0.5 block">Send email</span>
              </div>
            </a>

            <div className="p-3.5 bg-[#0e1014] border border-neutral-800 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">Facility Schedule</span>
                <span className="font-bold text-white text-xs block">
                  5:00 AM – 10:00 AM
                </span>
                <span className="text-[10px] text-neutral-400 font-mono block">4:30 PM – 10:00 PM (Daily)</span>
              </div>
            </div>
          </div>

          {/* Physical Address */}
          <div className="p-4 bg-[#0e1014] border border-neutral-800 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-neutral-400 font-headline font-bold text-xs uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-[#f36b22]" />
              <span>Facility Location & Arena</span>
            </div>
            <p className="text-white text-xs leading-relaxed">
              Saawariya godown Front of Makra tower, near Vikas dudh federation, Shivaji Nagar, Jalgaon, Maharashtra 425001
            </p>
            <p className="text-[11px] text-neutral-500 font-mono">
              Prime Fitness Commercial Facility · 4000+ Sq.Ft. Area
            </p>
          </div>

          {/* Operations FAQ */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#f36b22]" />
              <span>Owner Operations Guide</span>
            </span>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#0e1014] border border-neutral-800/80 rounded-lg">
                <strong className="text-white block mb-1">1. Member Registration & Code Sequencing</strong>
                <p className="text-neutral-400 leading-relaxed text-[11px]">
                  New members receive sequential codes (e.g. PF-1001, PF-1002). Adding a member with fee collection automatically logs an initial payment record in the Billing Ledger.
                </p>
              </div>

              <div className="p-3 bg-[#0e1014] border border-neutral-800/80 rounded-lg">
                <strong className="text-white block mb-1">2. Expiry Reminders & WhatsApp Dispatch</strong>
                <p className="text-neutral-400 leading-relaxed text-[11px]">
                  The Retention Hub tracks memberships expiring today or in the next 7 days using India Standard Time (IST). Clicking &ldquo;WhatsApp&rdquo; opens pre-filled official <code className="bg-neutral-800 px-1 py-0.5 rounded text-neutral-200">wa.me</code> links for free manual sending.
                </p>
              </div>

              <div className="p-3 bg-[#0e1014] border border-neutral-800/80 rounded-lg">
                <strong className="text-white block mb-1">3. Security Hardening & Privacy Shield</strong>
                <p className="text-neutral-400 leading-relaxed text-[11px]">
                  Public visitors only have access to read-only views (<code className="bg-neutral-800 px-1 py-0.5 rounded text-neutral-200">public_gym_settings</code>, <code className="bg-neutral-800 px-1 py-0.5 rounded text-neutral-200">public_trainers</code>) and insert-only on leads. Direct table mutations require authenticated owner or staff roles.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-[#0e1014] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Support Desk Active</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
