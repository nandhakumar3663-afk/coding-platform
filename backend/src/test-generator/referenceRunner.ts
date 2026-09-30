import { PythonRunner } from '../judges/pythonRunner.js';
import { CppRunner } from '../judges/cppRunner.js';
import { normalizeOutput } from '../judges/normalize.js';

export interface ReferenceExecutionResult {
  success: boolean;
  output: string;
  executionTimeMs: number;
  error?: string;
}

export async function runReferenceSolution(
  language: 'python' | 'cpp',
  code: string,
  input: string
): Promise<ReferenceExecutionResult> {
  const runner = language === 'cpp' ? new CppRunner(5000) : new PythonRunner(5000);

  try {
    const compileResult = await runner.compile(code);
    if (!compileResult.success) {
      return {
        success: false,
        output: '',
        executionTimeMs: 0,
        error: `Reference solution compilation failed: ${compileResult.error}`,
      };
    }

    const runResult = await runner.run(input);
    if (runResult.timedOut) {
      return {
        success: false,
        output: '',
        executionTimeMs: runResult.executionTimeMs,
        error: 'Reference solution timed out (limit: 5000ms)',
      };
    }

    if (runResult.exitCode !== 0) {
      return {
        success: false,
        output: '',
        executionTimeMs: runResult.executionTimeMs,
        error: `Reference solution runtime error: ${runResult.stderr}`,
      };
    }

    return {
      success: true,
      output: normalizeOutput(runResult.stdout),
      executionTimeMs: runResult.executionTimeMs,
    };
  } finally {
    await runner.cleanup();
  }
}
