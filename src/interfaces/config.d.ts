import { role_t, type_t, blockchain_t } from 'types/config';

export interface blockchain_i {
  readonly id: blockchain_t;
  readonly coin_address?: string;
  readonly coin_address_wrapped?: string;
  readonly coin_name: string;
  readonly coin_symbol: string;
  readonly coin_decimals: number;
  readonly coin_img: string;
  readonly usdt_address?: string;
  readonly usdt_decimals?: number;
  readonly usdc_address?: string;
  readonly usdc_decimals?: number;
  readonly url_explorer: string;
  readonly url_binance_price: string;
  readonly url_rpc: string;
  readonly url_rpc_ws: string;
  readonly wallet_generate: Function;
  readonly wallet_scan: Function;
  readonly wallet_scan_withdraw: Function;
  readonly wallet_scan_refund: Function;
  readonly socket_connect: Function;
}

export default interface config_i {
  readonly ENV_HOST: string;
  readonly ENV_PORT: number;
  readonly ENV_PORT_SOCKET: number;
  readonly ENV_COOKIE_NAME: string;
  readonly ENV_COOKIE_LIFETIME_MS: number;
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

  readonly ENV_API_KEY_GARANTI: string;
  readonly ENV_API_KEY_GARANTI_SWITCH: string;
  readonly ENV_API_KEY_GARANTI_SWITCH_PASSWORD: string;
  readonly ENV_API_KEY_GARANTI_MERCHANT: string;
  readonly ENV_API_KEY_GARANTI_TERMINAL: string;
  readonly ENV_API_KEY_GARANTI_USER: string;
  readonly ENV_API_KEY_GARANTI_PASSWORD: string;
  readonly ENV_API_KEY_GARANTI_STORE: string;

  readonly ENV_API_KEY_EXCHANGE: string;

  readonly ENV_API_KEY_HELIUS: string;
  readonly ENV_API_KEY_INFURA: string;

  readonly ENV_API_KEY_CAPTCHA: string;

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
  readonly endpoint_products: string;
  readonly endpoint_products_id: string;
  readonly endpoint_orders: string;
  readonly endpoint_orders_delivery: string;
  readonly endpoint_provisions: string;
  readonly endpoint_provisions_payments: string;
  readonly endpoint_wallets: string;
  readonly endpoint_cards: string;
  readonly endpoint_coupons: string;
  readonly endpoint_reviews: string;
  readonly endpoint_admin_mail_send: string;
  readonly endpoint_admin_settings: string;
  readonly endpoint_admin_products: string;
  readonly endpoint_admin_wallets: string;
  readonly endpoint_admin_coupons: string;

  readonly role_user: role_t;
  readonly role_admin: role_t;

  readonly time_gmt: number;
  readonly time_one_min_ms: number;
  readonly time_one_hour_ms: number;
  readonly time_one_day_ms: number;

  readonly type_object_id: type_t;
  readonly type_string: type_t;
  readonly type_number: type_t;
  readonly type_int: type_t;
  readonly type_float: type_t;
  readonly type_date: type_t;
  readonly type_double: type_t;
  readonly type_boolean: type_t;
  readonly type_bool: type_t;
  readonly type_object: type_t;
  readonly type_array: type_t;
  readonly type_function: type_t;
  readonly type_null: type_t;
  readonly type_undefined: type_t;

  // (array)
  readonly blockchains: blockchain_i[];
}
