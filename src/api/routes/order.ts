'use strict';

// INTERFACES
import { DeleteResult, Document, UpdateResult } from 'mongodb';
import { FastifyInstance } from 'fastify';
import { services_i } from 'interfaces/api';

// API > MIDDLEWARE
import prevalidation from '../middleware/prevalidation';

// CONFIG
import config from '../../config';

function bind_order_routes(
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
      url: '/v1' + config.endpoint_orders,
      preValidation: async function (request: any, reply: any): Promise<void> {
        await prevalidation.validate_user(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = { ...request.query, user: request.user };

        try {
          const orders: Document[] = await services.order.get_orders(
            credentials
          );

          reply.send(orders);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'GET',
      url: '/v1' + config.endpoint_orders_delivery,
      handler: async function (request: any, reply: any) {
        const credentials: any = { code: request.params.code };

        try {
          const order: Document = await services.order.deliver_orders(
            credentials
          );

          reply.send(order);
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

export default bind_order_routes;
