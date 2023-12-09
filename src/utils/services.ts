'use strict';

// MODULES
import validator from 'validator';
import axios from 'axios';
import Crypto from 'node:crypto';

// INTERFACES
import { Document, ObjectId } from 'mongodb';
import options_i from 'interfaces/common';

// CONFIG
import config from '../config';

// COMMON UTILS
import UTILS_COMMON from './common';

/**
 *
 * AUTH UTILS
 *
 */
export class validator_common_init {
  private options: any;

  constructor(options: any) {
    this.options = options;
  }

  static base64(base64: string, err: any) {
    if (typeof base64 !== config.types.string) {
      throw {
        message: 'base64 is invalid type',
        type: `${err.section}:${err.type}`,
      };
    }

    if (base64.length > 1000000) {
      throw {
        message: 'Logo is too big, 1mb max',
        type: `${err.section}:${err.type}`,
      };
    }

    if (
      !base64.startsWith('data:image/png;base64,') &&
      !base64.startsWith('data:image/jpg;base64,') &&
      !base64.startsWith('data:image/jpeg;base64,') &&
      !base64.startsWith('data:image/webp;base64,')
    ) {
      throw {
        message:
          'Invalid image file type (starts with data:image/{ext};base64,',
        type: `${err.section}:${err.type}`,
      };
    }

    const base64_parts: string[] = base64.split(';base64,');
    const base64_type: string = base64_parts[0];
    const base64_data: string = base64_parts[1];
    const file_ext: string = base64_type.split('/')[1];

    if (!validator.isBase64(base64) && !validator.isBase64(base64_data)) {
      throw {
        message: 'Invalid base64 string',
        type: `${err.section}:${err.type}`,
      };
    }

    if (!base64_type || !base64_data || !file_ext) {
      throw {
        message: 'Invalid image file type (base64)',
        type: `${err.section}:${err.type}`,
      };
    }

    // TODO improve
    if (
      !base64_type.includes('image/png') &&
      !base64_type.includes('image/jpg') &&
      !base64_type.includes('image/jpeg') &&
      !base64_type.includes('image/webp')
    ) {
      throw {
        message: 'Invalid image file type, acceptables (png, jpg, jpeg)',
        type: `${err.section}:${err.type}`,
      };
    }
  }
}

export class validator_auth_init {
  private options: any;
  private password_config: any;

  constructor(options: any) {
    this.options = options;

    this.password_config = {
      minLength: 6,
      minSymbols: 0,
      minNumbers: 0,
      minLowercase: 0,
      minUppercase: 0,
    };
  }

  async edit_profile(credentials: any): Promise<void> {
    const err = { section: 'auth', type: 'profile-edit' };

    if (!credentials) {
      throw {
        message: "User Credentials hasn't been provided",
        type: `${err.section}:${err.type}`,
      };
    }

    credentials.name = UTILS_COMMON.str_remove_space(credentials.name);

    credentials.username = UTILS_COMMON.str_remove_space(
      credentials.username
    ).toLowerCase();

    credentials.phone = UTILS_COMMON.str_remove_space(credentials.phone);

    if (!credentials.phone || !credentials.name || !credentials.username) {
      throw {
        message: 'Kimlik bilgileri sağlanmadı',
        type: `${err.section}:${err.type}`,
      };
    }

    if (
      typeof credentials.name !== config.types.string ||
      typeof credentials.username !== config.types.string ||
      typeof credentials.phone !== config.types.string
    ) {
      throw {
        message: 'Geçersiz tip kimilik bilgileri',
        type: `${err.section}:${err.type}`,
      };
    }

    if (
      credentials.name.length > 50 ||
      credentials.username.length > 50 ||
      credentials.phone.length > 14
    ) {
      throw {
        message: 'İsim çok uzun, lütfen daha kısa bir isim giriniz',
        type: `${err.section}:${err.type}`,
      };
    }

    /**
     *     if (
      !validator.isAlpha(UTILS_COMMON.str_remove_space(credentials.name, 'all'))
    ) {
      throw {
        message: 'Geçersiz isim',
        type: `${err.section}:${err.type}`,
      };
    }
     * 
     */

    if (
      credentials.username.includes(' ') ||
      !validator.isAlphanumeric(credentials.username)
    ) {
      throw {
        message: 'Geçersiz kullanıcı adı',
        type: `${err.section}:${err.type}`,
      };
    }

    if (!validator.isMobilePhone(credentials.phone)) {
      throw {
        message: 'Geçersiz telefon adresi',
        type: `${err.section}:${err.type}`,
      };
    }

    if (credentials.username !== credentials.user.username) {
      const user_existing = await this.options.db.users.findOne({
        username: credentials.username,
      });

      if (user_existing) {
        throw {
          message: 'Bu kullanıcı adı alınmış',
          type: `${err.section}:${err.type}`,
        };
      }

      if (
        credentials.user.username_changed_at &&
        Date.now() - credentials.user.username_changed_at.valueOf() <
          config.times.one_day_ms * 30
      ) {
        throw {
          message: 'Kullanıcı adınızı sadece 30 günde bir değiştirebilirsiniz',
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

    if (!credentials) {
      throw {
        message: 'Kimlik bilgieri sağlanmadı',
        type: `${err.section}:${err.type}`,
      };
    }

    if (typeof credentials !== config.types.object) {
      throw {
        message: 'Geçersiz kimlik bilgileri',
        type: `${err.section}:${err.type}`,
      };
    }

    credentials.name = UTILS_COMMON.str_remove_space(credentials.name);

    credentials.email = UTILS_COMMON.str_remove_space(
      credentials.email
    ).toLowerCase();

    credentials.username = UTILS_COMMON.str_remove_space(
      credentials.username
    ).toLowerCase();

    credentials.phone = UTILS_COMMON.str_remove_space(credentials.phone);

    if (!credentials.username) {
      let length: number = 8;

      credentials.username = UTILS_COMMON.random({ length: length });
      let _existing_user = await this.options.db.users.findOne({
        username: credentials.username,
      });

      while (_existing_user) {
        length++;
        credentials.username = UTILS_COMMON.random({ length: length });
        _existing_user = await this.options.db.users.findOne({
          username: credentials.username,
        });
      }
    }

    if (
      !credentials.ip ||
      !credentials.name ||
      !credentials.email ||
      !credentials.username ||
      !credentials.phone ||
      !credentials.password ||
      !credentials.password_verification
    ) {
      throw {
        message: 'Kimlik bilgileri yetersiz',
        type: `${err.section}:${err.type}`,
      };
    }

    /**
     * 
     * CAPTCHA CONTROL DISABLED
     * 
     *     if (!captcha_token) {
      throw {
        message: 'Captcha is missing',
        type: `${err.section}:${err.type}`,
      };
    }
     */

    if (
      typeof credentials.ip !== config.types.string ||
      typeof credentials.name !== config.types.string ||
      typeof credentials.email !== config.types.string ||
      typeof credentials.username !== config.types.string ||
      typeof credentials.phone !== config.types.string ||
      typeof credentials.password !== config.types.string ||
      typeof credentials.password_verification !== config.types.string
      //typeof captcha_token !== config.types.string
    ) {
      throw {
        message: 'Geçersiz kimlik bilgileri',
        type: `${err.section}:${err.type}`,
      };
    }

    if (!validator.isIP(credentials.ip)) {
      throw { message: 'Geçersiz IP', type: `${err.section}:${err.type}` };
    }

    if (
      credentials.name.length > 50 ||
      credentials.email.length > 100 ||
      credentials.username.length > 32 ||
      credentials.phone.length > 14 ||
      credentials.password.length > 32
    ) {
      throw {
        message: 'İsim veya şifre çok uzun',
        type: `${err.section}:${err.type}`,
      };
    }

    if (
      !validator.isAlpha(UTILS_COMMON.str_remove_space(credentials.name, 'all'))
    ) {
      throw { message: 'Geçersiz isim', type: `${err.section}:${err.type}` };
    }

    if (!validator.isEmail(credentials.email)) {
      throw {
        message: 'Geçersiz e-posta adresi',
        type: `${err.section}:${err.type}`,
      };
    }

    if (
      !credentials.username ||
      credentials.username.includes(' ') ||
      !validator.isAlphanumeric(credentials.username)
    ) {
      throw {
        message: 'Geçersiz kullanıcı adı',
        type: `${err.section}:${err.type}`,
      };
    }

    if (!validator.isMobilePhone(credentials.phone)) {
      throw {
        message: 'Geçersiz telefon',
        type: `${err.section}:${err.type}`,
      };
    }

    if (credentials.password.includes(' ')) {
      throw {
        message: 'Şifre boşluk içeremez',
        type: `${err.section}:${err.type}`,
      };
    }

    if (credentials.password !== credentials.password_verification) {
      throw {
        message: 'Şifreler eşleşmiyor',
        type: `${err.section}:${err.type}`,
      };
    }

    if (
      !validator.isStrongPassword(credentials.password, this.password_config)
    ) {
      throw {
        message: 'Zayıf parola',
        type: `${err.section}:${err.type}`,
      };
    }

    const existing_user = await this.options.db.users.findOne({
      $or: [{ email: credentials.email }, { username: credentials.username }],
    });

    if (existing_user) {
      throw {
        message: 'Bu e-posta sistemde mevcut',
        type: `${err.section}:${err.type}`,
      };
    }

    /**
     * 
     * 
     * CAPTCHA CONTROL DISABLED
     * 
     * 
     * 
     *     const captcha_body: string =
      'response=' + captcha_token + '&secret=' + config.env.SECRET_KEY_CAPTCHA;
    const catpcha_response: any = await axios.post(
      'https://hcaptcha.com/siteverify',
      captcha_body,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!catpcha_response) {
      throw {
        message: 'Captcha didnt succeed',
        type: `${err.section}:${err.type}`,
      };
    }

    if (!catpcha_response.data.success) {
      throw {
        message: 'Captcha didnt succeed',
        type: `${err.section}:${err.type}`,
      };
    }
     */
  }

  async signin(credentials: any): Promise<Document> {
    const err = { section: 'auth', type: 'signin' };

    if (!credentials || typeof credentials !== config.types.object) {
      throw {
        message: "User credentials hasn't been provided",
        type: `${err.section}:${err.type}`,
      };
    }

    const { ip, uid, password }: any = credentials;

    if (!credentials.ip || !credentials.uid || !credentials.password) {
      throw {
        message: 'Missing credentials while signing in',
        type: `${err.section}:${err.type}`,
      };
    }

    if (
      typeof credentials.ip !== config.types.string ||
      typeof credentials.uid !== config.types.string ||
      typeof credentials.password !== config.types.string
    ) {
      throw {
        message: 'Given credentials are invalid',
        type: `${err.section}:${err.type}`,
      };
    }

    if (!validator.isIP(credentials.ip)) {
      throw { message: 'IP is not valid', type: `${err.section}:${err.type}` };
    }

    const user: Document | null = await this.options.db.users.findOne({
      $or: [
        { email: credentials.uid.toLowerCase() },
        { username: credentials.uid.toLowerCase() },
      ],
    });

    if (!user) {
      throw {
        message: 'Bu E-Posta ile Kullanıcı Bulunamadı',
        type: `${err.section}:${err.type}`,
      };
    }

    if (
      user.password !==
      Crypto.createHash('sha256').update(credentials.password).digest('hex')
    ) {
      throw {
        message: 'E-Posta veya Şifre Yanlış',
        type: `${err.section}:${err.type}`,
      };
    }

    return user;
  }

  async reset_password(credentials: any): Promise<void> {
    const types = config.types;
    const err = { section: 'auth', type: 'password-reset' };

    if (!credentials || typeof credentials !== types.object) {
      throw {
        message: "User Credentials hasn't been provided",
        type: `${err.section}:${err.type}`,
      };
    }

    const { password, password_verification, token } = credentials;

    if (!password || !password_verification || !token) {
      throw {
        message: "User Credentials hasn't been provided",
        type: `${err.section}:${err.type}`,
      };
    }

    if (
      typeof password !== types.string ||
      typeof password_verification !== types.string ||
      typeof token !== types.string
    ) {
      throw {
        message: "User Credentials hasn't been provided",
        type: `${err.section}:${err.type}`,
      };
    }

    if (
      password.length > 50 ||
      password_verification.length > 50 ||
      token.length > 256
    ) {
      throw {
        message: "User Credentials hasn't been provided",
        type: `${err.section}:${err.type}`,
      };
    }

    if (password.includes(' ')) {
      throw { message: 'Invalid password', type: `${err.section}:${err.type}` };
    }

    if (password !== password_verification) {
      throw {
        message: "Passwords doesn't match",
        type: `${err.section}:${err.type}`,
      };
    }

    if (!validator.isStrongPassword(password, this.password_config)) {
      throw {
        message:
          'Password is weak. It should contain at least One Upper Case Character, One Number, One Special Character and it should be 8 characters long.',
        type: `${err.section}:${err.type}`,
      };
    }

    const user: Document | null = await this.options.db.users.findOne({
      password_reset_token: token,
    });

    if (!user) {
      throw {
        message: "User with this token couldn't be found",
        type: `${err.section}:${err.type}`,
      };
    }

    if (!user.password_reset_token || !user.password_reset_token_exp_at) {
      throw {
        message: "User credentials with this token couldn't be found",
        type: `${err.section}:${err.type}`,
      };
    }

    if (user.password_reset_token !== token) {
      throw {
        message: 'Wrong Token specified while changing the password',
        type: `${err.section}:${err.type}`,
      };
    }

    if (user.password_reset_token_exp_at.valueOf() < Date.now()) {
      throw {
        message: 'Token has expired',
        type: `${err.section}:${err.type}`,
      };
    }
  }

  async change_password(credentials: any): Promise<void> {
    const err = { section: 'auth', type: 'password-change' };

    if (!credentials || typeof credentials !== config.types.object) {
      throw {
        message: 'Invalid credentials',
        type: `${err.section}:${err.type}`,
      };
    }

    const { user, password, new_password, new_password_verification }: any =
      credentials;

    if (!password || !new_password || !new_password_verification) {
      throw {
        message: 'Credential properties are missing',
        type: `${err.section}:${err.type}`,
      };
    }

    if (
      typeof password !== config.types.string ||
      typeof new_password !== config.types.string ||
      typeof new_password_verification !== config.types.string
    ) {
      throw {
        message: 'Credential properties are missing',
        type: `${err.section}:${err.type}`,
      };
    }

    if (
      password.length > 50 ||
      new_password.length > 50 ||
      new_password_verification.length > 256
    ) {
      throw {
        message: 'Credential properties are invalid',
        type: `${err.section}:${err.type}`,
      };
    }

    if (new_password.includes(' ')) {
      throw {
        message: 'New password is invalid',
        type: `${err.section}:${err.type}`,
      };
    }

    if (new_password !== new_password_verification) {
      throw {
        message: "Passwords doesn't match",
        type: `${err.section}:${err.type}`,
      };
    }

    if (
      user.password !==
      Crypto.createHash('sha256').update(password).digest('hex')
    ) {
      throw { message: 'Wrong password', type: `${err.section}:${err.type}` };
    }

    if (!validator.isStrongPassword(new_password, this.password_config)) {
      throw {
        message:
          'Password is weak. It should contain at least One Upper Case Character, One Number, One Special Character and it should be 8 characters long.',
        type: `${err.section}:${err.type}`,
      };
    }
  }

  async change_email(credentials: any): Promise<void> {
    const err = { section: 'auth', type: 'email-change' };

    if (!credentials) {
      throw {
        message: "User Credentials hasn't been provided",
        type: `${err.section}:${err.type}`,
      };
    }

    if (typeof credentials.email !== config.types.string) {
      throw {
        message: 'Credentials are invalid',
        type: `${err.section}:${err.type}`,
      };
    }

    if (credentials.email.length > 256) {
      throw {
        message: 'Email is too long',
        type: `${err.section}:${err.type}`,
      };
    }

    credentials.email = UTILS_COMMON.str_remove_space(credentials.email);

    if (!validator.isEmail(credentials.email)) {
      throw { message: 'Email is invalid', type: `${err.section}:${err.type}` };
    }

    const existing_user: Document | null = await this.options.db.users.findOne({
      email: credentials.email,
    });

    if (existing_user) {
      throw {
        message: 'User with this email already in use',
        type: `${err.section}:${err.type}`,
      };
    }
  }

  async verify_email(token: string): Promise<Document> {
    const err = { section: 'auth', type: 'email-verify' };

    if (!token || token.includes(' ')) {
      throw {
        message: "Token hasn't been provided",
        type: `${err.section}:${err.type}`,
      };
    }

    if (typeof token !== config.types.string) {
      throw {
        message: 'Token is in Invalid Type',
        type: `${err.section}:${err.type}`,
      };
    }

    if (!validator.isAlphanumeric(token)) {
      throw {
        message: 'Token is in invalid format',
        type: `${err.section}:${err.type}`,
      };
    }

    if (token.length > 256) {
      throw {
        message: 'Token is too long',
        type: `${err.section}:${err.type}`,
      };
    }

    const user: Document | null = await this.options.db.users.findOne({
      email_verification_token: token,
    });

    if (
      !user ||
      !user.email_verification_token_exp_at ||
      !user.email_verification_token
    ) {
      throw {
        message: 'User with this token is missing',
        type: `${err.section}:${err.type}`,
      };
    }

    if (user.email_verification_token_exp_at.valueOf() < Date.now()) {
      throw {
        message: 'Token has expired',
        type: `${err.section}:${err.type}`,
      };
    }

    if (user.email_verification_token !== token) {
      throw {
        message: "Tokens doesn't match",
        type: `${err.section}:${err.type}`,
      };
    }

    return user;
  }
}

async function generate_ref_code(options: any): Promise<string> {
  const length: number = 8;

  let code: string = UTILS_COMMON.random({
    length: length,
    type: 'distinguishable',
  });

  let user: Document = await options.db.users.findOne({
    ref_code: code,
  });

  while (user) {
    code = UTILS_COMMON.random({ length: length, type: 'distinguishable' });
    user = await options.db.users.findOne({ ref_code: code });
  }

  return code;
}

export async function create_session(
  payload: any,
  options: any
): Promise<string> {
  let sid: string = UTILS_COMMON.random({ length: 128 });
  let session_existing: string | null = await options.redis.hGet(
    'sessions',
    sid
  );

  while (session_existing) {
    sid = UTILS_COMMON.random({ length: 128 });
    session_existing = await options.redis.hGet('sessions', sid);
  }

  // example redis session vaule: 1af904ab45ba14_123.34.37.23_93765392334
  await options.redis.hSet(
    'sessions',
    sid,
    payload.user_id.toString() + '_' + payload.ip + '_' + Date.now()
  );

  return sid;
}

export async function generate_email_verification_token(
  options: any
): Promise<string> {
  let token: string = UTILS_COMMON.random({ length: 128 });
  let user: Document | null = await options.db.users.findOne({
    email_verification_token: token,
  });

  while (user) {
    token = UTILS_COMMON.random({ length: 128 });
    user = await options.db.users.findOne({
      email_verification_token: token,
    });
  }

  return token;
}

export async function generate_password_reset_token(
  options: any
): Promise<string> {
  let token: string = UTILS_COMMON.random({ length: 128 });
  let user: Document | null = await options.db.users.findOne({
    password_reset_token: token,
  });

  while (user) {
    token = UTILS_COMMON.random({ length: 128 });
    user = await options.db.users.findOne({
      password_reset_token: token,
    });
  }

  return token;
}

async function generate_api_key(options: any): Promise<string> {
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
  options: any
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
    // auth validator signup configures extra spaces and lowercase chars, you dont have to worry
    name: UTILS_COMMON.str_remove_space(credentials.name),

    username: UTILS_COMMON.str_remove_space(credentials.username).toLowerCase(),
    username_changed_at: null,

    email: UTILS_COMMON.str_remove_space(credentials.email).toLowerCase(),
    email_verified: false,
    email_verification_token: email_verification_token,
    email_verification_token_exp_at: new Date(
      Date.now() + config.times.one_hour_ms * 24
    ),

    phone: credentials.phone,

    password: Crypto.createHash('sha256')
      .update(credentials.password)
      .digest('hex'),
    password_reset_token: null,
    password_reset_token_exp_at: null,

    role: config.roles.user,
    permission: config.env.PERM_USER,

    img: '',

    favs: '',

    ref_code: ref_code,
    ref_from: ref_from,

    api_key: api_key,

    ip: credentials.ip,

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
    favs: user.favs,
    ref_code: user.ref_code,
    ref_from: user.ref_from,
    api_key: user.api_key,
  };
}

/**
 *
 * MAIL UTILS
 *
 */
export class validator_mail_init {
  private options: any;

  constructor(options: any) {
    this.options = options;
  }

  async send_verification_link(payload: any): Promise<Document> {
    const err = { section: 'mail', type: 'send-verification-link' };

    if (!payload.email || !payload.token || payload.token.includes(' ')) {
      throw {
        message: "Email or token hasn't been provided",
        code: `${err.section}:${err.type}`,
      };
    }

    if (
      typeof payload.email !== config.types.string ||
      typeof payload.token !== config.types.string
    ) {
      throw {
        message: 'Email or Token is in invalid type',
        code: `${err.section}:${err.type}`,
      };
    }

    if (!validator.isEmail(payload.email)) {
      throw { message: 'Email is invalid', code: `${err.section}:${err.type}` };
    }

    if (!validator.isAlphanumeric(payload.token)) {
      throw {
        message: 'Token is in invalid format',
        code: `${err.section}:${err.type}`,
      };
    }

    if (payload.token.length > 256) {
      throw {
        message: 'Token is too long',
        code: `${err.section}:${err.type}`,
      };
    }

    const user: Document | null = await this.options.db.users.findOne({
      email: payload.email,
    });

    if (!user) {
      throw {
        message: 'User with this token is missing',
        code: `${err.section}:${err.type}`,
      };
    }

    if (user.email_verified) {
      throw {
        message: 'Email is already been verified',
        code: `${err.section}:${err.type}`,
      };
    }

    return user;
  }

  async resend_verification_link(email: string): Promise<Document> {
    const err = { section: 'mail', type: 'resend-verification-link' };

    if (!email) {
      throw {
        message: "Email  hasn't been provided",
        code: `${err.section}:${err.type}`,
      };
    }

    if (typeof email !== config.types.string) {
      throw {
        message: 'Email is in Invalid type',
        code: `${err.section}:${err.type}`,
      };
    }

    if (!validator.isEmail(email)) {
      throw { message: 'Email is invalid', code: `${err.section}:${err.type}` };
    }

    const user: Document | null = await this.options.db.users.findOne({
      email,
    });

    if (!user) {
      throw {
        message: 'User with this token is missing',
        code: `${err.section}:${err.type}`,
      };
    }

    if (user.email_verified) {
      throw {
        message: 'Email is already been verified',
        code: `${err.section}:${err.type}`,
      };
    }

    return user;
  }

  async send_password_reset_link(email: string): Promise<Document> {
    const err = { section: 'mail', type: 'send-password-reset-link' };

    if (!email) {
      throw {
        message: "Email  hasn't been provided",
        code: `${err.section}:${err.type}`,
      };
    }

    if (typeof email !== config.types.string) {
      throw {
        message: 'Email is in Invalid type',
        code: `${err.section}:${err.type}`,
      };
    }

    if (email.length > 200) {
      throw {
        message: 'Email is too long',
        code: `${err.section}:${err.type}`,
      };
    }

    if (!validator.isEmail(email)) {
      throw { message: 'Email is invalid', code: `${err.section}:${err.type}` };
    }

    const user: Document | null = await this.options.db.users.findOne({
      email,
    });

    if (!user) {
      throw {
        message: "User with this email couldn't be found",
        code: `${err.section}:${err.type}`,
      };
    }

    return user;
  }

  async add_subscription_email(credentials: any): Promise<void> {
    const err = { section: 'mail', type: 'add-subscription-email' };

    if (!credentials.email) {
      throw {
        message: "Email  hasn't been provided",
        code: `${err.section}:${err.type}`,
      };
    }

    if (typeof credentials.email !== config.types.string) {
      throw {
        message: 'Email is in Invalid type',
        code: `${err.section}:${err.type}`,
      };
    }

    if (credentials.email.length > 300) {
      throw {
        message: 'Email is too long',
        code: `${err.section}:${err.type}`,
      };
    }

    if (!validator.isEmail(credentials.email)) {
      throw { message: 'Email is invalid', code: `${err.section}:${err.type}` };
    }

    const existing_email: Document | null =
      await this.options.db.subscription_emails.findOne({
        email: credentials.email,
      });

    if (existing_email) {
      throw {
        message: 'Email already exists',
        code: `${err.section}:${err.type}`,
      };
    }
  }
}

export function generate_html(type = 'email-verify', payload: any): string {
  switch (type) {
    case 'email-verify':
      return (
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"><title>' +
        config.env.URL_UI +
        '</title><style rel="stylesheet">*{margin:0;padding:0;box-sizing:border-box;font-family:Poppins,sans-serif;text-decoration:none}body{max-width:520px}.content-area{border:1px solid #dbdbdb;border-radius:5px;max-width:500px}.main-logo{width:100%;position:relative}.main-logo>a{background-color:#e2dacd;display:block;width:100%;height:70px;text-align:center;border-radius:4px;font-weight:700;color:#363636;font-size:20px;position:relative;display:block}.main-logo>a>img{display:block;height:60%;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}.content-area>h1{margin:2rem 2rem 0 2rem;font-size:18px;text-align:center}.content-area>.p{margin:2rem 2rem 0 2rem;text-align:center;font-size:14px}.mainbutton-wrapper{text-align:center;margin:2rem}.mainbutton{text-decoration:none;font-weight:700;color:#e2dacd;background-color:#002746;border-radius:4px;font-weight:700;padding:.6rem 1.4rem}.subtext{font-size:12px}.p>.username{font-weight:700}.footer{text-align:center;margin:2rem;font-size:12px}</style></head><body><section class="section"><div class="content-area"><div class="main-logo"><a href="https://' +
        config.env.URL_UI +
        '" target="_blank" rel="referrer"><img src="https://kaciriyosun.com/wp-content/uploads/2023/10/kaciriyosun.png" alt="logo"></a></div><h1>E-Posta Adresini Onayla</h1><div class="p">Hi<span class="username">' +
        payload.username +
        '</span></div><div class="p">Lütfen aşşağıdaki butona basarak e-posta adresinizi onaylayınız</div><div class="p subtext">Eğer ' +
        config.env.URL_UI +
        ' adresine kayıt olmadıysanız bu e-postayı dikkate almayın</div><div class="mainbutton-wrapper"><a href="' +
        payload.link +
        '" target="_blank" rel="referrer" class="mainbutton">E-Postamı Onayla</a></div><footer class="footer">© 2023 ' +
        config.env.URL_UI +
        ' | All rights reserved.</footer></div></section></body></html>'
      );

    case 'password-reset':
      return (
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"><title>' +
        config.env.URL_UI +
        '</title><style rel="stylesheet">*{margin:0;padding:0;box-sizing:border-box;font-family:Poppins,sans-serif;text-decoration:none}body{max-width:520px}.content-area{border:1px solid #dbdbdb;border-radius:5px;max-width:500px}.main-logo{width:100%;position:relative}.main-logo>a{background-color:#e2dacd;display:block;width:100%;height:70px;text-align:center;border-radius:4px;font-weight:700;color:#363636;font-size:20px;position:relative;display:block}.main-logo>a>img{display:block;height:60%;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}.content-area>h1{margin:2rem 2rem 0 2rem;font-size:18px;text-align:center}.content-area>.p{margin:2rem 2rem 0 2rem;text-align:center;font-size:14px}.mainbutton-wrapper{text-align:center;margin:2rem}.mainbutton{text-decoration:none;font-weight:700;color:#e2dacd;background-color:#002746;border-radius:4px;font-weight:700;padding:.6rem 1.4rem}.subtext{font-size:12px}.p>.username{font-weight:700}.footer{text-align:center;margin:2rem;font-size:12px}</style></head><body><section class="section"><div class="content-area"><div class="main-logo"><a href="https://' +
        config.env.URL_UI +
        '" target="_blank" rel="referrer"><img src="https://kaciriyosun.com/wp-content/uploads/2023/10/kaciriyosun.png" alt="logo"></a></div><h1>Şifre Sıfırlama</h1><div class="p">Hi<span class="username">' +
        payload.username +
        '</span></div><div class="p">Aşşağıdaki butona basarak şifrenizi sıfırlayabilirsiniz</div><div class="p subtext">Eğer bu işlemi siz yapmadıysanız bu e-postayı dikkate almayın</div><div class="mainbutton-wrapper"><a href="' +
        payload.link +
        '" target="_blank" rel="referrer" class="mainbutton">Şifremi Sıfırla</a></div><footer class="footer">© 2023 ' +
        config.env.URL_UI +
        ' | All rights reserved.</footer></div></section></body></html>'
      );

    case 'new-ip':
      return (
        '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"><title>' +
        config.env.URL_UI +
        '</title><style rel="stylesheet">*{margin:0;padding:0;box-sizing:border-box;font-family:Poppins,sans-serif;text-decoration:none}body{max-width:520px}.content-area{border:1px solid #dbdbdb;border-radius:5px;max-width:500px}.main-logo{width:100%;position:relative}.main-logo>a{background-color:#e2dacd;display:block;width:100%;height:70px;text-align:center;border-radius:4px;font-weight:700;color:#363636;font-size:20px;position:relative;display:block}.main-logo>a>img{display:block;height:60%;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}.content-area>h1{margin:2rem 2rem 0 2rem;font-size:18px;text-align:center}.content-area>.p{margin:2rem 2rem 0 2rem;text-align:center;font-size:14px}.mainbutton-wrapper{text-align:center;margin:2rem}.mainbutton{text-decoration:none;font-weight:700;color:#e2dacd;background-color:#002746;border-radius:4px;font-weight:700;padding:.6rem 1.4rem}.subtext{font-size:12px}.p>.username{font-weight:700}.footer{text-align:center;margin:2rem;font-size:12px}</style></head><body><section class="section"><div class="content-area"><div class="main-logo"><a href="https://' +
        config.env.URL_UI +
        '" target="_blank" rel="referrer"><img src="https://kaciriyosun.com/wp-content/uploads/2023/10/kaciriyosun.png" alt="logo"></a></div><h1>E-Posta Adresini Onayla</h1><div class="p">Hi<span class="username">' +
        payload.username +
        '</span></div><div class="p">Lütfen aşşağıdaki butona basarak e-posta adresinizi onaylayınız</div><div class="p subtext">Eğer ' +
        config.env.URL_UI +
        ' adresine kayıt olmadıysanız bu e-postayı dikkate almayın</div><div class="mainbutton-wrapper"><a href="' +
        payload.link +
        '" target="_blank" rel="referrer" class="mainbutton">E-Postamı Onayla</a></div><footer class="footer">© 2023 ' +
        config.env.URL_UI +
        ' | All rights reserved.</footer></div></section></body></html>'
      );
    default:
      return '';
  }
}

export function create_subscription_email_doc(credentials: any): object {
  const doc: any = {
    email: UTILS_COMMON.str_remove_space(credentials.email).toLowerCase(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  return doc;
}

// SETTINGS VALIDATOR
export class validator_settings_init {
  private options: any;

  constructor(options: any) {
    this.options = options;
  }

  async edit_banners(credentials: any): Promise<void> {
    const err = { section: 'settings', type: 'banners-edit' };

    if (!credentials.banners) {
      throw {
        message: 'missing credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (typeof credentials.banners !== config.types.object) {
      throw {
        message: 'invalid banners data',
        code: `${err.section}:${err.type}`,
      };
    }

    if (!Array.isArray(credentials.banners)) {
      throw {
        message: 'invalid banners data',
        code: `${err.section}:${err.type}`,
      };
    }

    for (let i: number = 0; i < credentials.banners.length; i++) {
      if (
        typeof credentials.banners[i].img !== config.types.string ||
        typeof credentials.banners[i].src !== config.types.string
      ) {
        throw {
          message: 'img or src props are invalid',
          code: `${err.section}:${err.type}`,
        };
      }

      if (
        credentials.banners[i].img.length > 100 ||
        credentials.banners[i].src.length > 100
      ) {
        throw {
          message: 'props are too long',
          code: `${err.section}:${err.type}`,
        };
      }

      if (!validator.isURL(credentials.banners[i].src)) {
        throw {
          message: 'img or src is invalid',
          code: `${err.section}:${err.type}`,
        };
      }

      if (credentials.banners[i].img_base64) {
        validator_common_init.base64(credentials.banners[i].img_base64, err);
      }
    }
  }

  async edit_campaigns(credentials: any): Promise<void> {
    const err = { section: 'settings', type: 'campaigns-edit' };

    if (!credentials.campaigns) {
      throw {
        message: 'missing credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (typeof credentials.campaigns !== config.types.object) {
      throw {
        message: 'invalid campaigns data',
        code: `${err.section}:${err.type}`,
      };
    }

    if (!Array.isArray(credentials.campaigns)) {
      throw {
        message: 'invalid campaigns data',
        code: `${err.section}:${err.type}`,
      };
    }

    for (let i: number = 0; i < credentials.campaigns.length; i++) {
      if (
        typeof credentials.campaigns[i].img !== config.types.string ||
        typeof credentials.campaigns[i].src !== config.types.string ||
        typeof credentials.campaigns[i].message !== config.types.string
      ) {
        throw {
          message: 'img or src or message props are invalid',
          code: `${err.section}:${err.type}`,
        };
      }

      if (
        credentials.campaigns[i].img.length > 100 ||
        credentials.campaigns[i].src.length > 100 ||
        credentials.campaigns[i].message.length > 200
      ) {
        throw {
          message: 'props are too long',
          code: `${err.section}:${err.type}`,
        };
      }

      if (!validator.isURL(credentials.campaigns[i].src)) {
        throw {
          message: 'img or src is invalid',
          code: `${err.section}:${err.type}`,
        };
      }

      if (credentials.campaigns[i].img_base64) {
        validator_common_init.base64(credentials.campaigns[i].img_base64, err);
      }
    }
  }

  async edit_notifications(credentials: any): Promise<void> {
    const err = { section: 'settings', type: 'notifications-edit' };

    if (!credentials.notifications) {
      throw {
        message: 'missing credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (typeof credentials.notifications !== config.types.object) {
      throw {
        message: 'invalid notifications data',
        code: `${err.section}:${err.type}`,
      };
    }

    if (!Array.isArray(credentials.notifications)) {
      throw {
        message: 'invalid notifications data',
        code: `${err.section}:${err.type}`,
      };
    }

    for (let i: number = 0; i < credentials.notifications.length; i++) {
      if (
        typeof credentials.notifications[i].img !== config.types.string ||
        typeof credentials.notifications[i].src !== config.types.string ||
        typeof credentials.notifications[i].message !== config.types.string
      ) {
        throw {
          message: 'img or src or message props are invalid',
          code: `${err.section}:${err.type}`,
        };
      }

      if (
        credentials.notifications[i].img.length > 100 ||
        credentials.notifications[i].src.length > 100 ||
        credentials.notifications[i].message.length > 200
      ) {
        throw {
          message: 'props are too long',
          code: `${err.section}:${err.type}`,
        };
      }

      if (!validator.isURL(credentials.notifications[i].src)) {
        throw {
          message: 'img or src is invalid',
          code: `${err.section}:${err.type}`,
        };
      }

      if (credentials.notifications[i].img_base64) {
        validator_common_init.base64(
          credentials.notifications[i].img_base64,
          err
        );
      }
    }
  }
}

// STORE VALIDATOR
export class validator_store_init {
  private options: any;

  constructor(options: any) {
    this.options = options;
  }

  async get_store(credentials: any): Promise<void> {
    const err = { section: 'store', type: 'store-get' };

    if (!credentials) {
      throw {
        message: 'missing credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (!credentials.name) {
      throw {
        message: 'missing credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (typeof credentials.name !== config.types.string) {
      throw {
        message: 'invalid credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (credentials.name.length > 50) {
      throw {
        message: 'long credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    credentials.limit = Number(credentials.limit);

    if (!credentials.limit) {
      credentials.limit = 3;
    }

    if (credentials.limit > 5) {
      credentials.limit = 5;
    }
  }

  async get_stores(credentials: any): Promise<void> {
    const err = { section: 'store', type: 'stores-get' };

    if (!credentials) {
      throw {
        message: 'missing credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (credentials.page && isNaN(credentials.page)) {
      throw {
        message: 'invalid credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    credentials.page = Number(credentials.page || 0);
    credentials.page = parseInt(credentials.page) - 1;

    if (credentials.page < 0) {
      credentials.page = 0;
    }

    if (credentials.limit && isNaN(credentials.limit)) {
      throw {
        message: 'invalid credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    credentials.limt = Number(credentials.limit || 40);
    credentials.limit = parseInt(credentials.limit);
  }

  async create_store(credentials: any): Promise<void> {
    const err = { section: 'store', type: 'create' };

    if (!credentials) {
      throw {
        message: 'missing credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    credentials.name = UTILS_COMMON.str_remove_space(credentials.name);

    if (!credentials.name || !credentials.img_base64) {
      throw {
        message: 'missing credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (
      typeof credentials.name !== config.types.string ||
      typeof credentials.featured !== config.types.boolean ||
      typeof credentials.img_base64 !== config.types.string
    ) {
      throw {
        message: 'invalid credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (!validator.isAscii(credentials.name)) {
      throw {
        message: 'invalid credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (credentials.name.length > 200) {
      throw {
        message: 'long credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    validator_common_init.base64(credentials.img_base64, err);
  }

  async edit_store(credentials: any): Promise<any> {
    const err = { section: 'store', type: 'edit' };

    if (!credentials) {
      throw {
        message: 'missing credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (!ObjectId.isValid(credentials._id)) {
      throw {
        message: 'invalid store id',
        code: `${err.section}:${err.type}`,
      };
    }

    const store = await this.options.db.stores.findOne({
      _id: new ObjectId(credentials._id),
    });

    if (!store) {
      throw {
        message: 'missing store',
        code: `${err.section}:${err.type}`,
      };
    }

    credentials.name = UTILS_COMMON.str_remove_space(credentials.name);

    if (!credentials.name) {
      throw {
        message: 'missing credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (
      typeof credentials.name !== config.types.string ||
      typeof credentials.featured !== config.types.boolean
    ) {
      throw {
        message: 'invalid credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (!validator.isAscii(credentials.name)) {
      throw {
        message: 'invalid credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (credentials.name.length > 200) {
      throw {
        message: 'long credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (credentials.img_base64) {
      validator_common_init.base64(credentials.img_base64, err);
    }

    return store;
  }

  async delete_store(credentials: any): Promise<any> {
    const err = { section: 'store', type: 'delete' };

    if (!credentials) {
      throw {
        message: 'missing credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (!ObjectId.isValid(credentials._id)) {
      throw {
        message: 'invalid store id',
        code: `${err.section}:${err.type}`,
      };
    }

    const store = await this.options.db.stores.findOne({
      _id: new ObjectId(credentials._id),
    });

    if (!store) {
      throw {
        message: 'missing store',
        code: `${err.section}:${err.type}`,
      };
    }
  }
}

export async function create_store_doc(
  credentials: any,
  options: options_i
): Promise<any> {
  const doc = {
    name: credentials.name,
    featured: credentials.featured,
    img: '',
    created_at: new Date(),
    updated_at: new Date(),
  };

  return doc;
}

export class validator_product_init {
  private options: any;
  private categories: string[];

  constructor(options: any) {
    this.options = options;

    this.categories = [
      'trouser',
      'sweater',
      'shirt',
      'tshirt',
      'suit',
      'coat',
      'jean',
      'tunic',
      'swimsuit',
      'dress',
      'short',
      'skirt',
      'hoodie',
      'legging',
      'jacket',
    ];
  }

  async get_products(credentials: any): Promise<any> {
    const err = { section: 'product', type: 'products-get' };

    if (!credentials) {
      throw {
        message: 'missing credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    // delete undefined properties
    for (const key in credentials.query) {
      if (!credentials.query[key]) {
        credentials.query[key] = undefined;
        delete credentials.query[key];
      }
    }
  }

  async edit_fav_products(credentials: any): Promise<any> {
    const err = { section: 'product', type: 'products-favs-edit' };

    if (!credentials) {
      throw {
        message: 'missing credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (typeof credentials.favs !== config.types.string) {
      throw {
        message: 'invalid credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    // validate favs string and rebuild it
    credentials.favs = UTILS_COMMON.str_remove_space(credentials.favs);

    const products: any = await this.options.redis.hmGet(
      'products',
      credentials.favs.split(' ')
    );

    // remove unexisting products with invalid ids
    const products_valid = products.filter((curr: any, index: number) => {
      if (curr) {
        return curr;
      }
    });

    credentials.favs = products_valid.map((curr: any, index: number) => {
      return JSON.parse(curr);
    });
  }

  async create_product(credentials: any): Promise<any> {
    const err = { section: 'product', type: 'create' };

    if (!credentials) {
      throw {
        message: 'missing credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    const {
      store_id,
      name,
      desc,
      featured,
      category,
      sex,
      price,
      price_discount,
      src,
      img_url,
    } = credentials;

    credentials.name = UTILS_COMMON.str_remove_space(credentials.name);
    credentials.desc = UTILS_COMMON.str_remove_space(credentials.desc);
    credentials.category = UTILS_COMMON.str_remove_space(
      credentials.category
    ).toLowerCase();
    credentials.sex = UTILS_COMMON.str_remove_space(
      credentials.sex
    ).toLowerCase();

    if (!ObjectId.isValid(credentials.store_id)) {
      throw {
        message: 'invalid credentials store_id',
        code: `${err.section}:${err.type}`,
      };
    }

    const store: Document = await this.options.db.stores.findOne({
      _id: new ObjectId(credentials.store_id),
    });

    if (!store) {
      throw {
        message: 'missing store store_id',
        code: `${err.section}:${err.type}`,
      };
    }

    if (
      !credentials.name ||
      !credentials.desc ||
      !credentials.category ||
      !credentials.sex ||
      !credentials.price ||
      !credentials.price_discount ||
      !credentials.src
    ) {
      throw {
        message: 'missing credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (
      typeof credentials.name !== config.types.string ||
      typeof credentials.desc !== config.types.string ||
      typeof credentials.category !== config.types.string ||
      typeof credentials.sex !== config.types.string ||
      typeof credentials.price !== config.types.number ||
      typeof credentials.price_discount !== config.types.number ||
      typeof credentials.featured !== config.types.boolean ||
      typeof credentials.src !== config.types.string
    ) {
      throw {
        message: 'invalid credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (credentials.category.includes(' ') || credentials.sex.includes(' ')) {
      throw {
        message: 'invalid credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (credentials.price < credentials.price_discount) {
      throw {
        message: 'invalid credentials price cant be lower than price discount',
        code: `${err.section}:${err.type}`,
      };
    }

    if (!validator.isURL(credentials.src)) {
      throw {
        message: 'invalid credentials src',
        code: `${err.section}:${err.type}`,
      };
    }

    if (typeof credentials.img_url !== config.types.object) {
      throw {
        message: 'invalid credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (!Array.isArray(credentials.img_url)) {
      throw {
        message: 'invalid credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    for (let i: number = 0; i < credentials.img_url.length; i++) {
      if (!validator.isURL(credentials.img_url[i])) {
        throw {
          message: 'invalid credentials',
          code: `${err.section}:${err.type}`,
        };
      }
    }

    return store;
  }

  async edit_product(credentials: any): Promise<any> {
    const err = { section: 'product', type: 'edit' };

    if (!credentials) {
      throw {
        message: 'missing credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    const {
      store_id,
      name,
      desc,
      featured,
      category,
      sex,
      price,
      price_discount,
      img_url,
    } = credentials;

    credentials.name = UTILS_COMMON.str_remove_space(credentials.name);
    credentials.desc = UTILS_COMMON.str_remove_space(credentials.desc);
    credentials.category = UTILS_COMMON.str_remove_space(
      credentials.category
    ).toLowerCase();
    credentials.sex = UTILS_COMMON.str_remove_space(
      credentials.sex
    ).toLowerCase();

    const product: any = await this.options.redis.hGet(
      'products',
      credentials.id
    );

    if (!product) {
      throw {
        message: 'missing product',
        code: `${err.section}:${err.type}`,
      };
    }

    if (!ObjectId.isValid(credentials.store_id)) {
      throw {
        message: 'invalid credentials store_id',
        code: `${err.section}:${err.type}`,
      };
    }

    const user: Document = await this.options.db.users.findOne({
      _id: new ObjectId(credentials.owner_id),
    });

    if (!user) {
      throw {
        message: 'missing user owner_id',
        code: `${err.section}:${err.type}`,
      };
    }

    const store: Document = await this.options.db.stores.findOne({
      _id: new ObjectId(credentials.store_id),
    });

    if (!store) {
      throw {
        message: 'missing store store_id',
        code: `${err.section}:${err.type}`,
      };
    }

    if (
      !credentials.name ||
      !credentials.desc ||
      !credentials.category ||
      !credentials.sex ||
      !credentials.price ||
      !credentials.price_discount ||
      !credentials.src
    ) {
      throw {
        message: 'missing credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (
      typeof credentials.name !== config.types.string ||
      typeof credentials.desc !== config.types.string ||
      typeof credentials.category !== config.types.string ||
      typeof credentials.sex !== config.types.string ||
      typeof credentials.price !== config.types.number ||
      typeof credentials.price_discount !== config.types.number ||
      typeof credentials.featured !== config.types.boolean ||
      typeof credentials.src !== config.types.string
    ) {
      throw {
        message: 'invalid credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (credentials.category.includes(' ') || credentials.sex.includes(' ')) {
      throw {
        message: 'invalid credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (credentials.price < credentials.price_discount) {
      throw {
        message: 'invalid credentials price cant be lower than price discount',
        code: `${err.section}:${err.type}`,
      };
    }

    if (!validator.isURL(credentials.src)) {
      throw {
        message: 'invalid credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (typeof credentials.img_url !== config.types.object) {
      throw {
        message: 'invalid credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    if (!Array.isArray(credentials.img_url)) {
      throw {
        message: 'invalid credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    for (let i: number = 0; i < credentials.img_url.length; i++) {
      if (!validator.isURL(credentials.img_url[i])) {
        throw {
          message: 'invalid credentials',
          code: `${err.section}:${err.type}`,
        };
      }
    }

    return { product: JSON.parse(product), store };
  }

  async delete_product(credentials: any): Promise<any> {
    const err = { section: 'product', type: 'delete' };

    if (!credentials) {
      throw {
        message: 'missing credentials',
        code: `${err.section}:${err.type}`,
      };
    }

    let product: any = await this.options.redis.hGet(
      'products',
      credentials.id
    );

    if (!product) {
      throw {
        message: 'missing product',
        code: `${err.section}:${err.type}`,
      };
    }

    return JSON.parse(product);
  }
}

export async function generate_product_id(
  length: number,
  options: options_i
): Promise<string> {
  let id_length: number = length || 6;
  let id_repeat: number = 0;
  let id: string = UTILS_COMMON.random({ length: id_length, type: 'hex' });
  let product_existing: any = await options.redis.hGet('products', id);

  // increase the id length after few attempts to find product with same id
  while (product_existing) {
    if (id_repeat > 2) {
      id_length++;
    }

    id = UTILS_COMMON.random({ length: id_length });
    product_existing = await options.redis.hGet('products', id);

    id_repeat++;
  }

  return id;
}

export default {
  validator_common_init,
  validator_auth_init,
  create_session,
  generate_email_verification_token,
  generate_password_reset_token,
  create_user_doc,
  return_user_profile,
  validator_mail_init,
  generate_html,
  create_subscription_email_doc,
  validator_settings_init,
  validator_store_init,
  create_store_doc,
  validator_product_init,
  generate_product_id,
};
