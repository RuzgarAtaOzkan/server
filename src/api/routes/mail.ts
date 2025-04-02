'use strict';

// INTERFACES
import { FastifyInstance } from 'fastify';
import { routes_i, services_i } from 'interfaces/api';
import { options_i } from 'interfaces/common';

// API > MIDDLEWARE
import prevalidation from '../middleware/prevalidation';

// CONFIG
import config from '../../config';

function bind_mail_routes(
  server: FastifyInstance,
  services: services_i,
  options: options_i
): FastifyInstance {
  // @ Route Options Area
  const routes: routes_i = {
    mail_verification_link: {
      method: 'POST',
      url: '/v1' + config.endpoint_mail_verification_link,
      preValidation: async function (request, reply): Promise<void> {
        await prevalidation.validate_user(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          email: request.body.email,
          user: request.user,
        };

        try {
          await services.mail.resend_verification_link(credentials);

          reply.send(true);
        } catch (error) {
          reply.status(422).send(error);
        }
      },
    },

    mail_password_reset_link: {
      method: 'POST',
      url: '/v1' + config.endpoint_mail_password_reset_link,
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          email: request.body.email,
        };

        try {
          await services.mail.send_password_reset_link(credentials);

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
