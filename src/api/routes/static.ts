'use strict';

// MODULES
import path from 'node:path';

// INTERFACES
import { Document } from 'mongodb';
import { FastifyInstance } from 'fastify';
import { routes_i, services_i } from 'interfaces/api';

// API > MIDDLEWARE
import mw from '../middleware';
import mw_auth from '../middleware/auth';

// API > SCHEMAS
import schemas from '../schemas';

// CONFIG
import config from '../../config';

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
    public_image: {
      method: 'GET',
      url: config.endpoints.public_image,
      //preValidation: mw.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        const credentials = { id: request.params.id };
        //console.log(request.params.id);

        const full_path: string =
          process.cwd() + '/public/images/' + credentials.id;

        try {
          return reply.sendFile('/public/images/' + credentials.id);
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
