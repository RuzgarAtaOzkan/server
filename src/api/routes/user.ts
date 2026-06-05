'use strict';

// INTERFACES
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { services_i } from 'interfaces/api';
import {
  user_signup_credentials_i,
  user_signup_result_i,
  user_signin_credentials_i,
  user_signin_result_i,
  user_get_profile_credentials_i,
  user_get_profile_result_i,
  user_patch_profile_credentials_i,
  user_email_change_result_i,
  user_email_change_credentials_i,
  user_password_change_credentials_i,
  user_signout_credentials_i,
  user_password_reset_credentials_i,
} from 'interfaces/services';
import { options_i } from 'interfaces/common';

// API/MIDDLEWARE
import prevalidation from '../middleware/prevalidation';

// CONFIG
import config from '../../config';
import { user_profile_i } from 'interfaces/utils';
import { UpdateResult } from 'mongodb';

function bind_user_routes(
  server: FastifyInstance,
  services: services_i,
  options: options_i,
): FastifyInstance {
  const routes = [
    {
      method: 'POST',
      url: '/v1' + config.endpoint_user_signup,
      handler: async function (request: any, reply: FastifyReply) {
        const credentials: user_signup_credentials_i = {
          name: request.body.name,
          username: request.body.username,
          email: request.body.email,
          password: request.body.password,
          remember: request.body.remember,
          ref_code: request.body.ref_code,
          captcha: request.body.captcha,
          ip: request.ip,
        };

        try {
          const result: user_signup_result_i =
            await services.user.signup(credentials);

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
        const credentials: user_signin_credentials_i = {
          uid: request.body.uid,
          password: request.body.password,
          remember: request.body.remember,
          ip: request.ip,
        };

        try {
          const result: user_signin_result_i =
            await services.user.signin(credentials);

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
        try {
          const profile: user_profile_i = await services.user.verify_email(
            request.params.code,
          );

          reply.send(profile);
        } catch (error) {
          reply.status(422).send(error);
        }
      },
    },
    {
      method: 'GET',
      url: '/v1' + config.endpoint_user_profile,
      handler: async function (request: any, reply: any) {
        const credentials: user_get_profile_credentials_i = {
          sid: request.cookies[config.ENV_COOKIE_NAME],
          ip: request.ip,
        };

        try {
          const result: user_get_profile_result_i =
            await services.user.get_profile(credentials);

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
        const credentials: user_patch_profile_credentials_i = {
          name: request.body.name,
          username: request.body.username,
          img: request.body.img,
          phone: request.body.phone,
          city: request.body.city,
          district: request.body.district,
          address: request.body.address,
          zip: request.body.zip,
          user: request.user,
        };

        try {
          const result: UpdateResult =
            await services.user.edit_profile(credentials);

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
        const credentials: user_email_change_credentials_i = {
          email: request.body.email,
          user: request.user,
        };

        try {
          const result: user_email_change_result_i =
            await services.user.change_email(credentials);

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
        const credentials: user_password_reset_credentials_i = {
          password: request.body.password,
          code: request.body.code,
        };

        try {
          const profile: user_profile_i =
            await services.user.reset_password(credentials);

          reply.send(profile);
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
        const credentials: user_password_change_credentials_i = {
          password: request.body.password,
          user: request.user,
        };

        try {
          const profile: user_profile_i =
            await services.user.change_password(credentials);

          reply.send(profile);
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
        const credentials: user_signout_credentials_i = {
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
