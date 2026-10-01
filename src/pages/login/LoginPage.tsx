import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getSupabaseConfig, saveSupabaseConfig, testSupabaseConnection } from '../../lib/supabase';
import { Shield, Lock, Mail, AlertCircle, KeyRound, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick backend connection configuration if not configured or needed
  const [showConfig, setShowConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [configMessage, setConfigMessage] = useState<string | null>(null);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const config = getSupabaseConfig();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!email || !password) {
      setError('Please provide both operator email and password.');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await signIn(email, password);

      if (!result.success || !result.role) {
        setError(result.error || 'Authentication rejected. Verify credentials or operator status.');
        setIsSubmitting(false);
        return;
      }

      // Role-based routing strictly according to contract:
      // L1 -> /l1/dashboard
      // L2 -> /l2/dashboard
      // admin -> /admin
      if (result.role === 'L1') {
        navigate('/l1/dashboard');
      } else if (result.role === 'L2') {
        navigate('/l2/dashboard');
      } else if (result.role === 'admin') {
        navigate('/admin');
      } else {
        setError('Unknown role assignment. Contact SOC administration.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveConnection = async (e: FormEvent) => {
    e.preventDefault();
    if (!customUrl || !customKey) {
      setConfigMessage('Both Supabase URL and Anon Key are required.');
      return;
    }

    saveSupabaseConfig(customUrl, customKey);
    const testResult = await testSupabaseConnection(customUrl, customKey);
    if (testResult.success) {
      setConfigMessage(`Connection successful (${testResult.latencyMs}ms). You can now sign in.`);
    } else {
      setConfigMessage(`Saved, but ping returned: ${testResult.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      {/* Background SOC decorative grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-4 shadow-lg shadow-blue-500/10">
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 font-sans">
            SOC Incident Platform
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-widest">
            Security Operations Center &bull; Access Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              Operator Sign In
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your provisioned SOC analyst credentials.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
                Operator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@soc.domain.local"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Backend Connection Helper Toggle */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5 font-mono">
                <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                Backend Connection Setup
              </span>
              {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showConfig && (
              <form onSubmit={handleSaveConnection} className="mt-4 space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">
                  Configure your Supabase Project URL and Public Anon Key.
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder={config.url || 'https://xyzcompany.supabase.co'}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 font-mono focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    Supabase Anon Key
                  </label>
                  <input
                    type="password"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="eyJh... (Anon Public Key only)"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 font-mono focus:border-blue-500 outline-none"
                  />
                </div>

                {configMessage && (
                  <p className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    {configMessage}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded border border-slate-700 transition-colors cursor-pointer"
                >
                  Save & Verify Connection
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-slate-500 mt-6 font-mono">
          Authorized Security Personnel Only &bull; All Sessions Monitored
        </p>
      </div>
    </div>
  );
}
