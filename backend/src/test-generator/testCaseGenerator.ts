import { generateTestInputsForProblem, GeneratedInput } from './inputGenerator.js';
import { runReferenceSolution } from './referenceRunner.js';
import { execute, queryAll } from '../models/db.js';
import { v4 as uuidv4 } from 'uuid';

export interface GeneratedTestCaseResult {
  id: string;
  problemId: string;
  testCaseNumber: number;
  input: string;
  expectedOutput: string;
  testType: string;
  isHidden: boolean;
  executionTimeMs: number;
}

export interface GenerationSummary {
  success: boolean;
  message: string;
  testCases: GeneratedTestCaseResult[];
}

export async function generateAndStoreTestCases(
  problemId: string,
  slug: string,
  referenceSolution: string,
  referenceLang: 'python' | 'cpp' = 'python',
  constraints?: string,
  sampleInputs: string[] = []
): Promise<GenerationSummary> {
  const generatedInputs = generateTestInputsForProblem(slug, constraints, sampleInputs);
  const results: GeneratedTestCaseResult[] = [];

  for (let i = 0; i < generatedInputs.length; i++) {
    const item = generatedInputs[i];
    const refResult = await runReferenceSolution(referenceLang, referenceSolution, item.input);

    if (!refResult.success) {
      return {
        success: false,
        message: `Reference solution failed on test case ${i + 1} (${item.type}): ${refResult.error}`,
        testCases: [],
      };
    }

    const testCaseId = uuidv4();
    // Test Case 1 is visible sample, test cases 2 to 5 are hidden!
    const isHidden = i === 0 ? false : true;

    results.push({
      id: testCaseId,
      problemId,
      testCaseNumber: i + 1,
      input: item.input,
      expectedOutput: refResult.output,
      testType: item.type,
      isHidden,
      executionTimeMs: refResult.executionTimeMs,
    });
  }

  // Clear existing test cases for this problem
  execute('DELETE FROM test_cases WHERE problem_id = ?', [problemId]);

  // Insert generated test cases
  for (const tc of results) {
    execute(
      `INSERT INTO test_cases (id, problem_id, input, expected_output, test_type, is_hidden, order_num)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        tc.id,
        tc.problemId,
        tc.input,
        tc.expectedOutput,
        tc.testType,
        tc.isHidden ? 1 : 0,
        tc.testCaseNumber,
      ]
    );
  }

  return {
    success: true,
    message: `Successfully generated and verified ${results.length} test cases with trusted reference solution.`,
    testCases: results,
  };
}
