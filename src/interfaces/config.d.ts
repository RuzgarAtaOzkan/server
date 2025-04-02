import { roles_t, types_t } from 'types/config';

export default interface config_i {
  readonly ENV_PORT: number;
  readonly ENV_PORT_SOCKET: number;
  readonly ENV_HOST: string;
  readonly ENV_SESSION_SECRET: string;
  readonly ENV_SESSION_NAME: string;
  readonly ENV_SESSION_LIFETIME_MS: number;
  readonly ENV_DB_URL: string;
  readonly ENV_DB_NAME: string;
  readonly ENV_ROLE_KEY_USER: string;
  readonly ENV_ROLE_KEY_ADMIN: string;
  readonly ENV_EMAIL_HOST: string;
  readonly ENV_EMAIL_USERNAME: string;
  readonly ENV_EMAIL_PASSWORD: string;
  readonly ENV_URL_API: string;
  readonly ENV_URL_UI: string;
  readonly ENV_URL_UI_LOCAL: string;
  readonly ENV_API_KEY_CAPTCHA: string;
  readonly ENV_API_KEY_IYZICO: string;
  readonly ENV_API_KEY_IYZICO_SECRET: string;

  readonly endpoint_static_root: string;
  readonly endpoint_static_images_id: string;
  readonly endpoint_user_profile: string;
  readonly endpoint_user_signin: string;
  readonly endpoint_user_signup: string;
  readonly endpoint_user_signout: string;
  readonly endpoint_user_email_verify: string;
  readonly endpoint_user_email_change: string;
  readonly endpoint_user_password_change: string;
  readonly endpoint_user_password_reset: string;
  readonly endpoint_mail_verification_link: string;
  readonly endpoint_mail_password_reset_link: string;
  readonly endpoint_settings: string;
  readonly endpoint_settings_cities: string;
  readonly endpoint_settings_districts: string;
  readonly endpoint_settings_neighbourhoods: string;
  readonly endpoint_stores: string;
  readonly endpoint_stores_id: string;
  readonly endpoint_products: string;
  readonly endpoint_orders: string;
  readonly endpoint_orders_delivery: string;
  readonly endpoint_cards: string;
  readonly endpoint_coupons: string;

  readonly role_user: roles_t;
  readonly role_admin: roles_t;

  readonly time_gmt: number;
  readonly time_one_min_ms: number;
  readonly time_one_hour_ms: number;
  readonly time_one_day_ms: number;

  readonly type_object_id: types_t;
  readonly type_string: types_t;
  readonly type_number: types_t;
  readonly type_int: types_t;
  readonly type_float: types_t;
  readonly type_date: types_t;
  readonly type_double: types_t;
  readonly type_boolean: types_t;
  readonly type_bool: types_t;
  readonly type_object: types_t;
  readonly type_array: types_t;
  readonly type_function: types_t;
  readonly type_null: types_t;
  readonly type_undefined: types_t;

  readonly blockchain_chains: {
    readonly [key: number]: any;
  };
}
