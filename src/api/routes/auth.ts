'use strict';

// INTERFACES
import { Document } from 'mongodb';
import { FastifyInstance } from 'fastify';
import { routes_i, services_i } from 'interfaces/api';

// API > MIDDLEWARE
import mw_prevalidation from '../middleware/prevalidation';

// CONFIG
import config from '../../config';

function bind_auth_routes(
  server: FastifyInstance,
  services: services_i,
  options: any
): FastifyInstance {
  // @ Route Options Area
  const routes: routes_i = {
    // #title: GET PROFILE
    // #state: Public
    // #desc: Check if request has session and user, response: IProfile | null
    root: {
      method: 'GET',
      url: config.endpoints.auth_root,
      handler: async function (request: any, reply: any) {
        const req: object = {
          headers: { ...request.headers, cookie: undefined },
          id: request.id,
          ip: request.ip,
          hostname: request.hostname,
          protocol: request.protocol,
          method: request.method,
          url: request.url,
          original_url: request.originalUrl,
        };

        try {
          reply.send(req);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    profile: {
      method: 'GET',
      url: '/v1' + config.endpoints.auth_profile,
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          sid: request.cookies[config.env.SESSION_NAME],
          ip: request.ip,
        };

        try {
          const profile = await services.auth.get_profile(credentials);

          reply.send(profile);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    // #title: EDIT PROFILE
    // #state: Private
    // #desc: Allow signed in user to edit its profile credentials.
    profile_edit: {
      method: 'PUT',
      url: '/v1' + config.endpoints.auth_profile,
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
        const credentials: any = { ...request.body, user: request.user };

        try {
          const result = await services.auth.edit_profile(credentials);

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
      url: '/v1' + config.endpoints.auth_signup,
      handler: async function (request: any, reply: any) {
        const credentials = {
          ...request.body,
          ip: request.ip,
        };

        try {
          const result = await services.auth.signup(credentials);

          // Sending confirmation mail to those who just signed up
          await services.mail.send_verification_link({
            email: result.profile.email,
            token: result.email_verification_token,
          });

          reply
            .setCookie(config.env.SESSION_NAME, result.sid, {
              httpOnly: true,
              secure: true,
              path: '/',
              //domain: config.env.URL_UI,
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
      url: '/v1' + config.endpoints.auth_signin,
      handler: async function (request: any, reply: any) {
        const credentials = {
          ...request.body,
          ip: request.ip,
        };

        try {
          const result = await services.auth.signin(credentials);

          reply
            .setCookie(config.env.SESSION_NAME, result.sid, {
              httpOnly: true,
              secure: true,
              path: '/',
              //domain: config.env.URL_UI,
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
      url: '/v1' + config.endpoints.auth_signout,
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
        const credentials: any = {
          sid: request.cookies[config.env.SESSION_NAME],
          user: request.user,
        };

        try {
          await services.auth.signout(credentials);

          reply.clearCookie(config.env.SESSION_NAME, { path: '/' }).send(true);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    // #title: RESET PASSWORD
    // #state: Public
    // #desc: Resets users password by sending token to the user with the specified email.
    password_reset: {
      method: 'POST',
      url: '/v1' + config.endpoints.auth_password_reset,
      handler: async function (request: any, reply: any) {
        const credentials = {
          ...request.body,
          token: request.params.token,
        };

        try {
          const user = await services.auth.reset_password(credentials);

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
      url: '/v1' + config.endpoints.auth_password_change,
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
        const credentials: any = {
          ...request.body,
          user: request.user,
        };

        try {
          const user = await services.auth.change_password(credentials);

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
      url: '/v1' + config.endpoints.auth_email_change,
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
        const credentials: any = {
          ...request.body,

          user: request.user,
        };

        try {
          const result = await services.auth.change_email(credentials);

          await services.mail.send_verification_link({
            email: credentials.email,
            token: result.email_verification_token,
          });

          reply.send(result.profile);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    // #title: VERIFY EMAIL
    // #state: Private
    // #desc: Verifies user's email by sending token to the specified email
    email_verify: {
      method: 'GET',
      url: '/v1' + config.endpoints.auth_email_verify,
      handler: async function (request: any, reply: any) {
        try {
          const user = await services.auth.verify_email(request.params.token);

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

export default bind_auth_routes;
