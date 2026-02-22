'use strict';

// INTERFACES
import { DeleteResult, Document } from 'mongodb';
import { FastifyInstance } from 'fastify';
import { services_i } from 'interfaces/api';

// API > MIDDLEWARE
import prevalidation from '../middleware/prevalidation';

// CONFIG
import config from '../../config';

function bind_card_routes(
  server: FastifyInstance,
  services: services_i,
  options: any
): FastifyInstance {
  // @ Route Options Area
  const routes = [
    // #title: GET PROFILE
    // #state: Public
    // #desc: Check if request has session and user, response: IProfile | null
    {
      method: 'GET',
      url: '/v1' + config.endpoint_cards,
      preValidation: async function (request: any, reply: any): Promise<void> {
        await prevalidation.validate_user(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = { user: request.user };

        try {
          const card: Document | null = await services.card.get_card(
            credentials
          );

          reply.send(card);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'POST',
      url: '/v1' + config.endpoint_cards,
      preValidation: async function (request: any, reply: any): Promise<void> {
        await prevalidation.validate_user(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = { ...request.body, user: request.user };

        try {
          const card: Document = await services.card.create_card(credentials);

          reply.send(card);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'PATCH',
      url: '/v1' + config.endpoint_cards,
      preValidation: async function (request: any, reply: any): Promise<void> {
        await prevalidation.validate_user(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = { ...request.body, user: request.user };

        try {
          const card: Document = await services.card.edit_card(credentials);

          reply.send(card);
        } catch (err: any) {
          reply.status(422).send(err);
        }
      },
    },
    {
      method: 'DELETE',
      url: '/v1' + config.endpoint_cards,
      preValidation: async function (request: any, reply: any): Promise<void> {
        await prevalidation.validate_user(request, reply, options);
      },
      handler: async function (request: any, reply: any) {
        const credentials: any = { user: request.user };

        try {
          const result = await services.card.delete_card(credentials);

          reply.send(result);
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

export default bind_card_routes;
