import { buildApp } from './app.js';
import { config } from './config.js';

async function start(): Promise<void> {
  const app = await buildApp();

  try {
    await app.listen({
      host: config.HOST,
      port: config.PORT,
    });
    app.log.info(`🚀 Server listening on http://${config.HOST}:${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async (signal: string): Promise<void> => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
