'use strict';

// INTERFACES
import { Document } from 'mongodb';
import { FastifyInstance } from 'fastify';
import { routes_i, services_i } from 'interfaces/api';

// API > MIDDLEWARE
import mw_prevalidation from '../middleware/prevalidation';

// CONFIG
import config from '../../config';

function bind_location_routes(
  server: FastifyInstance,
  services: services_i,
  options: any
): FastifyInstance {
  // @ Route Options Area
  const routes: routes_i = {
    // #title: GET PROFILE
    // #state: Public
    // #desc: Check if request has session and user, response: IProfile | null
    locations: {
      method: 'GET',
      url: '/v1' + config.endpoints.locations,
      preValidation: async function (request: any, reply: any) {
        const is_admin: boolean = await mw_prevalidation.is_admin(
          request,
          options
        );

        if (!is_admin) {
          reply.status(401).send('unauthorized');
          return;
        }

        return;
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = { query: request.query };

        try {
          const locations: any = await services.location.get_locations(
            credentials
          );

          reply.send(locations);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    locations_create: {
      method: 'POST',
      url: '/v1' + config.endpoints.locations,
      preValidation: async function (request: any, reply: any) {
        const is_admin: boolean = await mw_prevalidation.is_admin(
          request,
          options
        );

        if (!is_admin) {
          reply.status(401).send('unauthorized');
          return;
        }

        return;
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = { ...request.body };

        try {
          const location: any = await services.location.create_location(
            credentials
          );

          reply.send(location);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    locations_delete: {
      method: 'DELETE',
      url: '/v1' + config.endpoints.locations,
      preValidation: async function (request: any, reply: any) {
        const is_admin: boolean = await mw_prevalidation.is_admin(
          request,
          options
        );

        if (!is_admin) {
          reply.status(401).send('unauthorized');
          return;
        }

        return;
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = { ...request.body };

        try {
          const result: any = await services.location.delete_location(
            credentials
          );

          reply.send(result);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    locations_prices: {
      method: 'GET',
      url: '/v1' + config.endpoints.locations_prices,
      handler: async function (request: any, reply: any) {
        const credentials: any = { origin: request.headers.origin };

        try {
          const prices = await services.location.get_location_prices(
            credentials
          );

          reply.send(prices);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    locations_available: {
      method: 'GET',
      url: '/v1' + config.endpoints.locations_available,
      handler: async function (request: any, reply: any) {
        const credentials: any = {};

        try {
          const locations: number =
            await services.location.get_available_locations(credentials);

          reply.send(locations);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    // register other locations routes first for name space
    // register txn route last because its a variable after /locations/:hash, fastify might think that other locations (/locations/prices) belongs to that route which is hash variable
    open_location: {
      method: 'GET',
      url: '/v1' + config.endpoints.locations_open,
      handler: async function (request: any, reply: any) {
        const credentials: any = { hash: request.params.hash };

        try {
          const location: any = await services.location.open_location(
            credentials
          );

          reply.send(location);
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

export default bind_location_routes;
