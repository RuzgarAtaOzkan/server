import { roles_t, types_t } from 'types/config';

export default interface config_i {
  readonly endpoints: {
    readonly auth_root: string;
    readonly auth_profile: string;
    readonly auth_signin: string;
    readonly auth_signup: string;
    readonly auth_signout: string;
    readonly auth_email_verify: string;
    readonly auth_email_change: string;
    readonly auth_password_change: string;
    readonly auth_password_reset: string;

    readonly mail_send: string;
    readonly mail_send_verification_link: string;
    readonly mail_send_password_reset_link: string;
    readonly mail_subscriptions: string;

    readonly settings: string;
    readonly settings_banners: string;
    readonly settings_campaigns: string;
    readonly settings_notifications: string;
    readonly settings_faq: string;

    readonly stores: string;
    readonly stores_store: string;

    readonly products: string;
    readonly products_favs: string;
  };
  readonly env: {
    readonly PORT: string;
    readonly HOST: string;
    readonly NODE_ENV: string;
    readonly SESSION_SECRET: string;
    readonly SESSION_LIFETIME: number;
    readonly SESSION_LIFETIME_MS: number;
    readonly SESSION_NAME: string;
    readonly DB_CONN_STR: string;
    readonly DB_NAME: string;
    readonly PERM_ADMIN: string;
    readonly PERM_USER: string;
    readonly EMAIL_HOST: string;
    readonly EMAIL_NO_REPLY_USERNAME: string;
    readonly EMAIL_NO_REPLY_PASSWORD: string;
    readonly URL_API: string;
    readonly URL_UI: string;
    readonly IMAGEKIT_PUBLIC_KEY: string;
    readonly IMAGEKIT_PRIVATE_KEY: string;
    readonly IMAGEKIT_ID: string;
    readonly SECRET_KEY_CAPTCHA: string;
  };
  readonly roles: {
    readonly admin: roles_t;
    readonly user: roles_t;
  };
  readonly times: {
    readonly one_min_ms: number;
    readonly one_hour_ms: number;
    readonly one_day_ms: number;
    readonly one_hour_s: number;
  };
  readonly types: {
    readonly objectId: types_t;
    readonly string: types_t;
    readonly number: types_t;
    readonly int: types_t;
    readonly float: types_t;
    readonly date: types_t;
    readonly double: types_t;
    readonly boolean: types_t;
    readonly bool: types_t;
    readonly object: types_t;
    readonly array: types_t;
    readonly function: types_t;
    readonly null: types_t;
    readonly undefined: types_t;
  };
}
