/**
 * HTTP server entrypoint.
 *
 * What: Loads config, creates the Express app, and listens on PORT.
 * Why: Separated from app.ts so tests can import the app without binding a port.
 */

import { createApp } from './app';
import { config } from './config';
import { prisma } from './lib/prisma';

const app = createApp();

async function main() {
  await prisma.$connect();

  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port} (${config.nodeEnv})`);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
