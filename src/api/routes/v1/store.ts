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

function bind_store_routes(
  server: FastifyInstance,
  services: services_i,
  options: any
): FastifyInstance {
  // @ Route Options Area
  const routes: routes_i = {
    // #title: GET PROFILE
    // #state: Public
    // #desc: Check if request has session and user, response: IProfile | null
    store_get: {
      method: 'GET',
      url: '/v1' + config.endpoints.stores_store,
      preValidation: mw.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          name: request.params.name,
          limit: request.query.limit,
        };

        try {
          const store = await services.store.get_store(credentials);

          reply.send(store);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    stores_get: {
      method: 'GET',
      url: '/v1' + config.endpoints.stores,
      schema: {
        querystring: {
          page: { type: config.types.string },
          limit: { type: config.types.string },
        },
      },
      preValidation: mw.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          page: request.query.page,
          limit: request.query.limit,
          ip: request.ip,
        };

        try {
          const stores = await services.store.get_stores(credentials);

          reply.send(stores);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    store_create: {
      method: 'POST',
      url: '/v1' + config.endpoints.stores,
      preValidation: mw.prevalidation(mw_auth.is_admin, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ...request.body,
          ip: request.ip,
        };

        try {
          const store = await services.store.create_store(credentials);

          reply.send(store);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    store_edit: {
      method: 'PUT',
      url: '/v1' + config.endpoints.stores,
      preValidation: mw.prevalidation(mw_auth.is_admin, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ...request.body,
          ip: request.ip,
        };

        try {
          const product = await services.store.edit_store(credentials);

          reply.send(product);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    store_delete: {
      method: 'DELETE',
      url: '/v1' + config.endpoints.stores,
      preValidation: mw.prevalidation(mw_auth.is_admin, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ...request.body,
          ip: request.ip,
          user: request.user,
        };

        try {
          const result = await services.store.delete_store(credentials);

          reply.send(result);
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

export default bind_store_routes;
