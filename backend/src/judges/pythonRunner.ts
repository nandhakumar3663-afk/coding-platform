import { BaseRunner, ProcessResult } from './baseRunner.js';
import { getCompilerPath } from './paths.js';

export class PythonRunner extends BaseRunner {
  public async compile(code: string): Promise<{ success: boolean; error?: string }> {
    await this.initSandbox();
    await this.writeFile('solution.py', code);

    const pythonPath = getCompilerPath('python3');
    // Pre-check syntax via py_compile
    const checkResult = await this.executeCommand(
      pythonPath,
      ['-m', 'py_compile', 'solution.py'],
      '',
      5000
    );

    if (checkResult.exitCode !== 0) {
      return {
        success: false,
        error: checkResult.stderr || checkResult.stdout || 'Syntax Error',
      };
    }

    return { success: true };
  }

  public async run(input: string): Promise<ProcessResult> {
    const pythonPath = getCompilerPath('python3');
    return this.executeCommand(pythonPath, ['solution.py'], input);
  }
}
