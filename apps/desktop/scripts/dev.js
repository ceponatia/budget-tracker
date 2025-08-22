#!/usr/bin/env node
// Dev orchestrator: run Vite (web) and Electron with reload (basic version)
import { spawn } from 'child_process';
import { stat } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function waitForFile(path, timeoutMs = 10000, intervalMs = 150) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await stat(path);
      return true;
    } catch {
      /* not there yet */
    }
    if (Date.now() - start > timeoutMs) return false;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

async function start() {
  const webRoot = join(__dirname, '../../web');
  const vite = await createServer({ root: webRoot, server: { port: 5173 } });
  await vite.listen();
  process.env.VITE_DEV_SERVER_URL = 'http://localhost:5173';

  // Compile TS (main + preload)
  const projectTsconfig = join(__dirname, '../tsconfig.json');
  const distMain = join(__dirname, '../dist/main.js');
  console.log('[desktop-dev] starting tsc watch');
  const tsc = spawn('npx', ['tsc', '-p', projectTsconfig, '--watch', '--preserveWatchOutput'], {
    stdio: 'inherit',
  });

  // Wait for initial compile to produce main.js
  console.log('[desktop-dev] waiting for initial compile...');
  const built = await waitForFile(distMain, 15000);
  if (!built) {
    console.error('[desktop-dev] initial build timed out – dist/main.js not found');
  }
  console.log('[desktop-dev] launching Electron');
  const electron = spawn('npx', ['electron', distMain], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' },
  });

  const cleanup = () => {
    console.log('[desktop-dev] shutting down');
    electron.kill('SIGTERM');
    tsc.kill('SIGTERM');
    vite.close();
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
