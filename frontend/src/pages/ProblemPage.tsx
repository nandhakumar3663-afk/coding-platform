import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { api } from '../api/client';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  Play, Send, RotateCcw, ChevronDown, Clock, HardDrive, CheckCircle2,
  XCircle, AlertTriangle, Loader2, FileCode2, BookOpen, Tag, Lightbulb,
  Terminal, ChevronLeft, ChevronRight, Shuffle, Search, X, Check,
  Layers, ArrowLeft, Save
} from 'lucide-react';

const LANG_OPTIONS = [
  { value: 'python', label: 'Python', monacoLang: 'python' },
  { value: 'cpp', label: 'C++', monacoLang: 'cpp' },
  { value: 'c', label: 'C', monacoLang: 'c' },
  { value: 'java', label: 'Java', monacoLang: 'java' },
];

const verdictStyle: Record<string, string> = {
  Accepted: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  'Wrong Answer': 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  'Compilation Error': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  'Runtime Error': 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  'Time Limit Exceeded': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  'Memory Limit Exceeded': 'text-purple-400 bg-purple-500/10 border-purple-500/30',
};

const diffBadge: Record<string, string> = {
  Easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  Hard: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
};

export const ProblemPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [problem, setProblem] = useState<any>(null);
  const [loadError, setLoadError] = useState('');
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'submissions'>('description');
  const [resultTab, setResultTab] = useState<'result' | 'custom'>('result');
  const [customInput, setCustomInput] = useState('');
  const draftRevision = useRef(0);
  const saveInFlight = useRef(false);
  const [savingCode, setSavingCode] = useState(false);
  const [draftState, setDraftState] = useState<'idle' | 'loading' | 'dirty' | 'saved' | 'error'>('idle');
  const [draftMessage, setDraftMessage] = useState('');

  // Top Questions Navigation State
  const [allProblems, setAllProblems] = useState<any[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerFilter, setPickerFilter] = useState<'all' | 'level2' | 'level3' | 'Easy' | 'Medium' | 'Hard'>('all');
  const activePillRef = useRef<HTMLAnchorElement>(null);
  const pillsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch complete catalog for top navigation
  useEffect(() => {
    api.getProblems().then(res => {
      setAllProblems(res.problems || []);
    }).catch(() => {});
  }, []);

  // Fetch current problem details on slug change
  useEffect(() => {
    let cancelled = false;
    setProblem(null);
    setCode('');
    setResult(null);
    setCustomInput('');
    setLoadError('');
    setShowPicker(false);
    if (slug) {
      api.getProblemBySlug(slug).then(res => {
        if (!cancelled) setProblem(res.problem);
      }).catch(error => {
        if (!cancelled) setLoadError(error.message || 'Unable to load this question.');
      });
    }
    return () => { cancelled = true; };
  }, [slug]);

  // Load the signed-in user's saved draft for this problem + language.
  useEffect(() => {
    let cancelled = false;
    const revision = ++draftRevision.current;
    setCode('');
    setSavingCode(false);

    if (!slug || authLoading) return;

    if (!user) {
      setDraftState('idle');
      setDraftMessage('');
      return;
    }

    if (!isSupabaseConfigured) {
      setDraftState('error');
      setDraftMessage('Cloud saving is not configured.');
      return;
    }

    setDraftState('loading');
    setDraftMessage('Loading saved code...');

    Promise.resolve(supabase
      .from('saved_code')
      .select('code, updated_at')
      .eq('user_id', user.id)
      .eq('problem_slug', slug)
      .eq('language', language)
      .maybeSingle())
      .then(({ data, error }) => {
        if (cancelled || revision !== draftRevision.current) return;

        if (error) {
          setDraftState('error');
          setDraftMessage('Could not load saved code');
          return;
        }

        if (data) {
          setCode(data.code || '');
          setDraftState('saved');
          setDraftMessage('Saved code restored');
        } else {
          setCode('');
          setDraftState('idle');
          setDraftMessage('');
        }
      }).catch(() => {
        if (cancelled || revision !== draftRevision.current) return;
        setDraftState('error');
        setDraftMessage('Could not load saved code. Check your connection.');
      });

    return () => {
      cancelled = true;
    };
  }, [slug, language, user?.id, authLoading]);

  // Auto-scroll active question pill into view in the top bar
  useEffect(() => {
    if (activePillRef.current) {
      activePillRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [slug, allProblems]);

  // Compute navigation indices
  const currentIndex = useMemo(() => {
    return allProblems.findIndex(p => p.slug === slug);
  }, [allProblems, slug]);

  const prevProblem = currentIndex > 0 ? allProblems[currentIndex - 1] : null;
  const nextProblem = currentIndex >= 0 && currentIndex < allProblems.length - 1 ? allProblems[currentIndex + 1] : null;

  const handleRandom = () => {
    if (allProblems.length <= 1) return;
    const others = allProblems.filter(p => p.slug !== slug);
    const random = others[Math.floor(Math.random() * others.length)];
    if (random) navigate(`/problem/${random.slug}`);
  };

  // Filtered list for the question drawer/picker
  const filteredPickerProblems = useMemo(() => {
    return allProblems.filter(p => {
      if (pickerFilter === 'level2' && p.problem_number > 57) return false;
      if (pickerFilter === 'level3' && p.problem_number <= 57) return false;
      if (['Easy', 'Medium', 'Hard'].includes(pickerFilter) && p.difficulty !== pickerFilter) return false;
      if (pickerSearch) {
        const query = pickerSearch.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesNum = String(p.problem_number).includes(query);
        const matchesCat = (p.category || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesNum && !matchesCat) return false;
      }
      return true;
    });
  }, [allProblems, pickerSearch, pickerFilter]);

  const switchLanguage = useCallback((lang: string) => {
    setLanguage(lang);
    setCode('');
    setResult(null);
  }, []);

  const handleCodeChange = (value: string | undefined) => {
    draftRevision.current++;
    setCode(value || '');
    setDraftState('dirty');
    setDraftMessage(user ? 'Unsaved changes' : 'Sign in to save');
  };

  const handleSaveCode = async () => {
    if (!slug || saveInFlight.current || authLoading) return;

    if (!user) {
      navigate('/login', { state: { from: `/problem/${slug}` } });
      return;
    }

    if (!isSupabaseConfigured) {
      setDraftState('error');
      setDraftMessage('Cloud saving is not configured.');
      return;
    }
    const revision = draftRevision.current;
    saveInFlight.current = true;
    setSavingCode(true);
    setDraftState('loading');
    setDraftMessage('Saving...');

    try {
      const { error } = await supabase
        .from('saved_code')
        .upsert(
          {
            user_id: user.id,
            problem_slug: slug,
            language,
            code,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,problem_slug,language',
          }
        );

      if (error) throw error;

      if (revision === draftRevision.current) {
        setDraftState('saved');
        setDraftMessage('Saved to your account');
      }
    } catch (err) {
      console.error('Save code failed:', err);
      if (revision === draftRevision.current) {
        setDraftState('error');
        setDraftMessage('Save failed. Check your connection and try again.');
      }
    } finally {
      saveInFlight.current = false;
      setSavingCode(false);
    }
  };

  const handleRun = async () => {
    if (!slug) return;
    setRunning(true);
    setResult(null);
    setResultTab('result');
    try {
      const input = customInput.trim() ? customInput : undefined;
      const res = await api.runCode(slug, { language, code, customInput: input });
      setResult({ type: 'run', ...res.result, verdict: input !== undefined && res.result.verdict === 'Accepted' ? 'Executed' : res.result.verdict });
    } catch (err: any) {
      setResult({ type: 'error', message: err.message });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!slug) return;
    setSubmitting(true);
    setResult(null);
    setResultTab('result');
    try {
      const res = await api.submitCode(slug, { language, code });
      setResult({ type: 'submit', ...res });
      // Update local problem status if accepted
      if (res.verdict === 'Accepted') {
        setAllProblems(prev => prev.map(p => p.slug === slug ? { ...p, user_status: 'solved' } : p));
      }
    } catch (err: any) {
      setResult({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (problem) {
      handleCodeChange('');
      setResult(null);
    }
  };

  if (loadError) return <div className="p-8 text-center"><p role="alert" className="text-rose-300 font-medium mb-4">{loadError}</p><Link to="/" className="text-xs text-indigo-400 hover:underline">← Back to problem list</Link></div>;

  if (!problem) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const monacoLang = LANG_OPTIONS.find(l => l.value === language)?.monacoLang || 'python';
  const diffClass = problem.difficulty === 'Easy' ? 'text-emerald-400' : problem.difficulty === 'Medium' ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="compiler-shell flex flex-col bg-dark-950 relative">
      {/* ======================================================== */}
      {/* TOP SECTION: QUESTION NAVIGATOR & QUICK ACCESS CAROUSEL */}
      {/* ======================================================== */}
      <section className="shrink-0 border-b border-dark-700/80 bg-dark-900/95 backdrop-blur-md px-3 py-1.5 z-30 shadow-md shadow-black/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left Controls: Catalog link + Prev/Next + Question Selector */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <Link
              to="/"
              className="p-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white border border-dark-700/60 transition-colors"
              title="Back to all problems"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <button
              onClick={() => prevProblem && navigate(`/problem/${prevProblem.slug}`)}
              disabled={!prevProblem}
              className="p-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white border border-dark-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title={prevProblem ? `Previous: #${prevProblem.problem_number} ${prevProblem.title}` : 'First problem'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => nextProblem && navigate(`/problem/${nextProblem.slug}`)}
              disabled={!nextProblem}
              className="p-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white border border-dark-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title={nextProblem ? `Next: #${nextProblem.problem_number} ${nextProblem.title}` : 'Last problem'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Question Selector Trigger Button */}
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700 text-xs font-semibold text-white transition-all group"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="font-mono text-indigo-300">#{problem.problem_number}</span>
              <span className="truncate max-w-[80px] sm:max-w-[200px] text-slate-200">{problem.title}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded border ${diffBadge[problem.difficulty] || 'text-slate-400'}`}>
                {problem.difficulty}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showPicker ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Center: Horizontal Scrollable Question Pills Bar */}
          <div
            ref={pillsContainerRef}
            className="hidden md:flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5 px-2 flex-1 max-w-2xl mx-2"
          >
            {allProblems.map((p) => {
              const isCurrent = p.slug === slug;
              const isSolved = p.user_status === 'solved';
              return (
                <Link
                  key={p.id}
                  ref={isCurrent ? activePillRef : null}
                  to={`/problem/${p.slug}`}
                  title={`#${p.problem_number}: ${p.title} (${p.difficulty})`}
                  className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium transition-all flex items-center space-x-1 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105 border border-indigo-400'
                      : isSolved
                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                      : 'bg-dark-850 text-slate-400 hover:text-slate-200 hover:bg-dark-800 border border-dark-700/60'
                  }`}
                >
                  <span>{p.problem_number}</span>
                  {isSolved && <Check className="w-2.5 h-2.5 text-emerald-400" />}
                </Link>
              );
            })}
          </div>

          {/* Right Controls: Random Question + Progress counter */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleRandom}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700/60 text-xs text-slate-300 hover:text-indigo-300 transition-colors"
              title="Pick a random problem"
            >
              <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden xl:inline text-[11px]">Random</span>
            </button>

            <span className="text-[11px] font-mono text-slate-400 bg-dark-850 border border-dark-700/60 px-2 py-0.5 rounded-lg shrink-0">
              {currentIndex >= 0 ? `${currentIndex + 1} / ${allProblems.length || 109}` : `${allProblems.length || 109} Qs`}
            </span>
          </div>
        </div>

        {/* Dropdown Modal: Searchable 109 Question Picker */}
        {showPicker && (
          <div className="absolute left-4 right-4 sm:left-12 sm:right-auto sm:w-[480px] top-12 max-h-[75vh] bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl shadow-black/80 flex flex-col z-50 animate-slide-down overflow-hidden">
            {/* Header + Search */}
            <div className="p-3 border-b border-dark-700 bg-dark-850 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Question Catalog ({allProblems.length})</span>
                </span>
                <button
                  onClick={() => setShowPicker(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search questions by title, number, or topic..."
                  value={pickerSearch}
                  onChange={e => setPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-dark-950 border border-dark-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1 overflow-x-auto no-scrollbar pt-1">
                {(['all', 'level2', 'level3', 'Easy', 'Medium', 'Hard'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setPickerFilter(tab)}
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold transition-colors shrink-0 ${
                      pickerFilter === tab
                        ? 'bg-indigo-600 text-white'
                        : 'bg-dark-950 text-slate-400 hover:text-slate-200 border border-dark-700/60'
                    }`}
                  >
                    {tab === 'all' ? 'All (109)' : tab === 'level2' ? 'Level 2 (1-57)' : tab === 'level3' ? 'Level 3 Arrays (58-109)' : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions List */}
            <div className="overflow-y-auto divide-y divide-dark-800/80 max-h-[50vh]">
              {filteredPickerProblems.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">No questions found matching your filter.</div>
              ) : (
                filteredPickerProblems.map(p => {
                  const isCurrent = p.slug === slug;
                  const isSolved = p.user_status === 'solved';
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setShowPicker(false);
                        navigate(`/problem/${p.slug}`);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-dark-850 transition-colors ${
                        isCurrent ? 'bg-dark-850 border-l-2 border-indigo-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        <span className="font-mono text-xs text-slate-400 shrink-0 w-8">#{p.problem_number}</span>
                        <span className={`text-xs truncate ${isCurrent ? 'font-bold text-indigo-300' : 'text-slate-200'}`}>
                          {p.title}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {isSolved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        <span className={`text-[10px] px-1.5 py-0.2 rounded border ${diffBadge[p.difficulty] || 'text-slate-400'}`}>
                          {p.difficulty}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* MAIN TWO-PANE CONTENT: PROBLEM VIEW + MONACO EDITOR */}
      {/* ======================================================== */}
      <div className="compiler-panels flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Panel — Problem Description */}
        <div
          className="problem-description lg:border-r border-dark-700/80 overflow-y-auto bg-dark-950"
        >
          <div className="p-6">
            {/* Title & Meta */}
            <div className="mb-4">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-sm font-mono text-slate-500">#{problem.problem_number}</span>
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                  verdictStyle[problem.difficulty] || 'border-dark-700'
                } ${diffClass}`}>
                  {problem.difficulty}
                </span>
                {problem.category && (
                  <span className="text-xs text-slate-400 bg-dark-850 border border-dark-700/60 px-2 py-0.5 rounded-md">
                    {problem.category}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-white leading-tight">{problem.title}</h1>
            </div>

            {/* Tags */}
            {problem.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {problem.tags.map((t: any) => (
                  <span key={t.id} className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-dark-850 border border-dark-700 text-[11px] text-slate-400 font-medium">
                    <Tag className="w-3 h-3" /><span>{t.name}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className="flex space-x-1 mb-5 border-b border-dark-700 pb-0">
              <button
                onClick={() => setActiveTab('description')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'description'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-1.5"><BookOpen className="w-4 h-4" /><span>Description</span></div>
              </button>
            </div>

            {/* Description */}
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {problem.description}
              </div>

              {/* Constraints */}
              {problem.constraints && (
                <div className="mt-5 p-4 bg-dark-900 border border-dark-700/80 rounded-xl">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /><span>Constraints</span>
                  </h3>
                  <code className="text-xs text-amber-300 font-mono">{problem.constraints}</code>
                </div>
              )}

              {/* Input/Output Format */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {problem.input_format && (
                  <div className="p-3 bg-dark-900 border border-dark-700/80 rounded-xl">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Input Format</h4>
                    <p className="text-xs text-slate-300">{problem.input_format}</p>
                  </div>
                )}
                {problem.output_format && (
                  <div className="p-3 bg-dark-900 border border-dark-700/80 rounded-xl">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Output Format</h4>
                    <p className="text-xs text-slate-300">{problem.output_format}</p>
                  </div>
                )}
              </div>

              {/* Examples */}
              {problem.examples?.length > 0 && (
                <div className="mt-5 space-y-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-indigo-400" /><span>Examples</span>
                  </h3>
                  {problem.examples.map((ex: any, i: number) => (
                    <div key={i} className="bg-dark-900 border border-dark-700/80 rounded-xl overflow-hidden shadow-sm">
                      <div className="px-4 py-2 bg-dark-850 border-b border-dark-700 text-xs font-semibold text-slate-400">
                        Example {i + 1}
                      </div>
                      <div className="grid grid-cols-2 divide-x divide-dark-700">
                        <div className="p-3">
                          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Input</div>
                          <pre className="text-xs text-cyan-300 font-mono whitespace-pre-wrap bg-dark-950 p-2 rounded-lg">{ex.input.replace(/\\n/g, '\n')}</pre>
                        </div>
                        <div className="p-3">
                          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Output</div>
                          <pre className="text-xs text-emerald-300 font-mono whitespace-pre-wrap bg-dark-950 p-2 rounded-lg">{ex.output.replace(/\\n/g, '\n')}</pre>
                        </div>
                      </div>
                      {ex.explanation && (
                        <div className="px-4 py-2 border-t border-dark-700 text-xs text-slate-400 italic">
                          💡 {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Limits */}
              <div className="mt-5 flex items-center space-x-4 text-xs text-slate-500">
                <span className="flex items-center space-x-1"><Clock className="w-3.5 h-3.5" /><span>Time: {(problem.time_limit_ms || 2000) / 1000}s</span></span>
                <span className="flex items-center space-x-1"><HardDrive className="w-3.5 h-3.5" /><span>Memory: {problem.memory_limit_mb || 256}MB</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel — Code Editor + Results */}
        <div className="compiler-editor flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Editor Toolbar */}
          <div className="editor-toolbar flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-dark-900 border-b border-dark-700/80 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5">
                <FileCode2 className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-300">Editor</span>
              </div>
              {/* Language Selector */}
              <div className="relative">
                <select
                  value={language}
                  onChange={e => switchLanguage(e.target.value)}
                  className="appearance-none pl-3 pr-7 py-1.5 bg-dark-850 border border-dark-700 rounded-lg text-xs text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                >
                  {LANG_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveCode}
                disabled={authLoading || savingCode || draftState === 'loading'}
                aria-label={savingCode ? 'Saving code' : 'Save code'}
                className="save-button flex shrink-0 items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 border border-indigo-400/40 text-xs font-semibold text-white hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-wait"
                title={user ? 'Save code for this problem and language' : 'Sign in to save your code'}
              >
                {savingCode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{savingCode ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={handleReset}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-dark-850 border border-dark-700 text-xs text-slate-400 hover:text-slate-200 hover:border-dark-600 transition-all"
                title="Clear editor"
              >
                <RotateCcw className="w-3.5 h-3.5" /><span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          <div role="status" aria-live="polite" className={`px-4 py-2 text-xs border-b border-dark-800 shrink-0 ${draftState === 'error' ? 'text-rose-300' : draftState === 'saved' ? 'text-emerald-300' : 'text-slate-400'}`}>
            {authLoading ? 'Checking your session…' : draftMessage || (user ? 'Save your progress for this question and language.' : 'Sign in to save your progress.')}
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={monacoLang}
              theme="vs-dark"
              value={code}
              onChange={handleCodeChange}
              options={{
                readOnly: draftState === 'loading' && !savingCode,
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12 },
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                wordWrap: 'on',
                tabSize: 4,
                formatOnPaste: true,
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 shrink-0 items-center justify-between px-4 py-2.5 bg-dark-900 border-t border-dark-700/80">
            <div className="flex items-center space-x-2">
              {/* Custom Input Toggle */}
              <button
                onClick={() => setResultTab(resultTab === 'custom' ? 'result' : 'custom')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  resultTab === 'custom'
                    ? 'bg-dark-800 border-indigo-500/40 text-indigo-400'
                    : 'bg-dark-850 border-dark-700 text-slate-400 hover:text-slate-300'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" /><span>Custom Input</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRun}
                disabled={running || submitting}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-dark-800 border border-dark-600 text-slate-200 text-xs font-semibold hover:bg-dark-700 transition-all disabled:opacity-50"
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 text-emerald-400" />}
                <span>Run</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={running || submitting}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Submit</span>
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="h-48 min-h-[10rem] max-h-80 overflow-y-auto bg-dark-950 border-t border-dark-700/80">
            {resultTab === 'custom' && (
              <div className="p-4">
                <label className="text-xs font-semibold text-slate-400 mb-2 block">Custom Test Input (stdin)</label>
                <textarea
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  className="w-full h-24 p-3 bg-dark-900 border border-dark-700 rounded-lg text-xs text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                  placeholder="Enter custom stdin test input..."
                />
              </div>
            )}

            {resultTab === 'result' && result && (
              <div className="p-4 space-y-3 animate-fade-in">
                {result.type === 'error' ? (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">{result.message}</div>
                ) : (
                  <>
                    {/* Verdict Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {(result.verdict === 'Accepted') ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-400" />
                        )}
                        <span className={`text-lg font-bold ${
                          result.verdict === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {result.verdict || 'Completed'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-slate-400">
                        {result.passedCount !== undefined && (
                          <span className="font-medium">{result.passedCount}/{result.totalCount} Passed</span>
                        )}
                        {result.executionTimeMs !== undefined && (
                          <span className="flex items-center space-x-1"><Clock className="w-3 h-3" /><span>{result.executionTimeMs}ms</span></span>
                        )}
                      </div>
                    </div>

                    {/* Compile Error */}
                    {result.compileError && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                        <div className="text-xs font-semibold text-amber-400 mb-1">Compilation Error</div>
                        <pre className="text-xs text-amber-300 font-mono whitespace-pre-wrap">{result.compileError}</pre>
                      </div>
                    )}

                    {/* Test Case Results */}
                    {result.testCaseResults?.length > 0 && (
                      <div className="space-y-2">
                        {result.testCaseResults.map((tc: any, idx: number) => (
                          <div key={idx} className={`p-3 rounded-xl border ${
                            tc.status === 'PASS' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                {tc.status === 'PASS'
                                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  : <XCircle className="w-4 h-4 text-rose-400" />}
                                <span className={`text-xs font-semibold ${tc.status === 'PASS' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  Test Case {tc.testCaseNumber}
                                </span>
                                {tc.isHidden && <span className="text-[10px] text-slate-500 bg-dark-800 px-1.5 py-0.5 rounded">Hidden</span>}
                              </div>
                              <span className="text-[11px] text-slate-500">{tc.executionTimeMs}ms</span>
                            </div>
                            {!tc.isHidden && (
                              <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-mono">
                                <div>
                                  <div className="text-[10px] text-slate-500 mb-0.5">Expected</div>
                                  <pre className="p-1.5 bg-dark-900 rounded-lg text-emerald-300 whitespace-pre-wrap">{tc.expectedOutput}</pre>
                                </div>
                                <div>
                                  <div className="text-[10px] text-slate-500 mb-0.5">Your Output</div>
                                  <pre className="p-1.5 bg-dark-900 rounded-lg text-rose-300 whitespace-pre-wrap">{tc.actualOutput}</pre>
                                </div>
                              </div>
                            )}
                            {tc.errorMessage && (
                              <div className="mt-2 text-xs text-orange-400 font-mono">{tc.errorMessage}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {resultTab === 'result' && !result && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm space-y-1">
                <Terminal className="w-6 h-6 text-slate-600" />
                <span>Click <strong>Run</strong> or <strong>Submit</strong> to benchmark against test cases</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
