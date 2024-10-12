'use strict';

// INTERFACES
import { Document } from 'mongodb';
import { FastifyInstance } from 'fastify';
import { routes_i, services_i } from 'interfaces/api';

// API > MIDDLEWARE
import mw_prevalidation from '../middleware/prevalidation';

// CONFIG
import config from '../../config';

function bind_coupon_routes(
  server: FastifyInstance,
  services: services_i,
  options: any
): FastifyInstance {
  // @ Route Options Area
  const routes: routes_i = {
    // #title: GET PROFILE
    // #state: Public
    // #desc: Check if request has session and user, response: IProfile | null
    coupons: {
      method: 'GET',
      url: '/v1' + config.endpoints.coupons,
      preValidation: async function (request, reply) {
        const is_admin: boolean = await mw_prevalidation.is_admin(
          request,
          options
        );

        if (!is_admin) {
          reply.status(401).send('unauthorized');
          return;
        }

        return;
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = { query: request.query };

        try {
          const coupons: any = await services.coupon.get_coupons(credentials);

          reply.send(coupons);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    coupons_create: {
      method: 'POST',
      url: '/v1' + config.endpoints.coupons,
      preValidation: async function (request, reply) {
        const is_admin: boolean = await mw_prevalidation.is_admin(
          request,
          options
        );

        if (!is_admin) {
          reply.status(401).send('unauthorized');

          return;
        }

        return;
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = { ...request.body };

        try {
          const result = await services.coupon.create_coupon(credentials);

          reply.send(result);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
  };

  // Route them in fastify
  for (const key in routes) {
    server.route(routes[key]);
  }

  return server;
}

export default bind_coupon_routes;
