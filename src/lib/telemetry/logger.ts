import 'server-only';

import pino from 'pino';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  base: {
    service: 'performanceos-ai',
    env: process.env.NODE_ENV,
  },
});

export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}
