'use strict';

// INTERFACES
import { FastifyInstance } from 'fastify';
import { routes_i, services_i } from 'interfaces/api';
import { options_i } from 'interfaces/common';

// API > MIDDLEWARE
import prevalidation from '../middleware/prevalidation';

// CONFIG
import config from '../../config';

function bind_user_routes(
  server: FastifyInstance,
  services: services_i,
  options: options_i
): FastifyInstance {
  // @ Route Options Area
  const routes: routes_i = {
    // #title: GET PROFILE
    // #state: Public
    // #desc: Check if request has session and user, response: IProfile | null

    profile: {
      method: 'GET',
      url: '/v1' + config.endpoint_user_profile,
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          sid: request.cookies[config.ENV_SESSION_NAME],
          ip: request.ip,
        };

        try {
          const result: any | null = await services.user.get_profile(
            credentials
          );

          if (result === null) {
            return reply.send(null);
          }

          // result.cookie_value is not changed, result.cookie_expires renewed

          reply
            .setCookie(config.ENV_SESSION_NAME, result.cookie_value, {
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
    // #title: EDIT PROFILE
    // #state: Private
    // #desc: Allow signed in user to edit its profile credentials.
    profile_patch: {
      method: 'PATCH',
      url: '/v1' + config.endpoint_user_profile,
      preValidation: async function (request, reply): Promise<void> {
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
    // #title: SIGNUP
    // #state: Public
    // #desc: Signs the user to the database if their credentials is valid and give them a session id.
    signup: {
      method: 'POST',
      url: '/v1' + config.endpoint_user_signup,
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ...request.body,

          ip: request.ip,
        };

        try {
          const result = await services.user.signup(credentials);

          await services.mail.send_verification_link({
            email: result.profile.email,
            code: result.email_verification_code,
          });

          reply
            .setCookie(config.ENV_SESSION_NAME, result.cookie_value, {
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
    // #title: SIGNIN
    // #state: Public
    // #desc: Sign users in and give them a session id.
    signin: {
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
            .setCookie(config.ENV_SESSION_NAME, result.cookie_value, {
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
    // #title: SIGNOUT
    // #state: Private
    // #desc: Sign users out and remove their session id.
    signout: {
      method: 'GET',
      url: '/v1' + config.endpoint_user_signout,
      preValidation: async function (request, reply): Promise<void> {
        await prevalidation.validate_user(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          sid: request.cookies[config.ENV_SESSION_NAME],
          user: request.user,
        };

        try {
          const result: boolean = await services.user.signout(credentials);

          reply
            .clearCookie(config.ENV_SESSION_NAME, { path: '/' })
            .send(result);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    // #title: RESET PASSWORD
    // #state: Public
    // #desc: resets users password by sending code to the user with the specified email.
    password_reset: {
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
    // #title: CHANGE PASSWORD
    // #state: Private
    // #desc: Changes users password with authentication
    password_change: {
      method: 'POST',
      url: '/v1' + config.endpoint_user_password_change,
      preValidation: async function (request, reply): Promise<void> {
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
    // #title: RESET EMAIL
    // #state: Private
    // #desc: Sends a link to the users new email, after click the link in the new email it resets and make that email the new one .
    email_change: {
      method: 'POST',
      url: '/v1' + config.endpoint_user_email_change,
      preValidation: async function (request, reply): Promise<void> {
        await prevalidation.validate_user(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ...request.body,
          user: request.user,
        };

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
    // #title: VERIFY EMAIL
    // #state: Private
    // #desc: Verifies user's email by sending code to the specified email
    email_verify: {
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
  };

  // Route them in fastify
  for (const key in routes) {
    server.route(routes[key]);
  }

  return server;
}

export default bind_user_routes;
