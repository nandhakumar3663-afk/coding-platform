#!/usr/bin/env python3
"""
Validation script for Level 1 Question Bank.
Checks:
- Exactly 35 Level 1 questions exist
- Source numbers 1 through 35
- No duplicate slugs
- No duplicate Level 1 source numbers
- Every question has title, description, input_format, output_format, reference_solution
- At least 5 tests per question
- Every question has a visible example
- Every question includes 'level-1' tag
- All JSON is valid
"""

import json
import sys

def main():
    with open('backend/src/catalog/problems.json', 'r') as f:
        catalog = json.load(f)

    print(f"Total problems in catalog: {len(catalog)}")

    # Separate Level 1
    level1 = [p for p in catalog if p.get('source') == 'Level 1']
    level2 = [p for p in catalog if p.get('source') == 'Level 2']
    level3 = [p for p in catalog if p.get('source') == 'Level 3']

    print(f"Level 1: {len(level1)} | Level 2: {len(level2)} | Level 3: {len(level3)}")

    errors = []

    # 1. Exactly 35 Level 1 questions
    if len(level1) != 35:
        errors.append(f"Expected 35 Level 1 questions, found {len(level1)}")

    # 2. Source numbers 1-35
    source_nums = sorted(p['source_number'] for p in level1)
    expected_nums = list(range(1, 36))
    if source_nums != expected_nums:
        errors.append(f"Level 1 source numbers not 1-35: {source_nums}")

    # 3. No duplicate slugs across ALL problems
    all_slugs = [p['slug'] for p in catalog]
    slug_counts = {}
    for s in all_slugs:
        slug_counts[s] = slug_counts.get(s, 0) + 1
    dups = {s: c for s, c in slug_counts.items() if c > 1}
    if dups:
        errors.append(f"Duplicate slugs: {dups}")

    # 4. No duplicate Level 1 source numbers
    l1_src_nums = [p['source_number'] for p in level1]
    if len(set(l1_src_nums)) != len(l1_src_nums):
        errors.append("Duplicate Level 1 source numbers found")

    # 5. Required fields
    total_tests = 0
    for p in level1:
        prefix = f"Q{p['source_number']} ({p['title']})"
        if not p.get('title'):
            errors.append(f"{prefix}: missing title")
        if not p.get('description'):
            errors.append(f"{prefix}: missing description")
        if not p.get('input_format'):
            errors.append(f"{prefix}: missing input_format")
        if not p.get('output_format'):
            errors.append(f"{prefix}: missing output_format")
        if not p.get('reference_solution'):
            errors.append(f"{prefix}: missing reference_solution")

        # 6. At least 5 tests
        tests = p.get('tests', [])
        total_tests += len(tests)
        if len(tests) < 5:
            errors.append(f"{prefix}: has {len(tests)} tests, need at least 5")

        # 7. Visible example
        examples = p.get('examples', [])
        if len(examples) < 1:
            errors.append(f"{prefix}: no visible examples")

        # 8. level-1 tag
        if 'level-1' not in p.get('tags', []):
            errors.append(f"{prefix}: missing 'level-1' tag")

        # Check difficulty is Easy
        if p.get('difficulty') != 'Easy':
            errors.append(f"{prefix}: difficulty is '{p.get('difficulty')}' not 'Easy'")

    # Report
    print(f"\nTotal Level 1 test cases: {total_tests}")
    print(f"Expected: {35 * 5} = 175 (minimum)")

    if errors:
        print(f"\n❌ VALIDATION FAILED: {len(errors)} error(s)")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("\n✅ ALL VALIDATION CHECKS PASSED")
        print(f"  - {len(level1)} Level 1 questions")
        print(f"  - {total_tests} test cases")
        print(f"  - {len(level2)} Level 2 questions preserved")
        print(f"  - {len(level3)} Level 3 questions preserved")
        print(f"  - No duplicate slugs")
        print(f"  - All required fields present")
        print(f"  - All tests present")

if __name__ == '__main__':
    main()
