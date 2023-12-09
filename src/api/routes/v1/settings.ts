'use strict';

// INTERFACES
import { Document } from 'mongodb';
import { FastifyInstance } from 'fastify';
import { routes_i, services_i } from 'interfaces/api';

// API > MIDDLEWARE
import mw from '../../middleware';
import mw_auth from '../../middleware/auth';

// API > SCHEMAS
import schemas from '../../schemas';

// CONFIG
import config from '../../../config';

function bind_settings_routes(
  server: FastifyInstance,
  services: services_i,
  options: any
): FastifyInstance {
  // @ Route Options Area
  const routes: routes_i = {
    // #title: GET PROFILE
    // #state: Public
    // #desc: Check if request has session and user, response: IProfile | null
    settings_get: {
      method: 'GET',
      url: '/v1' + config.endpoints.settings,
      preValidation: mw.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ip: request.ip,
        };

        try {
          const settings = await services.settings.get_settings(credentials);

          reply.send(settings);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    banners_get: {
      method: 'GET',
      url: '/v1' + config.endpoints.settings_banners,
      preValidation: mw.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ip: request.ip,
        };

        try {
          const settings = await services.settings.get_banners(credentials);

          reply.send(settings);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    banners_edit: {
      method: 'PUT',
      url: '/v1' + config.endpoints.settings_banners,
      preValidation: mw.prevalidation(mw_auth.is_admin, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ...request.body, // TODO body = { banners: [] }
          ip: request.ip,
        };

        try {
          const settings_banners = await services.settings.edit_banners(
            credentials
          );

          reply.send(settings_banners);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    campaigns_get: {
      method: 'GET',
      url: '/v1' + config.endpoints.settings_campaigns,
      preValidation: mw.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ip: request.ip,
        };

        try {
          const settings = await services.settings.get_campaigns(credentials);

          reply.send(settings);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    campaigns_edit: {
      method: 'PUT',
      url: '/v1' + config.endpoints.settings_campaigns,
      preValidation: mw.prevalidation(mw_auth.is_admin, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ...request.body, // TODO body = { banners: [] }
          ip: request.ip,
        };

        try {
          const settings_banners = await services.settings.edit_campaigns(
            credentials
          );

          reply.send(settings_banners);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    notifications_get: {
      method: 'GET',
      url: '/v1' + config.endpoints.settings_notifications,
      preValidation: mw.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ip: request.ip,
        };

        try {
          const settings = await services.settings.get_notifications(
            credentials
          );

          reply.send(settings);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    notifications_edit: {
      method: 'PUT',
      url: '/v1' + config.endpoints.settings_notifications,
      preValidation: mw.prevalidation(mw_auth.is_admin, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ...request.body, // TODO body = { banners: [] }
          ip: request.ip,
        };

        try {
          const settings_banners = await services.settings.edit_notifications(
            credentials
          );

          reply.send(settings_banners);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    faq_get: {
      method: 'GET',
      url: '/v1' + config.endpoints.settings_faq,
      preValidation: mw.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        const settings_faq = [
          {
            question: 'Kaciriyosun uygulamasi ne ise yariyor?',
            answer:
              'Kaciriyosun uygulamasi bircok giyim magazasinin indirime girmis urunlerini tek bir yerden gormenizi saglar',
          },
          {
            question: 'Kaciriyosun uygulamasi ne ise yariyor?',
            answer:
              'Kaciriyosun uygulamasi bircok giyim magazasinin indirime girmis urunlerini tek bir yerden gormenizi saglar',
          },
          {
            question: 'Kaciriyosun uygulamasi ne ise yariyor?',
            answer:
              'Kaciriyosun uygulamasi bircok giyim magazasinin indirime girmis urunlerini tek bir yerden gormenizi saglar',
          },
          {
            question: 'Kaciriyosun uygulamasi ne ise yariyor?',
            answer:
              'Kaciriyosun uygulamasi bircok giyim magazasinin indirime girmis urunlerini tek bir yerden gormenizi saglar',
          },
        ];

        try {
          reply.send(settings_faq);
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

export default bind_settings_routes;
