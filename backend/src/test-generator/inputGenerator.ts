export interface GeneratedInput {
  input: string;
  type: 'basic' | 'valid' | 'edge' | 'large' | 'special';
  description: string;
}

// Built-in smart generators for known problems and generic fallback
export function generateTestInputsForProblem(
  slug: string,
  constraints?: string,
  sampleInputs: string[] = []
): GeneratedInput[] {
  // If problem has dedicated smart cases based on mathematical domain
  const smartCases = problemSpecificInputs[slug];
  if (smartCases && smartCases.length >= 5) {
    return smartCases;
  }

  // Fallback: Rule-based generator from sample inputs & constraints
  const inputs: GeneratedInput[] = [];

  // Case 1: Basic (from sample 1 or small positive)
  const basic = sampleInputs[0] ? sampleInputs[0].trim() : '5';
  inputs.push({
    input: basic,
    type: 'basic',
    description: 'Basic normal case',
  });

  // Case 2: Different valid (from sample 2 or variation)
  const valid = sampleInputs[1] ? sampleInputs[1].trim() : '12';
  inputs.push({
    input: valid,
    type: 'valid',
    description: 'Second valid test case with different characteristics',
  });

  // Case 3: Edge case (boundary condition: 1, 0, or min)
  inputs.push({
    input: '1',
    type: 'edge',
    description: 'Boundary minimum valid condition',
  });

  // Case 4: Large / Stress case
  inputs.push({
    input: '100',
    type: 'large',
    description: 'Stress input to test algorithmic efficiency',
  });

  // Case 5: Special case (zero, negative, or special value)
  inputs.push({
    input: '0',
    type: 'special',
    description: 'Special edge case (zeros or identity boundary)',
  });

  return inputs;
}

const problemSpecificInputs: Record<string, GeneratedInput[]> = {
  'fibonacci-series': [
    { input: '5', type: 'basic', description: 'Small n = 5' },
    { input: '7', type: 'valid', description: 'n = 7 producing multiple Fibonacci terms' },
    { input: '1', type: 'edge', description: 'Boundary case n = 1' },
    { input: '20', type: 'large', description: 'Larger n = 20 testing sequence growth' },
    { input: '-5', type: 'special', description: 'Negative input handling Invalid Input' },
  ],
  'smallest-prime-number': [
    { input: '10', type: 'basic', description: 'n = 10, next 5 primes' },
    { input: '20', type: 'valid', description: 'n = 20, next 5 primes' },
    { input: '1', type: 'edge', description: 'Boundary case n = 1' },
    { input: '99', type: 'large', description: 'n = 99, 3-digit prime search' },
    { input: '2', type: 'special', description: 'Smallest prime boundary n = 2' },
  ],
  'prime-or-composite-number': [
    { input: '7', type: 'basic', description: 'Prime number 7' },
    { input: '12', type: 'valid', description: 'Even composite number 12' },
    { input: '2', type: 'edge', description: 'Smallest prime 2' },
    { input: '97', type: 'large', description: 'Largest two-digit prime 97' },
    { input: '121', type: 'special', description: 'Square of prime 11*11 composite' },
  ],
  'series-sum-calculator': [
    { input: '3\n4', type: 'basic', description: 'Next term 3, 4 terms' },
    { input: '5\n3', type: 'valid', description: 'Next term 5, 3 terms' },
    { input: '1\n1', type: 'edge', description: 'Single term 1' },
    { input: '9\n5', type: 'large', description: 'Larger terms 9 with 5 repetitions' },
    { input: '7\n2', type: 'special', description: 'Two terms series 7 + 77' },
  ],
  'divisor-sum-and-equality-checker': [
    { input: '6', type: 'basic', description: 'First perfect number 6' },
    { input: '42', type: 'valid', description: 'Non-perfect number 42' },
    { input: '28', type: 'edge', description: 'Second perfect number 28' },
    { input: '496', type: 'large', description: 'Three-digit perfect number 496' },
    { input: '25', type: 'special', description: 'Odd non-equal square number 25' },
  ],
  'abundant-number': [
    { input: '12', type: 'basic', description: 'Smallest abundant number 12' },
    { input: '18', type: 'valid', description: 'Abundant number 18' },
    { input: '7', type: 'edge', description: 'Prime non-abundant number 7' },
    { input: '90', type: 'large', description: 'Highly composite abundant number 90' },
    { input: '13', type: 'special', description: 'Odd prime non-abundant 13' },
  ],
  'leap-and-non-leap-years': [
    { input: '2022', type: 'basic', description: 'Non-leap year 2022' },
    { input: '2020', type: 'valid', description: 'Leap year 2020' },
    { input: '2000', type: 'edge', description: 'Century leap year 2000' },
    { input: '2400', type: 'large', description: 'Future century leap year 2400' },
    { input: '1900', type: 'special', description: 'Century non-leap year 1900' },
  ],
  'geometric-series-sum-calculator': [
    { input: '6', type: 'basic', description: '6 terms geometric sum' },
    { input: '3', type: 'valid', description: '3 terms geometric sum' },
    { input: '1', type: 'edge', description: '1 term boundary' },
    { input: '15', type: 'large', description: '15 terms converging towards 2.00' },
    { input: '-3', type: 'special', description: 'Negative input yielding 0.00' },
  ],
  'sum-of-squares-of-n-natural-numbers': [
    { input: '5', type: 'basic', description: '5 terms sum of squares' },
    { input: '10', type: 'valid', description: '10 terms sum of squares' },
    { input: '1', type: 'edge', description: '1 term minimum' },
    { input: '50', type: 'large', description: '50 terms stress sum' },
    { input: '0', type: 'special', description: '0 boundary value' },
  ],
  'harmonic-series': [
    { input: '5', type: 'basic', description: '5 terms harmonic series' },
    { input: '4', type: 'valid', description: '4 terms harmonic series' },
    { input: '1', type: 'edge', description: '1 term boundary = 1.00' },
    { input: '20', type: 'large', description: '20 terms harmonic expansion' },
    { input: '-1', type: 'special', description: 'Invalid negative input' },
  ],
  'digits-count': [
    { input: '1234', type: 'basic', description: '4 digits standard number' },
    { input: '798456', type: 'valid', description: '6 digits number' },
    { input: '7', type: 'edge', description: 'Single digit boundary' },
    { input: '987654321', type: 'large', description: 'Large 9 digits number' },
    { input: '0', type: 'special', description: 'Zero single digit' },
  ],
  'reverse-the-digits': [
    { input: '1234', type: 'basic', description: '4 digits reversal' },
    { input: '98765', type: 'valid', description: '5 digits reversal' },
    { input: '7', type: 'edge', description: 'Single digit 7' },
    { input: '100000', type: 'large', description: 'Trailing zeros reversal' },
    { input: '5020', type: 'special', description: 'Intermediate zeros 5020' },
  ],
};
