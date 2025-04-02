'use strict';

// CONFIG
import config from '../config';

// INTERFACES
import { FastifyInstance } from 'fastify';
import { services_i } from 'interfaces/api';

// SERVICES
import service_user_init from '../services/user';
import service_mail_init from '../services/mail';
import service_settings_init from '../services/settings';

// Route Binders
import bind_static_routes from './routes/static';
// v1
import bind_user_routes from './routes/user';
import bind_mail_routes from './routes/mail';
import bind_settings_routes from './routes/settings';

// bind all server routes here
function bind_routes(server: FastifyInstance, options: any): FastifyInstance {
  // Initialize all services here once to pass them into route binders
  const services: services_i = {
    user: new service_user_init(options),
    mail: new service_mail_init(options),
    settings: new service_settings_init(options),
  };

  // bind the routes and paths to fastify instance. e.g. server.route({ method: 'GET', handler: (request: any, reply: any) => {} })
  bind_static_routes(server, services, options);
  bind_user_routes(server, services, options);
  bind_mail_routes(server, services, options);
  bind_settings_routes(server, services, options);

  // return the same fastify instance but this has routes binded
  return server;
}

export default bind_routes;
