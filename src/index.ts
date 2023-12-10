'use strict';

// INITIALIZATION POINT OF THE PROGRAM.

// INTERFACES
import { FastifyInstance } from 'fastify';

// CONFIG
import config from './config';

// LOADERS
import load_server from './loaders';

async function init(): Promise<void> {
  // load_ferver returns a fastify instance with configured routes as well as mongodb database
  const server: FastifyInstance = await load_server();

  await server.listen({ port: Number(config.env.PORT), host: config.env.HOST });

  console.info(`🛡️  Server listening on port: ${config.env.PORT} 🛡️`);
}

init();
