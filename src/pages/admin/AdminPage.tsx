import { useState, useEffect, useCallback, FormEvent } from 'react';
import {
  getAdminUsers,
  toggleUserActive,
  provisionUser,
  getAIConfig,
  updateAIConfig,
  getAgentSkills,
  createAgentSkill,
  activateAgentSkill,
  deactivateAgentSkill,
} from '../../lib/admin';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
} from '../../lib/supabase';
import { User, UserRole, AIConfig, AgentSkill } from '../../types';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import {
  Users,
  Cpu,
  BrainCircuit,
  Database,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  UserPlus,
  KeyRound,
  Sparkles,
} from 'lucide-react';

type AdminTab = 'users' | 'ai_config' | 'agent_skills' | 'backend';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // --- Users Tab State ---
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('L1');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [provisionMessage, setProvisionMessage] = useState<string | null>(null);

  // --- AI Config Tab State ---
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [aiProvider, setAiProvider] = useState('Anthropic / Claude');
  const [aiModel, setAiModel] = useState('claude-3-5-sonnet');
  const [aiApiKey, setAiApiKey] = useState('');
  const [showAiKey, setShowAiKey] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // --- Agent Skills Tab State ---
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [showNewSkillModal, setShowNewSkillModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillPrompt, setNewSkillPrompt] = useState('');

  // --- Backend Connection Tab State ---
  const currentConfig = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(currentConfig.anonKey);
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // Load Users
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setUserError(null);
    try {
      const res = await getAdminUsers();
      if (res.error) setUserError(res.error);
      else setUsers(res.data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load users';
      setUserError(message);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Load AI Config
  const loadAI = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await getAIConfig();
      if (res.error) {
        setAiError(res.error);
      } else if (res.data) {
        setAiConfig(res.data);
        setAiProvider(res.data.provider);
        setAiModel(res.data.model);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load AI config';
      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  }, []);

  // Load Skills
  const loadSkills = useCallback(async () => {
    setSkillsLoading(true);
    setSkillsError(null);
    try {
      const res = await getAgentSkills();
      if (res.error) setSkillsError(res.error);
      else setSkills(res.data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load agent skills';
      setSkillsError(message);
    } finally {
      setSkillsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'ai_config') loadAI();
    if (activeTab === 'agent_skills') loadSkills();
  }, [activeTab, loadUsers, loadAI, loadSkills]);

  // Handle User Toggle
  const handleToggleUser = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserActive(userId, !currentStatus);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Provision User
  const handleProvisionUser = async (e: FormEvent) => {
    e.preventDefault();
    setProvisionMessage(null);
    const res = await provisionUser({
      email: newUserEmail,
      name: newUserName,
      role: newUserRole,
      password: newUserPassword,
    });

    if (res.error) {
      setProvisionMessage(`Provisioning error: ${res.error}`);
    } else {
      setProvisionMessage('Operator created and provisioned successfully.');
      setShowCreateUserModal(false);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      loadUsers();
    }
  };

  // Handle Update AI Config
  const handleSaveAIConfig = async (e: FormEvent) => {
    e.preventDefault();
    setAiMessage(null);
    setAiError(null);
    try {
      const res = await updateAIConfig({
        id: aiConfig?.id,
        provider: aiProvider,
        model: aiModel,
        api_key: aiApiKey || undefined,
      });

      if (res.error) {
        setAiError(res.error);
      } else {
        setAiMessage('AI Provider configuration updated successfully.');
        setAiApiKey('');
        loadAI();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save AI config';
      setAiError(message);
    }
  };

  // Handle Create Skill
  const handleCreateSkill = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createAgentSkill({
        name: newSkillName,
        description: newSkillDesc,
        prompt_template: newSkillPrompt,
      });
      setShowNewSkillModal(false);
      setNewSkillName('');
      setNewSkillDesc('');
      setNewSkillPrompt('');
      loadSkills();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Activate Skill
  const handleActivateSkill = async (skillId: string) => {
    await activateAgentSkill(skillId);
    loadSkills();
  };

  const handleDeactivateSkill = async (skillId: string) => {
    await deactivateAgentSkill(skillId);
    loadSkills();
  };

  // Handle Backend Connection Test & Save
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionTestResult(null);
    const result = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
    setConnectionTestResult(result);
    setTestingConnection(false);
  };

  const handleSaveConnection = () => {
    saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
    handleTestConnection();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-rose-400">
          <span>Tier 3 Administration</span>
          <span>&bull;</span>
          <span>Governance &amp; Infrastructure</span>
        </div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-1">
          SOC Platform Administration
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage operator accounts, AI model backends, IR Copilot playbooks, and Supabase connection parameters.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 space-x-1 sm:space-x-2">
        {[
          { id: 'users', label: 'Users', icon: Users },
          { id: 'ai_config', label: 'AI Config', icon: Cpu },
          { id: 'agent_skills', label: 'Agent Skills', icon: BrainCircuit },
          { id: 'backend', label: 'Backend Connection', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 tracking-wide transition-all cursor-pointer ${
                isActive
                  ? 'border-rose-500 text-rose-400 bg-rose-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
              Provisioned SOC Operators
            </h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={loadUsers}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowCreateUserModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Provision Operator</span>
              </button>
            </div>
          </div>

          {provisionMessage && (
            <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-lg text-xs font-mono text-blue-300">
              {provisionMessage}
            </div>
          )}

          {loadingUsers ? (
            <LoadingState message="Loading Users..." subMessage="Querying users table" />
          ) : userError ? (
            <ErrorState message={userError} onRetry={loadUsers} />
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                      <th className="py-3 px-4">Operator Email</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-bold text-slate-100">{u.email}</td>
                        <td className="py-3 px-4 text-slate-300 font-sans">{u.name || '-'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              u.role === 'admin'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : u.role === 'L2'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : 'bg-blue-950 text-blue-300 border border-blue-800'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {u.is_active ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                              Active
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleUser(u.id, u.is_active)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700 cursor-pointer"
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Provision Modal */}
          {showCreateUserModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-100 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-blue-400" />
                    <span>Provision SOC Operator</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateUserModal(false)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={handleProvisionUser} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-300 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="analyst@soc.domain.local"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Tier Assignment *</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-200 outline-none"
                    >
                      <option value="L1">L1 - Alert Ingest &amp; Triage</option>
                      <option value="L2">L2 - Incident Response &amp; Forensics</option>
                      <option value="admin">admin - Platform Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Initial Password *</label>
                    <input
                      type="password"
                      required
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-200 outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateUserModal(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded cursor-pointer"
                    >
                      Provision
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI CONFIG */}
      {activeTab === 'ai_config' && (
        <div className="max-w-2xl space-y-6">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
              AI Provider &amp; Model Configuration
            </h2>
          </div>

          {aiMessage && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs font-mono text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{aiMessage}</span>
            </div>
          )}

          {aiError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs font-mono text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{aiError}</span>
            </div>
          )}

          <form onSubmit={handleSaveAIConfig} className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-300 mb-1.5 uppercase tracking-wider">
                LLM Provider
              </label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-200 outline-none"
              >
                <option value="Anthropic / Claude">Anthropic / Claude</option>
                <option value="Google Gemini">Google Gemini</option>
                <option value="OpenAI">OpenAI</option>
                <option value="Local Ollama / vLLM">Local Ollama / vLLM</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1.5 uppercase tracking-wider">
                Model Name
              </label>
              <input
                type="text"
                required
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                placeholder="claude-3-5-sonnet-20241022"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-200 outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-300 uppercase tracking-wider">
                  Provider API Key
                </label>
                {aiConfig?.api_key_masked && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    Current: {aiConfig.api_key_masked}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showAiKey ? 'text' : 'password'}
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder={aiConfig?.api_key_masked ? 'Enter new key to rotate...' : 'sk-ant-api03-...'}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-200 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowAiKey(!showAiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showAiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                API keys are masked in the UI and transmitted securely to Supabase.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={aiLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded transition-colors cursor-pointer"
              >
                Save AI Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: AGENT SKILLS */}
      {activeTab === 'agent_skills' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
                AI Copilot Agent Skills
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage prompt engineering templates. Exactly one skill may be active at a time.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewSkillModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Skill</span>
            </button>
          </div>

          {skillsLoading ? (
            <LoadingState message="Loading Agent Skills..." subMessage="Querying agent_skills" />
          ) : skillsError ? (
            <ErrorState message={skillsError} onRetry={loadSkills} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className={`rounded-xl border p-5 flex flex-col justify-between space-y-3 ${
                    skill.is_active
                      ? 'border-emerald-500/60 bg-emerald-950/20 shadow-sm shadow-emerald-500/10'
                      : 'border-slate-800 bg-slate-900/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-sm font-bold text-slate-100">{skill.name}</h3>
                      {skill.is_active ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          ACTIVE TEMPLATE
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">INACTIVE</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{skill.description}</p>
                    {skill.prompt_template && (
                      <pre className="mt-3 p-2 bg-slate-950 rounded border border-slate-800 text-[10px] font-mono text-slate-400 max-h-24 overflow-y-auto">
                        {skill.prompt_template}
                      </pre>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    {skill.is_active ? (
                      <button
                        type="button"
                        onClick={() => handleDeactivateSkill(skill.id)}
                        className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs font-mono cursor-pointer"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleActivateSkill(skill.id)}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-semibold cursor-pointer"
                      >
                        Activate Skill
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Skill Modal */}
          {showNewSkillModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-100 flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-purple-400" />
                    <span>Create Agent Skill Template</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowNewSkillModal(false)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={handleCreateSkill} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-300 mb-1">Skill Name *</label>
                    <input
                      type="text"
                      required
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="e.g. Advanced Windows Threat Hunter"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Description *</label>
                    <input
                      type="text"
                      required
                      value={newSkillDesc}
                      onChange={(e) => setNewSkillDesc(e.target.value)}
                      placeholder="Specialized forensic playbook generator for Windows Event IDs &amp; Sysmon"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Prompt Template</label>
                    <textarea
                      rows={4}
                      value={newSkillPrompt}
                      onChange={(e) => setNewSkillPrompt(e.target.value)}
                      placeholder="You are an expert SOC Tier 2 Forensic Responder. Analyze the case log snippet and write actionable queries..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-200 outline-none font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewSkillModal(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded cursor-pointer"
                    >
                      Save Skill
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BACKEND CONNECTION */}
      {activeTab === 'backend' && (
        <div className="max-w-2xl space-y-6">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
              Supabase Backend Connection
            </h2>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-300 mb-1.5 uppercase tracking-wider">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzproject.supabase.co"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1.5 uppercase tracking-wider">
                Supabase Anon Key (Browser Public Key)
              </label>
              <div className="relative">
                <input
                  type={showAnonKey ? 'text' : 'password'}
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJh..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-200 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowAnonKey(!showAnonKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showAnonKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Notice: Never enter service-role secrets in client browser code. Anon key only.
              </p>
            </div>

            {connectionTestResult && (
              <div
                className={`p-3 rounded-lg border flex items-center gap-2 text-xs ${
                  connectionTestResult.success
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800 text-rose-300'
                }`}
              >
                {connectionTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{connectionTestResult.message}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveConnection}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded cursor-pointer"
              >
                Update Connection
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded cursor-pointer flex items-center gap-1.5"
              >
                {testingConnection && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Test Connection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
