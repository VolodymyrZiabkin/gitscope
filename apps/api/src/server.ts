import { existsSync } from 'node:fs';
import closeWithGrace from 'close-with-grace';
import { buildApp } from './app';
import { loadEnv } from './config/env';

if (existsSync('.env')) process.loadEnvFile('.env');

const env = loadEnv();
const app = await buildApp({ env });

closeWithGrace({ delay: 10_000 }, async ({ signal, err }) => {
  if (err) app.log.error({ err }, 'Shutting down after an unexpected error');
  else app.log.info({ signal }, 'Shutting down');
  await app.close();
});

await app.listen({ host: env.HOST, port: env.PORT });
