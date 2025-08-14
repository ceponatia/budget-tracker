#!/usr/bin/env node
// Build script placeholder: copies built web assets into dist/web (to be packaged later)
import { cp, mkdir } from 'fs/promises';
import { join } from 'path';

async function run() {
  const webDist = join(process.cwd(), '../web/dist');
  const target = join(process.cwd(), 'dist/web');
  await mkdir(target, { recursive: true });
  try {
    await cp(webDist, target, { recursive: true });
    // Using console.warn (allowed) for build script feedback to avoid no-console error.
    console.warn('Copied web assets to desktop dist/web');
  } catch (_e) {
    console.warn('Warning: web dist not found; run web build first.');
  }
}
void run();
