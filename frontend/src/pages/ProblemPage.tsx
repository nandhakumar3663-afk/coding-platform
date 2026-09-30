import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { api } from '../api/client';
import {
  Play, Send, RotateCcw, ChevronDown, Clock, HardDrive, CheckCircle2,
  XCircle, AlertTriangle, Loader2, FileCode2, BookOpen, Tag, Lightbulb,
  Terminal, ChevronLeft, ChevronRight
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

export const ProblemPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
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
  const [panelSplit, setPanelSplit] = useState(45); // percentage for left panel

  useEffect(() => {
    let cancelled = false;
    setProblem(null);
    setCode('');
    setResult(null);
    setCustomInput('');
    setLoadError('');
    if (slug) {
      api.getProblemBySlug(slug).then(res => {
        if (!cancelled) setProblem(res.problem);
      }).catch(error => {
        if (!cancelled) setLoadError(error.message || 'Unable to load this question.');
      });
    }
    return () => { cancelled = true; };
  }, [slug]);

  const switchLanguage = useCallback((lang: string) => {
    setLanguage(lang);
    setCode('');
    setResult(null);
  }, []);

  const handleCodeChange = (value: string | undefined) => setCode(value || '');

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
    } catch (err: any) {
      setResult({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (problem) {
      setCode('');
      setResult(null);
    }
  };

  if (loadError) return <p role="alert" className="p-8 text-rose-300">{loadError}</p>;

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
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden">
      {/* Left Panel — Problem Description */}
      <div
        className="lg:border-r border-dark-700 overflow-y-auto bg-dark-950"
        style={{ width: `${panelSplit}%`, minWidth: 320 }}
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
            </div>
            <h1 className="text-xl font-bold text-white leading-tight">{problem.title}</h1>
          </div>

          {/* Tags */}
          {problem.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {problem.tags.map((t: any) => (
                <span key={t.id} className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-dark-800 border border-dark-700 text-[11px] text-slate-400 font-medium">
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
              <div className="mt-5 p-4 bg-dark-900 border border-dark-700 rounded-lg">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /><span>Constraints</span>
                </h3>
                <code className="text-xs text-amber-300 font-mono">{problem.constraints}</code>
              </div>
            )}

            {/* Input/Output Format */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {problem.input_format && (
                <div className="p-3 bg-dark-900 border border-dark-700 rounded-lg">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Input Format</h4>
                  <p className="text-xs text-slate-300">{problem.input_format}</p>
                </div>
              )}
              {problem.output_format && (
                <div className="p-3 bg-dark-900 border border-dark-700 rounded-lg">
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
                  <div key={i} className="bg-dark-900 border border-dark-700 rounded-lg overflow-hidden">
                    <div className="px-4 py-2 bg-dark-850 border-b border-dark-700 text-xs font-semibold text-slate-400">
                      Example {i + 1}
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-dark-700">
                      <div className="p-3">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Input</div>
                        <pre className="text-xs text-cyan-300 font-mono whitespace-pre-wrap bg-dark-950 p-2 rounded">{ex.input.replace(/\\n/g, '\n')}</pre>
                      </div>
                      <div className="p-3">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Output</div>
                        <pre className="text-xs text-emerald-300 font-mono whitespace-pre-wrap bg-dark-950 p-2 rounded">{ex.output.replace(/\\n/g, '\n')}</pre>
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-dark-900 border-b border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <FileCode2 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-300">Code</span>
            </div>
            {/* Language Selector */}
            <div className="relative">
              <select
                value={language}
                onChange={e => switchLanguage(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 bg-dark-850 border border-dark-700 rounded-lg text-xs text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
              >
                {LANG_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-dark-850 border border-dark-700 text-xs text-slate-400 hover:text-slate-200 hover:border-dark-600 transition-all"
              title="Clear editor"
            >
              <RotateCcw className="w-3.5 h-3.5" /><span className="hidden sm:inline">Reset</span>
            </button>
          </div>
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
        <div className="flex items-center justify-between px-4 py-2.5 bg-dark-900 border-t border-dark-700">
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
              disabled={running || submitting || !code.trim()}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-dark-800 border border-dark-600 text-slate-200 text-xs font-semibold hover:bg-dark-700 transition-all disabled:opacity-50"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 text-emerald-400" />}
              <span>Run</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={running || submitting || !code.trim()}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Submit</span>
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="h-48 min-h-[10rem] max-h-80 overflow-y-auto bg-dark-950 border-t border-dark-700">
          {resultTab === 'custom' && (
            <div className="p-4">
              <label className="text-xs font-semibold text-slate-400 mb-2 block">Custom Test Input (stdin)</label>
              <textarea
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                className="w-full h-24 p-3 bg-dark-900 border border-dark-700 rounded-lg text-xs text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                placeholder="Enter your test input here..."
              />
            </div>
          )}

          {resultTab === 'result' && result && (
            <div className="p-4 space-y-3">
              {result.type === 'error' ? (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-sm">{result.message}</div>
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
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <div className="text-xs font-semibold text-amber-400 mb-1">Compilation Error</div>
                      <pre className="text-xs text-amber-300 font-mono whitespace-pre-wrap">{result.compileError}</pre>
                    </div>
                  )}

                  {/* Test Case Results */}
                  {result.testCaseResults?.length > 0 && (
                    <div className="space-y-2">
                      {result.testCaseResults.map((tc: any, idx: number) => (
                        <div key={idx} className={`p-3 rounded-lg border ${
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
                                <pre className="p-1.5 bg-dark-900 rounded text-emerald-300 whitespace-pre-wrap">{tc.expectedOutput}</pre>
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-500 mb-0.5">Your Output</div>
                                <pre className="p-1.5 bg-dark-900 rounded text-rose-300 whitespace-pre-wrap">{tc.actualOutput}</pre>
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
              <span>Click <strong>Run</strong> or <strong>Submit</strong> to see results</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
