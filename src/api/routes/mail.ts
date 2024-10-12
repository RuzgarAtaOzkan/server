'use strict';

// TYPES
import { FastifyInstance } from 'fastify';
import { routes_i, services_i } from 'interfaces/api';

// API > MIDDLEWARE
import mw_prevalidation from '../middleware/prevalidation';

// CONFIG
import config from '../../config';

function bind_mail_routes(
  server: FastifyInstance,
  services: services_i,
  options: any
): FastifyInstance {
  // @ Route Options Area
  const routes: routes_i = {
    send_verification_link: {
      method: 'POST',
      url: '/v1' + config.endpoints.mail_send_verification_link,
      preValidation: async function (request: any, reply: any) {
        const is_auth: boolean = await mw_prevalidation.is_auth(
          request,
          options
        );

        if (!is_auth) {
          reply.status(401).send('unauthorized');
          return;
        }

        return;
      },
      handler: async function (request: any, reply: any) {
        try {
          await services.mail.resend_verification_link(request.body.email);

          reply.send(true);
        } catch (error) {
          reply.status(422).send(error);
        }
      },
    },

    send_password_reset_link: {
      method: 'POST',
      url: '/v1' + config.endpoints.mail_send_password_reset_link,
      handler: async function (request: any, reply: any) {
        try {
          await services.mail.send_password_reset_link(request.body.email);

          reply.send(true);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
  };

  for (const key in routes) {
    server.route(routes[key]);
  }

  return server;
}

export default bind_mail_routes;
