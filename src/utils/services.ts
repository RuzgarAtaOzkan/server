'use strict';

// MODULES
import fs from 'node:fs';
import crypto from 'node:crypto';
import axios from 'axios';
import validator from 'validator';

// INTERFACES
import { Document, ObjectId } from 'mongodb';
import { options_i } from 'interfaces/common';

// CONFIG
import config from '../config';

// UTILS
import { random, str_remove_space } from './common';

///////////////////////
// COMMON UTILS
///////////////////////
export class common_validator_init {
  private readonly options: options_i;

  constructor(options: options_i) {
    this.options = options;
  }

  static base64(base64: string) {
    if (typeof base64 !== config.type_string) {
      throw 'ERR_INVALID_BASE64';
    }

    if (base64.length > 500000) {
      throw 'ERR_LONG_BASE64';
    }

    // allowed image types
    if (
      base64.startsWith('data:image/png;base64,') === false &&
      base64.startsWith('data:image/jpg;base64,') === false &&
      base64.startsWith('data:image/jpeg;base64,') === false &&
      base64.startsWith('data:image/webp;base64,') === false
    ) {
      throw 'ERR_INVALID_BASE64';
    }

    const base64_parts: string[] = base64.split(';base64,');

    const base64_type: string = base64_parts[0];
    const base64_data: string = base64_parts[1];

    const base64_ext: string = base64_type.split('/')[1];

    if (validator.isBase64(base64_data) === false) {
      throw 'ERR_INVALID_BASE64';
    }
  }
}

///////////////////////
// USER UTILS
///////////////////////
export class user_validator_init {
  private readonly options: options_i;
  private readonly password_config: any;

  constructor(options: options_i) {
    this.options = options;

    // password difficulty configurations
    this.password_config = {
      minLength: 8,
      minSymbols: 0,
      minNumbers: 0,
      minLowercase: 0,
      minUppercase: 0,
    };
  }

  async edit_profile(credentials: any): Promise<void> {
    // TODO: forbid user to change its contact informations if he has open orders or rented products so store owner can locate his contact information easily when the end of rent is due
    const res: any[] = await Promise.all([
      this.options.db.orders.findOne({
        user_id: credentials.user._id,
        open: true,
        error: '',
      }),
      this.options.db.products.findOne({
        user_id: credentials.user._id,
        status: { $gte: 2 },
      }),
    ]);

    const order: Document | null = res[0];
    const product: Document | null = res[1];

    if (order) {
      throw 'ERR_EXISTING_ORDER';
    }

    if (product) {
      throw 'ERR_EXISTING_PRODUCT';
    }

    if (credentials.name) {
      if (typeof credentials.name !== config.type_string) {
        throw 'ERR_INVALID_NAME';
      }

      credentials.name = str_remove_space(credentials.name);

      if (credentials.name.length > 32) {
        throw 'ERR_LONG_NAME';
      }
    }

    if (credentials.username) {
      if (typeof credentials.username !== config.type_string) {
        throw 'ERR_INVALID_USERNAME';
      }

      credentials.username = str_remove_space(
        credentials.username
      ).toLowerCase();

      if (credentials.username.length > 32) {
        throw 'ERR_LONG_USERNAME';
      }

      if (validator.isAlphanumeric(credentials.username) === false) {
        throw 'ERR_USERNAME';
      }

      if (credentials.username !== credentials.user.username) {
        const user = await this.options.db.users.findOne({
          username: credentials.username,
        });

        if (user) {
          throw 'ERR_EXISTING_USERNAME';
        }

        if (
          credentials.user.username_changed_at.valueOf() +
            config.time_one_day_ms * 30 >
          Date.now()
        ) {
          throw 'ERR_INVALID_USERNAME_CHANGE_DATE';
        }
      }
    }

    if (credentials.img) {
      common_validator_init.base64(credentials.img);
    }

    if (credentials.phone) {
      if (typeof credentials.phone !== config.type_string) {
        throw 'ERR_INVALID_PHONE';
      }

      credentials.phone = str_remove_space(credentials.phone);

      if (credentials.phone.length > 14) {
        throw 'ERR_LONG_PHONE';
      }

      if (validator.isMobilePhone(credentials.phone) === false) {
        throw 'ERR_INVALID_PHONE';
      }
    }

    if (credentials.city) {
      if (typeof credentials.city !== config.type_string) {
        throw 'ERR_INVALID_CITY';
      }

      credentials.city = str_remove_space(credentials.city).toLowerCase();

      if (credentials.city.length > 32) {
        throw 'ERR_LONG_CITY';
      }
    }

    if (credentials.district) {
      if (typeof credentials.district !== config.type_string) {
        throw 'ERR_INVALID_DISTRICT';
      }

      credentials.district = str_remove_space(
        credentials.district
      ).toLowerCase();

      if (credentials.district.length > 32) {
        throw 'ERR_LONG_DISTRICT';
      }
    }

    if (credentials.neighbourhood) {
      if (typeof credentials.neighbourhood !== config.type_string) {
        throw 'ERR_INVALID_NEIGHBOURHOOD';
      }

      credentials.neighbourhood = str_remove_space(
        credentials.neighbourhood
      ).toLowerCase();

      if (credentials.neighbourhood.length > 32) {
        throw 'ERR_LONG_NEIGHBOURHOOD';
      }
    }

    if (credentials.address) {
      if (typeof credentials.address !== config.type_string) {
        throw 'ERR_INVALID_ADDRESS';
      }

      credentials.address = str_remove_space(credentials.address);

      if (credentials.address.length > 128) {
        throw 'ERR_LONG_ADDRESS';
      }
    }

    if (credentials.zip) {
      if (typeof credentials.zip !== config.type_number) {
        throw 'ERR_INVALID_ZIP';
      }

      if (Math.abs(credentials.zip) > 100000) {
        throw 'ERR_INVALID_ZIP';
      }
    }
  }

  async signup(credentials: any): Promise<void> {
    if (typeof credentials.name !== config.type_string) {
      throw 'ERR_INVALID_NAME';
    }

    if (typeof credentials.email !== config.type_string) {
      throw 'ERR_INVALID_EMAIL';
    }

    if (typeof credentials.username !== config.type_string) {
      throw 'ERR_INVALID_USERNAME';
    }

    if (typeof credentials.password !== config.type_string) {
      throw 'ERR_INVALID_PASSWORD';
    }

    if (credentials.ref_code) {
      if (typeof credentials.ref_code !== config.type_string) {
        throw 'ERR_INVALID_REF';
      }

      credentials.ref_code = str_remove_space(
        credentials.ref_code
      ).toLowerCase();

      if (credentials.ref_code.length > 16) {
        throw 'ERR_LONG_REF';
      }
    }

    if (typeof credentials.remember !== config.type_boolean) {
      throw 'ERR_INVALID_REMEMBER';
    }

    credentials.name = str_remove_space(credentials.name);
    credentials.email = str_remove_space(credentials.email).toLowerCase();
    credentials.username = str_remove_space(credentials.username).toLowerCase();

    if (credentials.name.length > 32) {
      throw 'ERR_LONG_NAME';
    }

    if (credentials.email.length > 32) {
      throw 'ERR_LONG_EMAIL';
    }

    if (credentials.username.length > 32) {
      throw 'ERR_LONG_USERNAME';
    }

    if (credentials.password.length > 32) {
      throw 'ERR_LONG_PASSWORD';
    }

    if (validator.isEmail(credentials.email) === false) {
      throw 'ERR_INVALID_EMAIL';
    }

    if (validator.isAlphanumeric(credentials.username) === false) {
      throw 'ERR_INVALID_USERNAME';
    }

    if (
      validator.isStrongPassword(credentials.password, this.password_config) ===
      false
    ) {
      throw 'ERR_WEAK_PASSWORD';
    }

    const user: Document | null = await this.options.db.users.findOne({
      $or: [{ email: credentials.email }, { username: credentials.username }],
    });

    if (user) {
      throw 'ERR_EXISTING_USER';
    }

    if (config.ENV_API_KEY_CAPTCHA) {
      const urlencoded_captcha: string =
        'response=' +
        credentials.captcha +
        '&secret=' +
        config.ENV_API_KEY_CAPTCHA;

      const res_captcha: any = await axios.post(
        'https://api.hcaptcha.com/siteverify',
        urlencoded_captcha,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (res_captcha.data.success === false) {
        throw 'ERR_CAPTCHA';
      }
    }
  }

  async signin(credentials: any): Promise<Document> {
    if (typeof credentials.uid !== config.type_string) {
      throw 'ERR_INVALID_UID';
    }

    if (typeof credentials.password !== config.type_string) {
      throw 'ERR_INVALID_PASSWORD';
    }

    if (typeof credentials.remember !== config.type_boolean) {
      throw 'ERR_INVALID_REMEMBER';
    }

    credentials.uid = str_remove_space(credentials.uid).toLowerCase();

    if (credentials.uid.length > 32) {
      throw 'ERR_LONG_UID';
    }

    if (credentials.password.length > 32) {
      throw 'ERR_LONG_PASSWORD';
    }

    const user: Document | null = await this.options.db.users.findOne({
      $or: [{ email: credentials.uid }, { username: credentials.uid }],
    });

    if (user === null) {
      throw 'ERR_MISSING_USER';
    }

    if (
      user.password !==
      crypto.createHash('sha256').update(credentials.password).digest('hex')
    ) {
      throw 'ERR_WRONG_PASSWORD';
    }

    return user;
  }

  async reset_password(credentials: any): Promise<Document> {
    if (typeof credentials.password !== config.type_string) {
      throw 'ERR_INVALID_PASSWORD';
    }

    if (typeof credentials.code !== config.type_string) {
      throw 'ERR_INVALID_CODE';
    }

    if (credentials.password.length > 32) {
      throw 'ERR_LONG_PASSWORD';
    }

    credentials.code = str_remove_space(credentials.code);

    if (credentials.code.length > 128) {
      throw 'ERR_LONG_CODE';
    }

    if (
      validator.isStrongPassword(credentials.password, this.password_config) ===
      false
    ) {
      throw 'ERR_WEAK_PASSWORD';
    }

    const user: Document | null = await this.options.db.users.findOne({
      password_reset_code: credentials.code,
    });

    if (user === null) {
      throw 'ERR_MISSING_USER';
    }

    if (credentials.code !== user.password_reset_code) {
      throw 'ERR_INVALID_CODE';
    }

    const exp: number =
      parseInt(user.password_reset_code.substring(0, 8), 16) * 1000;

    if (Date.now() > exp) {
      throw 'ERR_EXPIRED_CODE';
    }

    return user;
  }

  async change_password(credentials: any): Promise<void> {
    if (typeof credentials.password !== config.type_string) {
      throw 'ERR_INVALID_PASSWORD';
    }

    if (credentials.password.length > 32) {
      throw 'ERR_LONG_PASSWORD';
    }

    if (
      validator.isStrongPassword(credentials.password, this.password_config) ===
      false
    ) {
      throw 'ERR_WEAK_PASSWORD';
    }
  }

  async change_email(credentials: any): Promise<void> {
    if (typeof credentials.email !== config.type_string) {
      throw 'ERR_INVALID_EMAIL';
    }

    credentials.email = str_remove_space(credentials.email).toLowerCase();

    if (credentials.email.length > 32) {
      throw 'ERR_LONG_EMAIL';
    }

    if (validator.isEmail(credentials.email) === false) {
      throw 'ERR_INVALID_EMAIL';
    }

    const user: Document | null = await this.options.db.users.findOne({
      email: credentials.email,
    });

    if (user) {
      throw 'ERR_EXISTING_USER';
    }
  }

  async verify_email(credentials: any): Promise<Document> {
    if (typeof credentials.code !== config.type_string) {
      throw 'ERR_INVALID_CODE';
    }

    credentials.code = str_remove_space(credentials.code);

    if (credentials.code.length > 128) {
      throw 'ERR_LONG_CODE';
    }

    const user: Document | null = await this.options.db.users.findOne({
      email_verification_code: credentials.code,
    });

    if (user === null) {
      throw 'ERR_MISSING_USER';
    }

    if (user.email_verification_code !== credentials.code) {
      throw 'ERR_INVALID_CODE';
    }

    const exp: number =
      parseInt(user.email_verification_code.substring(0, 8), 16) * 1000;

    if (Date.now() > exp) {
      throw 'ERR_INVALID_CODE';
    }

    return user;
  }
}

// TODO: if concurrent user_create_session request arrives, at least one of them will overwrite the other session hash, find a way to avoid hSet if key exists...
export async function user_create_session(
  payload: any,
  options: options_i
): Promise<string> {
  const session: string = JSON.stringify({
    user_id: payload.user_id,
    ip: payload.ip,
    remember: payload.remember,
    created_at: new Date(),
  });

  // 32 bytes strong random hexadecimal string
  let sid: string = random();
  let result: number = await options.redis.HSETNX('sessions', sid, session);

  while (result === 0) {
    sid = random();
    result = await options.redis.HSETNX('sessions', sid, session);
  }

  // set expiration for the individual session (sid) in seconds
  let exp: number = config.ENV_SESSION_LIFETIME_MS / 1000;
  if (payload.remember) {
    exp = exp * 30;
  }

  await options.redis.expire(sid, exp);

  return sid;
}

export async function user_generate_email_verification_code(
  length: number = config.time_one_hour_ms, // Date.now() + length in milliseconds
  options: options_i
): Promise<string> {
  // IMPORTANT: exp is a Unix Epoch timestamp, which means it is seconds since Jan 1 1970, setting the expiration date to year 2106 or more is forbidden, it causes the hexadecimal to be 10 bytes which break the algorithms of some functions dependent on it.

  const exp: string = Math.floor((Date.now() + length) / 1000).toString(16);

  let code: string = exp + random(24);
  let user: Document | null = await options.db.users.findOne({
    email_verification_code: code,
  });

  while (user) {
    code = exp + random(24);
    user = await options.db.users.findOne({
      email_verification_code: code,
    });
  }

  return code;
}

export async function user_generate_password_reset_code(
  length: number = config.time_one_hour_ms, // Date.now() + length in milliseconds
  options: options_i
): Promise<string> {
  // IMPORTANT: exp is a Unix Epoch timestamp, which means it is seconds since Jan 1 1970, setting the expiration date to year 2106 or more is forbidden, it causes the hexadecimal to be 10 bytes which breaks the algorithms which expects hexadecimal to be 8 bytes long.

  const exp: string = Math.floor((Date.now() + length) / 1000).toString(16);

  let code: string = exp + random(24);
  let user: Document | null = await options.db.users.findOne({
    password_reset_code: code,
  });

  while (user) {
    code = exp + random(24);
    user = await options.db.users.findOne({ password_reset_code: code });
  }

  return code;
}

export async function user_generate_ref_code(
  options: options_i
): Promise<string> {
  let code: string = random(8);
  let user: Document | null = await options.db.users.findOne({
    ref_code: code,
  });

  while (user) {
    code = random(8);
    user = await options.db.users.findOne({ ref_code: code });
  }

  return code;
}

export async function user_create_doc(
  credentials: any,
  options: options_i
): Promise<Document> {
  const res = await Promise.all([
    user_generate_email_verification_code(config.time_one_hour_ms, options),
    user_generate_password_reset_code(0, options),
    user_generate_ref_code(options),
    options.db.users.findOne({
      ref_code: credentials.ref_code ? credentials.ref_code.toLowerCase() : '',
    }),
  ]);

  const email_verification_code: string = res[0];
  const password_reset_code: string = res[1];
  const ref_code: string = res[2];
  const ref_from: ObjectId | null = res[3] ? res[3]._id : null;

  const doc: any = {
    name: str_remove_space(credentials.name),
    username: str_remove_space(credentials.username).toLowerCase(),
    username_changed_at: new Date(),

    email: str_remove_space(credentials.email).toLowerCase(),
    email_verified: false,
    email_verification_code: email_verification_code,

    password: crypto
      .createHash('sha256')
      .update(credentials.password)
      .digest('hex'),
    password_reset_code: password_reset_code,

    role: config.role_user,
    role_key: config.ENV_ROLE_KEY_USER,

    ref_code: ref_code,
    ref_from: ref_from,

    img: '',
    phone: '', //str_remove_space(credentials.phone),

    city: '', // istanbul
    district: '', // buyukcekmece
    neighbourhood: '', // sinanoba
    address: '', // Ibrahimzade caddesi, Sahiltepe Villalari, No: 2
    zip: 0, // 34535

    created_at: new Date(),
    updated_at: new Date(),
  };

  return doc;
}

export async function user_generate_api_key(
  options: options_i
): Promise<string> {
  const LENGTH: number = 32; // domain_123cdD893dS679sdd
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

  const namespace: string = config.ENV_DB_NAME;

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

export function user_return_profile(user: Document) {
  return {
    _id: user._id,

    name: user.name,
    username: user.username,

    email: user.email,
    email_verified: user.email_verified,

    phone: user.phone,
    role: user.role,
    img: user.img,

    ref_code: user.ref_code.toUpperCase(),
    ref_from: user.ref_from,

    city: user.city,
    district: user.district,
    neighbourhood: user.neighbourhood,
    address: user.address,
    zip: user.zip,

    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

///////////////////////
// MAIL UTILS
///////////////////////
export class mail_validator_init {
  private readonly options: options_i;

  constructor(options: options_i) {
    this.options = options;
  }

  async send_verification_link(credentials: any): Promise<Document> {
    if (typeof credentials.email !== config.type_string) {
      throw 'ERR_INVALID_EMAIL';
    }

    if (typeof credentials.code !== config.type_string) {
      throw 'ERR_INVALID_CODE';
    }

    credentials.email = str_remove_space(credentials.email).toLowerCase();
    credentials.code = str_remove_space(credentials.code);

    if (credentials.email.length > 32) {
      throw 'ERR_LONG_EMAIL';
    }

    if (credentials.code.length > 128) {
      throw 'ERR_LONG_CODE';
    }

    if (validator.isEmail(credentials.email) === false) {
      throw 'ERR_INVALID_EMAIL';
    }

    const user: Document | null = await this.options.db.users.findOne({
      email: credentials.email,
    });

    if (user === null) {
      throw 'ERR_MISSING_USER';
    }

    return user;
  }

  async resend_verification_link(credentials: any): Promise<Document> {
    if (typeof credentials.email !== config.type_string) {
      throw 'ERR_INVALID_EMAIL';
    }

    credentials.email = str_remove_space(credentials.email).toLowerCase();

    if (credentials.email.length > 32) {
      throw 'ERR_LONG_EMAIL';
    }

    if (validator.isEmail(credentials.email) === false) {
      throw 'ERR_INVALID_EMAIL';
    }

    const user: Document | null = await this.options.db.users.findOne({
      email: credentials.email,
    });

    if (user === null) {
      throw 'ERR_MISSING_USER';
    }

    if (user.email_verified) {
      throw 'ERR_VERIFIED_EMAIL';
    }

    if (config.ENV_API_KEY_CAPTCHA) {
      const urlencoded_captcha: string =
        'response=' +
        credentials.captcha +
        '&secret=' +
        config.ENV_API_KEY_CAPTCHA;

      const res_captcha: any = await axios.post(
        'https://api.hcaptcha.com/siteverify',
        urlencoded_captcha,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (res_captcha.data.success === false) {
        throw 'ERR_CAPTCHA';
      }
    }

    return user;
  }

  async send_password_reset_link(credentials: any): Promise<Document> {
    if (typeof credentials.email !== config.type_string) {
      throw 'ERR_INVALID_EMAIL';
    }

    credentials.email = str_remove_space(credentials.email).toLowerCase();

    if (credentials.email.length > 32) {
      throw 'ERR_LONG_EMAIL';
    }

    if (validator.isEmail(credentials.email) === false) {
      throw 'ERR_INVALID_EMAIL';
    }

    const user: Document | null = await this.options.db.users.findOne({
      email: credentials.email,
    });

    if (user === null) {
      throw 'ERR_MISSING_USER';
    }

    if (config.ENV_API_KEY_CAPTCHA) {
      const urlencoded_captcha: string =
        'response=' +
        credentials.captcha +
        '&secret=' +
        config.ENV_API_KEY_CAPTCHA;

      const res_captcha: any = await axios.post(
        'https://api.hcaptcha.com/siteverify',
        urlencoded_captcha,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (res_captcha.data.success === false) {
        throw 'ERR_CAPTCHA';
      }
    }

    return user;
  }
}

export function mail_generate_html(
  type = 'email-verify',
  payload: any
): string {
  switch (type) {
    case 'email-verify':
      return (
        '<!DOCTYPE html><html lang="en"> <head> <meta charset="UTF-8"/> <meta http-equiv="X-UA-Compatible" content="IE=edge"/> <meta name="viewport" content="width=device-width,initial-scale=1"/> <title>' +
        config.ENV_URL_UI +
        '</title> <style rel="stylesheet"> *{margin: 0; padding: 0; box-sizing: border-box; font-family: sans-serif; text-decoration: none; border: none; outline: none;}body{}.mail{max-width: 600px;}.mail-img{display: block; width: 30px; border-radius: 6px;}.mail-title{margin-top: 1rem; font-size: 16px; margin-bottom: 1rem;}.mail-desc{margin: 1rem 0;}.mail-warning{margin-top: 1rem;}.mail-copyright{margin-top: 1rem;}</style> </head> <body> <div class="mail"> <img src="' +
        config.ENV_URL_UI +
        '/favicon.ico" alt="' +
        config.ENV_DB_NAME +
        '" class="mail-img"/> <h1 class="mail-title"> Welcome to ' +
        config.ENV_URL_UI +
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
        config.ENV_URL_UI +
        ', you can ignore this email </div><div class="mail-copyright"> © 2023 ' +
        config.ENV_URL_UI +
        ' | All rights reserved. </div></div></body></html>'
      );

    case 'password-reset':
      return (
        '<!DOCTYPE html><html lang="en"> <head> <meta charset="UTF-8"/> <meta http-equiv="X-UA-Compatible" content="IE=edge"/> <meta name="viewport" content="width=device-width,initial-scale=1"/> <title>' +
        config.ENV_URL_UI +
        '</title> <style rel="stylesheet"> *{margin: 0; padding: 0; box-sizing: border-box; font-family: sans-serif; text-decoration: none; border: none; outline: none;}body{}.mail{max-width: 600px;}.mail-img{display: block; width: 30px; border-radius: 6px;}.mail-title{margin-top: 1rem; font-size: 16px; margin-bottom: 1rem;}.mail-desc{margin: 1rem 0;}.mail-warning{margin-top: 1rem;}.mail-copyright{margin-top: 1rem;}</style> </head> <body> <div class="mail"> <img src="' +
        config.ENV_URL_UI +
        '/favicon.ico" alt="' +
        config.ENV_DB_NAME +
        '" class="mail-img"/> <h1 class="mail-title"> Welcome to ' +
        config.ENV_URL_UI +
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
        config.ENV_URL_UI +
        ' | All rights reserved. </div></div></body></html>'
      );

    default:
      return '';
  }
}

///////////////////////
// SETTINGS UTILS
///////////////////////
export class settings_validator_init {
  private readonly options: options_i;

  constructor(options: options_i) {
    this.options = options;
  }

  async edit_settings(credentials: any): Promise<any> {}
}

/*
 * order_create_chat:
 *
 * creates an available slot on the options.chats array (hashmap) using order._id's last 2 bytes as an index and returns that slot
 *
 * available slot: undefined or an expired chat with last updated_at is more than * 1 hour
 *
 * [undefined, undefined, {expired}, {valid}, {expired}, undefined, {expired}, undefined, ...]
 * e.g. index = 2 (order._id.toString().substring(20, 24))
 * options.chats[index] = {new}
 *
 * if selected index is filled with valid chat which means a collision, try the adjacent slots starting at 1 left and 1 right and such
 */
export async function order_create_chat(
  order_id: ObjectId,
  options: options_i
): Promise<any | null> {
  // last 2 bytes of order._id (ffff)
  const index: number = parseInt(order_id.toString().substring(20, 24), 16); // 0 - 65535

  // if current index slot is available
  if (options.chats[index] === undefined) {
    options.chats[index] = {
      order_id: order_id,
      users: [],
      messages: [],
    };

    return options.chats[index];
  }

  // fulfilled order with missing user_delivery_code means products delivered to the user,
  // therefore slot is available for incoming new chat
  const order: Document | null = await options.db.orders.findOne({
    _id: options.chats[index].order_id,
    user_delivery_code: { $exists: false }, // ($unset)
    open: false,
    error: '',
  });

  if (order) {
    options.chats[index] = {
      order_id: order_id,
      users: [],
      messages: [],
    };

    return options.chats[index];
  }

  // collision
  const length = options.chats.length - 1;
  const ratio_left = index / length; // left ratio 1.
  const ratio_right = (length - index) / length; // right ratio 1.

  for (let i: number = 0; i < options.chats.length; i++) {
    const offset_left = Math.floor(i * ratio_left); // left weight 2.
    const offset_right = Math.floor(i * ratio_right); // right weight 2.

    const index_left: number = index - offset_left; // final left index 3.
    const index_right: number = index + offset_right; // final right index 3.

    if (options.chats[index_left] === undefined) {
      options.chats[index_left] = {
        order_id: order_id,
        users: [],
        messages: [],
      };

      return options.chats[index_left];
    }

    const order_left: Document | null = await options.db.orders.findOne({
      _id: options.chats[index_left].order_id,
      user_delivery_code: { $exists: false },
      open: false,
      error: '',
    });

    if (order_left) {
      options.chats[index_left] = {
        order_id: order_id,
        users: [],
        messages: [],
      };

      return options.chats[index_left];
    }

    if (options.chats[index_right] === undefined) {
      options.chats[index_right] = {
        order_id: order_id,
        users: [],
        messages: [],
      };

      return options.chats[index_right];
    }

    const order_right: Document | null = await options.db.orders.findOne({
      _id: options.chats[index_right].order_id,
      user_delivery_code: { $exists: false },
      open: false,
      error: '',
    });

    if (order_right) {
      options.chats[index_right] = {
        order_id: order_id,
        users: [],
        messages: [],
      };

      return options.chats[index_right];
    }
  }

  return null;
}

export async function order_find_chat(
  order_id: ObjectId,
  options: options_i
): Promise<any | null> {
  const index: number = parseInt(order_id.toString().substring(20, 24), 16); // 0 - 65535

  if (options.chats[index] !== undefined) {
    if (options.chats[index].order_id.equals(order_id)) {
      const order: Document | null = await options.db.orders.findOne({
        _id: order_id,
        user_delivery_code: { $exists: true }, // field exists and not an empty string (123456)
        open: false,
        error: '',
      });

      if (order) {
        return options.chats[index];
      }
    }
  }

  // collision
  const length = options.chats.length - 1;
  const ratio_left = index / length; // left ratio 1.
  const ratio_right = (length - index) / length; // right ratio 1.

  for (let i: number = 0; i < options.chats.length; i++) {
    const offset_left = Math.floor(i * ratio_left); // left weight 2.
    const offset_right = Math.floor(i * ratio_right); // right weight 2.

    const index_left: number = index - offset_left; // final left index 3.
    const index_right: number = index + offset_right; // final right index 3.

    if (options.chats[index_left] !== undefined) {
      if (options.chats[index_left].order_id.equals(order_id)) {
        const order_left: Document | null = await options.db.orders.findOne({
          _id: order_id,
          user_delivery_code: { $exists: true },
          open: false,
          error: '',
        });

        if (order_left) {
          return options.chats[index_left];
        }
      }
    }

    if (options.chats[index_right] !== undefined) {
      if (options.chats[index_right].order_id.equals(order_id)) {
        const order_right: Document = await options.db.orders.findOne({
          _id: order_id,
          user_delivery_code: { $exists: true },
          open: false,
          error: '',
        });

        if (order_right) {
          return options.chats[index_right];
        }
      }
    }
  }

  return null;
}

export default {
  // common utils
  common_validator_init,

  // user utils
  user_validator_init,
  user_create_session,
  user_generate_email_verification_code,
  user_generate_password_reset_code,
  user_generate_ref_code,
  user_create_doc,
  user_return_profile,

  // mail utils
  mail_validator_init,
  mail_generate_html,

  // settings utils
  settings_validator_init,

  // order utils
  order_create_chat,
  order_find_chat,
};
