import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const MAMBA_BIN = '/home/nandha/tools/env/bin';

export function getCompilerPath(tool: 'gcc' | 'g++' | 'javac' | 'java' | 'python3'): string {
  // Check conda/micromamba env first
  const mambaTool = path.join(MAMBA_BIN, tool);
  if (fs.existsSync(mambaTool)) {
    return mambaTool;
  }

  // Also check x86_64 prefixed compiler names (e.g. x86_64-conda-linux-gnu-gcc)
  if (tool === 'gcc') {
    const alias = path.join(MAMBA_BIN, 'x86_64-conda-linux-gnu-gcc');
    if (fs.existsSync(alias)) return alias;
  }
  if (tool === 'g++') {
    const alias = path.join(MAMBA_BIN, 'x86_64-conda-linux-gnu-g++');
    if (fs.existsSync(alias)) return alias;
  }

  // Check system PATH
  try {
    const sysPath = execSync(`which ${tool}`, { encoding: 'utf8' }).trim();
    if (sysPath && fs.existsSync(sysPath)) {
      return sysPath;
    }
  } catch {
    // ignore
  }

  // Fallback defaults
  if (tool === 'python3') return '/usr/bin/python3';
  return tool;
}
