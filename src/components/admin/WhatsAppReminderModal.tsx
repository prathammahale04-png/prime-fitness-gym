import React, { useState, useEffect } from 'react';
import { ReminderMemberItem, buildWhatsAppLink, normalizeIndianPhoneNumber, generateReminderMessage } from '../../utils/reminderUtils';
import {
  X,
  Send,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface WhatsAppReminderModalProps {
  item: ReminderMemberItem;
  onClose: () => void;
  onPhoneUpdated?: (memberId: string, newPhone: string) => void;
}

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  item,
  onClose,
  onPhoneUpdated,
}) => {
  const [customPhone, setCustomPhone] = useState(item.member.phone || '');
  const [messageText, setMessageText] = useState(item.defaultMessage);
  const [copied, setCopied] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  // Compute live validation for edited phone
  const phoneValidation = normalizeIndianPhoneNumber(customPhone);

  useEffect(() => {
    setMessageText(item.defaultMessage);
    setCustomPhone(item.member.phone || '');
    setHasOpened(false);
  }, [item]);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleOpenWhatsApp = () => {
    if (!phoneValidation.isValid) return;

    // Notify parent if phone was edited
    if (onPhoneUpdated && customPhone.trim() !== (item.member.phone || '').trim()) {
      onPhoneUpdated(item.member.id, customPhone.trim());
    }

    const url = buildWhatsAppLink(phoneValidation.normalizedNumber, messageText);
    window.open(url, '_blank', 'noopener,noreferrer');
    setHasOpened(true);
  };

  // Quick preset templates
  const applyTemplate = (type: 'standard' | 'friendly' | 'urgent' | 'offer') => {
    const name = item.member.full_name?.trim() || 'Valued Athlete';
    const pkg = item.member.package_name?.trim() || 'Prime Fitness';
    const date = item.member.expiry_date;

    switch (type) {
      case 'standard':
        setMessageText(generateReminderMessage(item.member, item.category));
        break;
      case 'friendly':
        setMessageText(
          `Hey ${name}! Hope your training is going strong at Prime Fitness MH19. Just a gentle heads-up that your ${pkg} membership ${
            item.category === 'today'
              ? 'expires today'
              : item.category === 'soon'
              ? `expires on ${date}`
              : 'has expired'
          }. Let us know when you would like to renew so we can keep your locker and access active. Thank you!`
        );
        break;
      case 'urgent':
        setMessageText(
          `Hi ${name}, this is an urgent reminder from Prime Fitness MH19. Your ${pkg} membership ${
            item.category === 'today'
              ? 'expires TODAY'
              : item.category === 'soon'
              ? `expires on ${date} (within ${item.daysDiff} days)`
              : `expired on ${date}`
          }. Please visit the front desk counter or reply to renew and avoid check-in interruptions.`
        );
        break;
      case 'offer':
        setMessageText(
          `Hi ${name}, Prime Fitness MH19 here! Your ${pkg} membership ${
            item.category === 'today'
              ? 'expires today'
              : item.category === 'soon'
              ? `expires on ${date}`
              : 'has expired'
          }. Renew this week to lock in uninterrupted workout access and ongoing trainer guidance. Let us know how we can help!`
        );
        break;
    }
  };

  const categoryBadgeClass =
    item.category === 'today'
      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
      : item.category === 'soon'
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      : 'bg-neutral-800 text-neutral-300 border-neutral-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#14161d] border border-neutral-800 rounded-2xl w-full max-w-xl relative shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Accent Top Border */}
        <div className="h-1 bg-gradient-to-r from-[#25d366] via-[#f36b22] to-[#25d366] w-full" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#25d366]/15 border border-[#25d366]/30 flex items-center justify-center text-[#25d366] shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-base sm:text-lg text-white uppercase tracking-tight">
                Send WhatsApp Expiry Reminder
              </h3>
              <p className="text-xs text-neutral-400">
                Official free manual WhatsApp chat launcher for Prime Fitness MH19
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-neutral-300">
          {/* Member Summary Card */}
          <div className="bg-[#0e1014] border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800/80">
              <div>
                <span className="font-headline font-black text-sm sm:text-base text-white tracking-wide block">
                  {item.member.full_name}
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  ID: <strong className="text-neutral-200">{item.member.member_code}</strong> · Package:{' '}
                  <span className="text-[#f36b22] font-semibold">{item.member.package_name || 'Standard'}</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-md border ${categoryBadgeClass}`}
                >
                  {item.daysLabel}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-neutral-500 block">Membership Expiry:</span>
                <span className="font-mono text-neutral-200 font-bold">{item.member.expiry_date}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Balance Due:</span>
                <span className="font-mono font-bold text-neutral-200">
                  ₹{Number(item.member.balance_due || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Phone Number Field & Validation Feedback */}
            <div className="pt-2 border-t border-neutral-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-neutral-400 font-medium flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Member Mobile Number:</span>
                </label>
                {phoneValidation.isValid ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Verified: {phoneValidation.displayFormatted}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>Invalid Mobile Number</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={customPhone}
                    onChange={e => setCustomPhone(e.target.value)}
                    placeholder="Enter 10-digit Indian mobile number (e.g. 9822012345)"
                    className={`w-full bg-[#181a24] border px-3 py-2 rounded-lg text-xs font-mono text-white focus:outline-hidden transition-colors ${
                      phoneValidation.isValid
                        ? 'border-neutral-700 focus:border-emerald-500'
                        : 'border-rose-500/80 focus:border-rose-400 bg-rose-950/10'
                    }`}
                  />
                </div>
              </div>

              {!phoneValidation.isValid && (
                <p className="text-[11px] text-rose-400 leading-tight">
                  ⚠️ {phoneValidation.errorReason} Please enter a valid 10-digit Indian mobile number to enable WhatsApp chat.
                </p>
              )}
            </div>
          </div>

          {/* Quick Message Templates */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#f36b22]" />
                <span>Message Templates:</span>
              </span>
              <button
                type="button"
                onClick={() => applyTemplate('standard')}
                className="text-[10px] text-neutral-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Default</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyTemplate('standard')}
                className="px-2.5 py-1 bg-[#1a1d28] hover:bg-[#252837] text-neutral-300 hover:text-white rounded-lg border border-neutral-700 text-[11px] font-medium transition-colors cursor-pointer"
              >
                Standard Reminder
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('urgent')}
                className="px-2.5 py-1 bg-[#1a1d28] hover:bg-[#252837] text-neutral-300 hover:text-white rounded-lg border border-neutral-700 text-[11px] font-medium transition-colors cursor-pointer"
              >
                Urgent Notice
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('friendly')}
                className="px-2.5 py-1 bg-[#1a1d28] hover:bg-[#252837] text-neutral-300 hover:text-white rounded-lg border border-neutral-700 text-[11px] font-medium transition-colors cursor-pointer"
              >
                Friendly Follow-up
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('offer')}
                className="px-2.5 py-1 bg-[#1a1d28] hover:bg-[#252837] text-neutral-300 hover:text-white rounded-lg border border-neutral-700 text-[11px] font-medium transition-colors cursor-pointer"
              >
                Renewal Promo
              </button>
            </div>
          </div>

          {/* Editable WhatsApp Message Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-neutral-300 font-medium">
                Editable Message Content (Pre-fills WhatsApp chat):
              </label>
              <span className="text-[10px] font-mono text-neutral-500">
                {messageText.length} characters
              </span>
            </div>

            <textarea
              rows={4}
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Type your WhatsApp reminder message here..."
              className="w-full bg-[#0e1014] border border-neutral-700 focus:border-[#25d366] rounded-xl p-3 text-xs text-white focus:outline-hidden leading-relaxed resize-y font-sans transition-colors"
            />
          </div>

          {/* Safe Manual Dispatch Notice */}
          <div className="p-3 bg-[#11131a] border border-neutral-800 rounded-xl space-y-1">
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              💡 <strong className="text-neutral-200">Free Manual WhatsApp:</strong> Clicking{' '}
              <span className="text-[#25d366] font-semibold">“Open WhatsApp Chat”</span> opens the official{' '}
              <code className="text-[10px] bg-neutral-900 px-1 py-0.5 rounded text-neutral-300 font-mono">wa.me</code>{' '}
              link in a new tab with this exact message pre-filled. You can review the chat and manually click Send in WhatsApp. No automated messages are dispatched.
            </p>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-5 sm:p-6 pt-4 border-t border-neutral-800 bg-[#0e1014] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#181a24] hover:bg-[#222634] text-neutral-300 hover:text-white rounded-lg text-xs font-semibold border border-neutral-700 transition-colors cursor-pointer w-full sm:w-auto"
              title="Copy message text to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              disabled={!phoneValidation.isValid || !messageText.trim()}
              onClick={handleOpenWhatsApp}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#25d366] hover:bg-[#20bd5a] disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-neutral-950 font-headline font-black text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-lg shadow-[#25d366]/20"
            >
              <Send className="w-4 h-4 fill-neutral-950" />
              <span>{hasOpened ? 'Reopen WhatsApp Chat' : 'Open WhatsApp Chat'}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
