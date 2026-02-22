// TYPES
import { http_method_t } from 'types/config';

// CLASS TYPES
import service_user_init from 'services/user';
import service_mail_init from 'services/mail';
import service_settings_init from 'services/settings';
import service_card_init from 'services/card';
import service_product_init from 'services/product';
import service_order_init from 'services/order';
import service_provision_init from 'services/provision';
import service_wallet_init from 'services/wallet';
import service_coupon_init from 'services/coupon';
import service_review_init from 'services/review';
import service_admin_init from 'services/admin';

export interface services_i {
  user: service_user_init;
  mail: service_mail_init;
  settings: service_settings_init;
  card: service_card_init;
  product: service_product_init;
  order: service_order_init;
  provision: service_provision_init;
  wallet: service_wallet_init;
  coupon: service_coupon_init;
  review: service_review_init;
  admin: service_admin_init;
}

export interface route_i {
  method: http_method_t;
  url: string;
  preValidation: Function | undefined;
  handler: Function;
  schema?: any;
}
