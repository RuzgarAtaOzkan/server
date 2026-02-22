'use strict';

// INTERFACES
import { FastifyInstance } from 'fastify';
import { services_i } from 'interfaces/api';
import { options_i } from 'interfaces/common';

// API > MIDDLEWARE
import prevalidation from '../middleware/prevalidation';

// CONFIG
import config from '../../config';

function bind_review_routes(
  server: FastifyInstance,
  services: services_i,
  options: options_i
): FastifyInstance {
  // @ Route Options Area
  const routes = [
    {
      method: 'POST',
      url: '/v1' + config.endpoint_reviews,
      preValidation: async function (request: any, reply: any): Promise<void> {
        await prevalidation.validate_user(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ...request.body,
          user: request.user,
          ip: request.ip,
        };

        try {
          const result = await services.review.create(credentials);

          reply.send(result);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'PATCH',
      url: '/v1' + config.endpoint_reviews,
      preValidation: async function (request: any, reply: any): Promise<void> {
        await prevalidation.validate_user(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ...request.body,

          user: request.user,
          ip: request.ip,
        };

        try {
          const result = await services.review.edit(credentials);

          reply.send(result);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'GET',
      url: '/v1' + config.endpoint_reviews,
      preValidation: async function (request: any, reply: any): Promise<void> {
        // await prevalidation.validate_user(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          product_id: request.query.product_id,
          user: request.user,
          ip: request.ip,
        };

        try {
          const result = await services.review.get(credentials);

          reply.send(result);
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

export default bind_review_routes;
