'use strict';

// CONFIG
import config from '../config';

// INTERFACES
import { FastifyInstance } from 'fastify';
import { services_i } from 'interfaces/api';

// SERVICES
import service_auth_init from '../services/auth';
import service_mail_init from '../services/mail';
import service_settings_init from '../services/settings';
import service_blockchain_init from '../services/blockchain';
import service_location_init from '../services/location';
import service_coupon_init from '../services/coupon';

// Route Binders
import bind_static_routes from './routes/static';
// v1
import bind_auth_routes from './routes/auth';
import bind_mail_routes from './routes/mail';
import bind_settings_routes from './routes/settings';
import bind_blockchain_routes from './routes/blockchain';
import bind_location_routes from './routes/location';
import bind_coupon_routes from './routes/coupon';

// Bind all server routes here
function bind_routes(server: FastifyInstance, options: any): FastifyInstance {
  // Initialize all services here once to pass them into route binders
  const services: services_i = {
    auth: new service_auth_init(options),
    mail: new service_mail_init(options),
    settings: new service_settings_init(options),
    blockchain: new service_blockchain_init(options),
    location: new service_location_init(options),
    coupon: new service_coupon_init(options),
  };

  // Bind the routes and paths to fastify instance. e.g. server.route({ method: 'GET', handler: (request: any, reply: any) => {} })
  bind_static_routes(server, services, options);
  bind_auth_routes(server, services, options);
  bind_mail_routes(server, services, options);
  bind_settings_routes(server, services, options);
  bind_blockchain_routes(server, services, options);
  bind_location_routes(server, services, options);
  bind_coupon_routes(server, services, options);

  // Return the same fastify instance but this routes binded
  return server;
}

export default bind_routes;
