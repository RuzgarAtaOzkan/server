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

function bind_product_routes(
  server: FastifyInstance,
  services: services_i,
  options: any
): FastifyInstance {
  // @ Route Options Area
  const routes: routes_i = {
    products_get: {
      method: 'GET',
      url: '/v1' + config.endpoints.products,
      schema: {
        querystring: {
          page: { type: config.types.string },
          limit: { type: config.types.string },
          store_id: { type: config.types.string },
          name: { type: config.types.string },
          category: { type: config.types.string },
          sex: { type: config.types.string },
          featured: { type: config.types.string },
          price_under: { type: config.types.string },
          price_over: { type: config.types.string },
        },
      },
      preValidation: mw.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          query: request.query,
          user: request.user,
        };

        try {
          const products: any = await services.product.get_products(
            credentials
          );

          reply.send(products);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    products_favs_get: {
      method: 'GET',
      url: '/v1' + config.endpoints.products_favs,
      preValidation: mw.prevalidation(mw_auth.is_auth, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ip: request.ip,
          user: request.user,
        };

        try {
          const products: any = await services.product.get_fav_products(
            credentials
          );

          reply.send(products);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    products_favs_edit: {
      method: 'PUT',
      url: '/v1' + config.endpoints.products_favs,
      preValidation: mw.prevalidation(mw_auth.is_auth, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          favs: request.body,
          ip: request.ip,
          user: request.user,
        };

        try {
          const products: any = await services.product.edit_fav_products(
            credentials
          );

          reply.send(products);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    product_update: {
      method: 'PATCH',
      url: '/v1' + config.endpoints.products,
      preValidation: mw.prevalidation(null, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          products: request.body,
          key: request.headers['x-key'],
          ip: request.ip,
        };

        try {
          const product = await services.product.update_products(credentials);

          reply.send(product);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    product_create: {
      method: 'POST',
      url: '/v1' + config.endpoints.products,
      preValidation: mw.prevalidation(mw_auth.is_admin, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ...request.body,
          ip: request.ip,
          user: request.user,
        };

        try {
          const product = await services.product.create_product(credentials);

          reply.send(product);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    product_edit: {
      method: 'PUT',
      url: '/v1' + config.endpoints.products,
      preValidation: mw.prevalidation(mw_auth.is_admin, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ...request.body,
          ip: request.ip,
          user: request.user,
        };

        try {
          const product = await services.product.edit_product(credentials);

          reply.send(product);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    product_delete: {
      method: 'DELETE',
      url: '/v1' + config.endpoints.products,
      preValidation: mw.prevalidation(mw_auth.is_admin, options),
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ...request.body,
          ip: request.ip,
          user: request.user,
        };

        try {
          const result = await services.product.delete_product(credentials);

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

export default bind_product_routes;
