import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

/** OpenAPI document generated from the same Zod schemas that validate requests and responses. */
export async function registerSwagger(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'GitScope API',
        version: '1.0.0',
        description: 'GitHub profile analytics. Errors use RFC 9457 problem details with a machine-readable `code`.',
      },
      tags: [
        { name: 'users', description: 'GitHub user analytics' },
        { name: 'system', description: 'Service status' },
      ],
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/docs', uiConfig: { validatorUrl: null } });
}
