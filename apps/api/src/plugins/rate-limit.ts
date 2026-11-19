import { timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import rateLimit, { normalizeIP } from '@fastify/rate-limit';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { tooManyRequests } from '../lib/errors';

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Server-side requests from the Next.js app all come from the same hosting IPs, so the web app forwards the real
 * client IP in `x-client-ip`. The header is trusted only together with the shared `x-internal-key` —
 * otherwise anyone could pick a fresh IP for every request and bypass the limit.
 */
export function resolveClientKey(request: FastifyRequest, internalApiKey: string | undefined): string {
  const providedKey = request.headers['x-internal-key'];
  const clientIp = request.headers['x-client-ip'];
  const trusted =
    internalApiKey !== undefined &&
    typeof providedKey === 'string' &&
    typeof clientIp === 'string' &&
    isIP(clientIp) !== 0 &&
    safeEqual(providedKey, internalApiKey);
  return normalizeIP(trusted ? clientIp : request.ip);
}

export async function registerRateLimit(
  app: FastifyInstance,
  { max, internalApiKey }: { max: number; internalApiKey: string | undefined },
): Promise<void> {
  await app.register(rateLimit, {
    max,
    timeWindow: '1 minute',
    keyGenerator: (request) => resolveClientKey(request, internalApiKey),
    errorResponseBuilder: (_request, context) => tooManyRequests(Math.max(1, Math.ceil(context.ttl / 1000))),
  });
}
