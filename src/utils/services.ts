'use strict';

// MODULES
import validator from 'validator';
import fs from 'fs';
import axios from 'axios';
import Crypto from 'node:crypto';

// INTERFACES
import { Document, ObjectId } from 'mongodb';
import { options_i } from 'interfaces/common';

// CONFIG
import config from '../config';

// UTILS
import { random, str_remove_space } from './common';

///////////////////////
// AUTH UTILS
///////////////////////
export class validator_common_init {
  private readonly options: options_i;

  constructor(options: options_i) {
    this.options = options;
  }

  static base64(base64: string, err: any) {
    if (typeof base64 !== config.types.string) {
      throw {
        message: 'invalid credentials',
        type: `${err.section}:${err.type}`,
      };
    }

    if (base64.length > 1000000) {
      throw {
        message: 'credentials are too big',
        type: `${err.section}:${err.type}`,
      };
    }

    // allowed image types
    if (
      !base64.startsWith('data:image/png;base64,') &&
      !base64.startsWith('data:image/jpg;base64,') &&
      !base64.startsWith('data:image/jpeg;base64,') &&
      !base64.startsWith('data:image/webp;base64,')
    ) {
      throw {
        message: 'invalid credentials',
        type: `${err.section}:${err.type}`,
      };
    }

    const base64_parts: string[] = base64.split(';base64,');
    const base64_type: string = base64_parts[0];
    const base64_data: string = base64_parts[1];
    const file_ext: string = base64_type.split('/')[1];

    if (!validator.isBase64(base64_data)) {
      throw {
        message: 'invalid credentials',
        type: `${err.section}:${err.type}`,
      };
    }
  }
}

export class validator_auth_init {
  private readonly options: options_i;
  private readonly password_config: any;

  constructor(options: options_i) {
    this.options = options;

    this.password_config = {
      minLength: 8,
      minSymbols: 0,
      minNumbers: 0,
      minLowercase: 0,
      minUppercase: 0,
    };
  }

  async edit_profile(credentials: any): Promise<void> {
    const err = { section: 'auth', type: 'profile-edit' };

    if (credentials.name) {
      if (typeof credentials.name !== config.types.string) {
        throw {
          message: 'invalid credentials',
          type: `${err.section}:${err.type}`,
        };
      }

      if (credentials.name.length > 50) {
        throw {
          message: 'name is too long',
          type: `${err.section}:${err.type}`,
        };
      }

      credentials.name = str_remove_space(credentials.name);
    }

    if (credentials.username) {
      if (typeof credentials.username !== config.types.string) {
        throw {
          message: 'invalid username',
          type: `${err.section}:${err.type}`,
        };
      }

      if (credentials.username.length > 50) {
        throw {
          message: 'username is too long',
          type: `${err.section}:${err.type}`,
        };
      }

      credentials.username = str_remove_space(
        credentials.username
      ).toLowerCase();

      if (!validator.isAlphanumeric(credentials.username)) {
        throw {
          message: 'invalid username',
          type: `${err.section}:${err.type}`,
        };
      }

      if (credentials.username !== credentials.user.username) {
        const user_existing = await this.options.db.users.findOne({
          username: credentials.username,
        });

        if (user_existing) {
          throw {
            message: 'existing username',
            type: `${err.section}:${err.type}`,
          };
        }

        if (
          credentials.user.username_changed_at.valueOf() +
            config.times.one_day_ms * 30 >
          Date.now()
        ) {
          throw {
            message: 'invalid username change date',
            type: `${err.section}:${err.type}`,
          };
        }
      }
    }

    if (credentials.phone) {
      if (typeof credentials.phone !== config.types.string) {
        throw {
          message: 'invalid phone',
          type: `${err.section}:${err.type}`,
        };
      }

      if (credentials.phone.length > 14) {
        throw {
          message: 'phone is too long',
          type: `${err.section}:${err.type}`,
        };
      }

      credentials.phone = str_remove_space(credentials.phone);

      if (!validator.isMobilePhone(credentials.phone)) {
        throw {
          message: 'invalid phone',
          type: `${err.section}:${err.type}`,
        };
      }
    }

    if (credentials.wallet_address) {
      if (typeof credentials.wallet_address !== config.types.string) {
        throw {
          message: 'invalid wallet address',
          type: `${err.section}:${err.type}`,
        };
      }

      if (credentials.wallet_address.length > 100) {
        throw {
          message: 'wallet address is too long',
          type: `${err.section}:${err.type}`,
        };
      }

      credentials.wallet_address = str_remove_space(credentials.wallet_address);

      if (
        !validator.isHexadecimal(credentials.wallet_address) ||
        !credentials.wallet_address.startsWith('0x')
      ) {
        throw {
          message: 'invalid wallet address',
          type: `${err.section}:${err.type}`,
        };
      }
    }

    if (credentials.img_base64) {
      validator_common_init.base64(credentials.img_base64, err);
    }
  }

  async signup(credentials: any): Promise<void> {
    const err = { section: 'auth', type: 'signup' };

    if (
      typeof credentials.name !== config.types.string ||
      typeof credentials.email !== config.types.string ||
      typeof credentials.username !== config.types.string ||
      typeof credentials.phone !== config.types.string ||
      typeof credentials.password !== config.types.string
    ) {
      throw {
        message: 'invalid credentials',
        type: `${err.section}:${err.type}`,
      };
    }

    if (
      credentials.name.length > 50 ||
      credentials.email.length > 100 ||
      credentials.username.length > 32 ||
      credentials.phone.length > 14 ||
      credentials.password.length > 32
    ) {
      throw {
        message: 'credentials are too long',
        type: `${err.section}:${err.type}`,
      };
    }

    credentials.name = str_remove_space(credentials.name);
    credentials.email = str_remove_space(credentials.email).toLowerCase();
    credentials.username = str_remove_space(credentials.username).toLowerCase();
    credentials.phone = str_remove_space(credentials.phone);
    credentials.password = str_remove_space(credentials.password);

    if (!validator.isEmail(credentials.email)) {
      throw {
        message: 'invalid email',
        type: `${err.section}:${err.type}`,
      };
    }

    if (!validator.isAlphanumeric(credentials.username)) {
      throw {
        message: 'invalid username',
        type: `${err.section}:${err.type}`,
      };
    }

    if (!validator.isMobilePhone(credentials.phone)) {
      throw {
        message: 'invalid phone',
        type: `${err.section}:${err.type}`,
      };
    }

    if (credentials.password.includes(' ')) {
      throw {
        message: 'invalid password',
        type: `${err.section}:${err.type}`,
      };
    }

    if (
      !validator.isStrongPassword(credentials.password, this.password_config)
    ) {
      throw {
        message: 'weak password',
        type: `${err.section}:${err.type}`,
      };
    }

    const user_existing = await this.options.db.users.findOne({
      $or: [{ email: credentials.email }, { username: credentials.username }],
    });

    if (user_existing) {
      throw {
        message: 'existing user',
        type: `${err.section}:${err.type}`,
      };
    }

    if (credentials.img_base64) {
      validator_common_init.base64(credentials.img_base64, err);
    }

    if (!validator.isIP(credentials.ip)) {
      throw { message: 'invalid ip', type: `${err.section}:${err.type}` };
    }

    const urlencoded_captcha: string =
      'response=' +
      credentials.captcha_token +
      '&secret=' +
      config.env.API_KEY_CAPTCHA;

    const res_capthca: any = await axios.post(
      'https://api.hcaptcha.com/siteverify',
      urlencoded_captcha,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (!res_capthca.data.success) {
      throw {
        message: 'captcha fail',
        type: `${err.section}:${err.type}`,
      };
    }
  }

  async signin(credentials: any): Promise<Document> {
    const err = { section: 'auth', type: 'signin' };

    if (!credentials.uid || !credentials.password) {
      throw {
        message: 'missing credentials',
        type: `${err.section}:${err.type}`,
      };
    }

    if (
      typeof credentials.ip !== config.types.string ||
      typeof credentials.uid !== config.types.string ||
      typeof credentials.password !== config.types.string
    ) {
      throw {
        message: 'invalid credentials',
        type: `${err.section}:${err.type}`,
      };
    }

    credentials.uid = str_remove_space(credentials.uid).toLowerCase();
    credentials.password = str_remove_space(credentials.password);

    const user: Document | null = await this.options.db.users.findOne({
      $or: [{ email: credentials.uid }, { username: credentials.uid }],
    });

    if (!user) {
      throw {
        message: 'missing user',
        type: `${err.section}:${err.type}`,
      };
    }

    if (
      user.password !==
      Crypto.createHash('sha256').update(credentials.password).digest('hex')
    ) {
      throw {
        message: 'wrong password',
        type: `${err.section}:${err.type}`,
      };
    }

    return user;
  }

  async reset_password(credentials: any): Promise<void> {
    const err = { section: 'auth', type: 'password-reset' };

    if (
      typeof credentials.password !== config.types.string ||
      typeof credentials.token !== config.types.string
    ) {
      throw {
        message: 'invalid credentials',
        type: `${err.section}:${err.type}`,
      };
    }

    if (credentials.password.length > 50 || credentials.token.length > 256) {
      throw {
        message: 'credentials are too long',
        type: `${err.section}:${err.type}`,
      };
    }

    credentials.password = str_remove_space(credentials.password);
    credentials.token = str_remove_space(credentials.token);

    if (credentials.password.includes(' ')) {
      throw { message: 'invalid password', type: `${err.section}:${err.type}` };
    }

    if (
      !validator.isStrongPassword(credentials.password, this.password_config)
    ) {
      throw {
        message: 'weak password',
        type: `${err.section}:${err.type}`,
      };
    }

    const user: Document | null = await this.options.db.users.findOne({
      password_reset_token: credentials.token,
    });

    if (!user) {
      throw {
        message: 'missing user',
        type: `${err.section}:${err.type}`,
      };
    }

    if (credentials.token !== user.password_reset_token) {
      throw {
        message: 'invalid token',
        type: `${err.section}:${err.type}`,
      };
    }

    if (user.password_reset_token_exp_at.valueOf() < Date.now()) {
      throw {
        message: 'expired token',
        type: `${err.section}:${err.type}`,
      };
    }
  }

  async change_password(credentials: any): Promise<void> {
    const err = { section: 'auth', type: 'password-change' };

    if (
      typeof credentials.password !== config.types.string ||
      typeof credentials.new_password !== config.types.string
    ) {
      throw {
        message: 'invalid credentials',
        type: `${err.section}:${err.type}`,
      };
    }

    if (
      credentials.password.length > 50 ||
      credentials.new_password.length > 50
    ) {
      throw {
        message: 'credentials are too long',
        type: `${err.section}:${err.type}`,
      };
    }

    credentials.password = str_remove_space(credentials.password);
    credentials.new_password = str_remove_space(credentials.new_password);

    if (
      credentials.user.password !==
      Crypto.createHash('sha256').update(credentials.password).digest('hex')
    ) {
      throw { message: 'wrong password', type: `${err.section}:${err.type}` };
    }

    if (credentials.new_password.includes(' ')) {
      throw {
        message: 'New password is invalid',
        type: `${err.section}:${err.type}`,
      };
    }

    if (
      !validator.isStrongPassword(
        credentials.new_password,
        this.password_config
      )
    ) {
      throw {
        message: 'weak password',
        type: `${err.section}:${err.type}`,
      };
    }
  }

  async change_email(credentials: any): Promise<void> {
    const err = { section: 'auth', type: 'email-change' };

    if (typeof credentials.email !== config.types.string) {
      throw {
        message: 'invalid credentials',
        type: `${err.section}:${err.type}`,
      };
    }

    if (credentials.email.length > 256) {
      throw {
        message: 'credentials are too long',
        type: `${err.section}:${err.type}`,
      };
    }

    credentials.email = str_remove_space(credentials.email);

    if (!validator.isEmail(credentials.email)) {
      throw { message: 'invalid email', type: `${err.section}:${err.type}` };
    }

    const existing_user: Document | null = await this.options.db.users.findOne({
      email: credentials.email,
    });

    if (existing_user) {
      throw {
        message: 'existing user',
        type: `${err.section}:${err.type}`,
      };
    }
  }

  async verify_email(credentials: any): Promise<Document> {
    const err = { section: 'auth', type: 'email-verify' };

    if (typeof credentials.token !== config.types.string) {
      throw {
        message: 'invalid credentials',
        type: `${err.section}:${err.type}`,
      };
    }

    if (credentials.token.length > 256) {
      throw {
        message: 'credentials are too long',
        type: `${err.section}:${err.type}`,
      };
    }

    credentials.token = str_remove_space(credentials.token);

    const user: Document | null = await this.options.db.users.findOne({
      email_verification_token: credentials.token,
    });

    if (!user) {
      throw {
        message: 'missing user',
        type: `${err.section}:${err.type}`,
      };
    }

    if (user.email_verification_token !== credentials.token) {
      throw {
        message: 'invalid token',
        type: `${err.section}:${err.type}`,
      };
    }

    if (user.email_verification_token_exp_at.valueOf() < Date.now()) {
      throw {
        message: 'expired token',
        type: `${err.section}:${err.type}`,
      };
    }

    return user;
  }
}

// TODO! if concurrent create_session request arrives, at least one of them will overwrite the other session hash, find a way to avoid hSet if key exists...
export async function create_session(
  payload: any,
  options: options_i
): Promise<string> {
  const session: string = JSON.stringify({
    user_id: payload.user_id,
    ip: payload.ip,
    created_at: new Date(),
  });

  let sid: string = random({ length: 128 });
  let result: number = await options.redis.HSETNX('sessions', sid, session);

  while (!result) {
    sid = random({ length: 128 });
    result = await options.redis.HSETNX('sessions', sid, session);
  }

  return sid;
}

export async function generate_email_verification_token(
  options: options_i
): Promise<string> {
  let token: string = random({ length: 64 });
  let user: Document | null = await options.db.users.findOne({
    email_verification_token: token,
  });

  while (user) {
    token = random({ length: 64 });
    user = await options.db.users.findOne({
      email_verification_token: token,
    });
  }

  return token;
}

export async function generate_password_reset_token(
  options: options_i
): Promise<string> {
  let token: string = random({ length: 64 });
  let user: Document | null = await options.db.users.findOne({
    password_reset_token: token,
  });

  while (user) {
    token = random({ length: 64 });
    user = await options.db.users.findOne({
      password_reset_token: token,
    });
  }

  return token;
}

async function generate_ref_code(options: options_i): Promise<string> {
  let code: string = random({
    length: 8,
    type: 'distinguishable',
  });

  let user: Document = await options.db.users.findOne({
    ref_code: code,
  });

  while (user) {
    code = random({ length: 8, type: 'distinguishable' });
    user = await options.db.users.findOne({ ref_code: code });
  }

  return code;
}

export async function generate_api_key(options: options_i): Promise<string> {
  const LENGTH: number = 40; // safubase_123cdD893dS679sdd
  const BUFFER: string[] =
    'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890'.split('');

  // mix the chars in array
  for (let i: number = 0; i < BUFFER.length; i++) {
    const randx: number = Math.floor(Math.random() * BUFFER.length);
    const randy: number = Math.floor(Math.random() * BUFFER.length);
    const saved: string = BUFFER[randx];

    BUFFER[randx] = BUFFER[randy];
    BUFFER[randy] = saved;
  }

  const namespace: string = config.env.DB_NAME;

  // len_ran: length of random on the right side of the string.
  const random_len: number = LENGTH - (namespace.length + 1); // + 1: underscore on the middle
  let random: string = '';

  for (let i: number = 0; i < random_len; i++) {
    random = random + BUFFER[Math.floor(Math.random() * BUFFER.length)];
  }

  let final: string = namespace + '_' + random;
  let user: Document | null = await options.db.users.findOne({
    api_key: final,
  });

  while (user) {
    random = '';

    for (let i = 0; i < random_len; i++) {
      random = random + BUFFER[Math.floor(Math.random() * BUFFER.length)];
    }

    final = namespace + '_' + random;

    user = await options.db.users.findOne({ api_key: final });
  }

  return final;
}

export async function create_user_doc(
  credentials: any,
  options: options_i
): Promise<any> {
  const res = await Promise.all([
    generate_email_verification_token(options),
    generate_ref_code(options),
    options.db.users.findOne({ ref_code: credentials.ref_code }),
    generate_api_key(options),
  ]);

  const email_verification_token: string = res[0];
  const ref_code: string = res[1];
  const ref_from: ObjectId | null = res[2] ? res[2]._id : null;
  const api_key: string = res[3];

  const doc: any = {
    name: str_remove_space(credentials.name),

    username: str_remove_space(credentials.username).toLowerCase(),
    username_changed_at: new Date(),

    email: str_remove_space(credentials.email).toLowerCase(),
    email_verified: false,
    email_verification_token: email_verification_token,
    email_verification_token_exp_at: new Date(
      Date.now() + config.times.one_day_ms
    ),

    password: Crypto.createHash('sha256')
      .update(credentials.password)
      .digest('hex'),
    password_reset_token: null,
    password_reset_token_exp_at: new Date(),

    role: config.roles.user,
    role_key: config.env.ROLE_KEY_USER,

    ref_code: ref_code,
    ref_from: ref_from,

    img: '',

    phone: str_remove_space(credentials.phone),

    api_key: api_key,

    wallet_address: '',

    created_at: new Date(),
    updated_at: new Date(),
  };

  return doc;
}

export function return_user_profile(user: any) {
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    email_verified: user.email_verified,
    phone: user.phone,
    role: user.role,
    img: user.img,
    ref_code: user.ref_code,
    ref_from: user.ref_from,
    api_key: user.api_key,
    wallet_address: user.wallet_address,
  };
}

///////////////////////
// MAIL UTILS
///////////////////////
export class validator_mail_init {
  private readonly options: options_i;

  constructor(options: options_i) {
    this.options = options;
  }

  async send_verification_link(payload: any): Promise<Document> {
    const err = { section: 'mail', type: 'send-verification-link' };

    if (
      typeof payload.email !== config.types.string ||
      typeof payload.token !== config.types.string
    ) {
      throw {
        message: 'invalid credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (payload.email.length > 256 || payload.token.length > 256) {
      throw {
        message: 'credentials are too long',
        code: `${err.section}:${err.type}`,
      };
    }

    payload.email = str_remove_space(payload.email).toLowerCase();

    if (!validator.isEmail(payload.email)) {
      throw { message: 'invalid email', code: `${err.section}:${err.type}` };
    }

    const user: Document | null = await this.options.db.users.findOne({
      email: payload.email,
    });

    if (!user) {
      throw {
        message: 'missing user',
        code: `${err.section}:${err.type}`,
      };
    }

    return user;
  }

  async resend_verification_link(email: string): Promise<Document> {
    const err = { section: 'mail', type: 'resend-verification-link' };

    if (typeof email !== config.types.string) {
      throw {
        message: 'invalid credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (email.length > 256) {
      throw {
        message: 'credentials are too long',
        code: `${err.section}:${err.type}`,
      };
    }

    email = str_remove_space(email).toLowerCase();

    if (!validator.isEmail(email)) {
      throw { message: 'invalid email', code: `${err.section}:${err.type}` };
    }

    const user: Document | null = await this.options.db.users.findOne({
      email: email,
    });

    if (!user) {
      throw {
        message: 'missing user',
        code: `${err.section}:${err.type}`,
      };
    }

    if (user.email_verified) {
      throw {
        message: 'email is already verified',
        code: `${err.section}:${err.type}`,
      };
    }

    return user;
  }

  async send_password_reset_link(email: string): Promise<Document> {
    const err = { section: 'mail', type: 'send-password-reset-link' };

    if (typeof email !== config.types.string) {
      throw {
        message: 'invalid credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (email.length > 256) {
      throw {
        message: 'credentials are too long',
        code: `${err.section}:${err.type}`,
      };
    }

    email = str_remove_space(email).toLowerCase();

    if (!validator.isEmail(email)) {
      throw { message: 'invalid email', code: `${err.section}:${err.type}` };
    }

    const user: Document | null = await this.options.db.users.findOne({
      email: email,
    });

    if (!user) {
      throw {
        message: 'missing user',
        code: `${err.section}:${err.type}`,
      };
    }

    return user;
  }
}

export function generate_html(type = 'email-verify', payload: any): string {
  switch (type) {
    case 'email-verify':
      return (
        '<!DOCTYPE html><html lang="en"> <head> <meta charset="UTF-8"/> <meta http-equiv="X-UA-Compatible" content="IE=edge"/> <meta name="viewport" content="width=device-width,initial-scale=1"/> <title>' +
        config.env.URL_UI +
        '</title> <style rel="stylesheet"> *{margin: 0; padding: 0; box-sizing: border-box; font-family: sans-serif; text-decoration: none; border: none; outline: none;}body{}.mail{max-width: 600px;}.mail-img{display: block; width: 30px; border-radius: 6px;}.mail-title{margin-top: 1rem; font-size: 16px; margin-bottom: 1rem;}.mail-desc{margin: 1rem 0;}.mail-warning{margin-top: 1rem;}.mail-copyright{margin-top: 1rem;}</style> </head> <body> <div class="mail"> <img src="https://' +
        config.env.URL_UI +
        '/favicon.ico" alt="' +
        config.env.DB_NAME +
        '" class="mail-img"/> <h1 class="mail-title"> Welcome to ' +
        config.env.URL_UI +
        ', please confirm your email. </h1> <div class="mail-value"> Account: <span class="username">' +
        payload.username +
        '</span> </div><div class="mail-value"> IP Address: <span class="ip">' +
        payload.ip +
        '</span> </div><div class="mail-value"> Date: <span class="date">' +
        payload.date +
        '</span> </div><div class="mail-desc"> Please confirm the e-mail belov by clicking the hyperlink </div><a href="' +
        payload.link +
        '" target="_blank" rel="referrer" class="mail-button" >' +
        payload.link +
        '</a > <div class="mail-warning"> If you didn\'t signup to ' +
        config.env.URL_UI +
        ', you can ignore this email </div><div class="mail-copyright"> © 2023 ' +
        config.env.URL_UI +
        ' | All rights reserved. </div></div></body></html>'
      );

    case 'password-reset':
      return (
        '<!DOCTYPE html><html lang="en"> <head> <meta charset="UTF-8"/> <meta http-equiv="X-UA-Compatible" content="IE=edge"/> <meta name="viewport" content="width=device-width,initial-scale=1"/> <title>' +
        config.env.URL_UI +
        '</title> <style rel="stylesheet"> *{margin: 0; padding: 0; box-sizing: border-box; font-family: sans-serif; text-decoration: none; border: none; outline: none;}body{}.mail{max-width: 600px;}.mail-img{display: block; width: 30px; border-radius: 6px;}.mail-title{margin-top: 1rem; font-size: 16px; margin-bottom: 1rem;}.mail-desc{margin: 1rem 0;}.mail-warning{margin-top: 1rem;}.mail-copyright{margin-top: 1rem;}</style> </head> <body> <div class="mail"> <img src="https://' +
        config.env.URL_UI +
        '/favicon.ico" alt="' +
        config.env.DB_NAME +
        '" class="mail-img"/> <h1 class="mail-title"> Welcome to ' +
        config.env.URL_UI +
        ', please reset your password. </h1> <div class="mail-value"> Account: <span class="username">' +
        payload.username +
        '</span> </div><div class="mail-value"> IP Address: <span class="ip">' +
        payload.ip +
        '</span> </div><div class="mail-value"> Date: <span class="date">' +
        payload.date +
        '</span> </div><div class="mail-desc"> Please reset your password by clicking the hyperlink belov</div><a href="' +
        payload.link +
        '" target="_blank" rel="referrer" class="mail-button" >' +
        payload.link +
        '</a > <div class="mail-warning"> If you didn\'t send this request, you can ignore this email </div><div class="mail-copyright"> © 2023 ' +
        config.env.URL_UI +
        ' | All rights reserved. </div></div></body></html>'
      );

    default:
      return '';
  }
}

///////////////////////
// SETTINGS UTILS
///////////////////////
export class validator_settings_init {
  private readonly options: options_i;

  constructor(options: options_i) {
    this.options = options;
  }
}

export default {
  validator_common_init,
  validator_auth_init,
  create_session,
  generate_email_verification_token,
  generate_password_reset_token,
  generate_api_key,
  create_user_doc,
  return_user_profile,
  validator_mail_init,
  generate_html,
  validator_settings_init,
};
