'use strict';

// INTERFACES
import { Document } from 'mongodb';
import { FastifyInstance } from 'fastify';
import { services_i } from 'interfaces/api';
import { options_i } from 'interfaces/loaders';

// CONFIG
import config from '../../config';

function bind_wallet_routes(
  server: FastifyInstance,
  services: services_i,
  options: options_i,
): FastifyInstance {
  const routes = [
    {
      method: 'GET',
      url: config.endpoint_wallets,
      handler: async function (request: any, reply: any) {
        const credentials: any = { ...request.query };

        try {
          const wallet: Document =
            await services.wallet.get_wallet(credentials);

          reply.send(wallet);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'POST',
      url: config.endpoint_wallets,
      handler: async function (request: any, reply: any) {
        const credentials: any = { ...request.body, ip: request.ip };

        try {
          const wallet: Document =
            await services.wallet.create_wallet(credentials);

          reply.send(wallet);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
  ];

  for (let i: number = 0; i < routes.length; i++) {
    server.route(routes[i]);
  }

  return server;
}

export default bind_wallet_routes;
