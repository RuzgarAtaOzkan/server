'use strict';

// INTERFACES
import { Document } from 'mongodb';
import { FastifyInstance } from 'fastify';
import { routes_i, services_i } from 'interfaces/api';

// API > MIDDLEWARE

// CONFIG
import config from '../../config';

// UTILS
import { sleep } from '../../utils/common';

function bind_static_routes(
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
      url: config.endpoint_static_root,
      handler: async function (request: any, reply: any) {
        const response: string =
          config.ENV_URL_UI +
          '\n\n' +
          'collaborators:' +
          '\n\n' +
          'Frontend: https://github.com/basarballioz' +
          '\n' +
          'Backend: https://github.com/ruzgarataozkan';

        try {
          reply.send(response);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    static_images_id: {
      method: 'GET',
      url: config.endpoint_static_images_id,
      handler: async function (request: any, reply: any) {
        const path: string = 'public/images/' + request.params.id;

        try {
          return reply.sendFile(path);
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

export default bind_static_routes;
