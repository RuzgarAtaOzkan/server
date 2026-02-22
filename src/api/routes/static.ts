'use strict';

// INTERFACES
import { Document } from 'mongodb';
import { FastifyInstance } from 'fastify';
import { options_i } from 'interfaces/common';
import { services_i } from 'interfaces/api';

// API > MIDDLEWARE

// CONFIG
import config from '../../config';

// UTILS
import { sleep } from '../../utils/common';

function bind_static_routes(
  server: FastifyInstance,
  services: services_i,
  options: options_i
): FastifyInstance {
  // @ Route Options Area
  const routes = [
    // #title: GET PROFILE
    // #state: Public
    // #desc: Check if request has session and user, response: IProfile | null
    {
      method: 'GET',
      url: config.endpoint_static_root,
      handler: async function (request: any, reply: any) {
        try {
          reply.send(config.ENV_URL_UI);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
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
  ];

  for (let i: number = 0; i < routes.length; i++) {
    server.route(routes[i]);
  }

  return server;
}

export default bind_static_routes;
