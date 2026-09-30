import { BaseRunner, ProcessResult } from './baseRunner.js';
import { getCompilerPath } from './paths.js';

export class JavaRunner extends BaseRunner {
  private javaClass = 'Main';

  public async compile(code: string): Promise<{ success: boolean; error?: string }> {
    await this.initSandbox();

    // If student code doesn't define "public class Main", extract public class name or use Main
    const classMatch = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
    if (classMatch && classMatch[1]) {
      this.javaClass = classMatch[1];
    } else {
      this.javaClass = 'Main';
    }

    await this.writeFile(`${this.javaClass}.java`, code);

    const javacPath = getCompilerPath('javac');
    const compileResult = await this.executeCommand(
      javacPath,
      [`${this.javaClass}.java`],
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
    const javaPath = getCompilerPath('java');
    return this.executeCommand(javaPath, ['-Xmx256m', this.javaClass], input);
  }
}
