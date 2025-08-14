#!/usr/bin/env node
// Dev orchestrator: run Vite (web) and Electron with reload (basic version)
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function start() {
  const webRoot = join(__dirname, '../../web');
  const vite = await createServer({ root: webRoot, server: { port: 5173 } });
  await vite.listen();
  process.env.VITE_DEV_SERVER_URL = 'http://localhost:5173';

  // Compile TS (main + preload)
  const tsc = spawn('npx', ['tsc', '-p', join(__dirname, '../tsconfig.json'), '--watch'], {
    stdio: 'inherit',
  });

  const electron = spawn('npx', ['electron', join(__dirname, '../dist/main.js')], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' },
  });

  const cleanup = () => {
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
