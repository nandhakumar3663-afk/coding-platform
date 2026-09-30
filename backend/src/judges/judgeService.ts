import {
  SupportedLanguage,
  TestCaseInput,
  JudgeResult,
  TestCaseExecutionResult,
  ExecutionOptions,
} from './types.js';
import { CRunner } from './cRunner.js';
import { CppRunner } from './cppRunner.js';
import { JavaRunner } from './javaRunner.js';
import { PythonRunner } from './pythonRunner.js';
import { compareOutputs, normalizeOutput } from './normalize.js';

export async function judgeSubmission(
  language: SupportedLanguage,
  code: string,
  testCases: TestCaseInput[],
  options: ExecutionOptions = {}
): Promise<JudgeResult> {
  const timeLimit = options.timeLimitMs || 2500;
  const memoryLimit = options.memoryLimitMb || 256;

  let runner: CRunner | CppRunner | JavaRunner | PythonRunner;

  switch (language) {
    case 'c':
      runner = new CRunner(timeLimit, memoryLimit);
      break;
    case 'cpp':
      runner = new CppRunner(timeLimit, memoryLimit);
      break;
    case 'java':
      runner = new JavaRunner(timeLimit, memoryLimit);
      break;
    case 'python':
      runner = new PythonRunner(timeLimit, memoryLimit);
      break;
    default:
      throw new Error(`Unsupported language: ${language}`);
  }

  try {
    // 1. Compilation phase
    const compileResult = await runner.compile(code);
    if (!compileResult.success) {
      return {
        verdict: 'Compilation Error',
        passedCount: 0,
        totalCount: testCases.length,
        executionTimeMs: 0,
        memoryUsedKb: 0,
        compileError: compileResult.error,
        testCaseResults: [],
      };
    }

    // 2. Execution phase across test cases
    const results: TestCaseExecutionResult[] = [];
    let totalTime = 0;
    let maxMemory = 0;
    let passedCount = 0;
    let firstFailedVerdict: 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | null = null;

    for (const tc of testCases) {
      const proc = await runner.run(tc.input);

      totalTime += proc.executionTimeMs;
      if (proc.memoryUsedKb > maxMemory) {
        maxMemory = proc.memoryUsedKb;
      }

      let status: 'PASS' | 'FAIL' | 'TLE' | 'RTE' = 'FAIL';
      let errorMessage: string | undefined = undefined;

      if (proc.timedOut) {
        status = 'TLE';
        errorMessage = `Time Limit Exceeded (${timeLimit}ms)`;
        if (!firstFailedVerdict) firstFailedVerdict = 'Time Limit Exceeded';
      } else if (proc.exitCode !== 0) {
        status = 'RTE';
        errorMessage = proc.stderr || `Process exited with code ${proc.exitCode}`;
        if (!firstFailedVerdict) firstFailedVerdict = 'Runtime Error';
      } else {
        const isMatch = compareOutputs(proc.stdout, tc.expectedOutput);
        if (isMatch) {
          status = 'PASS';
          passedCount++;
        } else {
          status = 'FAIL';
          if (!firstFailedVerdict) firstFailedVerdict = 'Wrong Answer';
        }
      }

      // Preview inputs/outputs
      const inputPreview = tc.isHidden
        ? (tc.input.length > 50 ? tc.input.slice(0, 50) + '...' : tc.input)
        : tc.input;

      results.push({
        testCaseNumber: tc.testCaseNumber,
        testCaseId: tc.id,
        status,
        inputPreview,
        expectedOutput: tc.expectedOutput,
        actualOutput: normalizeOutput(proc.stdout),
        executionTimeMs: proc.executionTimeMs,
        memoryUsedKb: proc.memoryUsedKb,
        errorMessage,
        isHidden: tc.isHidden,
      });
    }

    const verdict = passedCount === testCases.length ? 'Accepted' : (firstFailedVerdict || 'Wrong Answer');

    return {
      verdict,
      passedCount,
      totalCount: testCases.length,
      executionTimeMs: totalTime,
      memoryUsedKb: maxMemory,
      testCaseResults: results,
    };
  } finally {
    // 3. Clean up sandbox
    await runner.cleanup();
  }
}
