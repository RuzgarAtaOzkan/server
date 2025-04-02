'use strict';

// MODULES
import fs from 'node:fs';

// MIDDLEWARE
import prevalidation from '../middleware/prevalidation';

// INTERFACES
import { Document } from 'mongodb';
import { FastifyInstance } from 'fastify';
import { routes_i, services_i } from 'interfaces/api';

// CONFIG
import config from '../../config';

function bind_settings_routes(
  server: FastifyInstance,
  services: services_i,
  options: any
): FastifyInstance {
  // @ Route Options Area
  const routes: routes_i = {
    // #title: GET PROFILE
    // #state: public
    // #desc: check if request has session and user, response: IProfile | null
    settings_get: {
      method: 'GET',
      url: '/v1' + config.endpoint_settings,
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
    settings_edit: {
      method: 'PATCH',
      url: '/v1' + config.endpoint_settings,
      preValidation: async function (request, reply): Promise<void> {
        await prevalidation.validate_admin(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = { ...request.body };

        try {
          const settings = await services.settings.edit_settings(credentials);

          reply.send(settings);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    settings_cities: {
      method: 'GET',
      url: '/v1' + config.endpoint_settings_cities,
      handler: async function (request: any, reply: any) {
        const credentials: any = {};

        try {
          const cities: string[] = await services.settings.get_cities(
            credentials
          );

          reply.send(cities);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    settings_districts: {
      method: 'GET',
      url: '/v1' + config.endpoint_settings_districts,
      handler: async function (request: any, reply: any) {
        const credentials: any = { city: request.query.city };

        try {
          const districts = services.settings.get_districts(credentials);

          reply.send(districts);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    settings_neighbourhoods: {
      method: 'GET',
      url: '/v1' + config.endpoint_settings_neighbourhoods,
      handler: async function (request: any, reply: any) {
        const credentials: any = { district: request.query.district };

        try {
          const neighbourhoods =
            services.settings.get_neighbourhoods(credentials);

          reply.send(neighbourhoods);
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
