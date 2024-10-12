'use strict';

// MODULES
import fs from 'fs';

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
    // #state: Public
    // #desc: Check if request has session and user, response: IProfile | null
    settings_get: {
      method: 'GET',
      url: '/v1' + config.endpoints.settings,
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
  };

  // Route them in fastify
  for (const key in routes) {
    server.route(routes[key]);
  }

  return server;
}

export default bind_settings_routes;
