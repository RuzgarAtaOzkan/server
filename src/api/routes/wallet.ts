'use strict';

// INTERFACES
import { DeleteResult, Document, UpdateResult } from 'mongodb';
import { FastifyInstance } from 'fastify';
import { services_i } from 'interfaces/api';

// API > MIDDLEWARE
import prevalidation from '../middleware/prevalidation';

// CONFIG
import config from '../../config';

function bind_wallet_routes(
  server: FastifyInstance,
  services: services_i,
  options: any
): FastifyInstance {
  // @ Route Options Area
  const routes = [
    // #title: GET PROFILE
    // #state: Public
    // #desc: Check if request has session and user, response: IProfile | null
    {
      method: 'GET',
      url: '/v1' + config.endpoint_wallets,
      handler: async function (request: any, reply: any) {
        const credentials: any = { ...request.query };

        try {
          const wallet: Document = await services.wallet.get_wallet(
            credentials
          );

          reply.send(wallet);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'POST',
      url: '/v1' + config.endpoint_wallets,
      handler: async function (request: any, reply: any) {
        const credentials: any = { ...request.body, ip: request.ip };

        try {
          const wallet: Document | void = await services.wallet.create_wallet(
            credentials
          );

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
