'use strict';

// INTERFACES
import { FastifyInstance } from 'fastify';
import { services_i } from 'interfaces/api';
import { options_i } from 'interfaces/common';

// API/MIDDLEWARE
import prevalidation from '../middleware/prevalidation';

// CONFIG
import config from '../../config';

function bind_user_routes(
  server: FastifyInstance,
  services: services_i,
  options: options_i,
): FastifyInstance {
  const routes = [
    {
      method: 'POST',
      url: '/v1' + config.endpoint_user_signup,
      handler: async function (request: any, reply: any) {
        const credentials: any = { ...request.body, ip: request.ip };

        try {
          const result = await services.user.signup(credentials);

          await services.mail.send_verification_link({
            email: result.profile.email,
            code: result.email_verification_code,
          });

          reply
            .setCookie(config.ENV_COOKIE_NAME, result.cookie_value, {
              sameSite: 'none',
              // domain: config.ENV_URL_UI.split("://")[1]
              httpOnly: true,
              secure: true,
              path: '/',
              expires: result.cookie_expires,
              priority: 'high',
            })
            .send(result.profile);
        } catch (err) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'POST',
      url: '/v1' + config.endpoint_user_signin,
      handler: async function (request: any, reply: any) {
        const credentials = {
          ...request.body,
          ip: request.ip,
        };

        try {
          const result = await services.user.signin(credentials);

          reply
            .setCookie(config.ENV_COOKIE_NAME, result.cookie_value, {
              sameSite: 'none',
              // domain: config.ENV_URL_UI.split("://")[1]
              httpOnly: true,
              secure: true,
              path: '/',
              expires: result.cookie_expires,
              priority: 'high',
            })
            .send(result.profile);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'GET',
      url: '/v1' + config.endpoint_user_email_verify,
      handler: async function (request: any, reply: any) {
        const credentials: any = { code: request.params.code };

        try {
          const user = await services.user.verify_email(credentials);

          reply.send(user);
        } catch (error) {
          reply.status(422).send(error);
        }
      },
    },
    {
      method: 'GET',
      url: '/v1' + config.endpoint_user_profile,
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          sid: request.cookies[config.ENV_COOKIE_NAME],
          ip: request.ip,
        };

        try {
          const result = await services.user.get_profile(credentials);

          reply
            .setCookie(config.ENV_COOKIE_NAME, result.cookie_value, {
              sameSite: 'none',
              // domain: config.ENV_URL_UI.split("://")[1]
              httpOnly: true,
              secure: true,
              path: '/',
              expires: result.cookie_expires,
              priority: 'high',
            })
            .send(result.profile);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'PATCH',
      url: '/v1' + config.endpoint_user_profile,
      preValidation: async function (request: any, reply: any): Promise<void> {
        await prevalidation.validate_user(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = { ...request.body, user: request.user };

        try {
          const result = await services.user.edit_profile(credentials);

          reply.send(result);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'POST',
      url: '/v1' + config.endpoint_user_email_change,
      preValidation: async function (request: any, reply: any): Promise<void> {
        await prevalidation.validate_user(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = { ...request.body, user: request.user };

        try {
          const result = await services.user.change_email(credentials);

          await services.mail.send_verification_link({
            email: result.profile.email,
            code: result.email_verification_code,
          });

          reply.send(result.profile);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'POST',
      url: '/v1' + config.endpoint_user_password_reset,
      handler: async function (request: any, reply: any) {
        const credentials = {
          password: request.body.password,
          code: request.body.code,
        };

        try {
          const user = await services.user.reset_password(credentials);

          reply.send(user);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'POST',
      url: '/v1' + config.endpoint_user_password_change,
      preValidation: async function (request: any, reply: any): Promise<void> {
        await prevalidation.validate_user(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ...request.body,

          user: request.user,
        };

        try {
          const user = await services.user.change_password(credentials);

          reply.send(user);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'GET',
      url: '/v1' + config.endpoint_user_signout,
      preValidation: async function (request: any, reply: any): Promise<void> {
        await prevalidation.validate_user(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          sid: request.cookies[config.ENV_COOKIE_NAME],
          user: request.user,
        };

        try {
          const result: number = await services.user.signout(credentials);

          reply.clearCookie(config.ENV_COOKIE_NAME, { path: '/' }).send(result);
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

export default bind_user_routes;
