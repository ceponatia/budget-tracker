/** Thin server bootstrap delegating to modular app (post-refactor). */
// eslint-disable-next-line import/no-named-as-default-member
import * as express from 'express';
import { createApp } from './app.js';
import { loadConfig } from '@budget/config';
import { logger } from '@budget/logging';

export function createServer(): express.Express {
  return createApp();
}

if (process.env.NODE_ENV !== 'test') {
  const cfg = loadConfig();
  const port: number = cfg.PORT;
  const app = createApp();
  app.listen(port, () => {
    logger.child().info('api.start', { port });
  });
}
