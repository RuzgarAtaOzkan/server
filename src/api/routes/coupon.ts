'use strict';

// INTERFACES
import { Document } from 'mongodb';
import { FastifyInstance } from 'fastify';
import { services_i } from 'interfaces/api';
import { options_i } from 'interfaces/common';

// API > MIDDLEWARE
import prevalidation from '../middleware/prevalidation';

// CONFIG
import config from '../../config';

function bind_coupon_routes(
  server: FastifyInstance,
  services: services_i,
  options: options_i
): FastifyInstance {
  // @ Route Options Area
  const routes = [
    // #title: GET PROFILE
    // #state: Public
    // #desc: Check if request has session and user, response: IProfile | null
    {
      method: 'GET',
      url: '/v1' + config.endpoint_coupons,
      handler: async function (request: any, reply: any) {
        const credentials: any = { code: request.query.code };

        try {
          const coupon: Document | null = await services.coupon.get_coupon(
            credentials
          );

          reply.send(coupon);
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

export default bind_coupon_routes;
