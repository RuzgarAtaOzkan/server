'use strict';

// INTERFACES
import { FastifyInstance } from 'fastify';
import { options_i } from 'interfaces/common';
import { services_i } from 'interfaces/api';

// SERVICES
import service_user_init from '../services/user';
import service_mail_init from '../services/mail';
import service_settings_init from '../services/settings';
import service_card_init from '../services/card';
import service_product_init from '../services/product';
import service_order_init from '../services/order';
import service_provision_init from '../services/provision';
import service_wallet_init from '../services/wallet';
import service_coupon_init from '../services/coupon';
import service_review_init from '../services/review';
import service_admin_init from '../services/admin';

// Route Binders
import bind_static_routes from './routes/static';
// v1
import bind_user_routes from './routes/user';
import bind_mail_routes from './routes/mail';
import bind_settings_routes from './routes/settings';
import bind_card_routes from './routes/card';
import bind_product_routes from './routes/product';
import bind_order_routes from './routes/order';
import bind_provision_routes from './routes/provision';
import bind_wallet_routes from './routes/wallet';
import bind_coupon_routes from './routes/coupon';
import bind_review_routes from './routes/review';
import bind_admin_routes from './routes/admin';

// bind all server routes here
function bind_routes(
  server: FastifyInstance,
  options: options_i
): FastifyInstance {
  // Initialize all services here once to pass them into route binders
  const services: services_i = {
    user: new service_user_init(options),
    mail: new service_mail_init(options),
    settings: new service_settings_init(options),
    card: new service_card_init(options),
    product: new service_product_init(options),
    order: new service_order_init(options),
    provision: new service_provision_init(options),
    wallet: new service_wallet_init(options),
    coupon: new service_coupon_init(options),
    review: new service_review_init(options),
    admin: new service_admin_init(options),
  };

  // bind the routes and paths to fastify instance. e.g. server.route({ method: 'GET', handler: (request: any, reply: any) => {} })
  bind_static_routes(server, services, options);
  bind_user_routes(server, services, options);
  bind_mail_routes(server, services, options);
  bind_settings_routes(server, services, options);
  bind_card_routes(server, services, options);
  bind_product_routes(server, services, options);
  bind_order_routes(server, services, options);
  bind_provision_routes(server, services, options);
  bind_wallet_routes(server, services, options);
  bind_coupon_routes(server, services, options);
  bind_review_routes(server, services, options);
  bind_admin_routes(server, services, options);

  // return the same fastify instance but this has routes binded
  return server;
}

export default bind_routes;
