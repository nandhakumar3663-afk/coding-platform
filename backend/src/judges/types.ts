export type SupportedLanguage = 'c' | 'cpp' | 'java' | 'python';

export type SubmissionVerdict = 
  | 'Accepted'
  | 'Wrong Answer'
  | 'Compilation Error'
  | 'Runtime Error'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Internal Error';

export type TestCaseVerdict = 'PASS' | 'FAIL' | 'TLE' | 'RTE' | 'MLE';

export interface TestCaseInput {
  id?: string;
  testCaseNumber: number;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  testType?: string;
}

export interface TestCaseExecutionResult {
  testCaseNumber: number;
  testCaseId?: string;
  status: TestCaseVerdict;
  inputPreview: string;
  expectedOutput: string;
  actualOutput: string;
  executionTimeMs: number;
  memoryUsedKb: number;
  errorMessage?: string;
  isHidden: boolean;
}

export interface JudgeResult {
  verdict: SubmissionVerdict;
  passedCount: number;
  totalCount: number;
  executionTimeMs: number;
  memoryUsedKb: number;
  compileError?: string;
  runtimeError?: string;
  testCaseResults: TestCaseExecutionResult[];
}

export interface ExecutionOptions {
  timeLimitMs?: number;
  memoryLimitMb?: number;
}
