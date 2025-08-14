#!/usr/bin/env node
// Simple runtime config validation (T-018) - loads config module.
try {
  const { loadConfig } = require('../packages/config/dist/src/index.js');
  const cfg = loadConfig();
  // minimal assertion to ensure secret not default in production
  if (cfg.NODE_ENV === 'production' && cfg.JWT_SECRET === 'dev-secret-change') {
    console.error('CONFIG_CHECK_FAIL: In production with default JWT_SECRET');
    process.exit(1);
  }
  console.log('CONFIG_CHECK_OK');
} catch (e) {
  console.error('CONFIG_CHECK_FAIL:', e && e.message ? e.message : e);
  process.exit(1);
}
