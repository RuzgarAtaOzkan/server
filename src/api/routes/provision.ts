'use strict';

// INTERFACES
import { DeleteResult, Document, UpdateResult } from 'mongodb';
import { FastifyInstance } from 'fastify';
import { services_i } from 'interfaces/api';

// API > MIDDLEWARE
import prevalidation from '../middleware/prevalidation';

// CONFIG
import config from '../../config';

function bind_provision_routes(
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
      url: '/v1' + config.endpoint_provisions,
      handler: async function (request: any, reply: any) {
        const credentials: any = { ...request.query };

        try {
          const provision: Document | null =
            await services.provision.get_provision(credentials);

          reply.send(provision);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'POST',
      url: '/v1' + config.endpoint_provisions,
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ...request.body,
          ip: request.ip,
        };

        try {
          const provision: Document = await services.provision.create_provision(
            credentials
          );

          reply.send(provision);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'POST',
      url: '/v1' + config.endpoint_provisions_payments,
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ...request.body,

          ip: request.ip,
          url: request.url,
        };

        try {
          const result: Document | null = await services.provision.create_order(
            credentials
          );

          reply.send(result);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
  ];

  for (let i = 0; i < routes.length; i++) {
    server.route(routes[i]);
  }

  return server;
}

export default bind_provision_routes;
