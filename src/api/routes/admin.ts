'use strict';

// INTERFACES
import { FastifyInstance, RouteOptions } from 'fastify';
import { services_i } from 'interfaces/api';
import { options_i } from 'interfaces/common';

// API > MIDDLEWARE
import prevalidation from '../middleware/prevalidation';

// CONFIG
import config from '../../config';
import { Document } from 'mongodb';

function bind_admin_routes(
  server: FastifyInstance,
  services: services_i,
  options: options_i
): FastifyInstance {
  const routes: RouteOptions[] = [
    // MAIL
    {
      method: 'POST',
      url: '/v1' + config.endpoint_admin_mail_send,
      preValidation: async function (request: any, reply: any): Promise<void> {
        await prevalidation.validate_admin(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials = { ...request.body, ip: request.ip };

        try {
          const result = await services.admin.mail_send(credentials);

          reply.send(result.profile);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    // SETTINGS
    {
      method: 'PATCH',
      url: '/v1' + config.endpoint_admin_settings,
      preValidation: async function (request: any, reply: any): Promise<void> {
        await prevalidation.validate_admin(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = { ...request.body };

        try {
          const settings = await services.admin.settings_edit(credentials);

          reply.send(settings);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    // PRODUCTS
    {
      method: 'POST',
      url: '/v1' + config.endpoint_admin_products,
      preValidation: async function (request: any, reply: any): Promise<void> {
        await prevalidation.validate_admin(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ...request.body,

          user: request.user,
          bulk: request.query.bulk,
        };

        try {
          const product: any = await services.admin.products_create(
            credentials
          );

          reply.send(product);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'PATCH',
      url: '/v1' + config.endpoint_admin_products,
      preValidation: async function (request: any, reply: any): Promise<void> {
        await prevalidation.validate_admin(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = {
          ...request.body,

          user: request.user,
        };

        try {
          const product: any = await services.admin.products_edit(credentials);

          reply.send(product);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'DELETE',
      url: '/v1' + config.endpoint_admin_products,
      preValidation: async function (request: any, reply: any): Promise<void> {
        await prevalidation.validate_admin(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = { _id: request.query._id, user: request.user };

        try {
          const result: Document = await services.admin.products_delete(
            credentials
          );

          reply.send(result);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    // WALLETS
    {
      method: 'GET',
      url: '/v1' + config.endpoint_admin_wallets,
      preValidation: async function (request: any, reply: any): Promise<void> {
        await prevalidation.validate_admin(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = { ...request.query };

        try {
          const wallets: Document[] = await services.admin.wallets_get(
            credentials
          );

          reply.send(wallets);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },

    // COUPONS
    {
      method: 'GET',
      url: '/v1' + config.endpoint_admin_coupons,
      preValidation: async function (request: any, reply: any): Promise<void> {
        await prevalidation.validate_admin(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = { ip: request.ip };

        try {
          const coupons: Document[] = await services.admin.coupons_get(
            credentials
          );

          reply.send(coupons);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'POST',
      url: '/v1' + config.endpoint_admin_coupons,
      preValidation: async function (request: any, reply: any): Promise<void> {
        await prevalidation.validate_admin(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = { ...request.body, ip: request.ip };

        try {
          const coupon: Document = await services.admin.coupons_create(
            credentials
          );

          reply.send(coupon);
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

export default bind_admin_routes;
