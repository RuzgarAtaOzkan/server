'use strict';

// MODULES
import fs from 'node:fs';
import crypto from 'node:crypto';
import axios from 'axios';
import validator from 'validator';

// INTERFACES
import { Document, ObjectId } from 'mongodb';
import { options_i } from 'interfaces/common';
import { blockchain_i } from 'interfaces/config';
import { wallet_i } from 'interfaces/services';

// CONFIG
import config from '../config';

// UTILS
import {
  random,
  str_remove_space,
  base58_encode,
  base58_decode,
  fixd,
} from './common';
import * as ed25519 from './crypto/ed25519'; // solana curve math
import * as secp256k1 from './crypto/secp256k1'; // ethereum & bitcoin curve math
import * as sha3 from './crypto/sha3';

///////////////////////
// COMMON UTILS
///////////////////////
export class common_validator_init {
  static base64(base64: string): void {
    // base64 = data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAApgAAAKYB3X3/OAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVEiJtZZPbBtFFMZ/

    if (typeof base64 !== config.type_string) {
      throw 'ERR_INVALID_BASE64';
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

    if (base64_parts.length !== 2) {
      throw 'ERR_INVALID_BASE64';
    }

    const base64_type: string = base64_parts[0];
    const base64_data: string = base64_parts[1];

    if (validator.isBase64(base64_data) === false) {
      throw 'ERR_INVALID_BASE64';
    }

    const buffer: Uint8Array = Buffer.from(base64_data, 'base64');

    if (buffer.length === 0) {
      throw 'ERR_INVALID_BASE64';
    }

    let ext: string = ''; // extension
    const index: number = base64_type.indexOf('/') + 1;
    for (let i: number = index; i < base64_type.length; i++) {
      ext = ext + base64_type[i];
    }

    const signatures: any = {
      png: [0x89, 0x50, 0x4e, 0x47],
      jpg: [0xff, 0xd8, 0xff],
      jpeg: [0xff, 0xd8, 0xff],
      webp: [0x52, 0x49, 0x46, 0x46],
    };

    const sign: number[] = signatures[ext];
    for (let i: number = 0; i < sign.length; i++) {
      if (buffer[i] !== sign[i]) {
        throw 'ERR_INVALID_BASE64';
      }
    }
  }

  static address(credentials: any): void {
    if (typeof credentials.city !== config.type_string) {
      throw 'ERR_INVALID_CITY';
    }
    credentials.city = str_remove_space(
      credentials.city
        .normalize('NFKD') // decompose accents
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .replace(/Ğ/g, 'G')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .toLowerCase(),
    );
    if (credentials.city.length > 32) {
      throw 'ERR_LONG_CITY';
    }
    if (validator.isAlpha(credentials.city) === false) {
      throw 'ERR_INVALID_CITY';
    }

    // ---

    if (typeof credentials.district !== config.type_string) {
      throw 'ERR_INVALID_DISTRICT';
    }
    credentials.district = str_remove_space(
      credentials.district
        .normalize('NFKD') // decompose accents
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .replace(/Ğ/g, 'G')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .toLowerCase(),
    );
    if (credentials.district.length > 32) {
      throw 'ERR_LONG_DISTRICT';
    }
    if (validator.isAlpha(credentials.district) === false) {
      throw 'ERR_INVALID_DISTRICT';
    }

    // ---

    if (typeof credentials.address !== config.type_string) {
      throw 'ERR_INVALID_ADDRESS';
    }
    credentials.address = str_remove_space(
      credentials.address
        .normalize('NFKD') // decompose accents
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .replace(/Ğ/g, 'G')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i'),
    );
    if (credentials.address.length > 128) {
      throw 'ERR_LONG_ADDRESS';
    }
    if (
      new RegExp(/^[a-zA-Z0-9.,!:#()\-/ ]+$/).test(credentials.address) ===
      false
    ) {
      throw 'ERR_INVALID_ADDRESS';
    }

    // ---

    if (typeof credentials.zip !== config.type_number) {
      throw 'ERR_INVALID_ZIP';
    }
    if (Math.abs(credentials.zip) > 100000) {
      throw 'ERR_INVALID_ZIP';
    }
  }

  static async basket(basket: any[], options: options_i): Promise<void> {
    if (Array.isArray(basket) === false) {
      throw 'ERR_INVALID_BASKET';
    }

    if (basket.length > 9) {
      throw 'ERR_LONG_BASKET';
    }

    for (let i: number = 0; i < basket.length; i++) {
      if (typeof basket[i] !== config.type_object) {
        throw 'ERR_INVALID_BASKET';
      }

      if (ObjectId.isValid(basket[i]._id) === false) {
        throw 'ERR_INVALID_ID';
      }

      if (typeof basket[i].quantity !== config.type_number) {
        throw 'ERR_INVALID_QUANTITY';
      }

      if (basket[i].quantity < 1 || basket[i].quantity > 9) {
        throw 'ERR_INVALID_QUANTITY';
      }

      const product: Document | null = await options.db.products.findOne({
        _id: ObjectId.createFromHexString(basket[i]._id),
      });

      if (product === null) {
        throw 'ERR_MISSING_PRODUCT';
      }

      let duplicate: number = 0;
      for (let j: number = 0; j < basket.length; j++) {
        if (basket[j]._id === basket[i]._id) {
          duplicate++;
        }
      }
      if (duplicate > 1) {
        throw 'ERR_DUPLICATE_PRODUCT';
      }

      if (basket[i].quantity > product.quantity) {
        throw 'ERR_INVALID_QUANTITY';
      }

      basket[i]._id = basket[i]._id.toLowerCase();
      basket[i].price = product.price * basket[i].quantity;
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

    // TODO: password difficulty configurations
    this.password_config = {
      minLength: 8,
      minSymbols: 0,
      minNumbers: 0,
      minLowercase: 0,
      minUppercase: 0,
    };
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
        credentials.ref_code,
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

    if (
      new RegExp(/^[a-zA-ZÇçĞğİıÖöŞşÜü ]+$/).test(credentials.name) === false
    ) {
      throw 'ERR_INVALID_NAME';
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
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
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

    // TODO: use crypto.scryptSync instead of sha256
    if (
      user.password !==
      crypto.createHash('sha256').update(credentials.password).digest('hex')
    ) {
      throw 'ERR_WRONG_PASSWORD';
    }

    return user;
  }

  async edit_profile(credentials: any): Promise<void> {
    if (credentials.name) {
      if (typeof credentials.name !== config.type_string) {
        throw 'ERR_INVALID_NAME';
      }

      credentials.name = str_remove_space(credentials.name);

      if (credentials.name.length > 32) {
        throw 'ERR_LONG_NAME';
      }

      if (
        new RegExp(/^[a-zA-ZÇçĞğİıÖöŞşÜü ]+$/).test(credentials.name) === false
      ) {
        throw 'ERR_INVALID_NAME';
      }
    }

    if (credentials.username) {
      if (typeof credentials.username !== config.type_string) {
        throw 'ERR_INVALID_USERNAME';
      }

      credentials.username = str_remove_space(
        credentials.username,
      ).toLowerCase();

      if (credentials.username.length > 32) {
        throw 'ERR_LONG_USERNAME';
      }

      if (validator.isAlphanumeric(credentials.username) === false) {
        throw 'ERR_INVALID_USERNAME';
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
      credentials.city = str_remove_space(
        credentials.city
          .normalize('NFKD') // decompose accents
          .replace(/[\u0300-\u036f]/g, '') // remove diacritics
          .replace(/Ğ/g, 'G')
          .replace(/ğ/g, 'g')
          .replace(/ı/g, 'i')
          .toLowerCase(),
      );
      if (credentials.city.length > 32) {
        throw 'ERR_LONG_CITY';
      }
      if (validator.isAlpha(credentials.city) === false) {
        throw 'ERR_INVALID_CITY';
      }
    }

    if (credentials.district) {
      if (typeof credentials.district !== config.type_string) {
        throw 'ERR_INVALID_DISTRICT';
      }
      credentials.district = str_remove_space(
        credentials.district
          .normalize('NFKD') // decompose accents
          .replace(/[\u0300-\u036f]/g, '') // remove diacritics
          .replace(/Ğ/g, 'G')
          .replace(/ğ/g, 'g')
          .replace(/ı/g, 'i')
          .toLowerCase(),
      );
      if (credentials.district.length > 32) {
        throw 'ERR_LONG_DISTRICT';
      }
      if (validator.isAlpha(credentials.district) === false) {
        throw 'ERR_INVALID_DISTRICT';
      }
    }

    if (credentials.address) {
      if (typeof credentials.address !== config.type_string) {
        throw 'ERR_INVALID_ADDRESS';
      }
      credentials.address = str_remove_space(
        credentials.address
          .normalize('NFKD') // decompose accents
          .replace(/[\u0300-\u036f]/g, '') // remove diacritics
          .replace(/Ğ/g, 'G')
          .replace(/ğ/g, 'g')
          .replace(/ı/g, 'i'),
      );
      if (credentials.address.length > 128) {
        throw 'ERR_LONG_ADDRESS';
      }
      if (
        new RegExp(/^[a-zA-Z0-9.,!:#()\-/ ]+$/).test(credentials.address) ===
        false
      ) {
        throw 'ERR_INVALID_ADDRESS';
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

    const exp: number =
      parseInt(user.email_verification_code.substring(0, 8), 16) * 1000;

    if (Date.now() > exp) {
      throw 'ERR_INVALID_CODE';
    }

    return user;
  }
}

export async function user_create_session(
  payload: any,
  options: options_i,
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
  let exp: number = config.ENV_COOKIE_LIFETIME_MS / 1000;
  if (payload.remember) {
    exp = exp * 30;
  }

  await options.redis.expire(sid, exp);

  return sid;
}

export async function user_generate_email_verification_code(
  length: number = config.time_one_hour_ms, // Date.now() + length in milliseconds
  options: options_i,
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
  options: options_i,
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
  options: options_i,
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
  options: options_i,
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
    address: '', // Ibrahimzade caddesi, Sahiltepe Villalari, No: 2
    zip: 0, // 34535

    created_at: new Date(),
    updated_at: new Date(),
  };

  return doc;
}

export async function user_generate_api_key(
  options: options_i,
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
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
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
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
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
  payload: any,
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
}

///////////////////////
// CARD UTILS
///////////////////////
export class card_validator_init {
  private readonly options: options_i;

  constructor(options: options_i) {
    this.options = options;
  }

  async get_card(credentials: any): Promise<void> {}

  async create_card(credentials: any): Promise<void> {
    if (typeof credentials.number !== config.type_string) {
      throw 'ERR_INVALID_NUMBER';
    }

    credentials.number = credentials.number.replace(/ /g, '');

    if (credentials.number.length !== 16) {
      throw 'ERR_INVALID_NUMBER';
    }

    for (let i: number = 0; i < credentials.number.length; i++) {
      if (isNaN(Number(credentials.number[i]))) {
        throw 'ERR_INVALID_NUMBER';
      }
    }

    if (typeof credentials.month !== config.type_number) {
      throw 'ERR_INVALID_MONTH';
    }

    if (credentials.month < 1 || credentials.month > 12) {
      throw 'ERR_INVALID_MONTH';
    }

    if (typeof credentials.year !== config.type_number) {
      throw 'ERR_INVALID_YEAR';
    }

    if (credentials.year < new Date().getUTCFullYear()) {
      throw 'ERR_INVALID_YEAR';
    }

    if (typeof credentials.cvc !== config.type_number) {
      throw 'ERR_INVALID_CVC';
    }

    if (credentials.cvc < 1 || credentials.cvc % 1 !== 0) {
      throw 'ERR_INVALID_CVC';
    }

    const card: Document | null = await this.options.db.cards.findOne({
      user_id: credentials.user._id,
    });

    if (card) {
      throw 'ERR_EXISTING_CARD';
    }
  }

  async edit_card(credentials: any): Promise<void> {
    if (credentials.number) {
      if (typeof credentials.number !== config.type_string) {
        throw 'ERR_INVALID_NUMBER';
      }

      credentials.number = credentials.number.replace(/ /g, '');

      if (credentials.number.length !== 16) {
        throw 'ERR_INVALID_NUMBER';
      }

      for (let i: number = 0; i < credentials.number.length; i++) {
        if (isNaN(Number(credentials.number[i]))) {
          throw 'ERR_INVALID_NUMBER';
        }
      }
    }

    if (credentials.month) {
      if (typeof credentials.month !== config.type_number) {
        throw 'ERR_INVALID_MONTH';
      }

      if (credentials.month < 1 || credentials.month > 12) {
        throw 'ERR_INVALID_MONTH';
      }
    }

    if (credentials.year) {
      if (typeof credentials.year !== config.type_number) {
        throw 'ERR_INVALID_YEAR';
      }

      if (credentials.year < new Date().getFullYear()) {
        throw 'ERR_INVALID_YEAR';
      }
    }

    if (credentials.cvc) {
      if (typeof credentials.cvc !== config.type_number) {
        throw 'ERR_INVALID_CVC';
      }

      if (credentials.cvc < 1 || credentials.cvc % 1 !== 0) {
        throw 'ERR_INVALID_CVC';
      }
    }
  }

  async delete_card(credentials: any): Promise<void> {}
}

export function card_create_doc(credentials: any): Document {
  const doc: Document = {
    user_id: credentials.user._id,

    number: credentials.number.replace(/ /g, ''),
    month: credentials.month,
    year: credentials.year,
    cvc: credentials.cvc,

    created_at: new Date(),
    updated_at: new Date(),
  };

  return doc;
}

///////////////////////
// PRODUCT UTILS
///////////////////////
export class product_validator_init {
  private readonly options: options_i;

  constructor(options: options_i) {
    this.options = options;
  }

  async get_products(credentials: any): Promise<void> {}

  async get_product(credentials: any): Promise<void> {
    if (typeof credentials._id !== config.type_string) {
      throw 'ERR_INVALID_ID';
    }

    if (ObjectId.isValid(credentials._id) === false) {
      throw 'ERR_INVALID_ID';
    }
  }
}

export function product_create_doc(credentials: any): Document {
  const doc: any = {
    img: JSON.stringify(credentials.img),
    name: str_remove_space(credentials.name),
    description: str_remove_space(credentials.description),
    category: str_remove_space(credentials.category).toLowerCase(),

    price: credentials.price,
    quantity: credentials.quantity,

    created_at: new Date(),
    updated_at: new Date(),
  };

  return doc;
}

///////////////////////
// ORDER UTILS
///////////////////////
export class order_validator_init {
  private readonly options: options_i;

  constructor(options: options_i) {
    this.options = options;
  }

  validate_card(credentials: any) {
    if (typeof credentials.card_number !== config.type_string) {
      throw 'ERR_INVALID_CARD_NUMBER';
    }

    credentials.card_number = credentials.card_number.replace(/ /g, '');

    if (credentials.card_number.length !== 16) {
      throw 'ERR_INVALID_CARD_NUMBER';
    }

    for (let i: number = 0; i < credentials.card_number.length; i++) {
      if (isNaN(Number(credentials.card_number[i]))) {
        throw 'ERR_INVALID_CARD_NUMBER';
      }
    }

    if (typeof credentials.card_month !== config.type_number) {
      throw 'ERR_INVALID_CARD_MONTH';
    }

    if (credentials.card_month < 1 || credentials.card_month > 12) {
      throw 'ERR_INVALID_CARD_MONTH';
    }

    if (typeof credentials.card_year !== config.type_number) {
      throw 'ERR_INVALID_CARD_YEAR';
    }

    if (credentials.card_year < new Date().getUTCFullYear()) {
      throw 'ERR_INVALID_CARD_YEAR';
    }

    if (typeof credentials.card_cvc !== config.type_number) {
      throw 'ERR_INVALID_CARD_CVC';
    }

    if (credentials.card_cvc < 1 || credentials.card_cvc % 1 !== 0) {
      throw 'ERR_INVALID_CARD_CVC';
    }
  }

  async get_orders(credentials: any): Promise<void> {}

  async create_order(credentials: any): Promise<void> {
    // IMPORTANT: these checks are actually unneccesary because no user can directly call create_order function from services, either already validated provision or a wallet can call it, making these validations unneccessary

    if (credentials.name !== config.type_string) {
      throw 'ERR_INVALID_NAME';
    }
    credentials.name = str_remove_space(credentials.name);
    if (credentials.name.length > 32) {
      throw 'ERR_LONG_NAME';
    }
    if (
      new RegExp(/^[a-zA-ZÇçĞğİıÖöŞşÜü ]+$/).test(credentials.name) === false
    ) {
      throw 'ERR_INVALID_NAME';
    }

    // ====================

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

    // ====================

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

    common_validator_init.address(credentials);
    await common_validator_init.basket(credentials.basket, this.options);

    this.validate_card(credentials);

    if (config.ENV_API_KEY_CAPTCHA) {
      const urlencoded_captcha: string =
        'response=' +
        credentials.captcha +
        '&secret=' +
        config.ENV_API_KEY_CAPTCHA;

      const res_captcha: any = await axios.post(
        'https://api.hcaptcha.com/siteverify',
        urlencoded_captcha,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      if (res_captcha.data.success === false) {
        throw 'ERR_CAPTCHA';
      }
    }
  }

  async deliver_orders(credentials: any): Promise<Document> {
    if (typeof credentials.code !== config.type_string) {
      throw 'ERR_INVALID_CODE';
    }

    const order: Document | null = await this.options.db.orders.findOne({
      delivery_code: credentials.code,
    });

    if (order === null) {
      throw 'ERR_MISSING_ORDER';
    }

    return order;
  }
}

export async function order_generate_delivery_code(
  options: options_i,
): Promise<string> {
  const length: number = 6;

  let code: string = random(length, 'numeric');
  let order: Document | null = await options.db.orders.findOne({
    delivery_code: code,
  });

  while (order) {
    code = random(length, 'numeric');
    order = await options.db.orders.findOne({ delivery_code: code });
  }

  return code;
}

export function order_create_doc(credentials: any): Document {
  const doc: Document = {
    // contact info
    name: str_remove_space(credentials.name),
    email: str_remove_space(credentials.email).toLowerCase(),
    phone: str_remove_space(credentials.phone),

    // address
    city: str_remove_space(credentials.city).toLowerCase(),
    district: str_remove_space(credentials.district).toLowerCase(),
    address: str_remove_space(credentials.address),
    zip: credentials.zip,

    // order
    status: 1,
    basket: JSON.stringify(credentials.basket),

    created_at: new Date(),
    updated_at: new Date(),
  };

  return doc;
}

///////////////////////
// PROVISION UTILS
///////////////////////
export class provision_validator_init {
  private readonly options: options_i;

  constructor(options: options_i) {
    this.options = options;
  }

  validate_card(credentials: any): void {
    if (typeof credentials.card_number !== config.type_string) {
      throw 'ERR_INVALID_CARD_NUMBER';
    }

    credentials.card_number = str_remove_space(credentials.card_number);

    if (credentials.card_number.length !== 16) {
      throw 'ERR_INVALID_CARD_NUMBER';
    }

    for (let i: number = 0; i < credentials.card_number.length; i++) {
      if (isNaN(Number(credentials.card_number[i]))) {
        throw 'ERR_INVALID_CARD_NUMBER';
      }
    }

    if (typeof credentials.card_month !== config.type_number) {
      throw 'ERR_INVALID_CARD_MONTH';
    }

    if (credentials.card_month < 1 || credentials.card_month > 12) {
      throw 'ERR_INVALID_CARD_MONTH';
    }

    if (typeof credentials.card_year !== config.type_number) {
      throw 'ERR_INVALID_CARD_YEAR';
    }

    if (credentials.card_year < new Date().getUTCFullYear()) {
      throw 'ERR_INVALID_CARD_YEAR';
    }

    if (typeof credentials.card_cvc !== config.type_number) {
      throw 'ERR_INVALID_CARD_CVC';
    }

    if (credentials.card_cvc < 1 || credentials.card_cvc % 1 !== 0) {
      throw 'ERR_INVALID_CARD_CVC';
    }
  }

  async get_provision(credentials: any): Promise<void> {
    if (typeof credentials._id !== config.type_string) {
      throw 'ERR_INVALID_ID';
    }

    if (ObjectId.isValid(credentials._id) === false) {
      throw 'ERR_INVALID_ID';
    }
  }

  async create_provision(credentials: any): Promise<void> {
    if (typeof credentials.name !== config.type_string) {
      throw 'ERR_INVALID_NAME';
    }
    credentials.name = str_remove_space(credentials.name);
    if (credentials.name.length > 32) {
      throw 'ERR_LONG_NAME';
    }
    if (
      new RegExp(/^[a-zA-ZÇçĞğİıÖöŞşÜü ]+$/).test(credentials.name) === false
    ) {
      throw 'ERR_INVALID_NAME';
    }

    // ====================

    if (typeof credentials.email !== config.type_string) {
      throw 'ERR_INVALID_EMAIL';
    }
    credentials.email = str_remove_space(credentials.email);
    if (credentials.email.length > 32) {
      throw 'ERR_LONG_EMAIL';
    }
    if (validator.isEmail(credentials.email) === false) {
      throw 'ERR_INVALID_EMAIL';
    }

    // ====================

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

    common_validator_init.address(credentials);
    await common_validator_init.basket(credentials.basket, this.options);

    this.validate_card(credentials);

    if (credentials.coupon !== undefined) {
      if (typeof credentials.coupon !== config.type_string) {
        throw 'ERR_INVALID_COUPON';
      }

      credentials.coupon = str_remove_space(credentials.coupon).toLowerCase();

      const coupon: Document | null = await this.options.db.coupons.findOne({
        code: credentials.coupon,
      });
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
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      if (res_captcha.data.success === false) {
        throw 'ERR_CAPTCHA';
      }
    }
  }

  async create_order(credentials: any): Promise<Document | null> {
    // https://apisales.garantibbva.com.tr

    if (credentials.url !== 'https://api.garantibbva.com') {
      // throw 'ERR_INVALID_URL';
    }

    // Örnek: mdStatus kontrolü
    if (credentials.mdStatus !== '1') {
      // 3D doğrulama başarısız
      throw 'ERR_INVALID_MDSTATUS';
    }

    // Örnek: returnCode kontrolü
    if (credentials.returnCode !== '00') {
      // İşlem başarısız
      throw 'ERR_INVALID_RETURNCODE';
    }

    if (credentials.procReturnCode !== '00') {
      throw 'ERR_INVALID_PROCRETURNCODE';
    }

    const provision: Document | null = await this.options.db.provisions.findOne(
      {
        _id: ObjectId.createFromHexString(credentials.orderId),
      },
    );

    if (provision === null) {
      // provision document deleted from TTL, user waited so long to process 3D secure

      // TODO: refund process
      // ..

      throw 'ERR_MISSING_PROVISION';
    }

    const hash_data: string =
      config.ENV_API_KEY_GARANTI_SWITCH +
      credentials.orderId +
      credentials.txnType +
      credentials.txnAmount +
      credentials.txnInstallmentCount +
      credentials.successUrl +
      credentials.failureUrl +
      credentials.txnTimestamp +
      credentials.txnCurrencyCode +
      config.ENV_API_KEY_GARANTI_SWITCH_PASSWORD;

    const hash: string = crypto
      .createHash('sha256')
      .update(hash_data, 'utf-8')
      .digest('hex')
      .toUpperCase();

    if (hash !== credentials.hashData) {
      throw 'ERR_INVALID_HASH';
    }

    provision.basket = JSON.parse(provision.basket);

    let price: number = 0; // (USD) total price of the basket
    for (let i: number = 0; i < provision.basket.length; i++) {
      price = price + provision.basket[i].price;
    }

    const settings = JSON.parse(await this.options.redis.get('settings'));

    // const price_exchange_margin: number = 0.97; // incase exchange increase during transaction
    const price_exchange: number =
      price * settings.exchange[credentials.currencyCode];
    //* price_exchange_margin;

    if (credentials.txnAmount < price_exchange) {
      // TODO: refund process
      // ..

      throw 'ERR_INSUFFICIENT_AMOUNT';
    }

    return provision;
  }
}

export function provision_create_doc(credentials: any): Document {
  const doc: Document = {
    // contact info
    name: str_remove_space(credentials.name),
    email: str_remove_space(credentials.email).toLowerCase(),
    phone: str_remove_space(credentials.phone),

    // address
    city: str_remove_space(credentials.city).toLowerCase(),
    district: str_remove_space(credentials.district).toLowerCase(),
    address: str_remove_space(credentials.address),
    zip: credentials.zip,

    basket: JSON.stringify(credentials.basket),

    created_at: new Date(),
    updated_at: new Date(),
  };

  return doc;
}

///////////////////////
// WALLET UTILS
///////////////////////
export class wallet_validator_init {
  private readonly options: options_i;

  constructor(options: options_i) {
    this.options = options;
  }

  async get_wallet(credentials: any): Promise<Document> {
    if (typeof credentials._id !== config.type_string) {
      throw 'ERR_INVALID_ID';
    }

    if (ObjectId.isValid(credentials._id) === false) {
      throw 'ERR_INVALID_ID';
    }

    const wallet: Document | null = await this.options.db.wallets.findOne({
      _id: ObjectId.createFromHexString(credentials._id),
    });

    if (wallet === null) {
      throw 'ERR_MISSING_WALLET';
    }

    delete wallet.private;

    return wallet;
  }

  async create_wallet(credentials: any): Promise<void> {
    if (typeof credentials.blockchain !== config.type_string) {
      throw 'ERR_INVALD_BLOCKCHAIN';
    }
    let blockchain_exists: boolean = false;
    for (let i: number = 0; i < config.blockchains.length; i++) {
      if (credentials.blockchain === config.blockchains[i].id) {
        blockchain_exists = true;
        break;
      }
    }
    if (blockchain_exists === false) {
      throw 'ERR_INVALID_BLOCKCHAIN';
    }

    // ---

    if (typeof credentials.name !== config.type_string) {
      throw 'ERR_INVALID_NAME';
    }
    credentials.name = str_remove_space(credentials.name);
    if (credentials.name.length > 32) {
      throw 'ERR_LONG_NAME';
    }
    if (
      new RegExp(/^[a-zA-ZÇçĞğİıÖöŞşÜü ]+$/).test(credentials.name) === false
    ) {
      throw 'ERR_INVALID_NAME';
    }

    // ---

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

    // ---

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

    common_validator_init.address(credentials);
    await common_validator_init.basket(credentials.basket, this.options);

    const settings = JSON.parse(await this.options.redis.get('settings'));

    for (let i: number = 0; i < settings.blockchains.length; i++) {
      if (credentials.blockchain === settings.blockchains[i].id) {
        if (settings.blockchains[i].price === 0) {
          throw 'ERR_INVALID_BLOCKCHAIN_PRICE';
        }

        break;
      }
    }

    if (config.ENV_API_KEY_CAPTCHA) {
      const body_captcha: string =
        'response=' +
        credentials.captcha +
        '&secret=' +
        config.ENV_API_KEY_CAPTCHA;

      const res_captcha: any = await axios.post(
        'https://api.hcaptcha.com/siteverify',
        body_captcha,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      if (res_captcha.data.success === false) {
        throw 'ERR_CAPTCHA';
      }
    }
  }
}

// ed25519 elliptic curve implementation for private and public key of a solana wallet
export async function wallet_generate_solana(): Promise<wallet_i> {
  const seed: Uint8Array = crypto.randomBytes(32);
  const key: Uint8Array = await ed25519.getPublicKeyAsync(seed);

  const private_base58: string = base58_encode(seed);
  const public_base58: string = base58_encode(key);

  const wallet: wallet_i = {
    private: private_base58,
    public: public_base58,
  };

  return wallet;
}

export async function wallet_generate_ethereum(): Promise<wallet_i> {
  const seed: Uint8Array = crypto.randomBytes(32);
  const key: Uint8Array = secp256k1.getPublicKey(seed, false);

  const address: Uint8Array = sha3.keccak_256(key.slice(1)).slice(-20);

  /*
  function toChecksumAddress(address: string): string {
    const addr = address.toLowerCase().replace(/^0x/, '');
    const hash = sha3.keccak_256(Uint8Array.from(Buffer.from(addr, 'ascii')));

    return (
      '0x' +
      [...addr]
        .map((char, i) => {
          const byte = hash[Math.floor(i / 2)];
          const nibble = i % 2 === 0 ? byte >> 4 : byte & 0x0f;
          return nibble >= 8 ? char.toUpperCase() : char;
        })
        .join('')
    );
  }
  */

  const private_hex: string = Buffer.from(seed).toString('hex');
  const public_hex: string = Buffer.from(address).toString('hex');

  const wallet: wallet_i = {
    private: '0x' + private_hex,
    public: '0x' + public_hex,
  };

  return wallet;
}

export async function wallet_generate_bitcoin(): Promise<wallet_i> {
  const seed: Uint8Array = crypto.randomBytes(32);
  const key: Uint8Array = secp256k1.getPublicKey(seed, false);

  const key_sha256: Uint8Array = crypto
    .createHash('sha256')
    .update(key)
    .digest();

  const key_ripemd160: Uint8Array = crypto
    .createHash('ripemd160')
    .update(key_sha256)
    .digest();

  // Step 3: Add version byte (0x00 for mainnet)
  const payload: Uint8Array = Buffer.concat([
    Buffer.from([0x00]),
    key_ripemd160,
  ]);

  const payload_sha256: Uint8Array = crypto
    .createHash('sha256')
    .update(payload)
    .digest();

  // Step 4: Create checksum (first 4 bytes of double SHA-256 of the versioned payload)
  const checksum: Uint8Array = crypto
    .createHash('sha256')
    .update(payload_sha256)
    .digest()
    .subarray(0, 4);

  const private_base58: string = base58_encode(seed);
  // Step 5: Combine versioned payload and checksum
  const public_base58: string = base58_encode(
    Buffer.concat([payload, checksum]),
  );

  const wallet: wallet_i = {
    private: private_base58,
    public: public_base58,
  };

  return wallet;
}

export async function wallet_create_doc(
  credentials: any,
  options: options_i,
): Promise<Document> {
  const settings = JSON.parse(await options.redis.get('settings'));

  let wallet: wallet_i = { private: '', public: '' };
  let price: number = 0; // total price of the basket
  let amount: number = 0; // coin amount which needs to be sent to the wallet

  // generate current blockchain's wallet
  for (let i: number = 0; i < config.blockchains.length; i++) {
    if (config.blockchains[i].id === credentials.blockchain) {
      wallet = await config.blockchains[i].wallet_generate();
      break;
    }
  }

  // calculate total price of the basket
  for (let i: number = 0; i < credentials.basket.length; i++) {
    price += credentials.basket[i].price;
  }

  // calculate coin amount which needs to be sent to the wallet
  for (let i: number = 0; i < settings.blockchains.length; i++) {
    if (settings.blockchains[i].id === credentials.blockchain) {
      amount = price / settings.blockchains[i].price;
      amount = fixd(amount, settings.blockchains[i].price);
      break;
    }
  }

  const doc: Document = {
    // wallet
    private: wallet.private,
    public: wallet.public,
    blockchain: credentials.blockchain,
    amount: amount,
    status: 0, // -2 | -1 | 0 | 1 | 2

    helius_subscription: 0,

    // contact
    name: str_remove_space(credentials.name),
    email: str_remove_space(credentials.email).toLowerCase(),
    phone: str_remove_space(credentials.phone),

    // address
    city: str_remove_space(credentials.city).toLowerCase(),
    district: str_remove_space(credentials.district).toLowerCase(),
    address: str_remove_space(credentials.address),
    zip: credentials.zip,

    // order
    basket: JSON.stringify(credentials.basket),

    created_at: new Date(),
    updated_at: new Date(),
  };

  return doc;
}

///////////////////////
// COUPON UTILS
///////////////////////
export class coupon_validator_init {
  private readonly options: options_i;

  constructor(options: options_i) {
    this.options = options;
  }

  async get_coupon(credentials: any): Promise<void> {
    if (typeof credentials.code !== config.type_string) {
      throw 'ERR_INVALID_CODE';
    }

    credentials.code = str_remove_space(credentials.code).toLowerCase();

    if (credentials.code.length > 16) {
      throw 'ERR_LONG_CODE';
    }
  }
}

export async function coupon_generate_code(
  options: options_i,
): Promise<string> {
  let code: string = random(8);
  let coupon: any = await options.db.coupons.findOne({ code: code });

  while (coupon) {
    code = random(8);
    coupon = await options.db.coupons.findOne({ code: code });
  }

  return code;
}

export async function coupon_create_doc(
  credentials: any,
  options: options_i,
): Promise<Document> {
  let code: string | undefined = credentials.code;
  if (code === undefined) {
    code = await coupon_generate_code(options);
  }

  const doc: any = {
    code: code,
    discount: credentials.discount,
    quantity: credentials.quantity,

    created_at: new Date(),
    updated_at: new Date(),
  };

  return doc;
}

///////////////////////
// REVIEW UTILS
///////////////////////
export class review_validator_init {
  private readonly options: options_i;

  constructor(options: options_i) {
    this.options = options;
  }

  async create(credentials: any): Promise<void> {
    if (ObjectId.isValid(credentials.product_id) === false) {
      throw 'ERR_INVALID_PRODUCT_ID';
    }

    const res = await Promise.all([
      this.options.db.products.findOne({
        _id: ObjectId.createFromHexString(credentials.product_id),
      }),
      this.options.db.reviews.findOne({
        product_id: ObjectId.createFromHexString(credentials.product_id),
        user_id: credentials.user._id,
      }),
    ]);

    const product: Document | null = res[0];
    const review: Document | null = res[1];

    if (product === null) {
      throw 'ERR_MISSING_PRODUCT';
    }

    if (review) {
      throw 'ERR_EXISTING_REVIEW';
    }

    if (typeof credentials.rating !== config.type_number) {
      throw 'ERR_INVALID_RATING';
    }

    if (credentials.rating < 0 || credentials.rating > 5) {
      throw 'ERR_INVALID_RATING';
    }

    if (typeof credentials.comment !== config.type_string) {
      throw 'ERR_INVALID_COMMENT';
    }

    credentials.comment = str_remove_space(credentials.comment);

    if (credentials.comment.length > 256) {
      throw 'ERR_LONG_REVIEW';
    }

    if (
      /^[a-zA-Z0-9ÇçĞğİıÖöŞşÜü.,!?$&:#()\-/ \p{Extended_Pictographic}]*$/u.test(
        credentials.comment,
      ) === false
    ) {
      throw 'ERR_INVALID_COMMENT';
    }
  }

  async edit(credentials: any): Promise<void> {
    const $or: any[] = [];

    if (credentials._id) {
      if (ObjectId.isValid(credentials._id) === false) {
        throw 'ERR_INVALID_ID';
      }

      $or.push({ _id: ObjectId.createFromHexString(credentials._id) });
    }

    if (credentials.product_id) {
      if (ObjectId.isValid(credentials.product_id) === false) {
        throw 'ERR_INVALID_PRODUCT_ID';
      }

      $or.push({
        product_id: ObjectId.createFromHexString(credentials.product_id),
      });
    }

    const review: Document | null = await this.options.db.reviews.findOne({
      $or: $or,
    });

    if (review === null) {
      throw 'ERR_MISSING_REVIEW';
    }

    if (typeof credentials.rating === config.type_number) {
      if (credentials.rating < 0 || credentials.rating > 5) {
        throw 'ERR_INVALID_RATING';
      }
    }

    if (typeof credentials.comment === config.type_string) {
      credentials.comment = str_remove_space(credentials.comment);

      if (credentials.comment.length > 256) {
        throw 'ERR_LONG_REVIEW';
      }

      if (
        /^[a-zA-Z0-9ÇçĞğİıÖöŞşÜü.,!?$&:#()\-/ \p{Extended_Pictographic}]*$/u.test(
          credentials.comment,
        ) === false
      ) {
        throw 'ERR_INVALID_COMMENT';
      }
    }
  }

  async get(credentials: any): Promise<void> {
    if (ObjectId.isValid(credentials.product_id) === false) {
      throw 'ERR_INVALID_PRODUCT_ID';
    }
  }
}

export function review_create_doc(credentials: any): Document {
  const doc: Document = {
    product_id: ObjectId.createFromHexString(
      credentials.product_id.toLowerCase(),
    ),
    user_id: credentials.user._id,

    rating: credentials.rating,
    comment: credentials.comment,

    created_at: new Date(),
    updated_at: new Date(),
  };

  return doc;
}

///////////////////////
// ADMIN UTILS
///////////////////////
export class admin_validator_init {
  private readonly options: options_i;

  constructor(options: options_i) {
    this.options = options;
  }

  async mail_send(credentials: any): Promise<void> {}

  async settings_edit(credentials: any): Promise<void> {}

  async products_create(credentials: any): Promise<void> {
    if (Array.isArray(credentials.img) === false) {
      throw 'ERR_INVALID_IMG';
    }

    if (credentials.img.length > 9) {
      throw 'ERR_LONG_IMG';
    }

    for (let i: number = 0; i < credentials.img.length; i++) {
      common_validator_init.base64(credentials.img[i]);
    }

    if (typeof credentials.name !== config.type_string) {
      throw 'ERR_INVALID_NAME';
    }
    credentials.name = str_remove_space(credentials.name);
    if (credentials.name.length > 32) {
      throw 'ERR_LONG_NAME';
    }
    if (
      new RegExp(/^[a-zA-ZÇçĞğİıÖöŞşÜü ]+$/).test(credentials.name) === false
    ) {
      throw 'ERR_INVALID_NAME';
    }

    if (typeof credentials.description !== config.type_string) {
      throw 'ERR_INVALID_DESCRIPTION';
    }
    credentials.description = str_remove_space(credentials.description);
    if (credentials.description.length > 128) {
      throw 'ERR_LONG_DESCRIPTION';
    }
    if (
      new RegExp(/^[a-zA-Z0-9a-zA-ZÇçĞğİıÖöŞşÜü.,!:#()\-\n/ ]+$/).test(
        credentials.description,
      ) === false
    ) {
      throw 'ERR_INVALID_DESCRIPTION';
    }

    if (typeof credentials.category !== config.type_string) {
      throw 'ERR_INVALID_CATEGORY';
    }
    credentials.category = str_remove_space(credentials.category).toLowerCase();
    if (credentials.category.length > 32) {
      throw 'ERR_LONG_CATEGORY';
    }
    if (validator.isAlpha(credentials.category) === false) {
      throw 'ERR_INVALID_CATEGORY';
    }

    if (typeof credentials.price !== config.type_number) {
      throw 'ERR_INVALID_PRICE';
    }
    if (credentials.price < 1) {
      throw 'ERR_INVALID_PRICE';
    }

    if (typeof credentials.quantity !== config.type_number) {
      throw 'ERR_INVALID_QUANTITY';
    }

    if (credentials.quantity < 1) {
      throw 'ERR_INVALID_QUANTITY';
    }

    if (credentials.quantity % 1 !== 0) {
      throw 'ERR_INVALID_QUANTITY';
    }
  }

  async products_edit(credentials: any): Promise<Document> {
    if (ObjectId.isValid(credentials._id) === false) {
      throw 'ERR_INVALID_ID';
    }

    const product: Document | null = this.options.db.products.findOne({
      _id: ObjectId.createFromHexString(credentials._id),
    });

    if (product === null) {
      throw 'ERR_MISSING_PRODUCT';
    }

    if (
      typeof credentials.img === config.type_string ||
      typeof credentials.img === config.type_number
    ) {
      // will assume its a base64 string
      if (typeof credentials.img === config.type_string) {
        const img: string[] = JSON.parse(product.img);

        if (img.length >= 9) {
          throw 'ERR_LIMIT_IMG';
        }

        common_validator_init.base64(credentials.img);
      }

      // will assume you are trying to delete an image at a specific index
      if (typeof credentials.img === config.type_number) {
        const img: string[] = JSON.parse(product.img);

        if (credentials.img < 0 || credentials.img >= img.length) {
          throw 'ERR_INVALID_IMG';
        }
      }
    }

    if (credentials.name) {
      if (typeof credentials.name !== config.type_string) {
        throw 'ERR_INVALID_NAME';
      }
      credentials.name = str_remove_space(credentials.name);
      if (credentials.name.length > 32) {
        throw 'ERR_LONG_NAME';
      }
      if (
        new RegExp(/^[a-zA-ZÇçĞğİıÖöŞşÜü ]+$/).test(credentials.name) === false
      ) {
        throw 'ERR_INVALID_NAME';
      }
    }

    if (credentials.description) {
      if (typeof credentials.description !== config.type_string) {
        throw 'ERR_INVALID_DESCRIPTION';
      }
      credentials.description = str_remove_space(credentials.description);
      if (credentials.description.length > 128) {
        throw 'ERR_LONG_DESCRIPTION';
      }
      if (
        new RegExp(/^[a-zA-Z0-9a-zA-ZÇçĞğİıÖöŞşÜü.,!:#()\-\n/ ]+$/).test(
          credentials.description,
        ) === false
      ) {
        throw 'ERR_INVALID_DESCRIPTION';
      }
    }

    if (credentials.category) {
      if (typeof credentials.category !== config.type_string) {
        throw 'ERR_INVALID_CATEGORY';
      }
      credentials.category = str_remove_space(
        credentials.category,
      ).toLowerCase();
      if (credentials.category.length > 32) {
        throw 'ERR_LONG_CATEGORY';
      }
      if (validator.isAlpha(credentials.category) === false) {
        throw 'ERR_INVALID_CATEGORY';
      }
    }

    if (credentials.price) {
      if (typeof credentials.price !== config.type_number) {
        throw 'ERR_INVALID_PRICE';
      }
      if (credentials.price < 1) {
        throw 'ERR_INVALID_PRICE';
      }
    }

    if (credentials.quantity) {
      if (typeof credentials.quantity !== config.type_number) {
        throw 'ERR_INVALID_QUANTITY';
      }
      if (credentials.quantity % 1 !== 0) {
        throw 'ERR_INVALID_QUANTITY';
      }
      if (credentials.quantity < 1) {
        throw 'ERR_INVALID_QUANTITY';
      }
    }

    return product;
  }

  async products_delete(credentials: any): Promise<Document> {
    if (ObjectId.isValid(credentials._id) === false) {
      throw 'ERR_INVALID_ID';
    }

    const product: Document | null = this.options.db.products.findOne({
      _id: ObjectId.createFromHexString(credentials._id),
    });

    if (product === null) {
      throw 'ERR_MISSING_PRODUCT';
    }

    credentials._id = credentials._id.toLowerCase();

    const res = await Promise.all([
      this.options.db.provisions.findOne({
        basket: { $regex: credentials._id },
      }),
      this.options.db.wallets.findOne({
        basket: { $regex: credentials._id },
        status: { $gte: 0 },
      }),
      this.options.db.orders.findOne({
        basket: { $regex: credentials._id },
        status: { $ne: 3 },
      }),
    ]);

    const provision: Document | null = res[0];
    const wallet: Document | null = res[1];
    const order: Document | null = res[2];

    if (provision || wallet || order) {
      throw 'ERR_EXISTING_BASKET';
    }

    return product;
  }

  async wallets_get(credentials: any): Promise<void> {}

  async coupons_create(credentials: any): Promise<void> {
    if (credentials.code) {
      if (typeof credentials.code !== config.type_string) {
        throw 'ERR_INVALID_CODE';
      }

      credentials.code = str_remove_space(credentials.code).toLowerCase();

      if (credentials.code.length > 16) {
        throw 'ERR_LONG_CODE';
      }

      if (validator.isAlphanumeric(credentials.code) === false) {
        throw 'ERR_INVALID_CODE';
      }

      const coupon: Document | null = await this.options.db.coupons.findOne({
        code: credentials.code,
      });

      if (coupon) {
        throw 'ERR_EXISTING_COUPON';
      }
    }

    if (typeof credentials.discount !== config.type_number) {
      throw 'ERR_INVALID_DISCOUNT';
    }

    if (credentials.discount < 1 || credentials.discount > 100) {
      throw 'ERR_INVALID_DISCOUNT';
    }

    if (typeof credentials.quantity !== config.type_number) {
      throw 'ERR_INVALID_QUANTITY';
    }

    if (credentials.quantity < 1) {
      throw 'ERR_INVALID_QUANTITY';
    }

    if (credentials.quantity % 1 !== 0) {
      throw 'ERR_INVALID_QUANTITY';
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
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      if (res_captcha.data.success === false) {
        throw 'ERR_CAPTCHA';
      }
    }
  }
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

  // card utils
  card_validator_init,
  card_create_doc,

  // mail utils
  mail_validator_init,
  mail_generate_html,

  // settings utils
  settings_validator_init,

  // product utils
  product_validator_init,
  product_create_doc,

  // order utils
  order_validator_init,
  order_generate_delivery_code,
  order_create_doc,

  // provision utils
  provision_validator_init,
  provision_create_doc,

  // wallet utils
  wallet_validator_init,
  wallet_generate_solana,
  wallet_generate_ethereum,
  wallet_generate_bitcoin,
  wallet_create_doc,

  // coupon utils
  coupon_validator_init,
  coupon_create_doc,

  // review utils
  review_validator_init,
  review_create_doc,

  // admin utils
  admin_validator_init,
};
