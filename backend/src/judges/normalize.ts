/**
 * Normalizes program output and compares it against expected output
 * adhering to competitive programming rules:
 * - Trims carriage returns (\r\n -> \n)
 * - Trims trailing whitespace on each line
 * - Trims trailing empty lines
 * - Handles flexible whitespace between tokens when appropriate
 */
export function normalizeOutput(output: string): string {
  if (!output) return '';
  return output
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trimEnd();
}

export function compareOutputs(actual: string, expected: string): boolean {
  const normActual = normalizeOutput(actual);
  const normExpected = normalizeOutput(expected);

  if (normActual === normExpected) {
    return true;
  }

  // Token-level comparison fallback (e.g. difference in trailing spaces or intermediate spaces between numbers)
  const actualLines = normActual.split('\n');
  const expectedLines = normExpected.split('\n');

  if (actualLines.length !== expectedLines.length) {
    return false;
  }

  for (let i = 0; i < actualLines.length; i++) {
    const actTokens = actualLines[i].trim().split(/\s+/).filter(Boolean);
    const expTokens = expectedLines[i].trim().split(/\s+/).filter(Boolean);

    if (actTokens.length !== expTokens.length) {
      return false;
    }

    for (let j = 0; j < actTokens.length; j++) {
      if (actTokens[j] !== expTokens[j]) {
        // Also check numerical float tolerance if both are valid numbers
        const actNum = Number(actTokens[j]);
        const expNum = Number(expTokens[j]);
        if (!isNaN(actNum) && !isNaN(expNum) && Math.abs(actNum - expNum) <= 1e-4) {
          continue;
        }
        return false;
      }
    }
  }

  return true;
}
