import { BaseRunner, ProcessResult } from './baseRunner.js';
import { getCompilerPath } from './paths.js';
import path from 'path';

export class CRunner extends BaseRunner {
  private executablePath = '';

  public async compile(code: string): Promise<{ success: boolean; error?: string }> {
    await this.initSandbox();
    await this.writeFile('solution.c', code);

    const gccPath = getCompilerPath('gcc');
    this.executablePath = path.join(this.sandboxDir, 'solution');

    const compileResult = await this.executeCommand(
      gccPath,
      ['solution.c', '-O2', '-o', 'solution', '-lm'],
      '',
      10000 // 10s compile timeout
    );

    if (compileResult.exitCode !== 0 || compileResult.timedOut) {
      return {
        success: false,
        error: compileResult.stderr || compileResult.stdout || 'Compilation failed',
      };
    }

    return { success: true };
  }

  public async run(input: string): Promise<ProcessResult> {
    return this.executeCommand(this.executablePath, [], input);
  }
}
