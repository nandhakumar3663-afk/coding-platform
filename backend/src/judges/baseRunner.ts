import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
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
    await fs.promises.mkdir(this.sandboxDir, { recursive: true });
  }

  public async cleanup(): Promise<void> {
    try {
      await fs.promises.rm(this.sandboxDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  }

  public async writeFile(fileName: string, content: string): Promise<string> {
    const filePath = path.join(this.sandboxDir, fileName);
    await fs.promises.writeFile(filePath, content, 'utf8');
    return filePath;
  }

  private terminateProcess(child: ChildProcess): void {
    if (!child.pid || child.killed) return;

    try {
      if (process.platform !== 'win32') {
        // Each judge command is launched in its own process group on POSIX.
        // Killing the group also stops descendants left behind by submitted code.
        process.kill(-child.pid, 'SIGKILL');
      } else {
        child.kill('SIGKILL');
      }
    } catch {
      try {
        child.kill('SIGKILL');
      } catch {
        // The process may already have exited.
      }
    }
  }

  protected executeCommand(
    command: string,
    args: string[],
    input = '',
    timeoutOverride?: number
  ): Promise<ProcessResult> {
    return new Promise((resolve) => {
      // A zero timeout is invalid; use the normal configured limit instead.
      const requestedTimeout = timeoutOverride ?? this.timeoutMs;
      const timeout = Number.isFinite(requestedTimeout) && requestedTimeout > 0
        ? requestedTimeout
        : this.timeoutMs;
      const startTime = process.hrtime.bigint();
      let stdoutData = '';
      let stderrData = '';
      let timedOut = false;
      let settled = false;

      const mambaPath = fs.existsSync('/home/nandha/tools/env/bin') ? '/home/nandha/tools/env/bin:' : '';
      const env = {
        ...process.env,
        PATH: `${mambaPath}${process.env.PATH || ''}`,
      };

      const child = spawn(command, args, {
        cwd: this.sandboxDir,
        env,
        detached: process.platform !== 'win32',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const finish = (exitCode: number | null, extraStderr = '') => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        const executionTimeMs = Number((process.hrtime.bigint() - startTime) / BigInt(1_000_000));
        resolve({
          stdout: stdoutData,
          stderr: stderrData + extraStderr,
          exitCode,
          executionTimeMs,
          // Memory accounting is not implemented; do not claim the configured
          // limit was measured or enforced.
          memoryUsedKb: 0,
          timedOut,
        });
      };

      let timer: NodeJS.Timeout | null = setTimeout(() => {
        timedOut = true;
        this.terminateProcess(child);
      }, timeout);

      child.stdin?.on('error', () => {
        // Submitted programs are allowed to exit without consuming all stdin.
      });
      child.stdin?.setDefaultEncoding('utf-8');
      if (input) child.stdin?.write(input);
      child.stdin?.end();

      child.stdout?.on('data', (data: Buffer | string) => {
        // Continue draining the pipe even after the cap so a noisy process does
        // not block forever when its output is larger than the retained result.
        const remaining = 2 * 1024 * 1024 - Buffer.byteLength(stdoutData);
        if (remaining > 0) stdoutData += Buffer.from(data).subarray(0, remaining).toString();
      });

      child.stderr?.on('data', (data: Buffer | string) => {
        const remaining = 512 * 1024 - Buffer.byteLength(stderrData);
        if (remaining > 0) stderrData += Buffer.from(data).subarray(0, remaining).toString();
      });

      child.once('error', (err) => finish(1, (stderrData ? '\n' : '') + err.message));
      child.once('close', (code) => finish(code));
    });
  }
}
