'use strict';

// INTERFACES
import { DeleteResult, Document } from 'mongodb';
import { FastifyInstance } from 'fastify';
import { services_i } from 'interfaces/api';

// MIDDLEWARE
import prevalidation from '../middleware/prevalidation';

// CONFIG
import config from '../../config';

function bind_product_routes(
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
      url: '/v1' + config.endpoint_products,
      handler: async function (request: any, reply: any) {
        const credentials: any = { ...request.query };

        try {
          const products: Document[] = await services.product.get_products(
            credentials
          );

          reply.send(products);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'GET',
      url: '/v1' + config.endpoint_products_id,
      handler: async function (request: any, reply: any) {
        const credentials: any = { _id: request.params._id };

        try {
          const product: Document | null = await services.product.get_product(
            credentials
          );

          reply.send(product);
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

export default bind_product_routes;
