'use strict';

// TYPES
import { FastifyInstance } from 'fastify';
import { routes_i, services_i } from 'interfaces/api';

// API > MIDDLEWARE
import mw from '../../middleware';
import mw_auth from '../../middleware/auth';

// API > SCHEMAS
import schemas from '../../schemas';

// CONFIG
import config from '../../../config';

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
      preValidation: mw.prevalidation(mw_auth.is_auth, options),
      handler: async function (request: any, reply: any) {
        try {
          await services.mail.resend_verification_link(request.body.email);

          const response = {
            success: true,
            message: 'Successfully sent email verification link',
          };

          reply.send(response);
        } catch (error) {
          reply.status(422).send(error);
        }
      },
    },

    send_password_reset_link: {
      method: 'POST',
      url: '/v1' + config.endpoints.mail_send_password_reset_link,
      preValidation: mw.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        try {
          await services.mail.send_password_reset_link(request.body.email);

          const response = {
            success: true,
            message: 'Successfully sent password reset link',
          };

          reply.send(response);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    subscriptions: {
      method: 'POST',
      url: '/v1' + config.endpoints.mail_subscriptions,
      preValidation: mw.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        const credentials = {
          ...request.body,
        };

        try {
          await services.mail.add_subscription_email(credentials);

          const response = {
            success: true,
            message: 'Successfully subscribed with email',
          };

          reply.send(response);
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
