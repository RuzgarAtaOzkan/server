// MODULES
import { Document } from 'mongodb';

// UTILS
import { user_profile_i } from './utils';

// some of the credential properties can and will be altered during the validation process

// USER INTERFACES
export interface user_signup_credentials_i {
  name: string;
  username: string;
  email: string;
  readonly password: string;
  readonly remember: boolean;
  ref_code: string;
  readonly captcha: string;
  readonly ip: string;
}

export interface user_signup_result_i {
  readonly profile: user_profile_i;
  readonly email_verification_code: string;
  readonly cookie_value: string;
  readonly cookie_expires: undefined | Date;
}

export interface user_signin_credentials_i {
  uid: string;
  readonly password: string;
  readonly remember: boolean;
  readonly ip: string;
}

export interface user_signin_result_i {
  readonly profile: user_profile_i;
  readonly cookie_value: string;
  readonly cookie_expires: undefined | Date;
}

export interface user_get_profile_credentials_i {
  sid: string;
  ip: string;
}

export interface user_get_profile_result_i {
  readonly profile: null | user_profile_i;
  readonly cookie_value: string;
  readonly cookie_expires: undefined | Date;
}

export interface user_patch_profile_credentials_i {
  name: string;
  username: string;
  img: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  readonly zip: number;
  readonly user: Document;
}

export interface user_email_change_credentials_i {
  email: string;
  readonly user: Document;
}

export interface user_password_reset_credentials_i {
  readonly code: string;
  readonly password: string;
}

export interface user_password_change_credentials_i {
  readonly password: string;
  readonly user: Document;
}

export interface user_signout_credentials_i {
  sid: string;
  readonly user: Document;
}

export interface user_email_change_result_i {
  readonly profile: user_profile_i;
  readonly email_verification_code: string;
}

// MAIL INTERFACES
export interface mail_send_verification_link_credentials_i {
  readonly code: string;
  email: string;
}

export interface mail_resend_verification_link_credentials_i {
  email: string;
  readonly captcha: string;
  readonly user: Document;
}

export interface mail_send_password_reset_link_credentials_i {
  email: string;
  readonly captcha: string;
}
