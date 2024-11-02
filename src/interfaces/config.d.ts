import { roles_t, types_t } from 'types/config';

export default interface config_i {
  readonly endpoints: {
    readonly static_images: string;

    readonly auth_root: string;
    readonly auth_profile: string;
    readonly auth_signin: string;
    readonly auth_signup: string;
    readonly auth_signout: string;
    readonly auth_email_verify: string;
    readonly auth_email_change: string;
    readonly auth_password_change: string;
    readonly auth_password_reset: string;

    readonly mail_send_verification_link: string;
    readonly mail_send_password_reset_link: string;

    readonly settings: string;
  };
  readonly env: {
    readonly PORT: string;
    readonly PORT_SOCKET: string;

    readonly HOST: string;

    readonly SESSION_SECRET: string;
    readonly SESSION_NAME: string;
    readonly SESSION_LIFETIME_MS: number;

    readonly DB_URL: string;
    readonly DB_NAME: string;

    readonly ROLE_KEY_ADMIN: string;
    readonly ROLE_KEY_USER: string;

    readonly EMAIL_HOST: string;
    readonly EMAIL_USERNAME: string;
    readonly EMAIL_PASSWORD: string;

    readonly URL_API: string;
    readonly URL_UI: string;

    readonly API_KEY_CAPTCHA: string;

    readonly API_KEY_0X: string;

    readonly API_KEY_MORALIS: string;

    readonly API_KEY_ETHERSCAN: string;
    readonly API_KEY_BSCSCAN: string;
    readonly API_KEY_ARBISCAN: string;
    readonly API_KEY_POLYGONSCAN: string;
    readonly API_KEY_FTMSCAN: string;
    readonly API_KEY_CELOSCAN: string;
  };
  readonly roles: {
    readonly admin: roles_t;
    readonly user: roles_t;
  };
  readonly times: {
    readonly one_min_ms: number;
    readonly one_hour_ms: number;
    readonly one_day_ms: number;
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

  readonly blockchain_chains: {
    [key: string]: any;
  };
}
