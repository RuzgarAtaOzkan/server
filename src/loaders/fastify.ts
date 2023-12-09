'use strict';

// MODULES
import Fastify, { FastifyInstance } from 'fastify';
import fastify_cookie from '@fastify/cookie';
import fastify_cors from '@fastify/cors';
import fastify_helmet from '@fastify/helmet';
import fastify_rate_limit from '@fastify/rate-limit';

// API
import bind_routes from '../api';

// CONFIG
import config from '../config';

async function load_fastify(options: any): Promise<FastifyInstance> {
  // FASTIFY SERVER INSTANCE CONFIGURATIONS

  const server: FastifyInstance = Fastify({
    maxParamLength: 256, // url param length
    trustProxy: true, // for NGINX
    bodyLimit: 2097152, // no data more than 2mb is allowed in one request
    logger: {
      // pino module by default
      level: 'info',
      file: __dirname + '/../../' + 'logs.log',
    },
  });

  await server.register(fastify_cors, {
    credentials: true, // cookie acceptance
    origin: [
      'https://' + config.env.URL_UI,
      'https://www.' + config.env.URL_UI,
      'https://admin.' + config.env.URL_UI,
      'https://profile.' + config.env.URL_UI,
    ],
  });

  // fastify middleware plugin registrations

  await server.register(fastify_helmet);
  await server.register(fastify_cookie, {
    secret: config.env.SESSION_SECRET,
    parseOptions: {},
  });

  await server.register(fastify_rate_limit, {
    max: 100,
    timeWindow: '1 minute',
  });

  server.addHook('onRequest', async (request, reply) => {});

  bind_routes(server, options);

  return server;
}

export default load_fastify;
