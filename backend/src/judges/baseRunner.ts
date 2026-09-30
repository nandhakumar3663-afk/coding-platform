import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

export interface ProcessResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTimeMs: number;
  memoryUsedKb: number;
  timedOut: boolean;
}

export abstract class BaseRunner {
  protected sandboxDir: string;
  protected timeoutMs: number;
  protected memoryLimitMb: number;

  constructor(timeoutMs = 2500, memoryLimitMb = 256) {
    this.sandboxDir = path.join(os.tmpdir(), 'coding-sandbox-' + uuidv4());
    this.timeoutMs = timeoutMs;
    this.memoryLimitMb = memoryLimitMb;
  }

  public async initSandbox(): Promise<void> {
    if (!fs.existsSync(this.sandboxDir)) {
      await fs.promises.mkdir(this.sandboxDir, { recursive: true });
    }
  }

  public async cleanup(): Promise<void> {
    try {
      if (fs.existsSync(this.sandboxDir)) {
        await fs.promises.rm(this.sandboxDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup error
    }
  }

  public async writeFile(fileName: string, content: string): Promise<string> {
    const filePath = path.join(this.sandboxDir, fileName);
    await fs.promises.writeFile(filePath, content, 'utf8');
    return filePath;
  }

  protected executeCommand(
    command: string,
    args: string[],
    input = '',
    timeoutOverride?: number
  ): Promise<ProcessResult> {
    return new Promise((resolve) => {
      const timeout = timeoutOverride || this.timeoutMs;
      const startTime = process.hrtime.bigint();
      let stdoutData = '';
      let stderrData = '';
      let timedOut = false;
      let memoryUsedKb = 0;

      // Ensure PATH includes the micromamba env bin if present
      const mambaPath = fs.existsSync('/home/nandha/tools/env/bin') ? '/home/nandha/tools/env/bin:' : '';
      const env = {
        ...process.env,
        PATH: `${mambaPath}${process.env.PATH || ''}`,
      };

      const child = spawn(command, args, {
        cwd: this.sandboxDir,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let timer: NodeJS.Timeout | null = setTimeout(() => {
        timedOut = true;
        try {
          child.kill('SIGKILL');
        } catch {
          // ignore
        }
      }, timeout);

      if (child.stdin) {
        child.stdin.on('error', () => { /* A program may exit without reading stdin. */ });
        child.stdin.setDefaultEncoding('utf-8');
        if (input) {
          child.stdin.write(input);
        }
        child.stdin.end();
      }

      if (child.stdout) {
        child.stdout.on('data', (data) => {
          if (stdoutData.length < 2 * 1024 * 1024) {
            stdoutData += data.toString();
          }
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data) => {
          if (stderrData.length < 512 * 1024) {
            stderrData += data.toString();
          }
        });
      }

      child.on('close', (code) => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }

        const endTime = process.hrtime.bigint();
        const executionTimeMs = Number((endTime - startTime) / BigInt(1_000_000));

        // Basic memory estimate
        memoryUsedKb = 0;

        resolve({
          stdout: stdoutData,
          stderr: stderrData,
          exitCode: code,
          executionTimeMs,
          memoryUsedKb,
          timedOut,
        });
      });

      child.on('error', (err) => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        const endTime = process.hrtime.bigint();
        const executionTimeMs = Number((endTime - startTime) / BigInt(1_000_000));

        resolve({
          stdout: stdoutData,
          stderr: (stderrData ? stderrData + '\n' : '') + err.message,
          exitCode: 1,
          executionTimeMs,
          memoryUsedKb,
          timedOut,
        });
      });
    });
  }
}
