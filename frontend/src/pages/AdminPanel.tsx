import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, Plus, RefreshCw, Eye, EyeOff, Trash2, Users, FileCode2,
  Send, Database, BarChart3, Loader2, CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { isAdmin } = useAuth();
  const [problems, setProblems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState<any>(null);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [genMsg, setGenMsg] = useState('');

  const fetchProblems = () => {
    api.getAdminProblems().then(res => {
      setProblems(res.problems);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    if (isAdmin) {
      fetchProblems();
      api.getAdminStats().then(setStats).catch(() => {});
    }
  }, [isAdmin]);

  const handleGenerateTests = async (id: string, title: string) => {
    setGenerating(id);
    setGenMsg('');
    try {
      const res = await api.generateTestCases(id);
      setGenMsg(`✅ ${title}: ${res.message}`);
      fetchProblems();
      if (selectedProblem?.id === id) loadTestCases(id);
    } catch (err: any) {
      setGenMsg(`❌ ${title}: ${err.message}`);
    } finally {
      setGenerating(null);
    }
  };

  const loadTestCases = async (id: string) => {
    const res = await api.getProblemTestCases(id);
    setTestCases(res.testCases);
  };

  const handleSelectProblem = async (p: any) => {
    setSelectedProblem(p);
    await loadTestCases(p.id);
  };

  const handleToggleVisibility = async (tcId: string) => {
    await api.toggleTestCaseVisibility(tcId);
    if (selectedProblem) loadTestCases(selectedProblem.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this problem?')) return;
    await api.deleteProblem(id);
    setSelectedProblem(null);
    fetchProblems();
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-slate-400">
        <ShieldCheck className="w-12 h-12 text-amber-400 mb-4" />
        <p className="text-lg font-medium">Switch to Admin to view this panel</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" /><span>Admin Panel</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage problems, generate test cases, view analytics</p>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: 'Users', value: stats.counts.users, color: 'text-indigo-400' },
            { icon: FileCode2, label: 'Problems', value: stats.counts.problems, color: 'text-emerald-400' },
            { icon: Send, label: 'Submissions', value: stats.counts.submissions, color: 'text-cyan-400' },
            { icon: Database, label: 'Test Cases', value: stats.counts.testCases, color: 'text-amber-400' },
          ].map(card => (
            <div key={card.label} className="bg-dark-900 border border-dark-700 rounded-xl p-4">
              <div className={`flex items-center space-x-2 ${card.color} text-xs font-medium mb-1`}>
                <card.icon className="w-4 h-4" /><span>{card.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Generation feedback message */}
      {genMsg && (
        <div className={`mb-4 p-3 rounded-lg text-sm border ${
          genMsg.startsWith('✅') ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
          'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>{genMsg}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Problem List */}
        <div className="lg:col-span-2 bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-dark-850 border-b border-dark-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">Problems ({problems.length})</h2>
          </div>
          <div className="divide-y divide-dark-800 max-h-[600px] overflow-y-auto">
            {problems.map(p => (
              <div
                key={p.id}
                onClick={() => handleSelectProblem(p)}
                className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-dark-850 transition-colors ${
                  selectedProblem?.id === p.id ? 'bg-dark-850 border-l-2 border-l-indigo-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="text-xs font-mono text-slate-500 w-6 shrink-0">#{p.problem_number}</span>
                  <span className="text-sm text-slate-200 truncate">{p.title}</span>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    p.difficulty === 'Easy' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                    p.difficulty === 'Medium' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                    'text-rose-400 border-rose-500/30 bg-rose-500/10'
                  }`}>{p.difficulty}</span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[10px] text-slate-500 font-mono">{p.test_case_count} TC</span>
                  <span className="text-[10px] text-slate-500 font-mono">{p.submission_count} subs</span>
                  <button
                    onClick={e => { e.stopPropagation(); handleGenerateTests(p.id, p.title); }}
                    disabled={generating === p.id}
                    className="p-1.5 rounded-md bg-dark-800 border border-dark-700 text-indigo-400 hover:bg-indigo-500/10 transition-all disabled:opacity-50"
                    title="Regenerate test cases"
                  >
                    {generating === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(p.id); }}
                    className="p-1.5 rounded-md bg-dark-800 border border-dark-700 text-rose-400 hover:bg-rose-500/10 transition-all"
                    title="Delete problem"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Cases Viewer */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-dark-850 border-b border-dark-700">
            <h2 className="text-sm font-semibold text-slate-300">
              {selectedProblem ? `Test Cases — ${selectedProblem.title}` : 'Select a problem'}
            </h2>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {!selectedProblem ? (
              <div className="text-center text-slate-500 text-sm py-12">Click a problem to view its test cases</div>
            ) : testCases.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-12">No test cases. Click regenerate.</div>
            ) : (
              <div className="divide-y divide-dark-800">
                {testCases.map((tc: any, i: number) => (
                  <div key={tc.id} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-slate-400">TC #{tc.order_num}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-dark-800">{tc.test_type}</span>
                      </div>
                      <button
                        onClick={() => handleToggleVisibility(tc.id)}
                        className={`flex items-center space-x-1 p-1 rounded-md text-xs ${
                          tc.is_hidden ? 'text-rose-400 hover:bg-rose-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'
                        } transition-all`}
                        title={tc.is_hidden ? 'Hidden — click to reveal' : 'Visible — click to hide'}
                      >
                        {tc.is_hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="space-y-1 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500">Input:</span>
                        <pre className="p-1.5 bg-dark-950 rounded text-cyan-300 whitespace-pre-wrap mt-0.5">{tc.input}</pre>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Expected Output:</span>
                        <pre className="p-1.5 bg-dark-950 rounded text-emerald-300 whitespace-pre-wrap mt-0.5">{tc.expected_output}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verdict & Language Distribution */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Verdict Distribution</h3>
            <div className="space-y-2">
              {stats.verdicts?.map((v: any) => (
                <div key={v.verdict} className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${
                    v.verdict === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>{v.verdict}</span>
                  <span className="text-xs text-slate-400 font-mono">{v.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Language Usage</h3>
            <div className="space-y-2">
              {stats.languages?.map((l: any) => (
                <div key={l.language} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-indigo-400 uppercase">{l.language}</span>
                  <span className="text-xs text-slate-400 font-mono">{l.count} submissions</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
