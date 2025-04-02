'use strict';

// MODULES
import Fastify, { FastifyInstance } from 'fastify';
import fastify_helmet from '@fastify/helmet';
import fastify_cookie from '@fastify/cookie';
import fastify_cors from '@fastify/cors';
import fastify_rate_limit from '@fastify/rate-limit';
import fastify_static from '@fastify/static';

// INTERFACES
import { options_i } from 'interfaces/common';

// API
import bind_routes from '../api';

// CONFIG
import config from '../config';

export async function load_fastify(
  options: options_i
): Promise<FastifyInstance> {
  // FASTIFY SERVER INSTANCE CONFIGURATIONS

  const server: FastifyInstance = Fastify({
    maxParamLength: 256, // url param length
    trustProxy: true, // for NGINX or any other proxy server
    bodyLimit: 500000, // no data more than 500kb is allowed in one request
    logger: {
      // pino logger module by default
      level: 'info',
      file: process.cwd() + '/logs.log',
    },
  });

  await server.register(fastify_helmet, { global: true });

  await server.register(fastify_static, {
    root: process.cwd(),
    prefix: '/', // optional: default '/'
    constraints: { host: config.ENV_URL_UI }, // optional: default {}
  });

  await server.register(fastify_cors, {
    credentials: true,
    origin: [config.ENV_URL_UI, config.ENV_URL_UI_LOCAL],
  });

  await server.register(fastify_cookie, {
    secret: config.ENV_SESSION_SECRET,
    parseOptions: {},
  });

  await server.register(fastify_rate_limit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // server.addHook('onRequest', async (request, reply) => {});

  bind_routes(server, options);

  await server.listen({ port: config.ENV_PORT, host: config.ENV_HOST });

  return server;
}

export default load_fastify;
