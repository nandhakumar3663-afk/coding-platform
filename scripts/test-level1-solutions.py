#!/usr/bin/env python3
"""
Test all 35 Level 1 reference solutions against their official PDF test cases.
35 questions × 5 test cases = 175 verified executions.
"""

import json
import subprocess
import sys
import tempfile
import os

def run_python(code, input_data):
    """Run Python code with given input and return stdout."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(code)
        f.flush()
        try:
            result = subprocess.run(
                ['python3', f.name],
                input=input_data,
                capture_output=True,
                text=True,
                timeout=10
            )
            return result.stdout.rstrip('\n'), result.stderr
        except subprocess.TimeoutExpired:
            return None, "TIMEOUT"
        finally:
            os.unlink(f.name)

def main():
    with open('backend/src/catalog/problems.json', 'r') as f:
        catalog = json.load(f)

    level1 = [p for p in catalog if p.get('source') == 'Level 1']
    level1.sort(key=lambda p: p['source_number'])

    total_tests = 0
    passed = 0
    failed = 0
    failures = []

    for p in level1:
        q_num = p['source_number']
        title = p['title']
        ref = p['reference_solution']

        for i, tc in enumerate(p['tests']):
            total_tests += 1
            input_data = tc['input']
            expected = tc['expected_output']

            actual, stderr = run_python(ref, input_data)

            if actual is None:
                failed += 1
                failures.append(f"Q{q_num} Test{i+1}: TIMEOUT")
                print(f"  ✗ Q{q_num:2d} Test {i+1}: TIMEOUT")
                continue

            # Normalize: strip trailing whitespace/newlines
            actual_norm = actual.strip()
            expected_norm = expected.strip()

            if actual_norm == expected_norm:
                passed += 1
                # Only print dots for passing tests to keep output clean
            else:
                failed += 1
                failures.append(
                    f"Q{q_num} '{title}' Test{i+1}: "
                    f"input='{input_data}' expected='{expected_norm}' got='{actual_norm}'"
                )
                print(f"  ✗ Q{q_num:2d} '{title}' Test {i+1}: expected '{expected_norm}', got '{actual_norm}'")
                if stderr:
                    print(f"    stderr: {stderr[:200]}")

        # Print summary per question
        q_tests = len(p['tests'])
        q_passed = q_tests - len([f for f in failures if f.startswith(f"Q{q_num}")])
        status = "✓" if q_passed == q_tests else "✗"
        print(f"  {status} Q{q_num:2d}. {title}: {q_passed}/{q_tests} passed")

    print(f"\n{'='*60}")
    print(f"TOTAL: {passed}/{total_tests} passed, {failed} failed")
    print(f"{'='*60}")

    if failed > 0:
        print(f"\n❌ {failed} FAILING TEST(S):")
        for f in failures:
            print(f"  - {f}")
        sys.exit(1)
    else:
        print(f"\n✅ ALL {total_tests} TESTS PASSED (35 questions × 5 tests)")

if __name__ == '__main__':
    main()
