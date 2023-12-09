'use strict';

// CONFIG
import config from '../config';

// INTERFACES
import { FastifyInstance } from 'fastify';
import { services_i } from 'interfaces/api';

// SERVICES
import service_auth_init from './services/auth';
import service_mail_init from './services/mail';
import service_settings_init from './services/settings';
import service_store_init from './services/store';
import service_product_init from './services/product';

// Route Binders
import bind_auth_routes from './routes/v1/auth';
import bind_mail_routes from './routes/v1/mail';
import bind_settings_routes from './routes/v1/settings';
import bind_store_routes from './routes/v1/store';
import bind_product_routes from './routes/v1/product';

// Bind all server routes here
function bind_routes(server: FastifyInstance, options: any): FastifyInstance {
  // Initialize all services here once to pass them into route binders
  const services: services_i = {
    auth: new service_auth_init(options),
    mail: new service_mail_init(options),
    settings: new service_settings_init(options),
    store: new service_store_init(options),
    product: new service_product_init(options),
  };

  // Bind the routes and paths to fastify instance. e.g. server.route({ method: 'GET', handler: (request: any, reply: any) => {} })
  bind_auth_routes(server, services, options);
  bind_mail_routes(server, services, options);
  bind_settings_routes(server, services, options);
  bind_store_routes(server, services, options);
  bind_product_routes(server, services, options);

  // Return the same fastify instance but this routes binded
  return server;
}

export default bind_routes;
