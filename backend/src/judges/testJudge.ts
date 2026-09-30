import { judgeSubmission } from './judgeService.js';
import { queryAll, queryOne } from '../models/db.js';

async function runTests() {
  console.log('=== Running Judge Verification Tests ===\n');

  // Fetch problem 1 test cases
  const problem = queryOne('SELECT * FROM problems WHERE slug = ?', ['fibonacci-series']);
  if (!problem) throw new Error('Problem not found');

  const testCases = queryAll(
    'SELECT * FROM test_cases WHERE problem_id = ? ORDER BY order_num ASC',
    [problem.id]
  ).map((tc: any) => ({
    id: tc.id,
    testCaseNumber: tc.order_num,
    input: tc.input,
    expectedOutput: tc.expected_output,
    isHidden: tc.is_hidden === 1,
    testType: tc.test_type,
  }));

  console.log(`Found ${testCases.length} test cases for Fibonacci Series.`);

  // 1. Python Correct Solution
  console.log('\n[Test 1] Python Correct Solution:');
  const pyCode = `
import sys
n = int(sys.stdin.read().strip())
if n <= 0:
    print("Invalid Input")
else:
    a, b = 0, 1
    res = []
    for _ in range(n):
        res.append(str(a))
        a, b = b, a + b
    print(','.join(res) + ',')
`;
  const pyRes = await judgeSubmission('python', pyCode, testCases);
  console.log(`Verdict: ${pyRes.verdict} (${pyRes.passedCount}/${pyRes.totalCount} passed, ${pyRes.executionTimeMs}ms)`);

  // 2. C++ Correct Solution
  console.log('\n[Test 2] C++ Correct Solution:');
  const cppCode = `
#include <iostream>
#include <vector>
using namespace std;

int main() {
    long long n;
    if (!(cin >> n)) return 0;
    if (n <= 0) {
        cout << "Invalid Input\\n";
        return 0;
    }
    long long a = 0, b = 1;
    for (int i = 0; i < n; i++) {
        cout << a << ",";
        long long next = a + b;
        a = b;
        b = next;
    }
    cout << "\\n";
    return 0;
}
`;
  const cppRes = await judgeSubmission('cpp', cppCode, testCases);
  console.log(`Verdict: ${cppRes.verdict} (${cppRes.passedCount}/${cppRes.totalCount} passed, ${cppRes.executionTimeMs}ms)`);

  // 3. C Correct Solution
  console.log('\n[Test 3] C Correct Solution:');
  const cCode = `
#include <stdio.h>

int main() {
    long long n;
    if (scanf("%lld", &n) != 1) return 0;
    if (n <= 0) {
        printf("Invalid Input\\n");
        return 0;
    }
    long long a = 0, b = 1;
    for (int i = 0; i < n; i++) {
        printf("%lld,", a);
        long long next = a + b;
        a = b;
        b = next;
    }
    printf("\\n");
    return 0;
}
`;
  const cRes = await judgeSubmission('c', cCode, testCases);
  console.log(`Verdict: ${cRes.verdict} (${cRes.passedCount}/${cRes.totalCount} passed, ${cRes.executionTimeMs}ms)`);

  // 4. Java Correct Solution
  console.log('\n[Test 4] Java Correct Solution:');
  const javaCode = `
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextLong()) return;
        long n = scanner.nextLong();
        if (n <= 0) {
            System.out.println("Invalid Input");
            return;
        }
        long a = 0, b = 1;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            sb.append(a).append(",");
            long next = a + b;
            a = b;
            b = next;
        }
        System.out.println(sb.toString());
    }
}
`;
  const javaRes = await judgeSubmission('java', javaCode, testCases);
  console.log(`Verdict: ${javaRes.verdict} (${javaRes.passedCount}/${javaRes.totalCount} passed, ${javaRes.executionTimeMs}ms)`);

  // 5. Wrong Solution
  console.log('\n[Test 5] Wrong Answer Test:');
  const wrongCode = `print("I am wrong")`;
  const wrongRes = await judgeSubmission('python', wrongCode, testCases);
  console.log(`Verdict: ${wrongRes.verdict} (${wrongRes.passedCount}/${wrongRes.totalCount} passed)`);

  // 6. Compilation Error Test
  console.log('\n[Test 6] Compilation Error Test (C++):');
  const brokenCode = `int main() { this is not valid c++ }`;
  const brokenRes = await judgeSubmission('cpp', brokenCode, testCases);
  console.log(`Verdict: ${brokenRes.verdict}, compile error message captured: ${Boolean(brokenRes.compileError)}`);

  // 7. Timeout Test (TLE)
  console.log('\n[Test 7] Timeout Test (Infinite Loop):');
  const loopCode = `while True: pass`;
  const loopRes = await judgeSubmission('python', loopCode, [testCases[0]], { timeLimitMs: 1000 });
  console.log(`Verdict: ${loopRes.verdict}`);

  console.log('\n=== All Judge Tests Completed Successfully! ===');
}

runTests().catch(err => {
  console.error('Judge test failure:', err);
  process.exit(1);
});
