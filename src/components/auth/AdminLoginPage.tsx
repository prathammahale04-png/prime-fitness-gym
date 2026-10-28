import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Lock, Mail, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AdminLoginPageProps {
  onBackToWebsite: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onBackToWebsite, onLoginSuccess }) => {
  const { signInWithEmail, isConfigured, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await signInWithEmail(email, password);
    setIsSubmitting(false);

    if (result.success) {
      onLoginSuccess();
    }
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen bg-[#0d0f12] text-neutral-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-[#f36b22] selection:text-white">
      {/* Background Subtle Gradient & Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1f242d_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Bar Return Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-6 z-10">
        <button
          onClick={onBackToWebsite}
          className="inline-flex items-center gap-2 text-xs font-headline font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-[#f36b22]" />
          <span>Return to Public Website</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 z-10">
        {/* Brand Lockup */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-none bg-[#161920] border border-neutral-800 text-[#f36b22] mb-4 shadow-xl">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-headline font-black uppercase tracking-tight text-white">
            PRIME FITNESS <span className="text-[#f36b22]">MH19</span>
          </h2>
          <p className="mt-1 text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
            OWNER & STAFF MANAGEMENT PORTAL
          </p>
        </div>

        {/* Configuration Notice if Supabase Env Vars are Missing */}
        {!isConfigured && (
          <div className="mb-6 p-4 rounded-none bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300 font-headline uppercase tracking-wider mb-1">
                  Supabase Environment Required
                </p>
                <p className="text-neutral-300 leading-relaxed">
                  To authenticate against your live database, add your Supabase credentials in your environment variables:
                </p>
                <div className="mt-2 p-2 bg-black/40 font-mono text-[11px] text-neutral-300 border border-neutral-800 space-y-1">
                  <div>VITE_SUPABASE_URL="https://your-project.supabase.co"</div>
                  <div>VITE_SUPABASE_ANON_KEY="your-anon-key"</div>
                </div>
                <p className="mt-2 text-neutral-400">
                  You can still review the dashboard layout and structure in preview mode.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Card Container */}
        <div className="bg-[#14171d] border border-neutral-800/90 py-8 px-6 sm:px-10 shadow-2xl relative">
          <div className="border-t-2 border-[#f36b22] absolute top-0 left-0 right-0" />

          {activeError && (
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <div>{activeError}</div>
                {activeError.includes('pending owner approval') && (
                  <p className="mt-1.5 text-[11px] text-neutral-400 leading-normal">
                    Authentication credentials are valid, but no matching active profile exists for this account in the database. The gym owner must provision or approve your account profile in Supabase.
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-2">
                Staff Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@primefitness.com"
                  autoComplete="email"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#0f1115] border border-neutral-700 text-white text-xs sm:text-sm placeholder-neutral-500 focus:outline-none focus:border-[#f36b22] focus:ring-1 focus:ring-[#f36b22] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-headline font-bold uppercase tracking-wider text-neutral-300 mb-2">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="block w-full pl-10 pr-10 py-2.5 bg-[#0f1115] border border-neutral-700 text-white text-xs sm:text-sm placeholder-neutral-500 focus:outline-none focus:border-[#f36b22] focus:ring-1 focus:ring-[#f36b22] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent font-headline font-bold uppercase tracking-wider text-xs text-white bg-[#f36b22] hover:bg-[#d95614] focus:outline-none focus:ring-2 focus:ring-[#f36b22] disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-[#f36b22]/20 rounded-lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <span>Sign In with Supabase Credentials</span>
                )}
              </button>
            </div>
          </form>

          {/* Security & Access Policy Notice */}
          <div className="mt-6 pt-5 border-t border-neutral-800 text-[11px] text-neutral-500 space-y-2">
            <div className="flex items-center gap-2 text-neutral-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Role-Based Access Control (Owner / Staff / Trainer)</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Row-Level Security & Session Verification</span>
            </div>
            <p className="pt-1 text-[10px] text-neutral-500 leading-normal">
              Public registration is disabled. Administrator accounts must be provisioned directly by the gym owner in the database.
            </p>
          </div>
        </div>

        {/* Security Footer */}
        <p className="mt-6 text-center text-[10px] uppercase tracking-wider text-neutral-600 font-mono">
          Prime Fitness MH19 · Jalgaon · Secure Console
        </p>
      </div>
    </div>
  );
};
