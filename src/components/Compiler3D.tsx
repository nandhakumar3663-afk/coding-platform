import React, { useState, useRef } from 'react';

type SupportedLanguage = 'typescript' | 'python' | 'cpp';

const STARTER_SNIPPETS: Record<SupportedLanguage, string> = {
  typescript: `function solve(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) return [map.get(diff)!, i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
  python: `def solve(nums: list[int], target: int) -> list[int]:\n    seen = {}\n    for i, num in enumerate(nums):\n        if target - num in seen:\n            return [seen[target - num], i]\n        seen[num] = i\n    return []`,
  cpp: `#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nvector<int> solve(vector<int>& nums, int target) {\n    unordered_map<int, int> seen;\n    for (int i = 0; i < nums.size(); ++i) {\n        if (seen.count(target - nums[i])) return {seen[target - nums[i]], i};\n        seen[nums[i]] = i;\n    }\n    return {};\n}`
};

export const Compiler3D: React.FC = () => {
  const [language, setLanguage] = useState<SupportedLanguage>('typescript');
  const [code, setCode] = useState<string>(STARTER_SNIPPETS.typescript);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [output, setOutput] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const executeCode = (mode: 'run' | 'submit') => {
    if (isRunning) return;
    if (!code.trim()) {
      setOutput('Error: Code editor cannot be empty.');
      return;
    }
    setIsRunning(true);
    setOutput('Executing in isolated sandbox...');

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setIsRunning(false);
      setOutput(
        mode === 'run'
          ? '[Output]\n[ 0, 1 ]\nRuntime: 42 ms | Memory: 14.1 MB'
          : '✓ Accepted (42/42 test cases passed)\nRuntime: 31 ms (Beats 94.8%)'
      );
    }, 900);
  };

  return (
    <div className="w-full max-w-5xl mx-auto perspective-1000">
      <div className="glass-panel-3d rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="px-5 py-3.5 bg-slate-900/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-white/5">
            {(['typescript', 'python', 'cpp'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => { setLanguage(lang); setCode(STARTER_SNIPPETS[lang]); setOutput(null); }}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                  language === lang ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={isRunning}
              onClick={() => executeCode('run')}
              className="btn-tactile-primary px-4 py-1.5 rounded-xl text-xs font-bold text-white uppercase disabled:opacity-50"
            >
              {isRunning ? 'Running...' : 'Run Code'}
            </button>
            <button
              disabled={isRunning}
              onClick={() => executeCode('submit')}
              className="btn-tactile-success px-4 py-1.5 rounded-xl text-xs font-bold text-white uppercase disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950/90 font-mono text-sm">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="w-full h-56 bg-transparent text-slate-200 focus:outline-none resize-none font-mono leading-relaxed"
          />
        </div>

        <div className="border-t border-white/10 bg-slate-900/95 p-4">
          <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap">
            {output || 'Click "Run Code" or "Submit" to test your solution.'}
          </pre>
        </div>
      </div>
    </div>
  );
};
