'use strict';

// MODULES
import fs from 'node:fs';
import crypto from 'node:crypto';

// INTERFACES
import { Document, InsertOneResult, UpdateResult, ObjectId } from 'mongodb';
import { options_i } from 'interfaces/common';
import { redis_session_i } from 'interfaces/loaders';
import {
  user_email_change_credentials_i,
  user_email_change_result_i,
  user_get_profile_credentials_i,
  user_get_profile_result_i,
  user_password_change_credentials_i,
  user_password_reset_credentials_i,
  user_patch_profile_credentials_i,
  user_signin_credentials_i,
  user_signin_result_i,
  user_signout_credentials_i,
  user_signup_credentials_i,
  user_signup_result_i,
} from 'interfaces/services';
import { user_profile_i } from 'interfaces/utils';

// CONFIG
import config from '../config';

// UTILS
import {
  user_validator_init,
  user_return_profile,
  user_generate_email_verification_code,
  user_create_doc,
  user_create_session,
  user_generate_password_reset_code,
} from '../utils/services';
import { random } from '../utils/common';

class service_user_init {
  private readonly options: options_i;
  private readonly validator: user_validator_init;

  constructor(options: options_i) {
    this.options = options;
    this.validator = new user_validator_init(options);
  }

  async signup(
    credentials: user_signup_credentials_i,
  ): Promise<user_signup_result_i> {
    await this.validator.signup(credentials);

    const doc: Document = await user_create_doc(credentials, this.options);

    const insert: InsertOneResult = await this.options.db.users.insertOne(doc);

    doc._id = insert.insertedId;

    const profile: user_profile_i = user_return_profile(doc);

    const session: redis_session_i = {
      user_id: insert.insertedId.toString(),
      ip: credentials.ip,
      remember: credentials.remember,
      created_at: new Date(),
    };

    const sid: string = await user_create_session(session, this.options);

    let expires: undefined | Date = undefined;
    if (credentials.remember) {
      expires = new Date(Date.now() + config.ENV_COOKIE_LIFETIME_MS * 30);
    }

    const result: user_signup_result_i = {
      profile: profile,
      email_verification_code: doc.email_verification_code,
      cookie_value: sid, // cookie value
      cookie_expires: expires, // cookie expires
    };

    return result;
  }

  async signin(
    credentials: user_signin_credentials_i,
  ): Promise<user_signin_result_i> {
    const user: Document = await this.validator.signin(credentials);

    const profile: user_profile_i = user_return_profile(user);

    const session: redis_session_i = {
      user_id: user._id.toString(),
      ip: credentials.ip,
      remember: credentials.remember,
      created_at: new Date(),
    };

    const sid: string = await user_create_session(session, this.options);

    let expires: undefined | Date = undefined;
    if (credentials.remember) {
      expires = new Date(Date.now() + config.ENV_COOKIE_LIFETIME_MS * 30);
    }

    const result = {
      profile: profile,
      cookie_value: sid,
      cookie_expires: expires,
    };

    return result;
  }

  async verify_email(code: string): Promise<user_profile_i> {
    const user: Document = await this.validator.verify_email(code);

    const email_verification_code: string =
      await user_generate_email_verification_code(0, this.options);

    await this.options.db.users.updateOne(
      { _id: user._id },
      {
        $set: {
          email_verified: true,
          email_verification_code: email_verification_code,
          updated_at: new Date(),
        },
      },
    );

    user.email_verified = true;
    user.email_verification_code = email_verification_code;
    user.updated_at = new Date();

    const profile: user_profile_i = user_return_profile(user);

    return profile;
  }

  // renewes the cookie lifetime if any exists
  async get_profile(
    credentials: user_get_profile_credentials_i,
  ): Promise<user_get_profile_result_i> {
    if (credentials.sid === undefined) {
      return {
        profile: null,
        cookie_value: '',
        cookie_expires: undefined,
      };
    }

    await this.validator.get_profile(credentials);

    const session: redis_session_i | null = JSON.parse(
      await this.options.redis.GET('session:' + credentials.sid),
    );

    if (session === null) {
      return {
        profile: null,
        cookie_value: '',
        cookie_expires: undefined,
      };
    }

    if (session.ip !== credentials.ip) {
      return {
        profile: null,
        cookie_value: '',
        cookie_expires: undefined,
      };
    }

    const user: Document | null = await this.options.db.users.findOne({
      _id: ObjectId.createFromHexString(session.user_id),
    });

    if (user === null) {
      return {
        profile: null,
        cookie_value: '',
        cookie_expires: undefined,
      };
    }

    const profile: user_profile_i = user_return_profile(user);

    // session time to live in seconds (number)
    const session_ttl: number = await this.options.redis.ttl(
      'session:' + credentials.sid,
    );

    let cookie_expires: undefined | Date = undefined;
    if (session.remember) {
      cookie_expires = new Date(Date.now() + session_ttl * 1000);
    }

    // renew session expiry only if a certain threshold has passed (12 hours)
    if (session_ttl < (config.time_one_hour_ms / 1000) * 12) {
      // redis expiration in seconds
      let redis_exp: number = config.ENV_COOKIE_LIFETIME_MS / 1000;

      if (session.remember) {
        redis_exp = redis_exp * 30;
        cookie_expires = new Date(
          Date.now() + config.ENV_COOKIE_LIFETIME_MS * 30,
        );
      }

      await this.options.redis.EXPIRE('session:' + credentials.sid, redis_exp);
    }

    const result: user_get_profile_result_i = {
      profile: profile,
      cookie_value: credentials.sid,
      cookie_expires: cookie_expires,
    };

    return result;
  }

  async edit_profile(
    credentials: user_patch_profile_credentials_i,
  ): Promise<UpdateResult> {
    await this.validator.edit_profile(credentials);

    const query: any = { _id: credentials.user._id };

    const $set: any = { updated_at: new Date() };

    if (credentials.img) {
      const base64_buffer: string[] = credentials.img.split(';base64,');
      const base64_type: string = base64_buffer[0];
      const base64_data: string = base64_buffer[1];

      const file_ext: string = base64_type.split('/')[1];

      let file_name: string = random() + '.' + file_ext;
      let file_exists: boolean = fs.existsSync('public/images/' + file_name);

      while (file_exists) {
        file_name = random() + '.' + file_ext;
        file_exists = fs.existsSync('public/images/' + file_name);
      }

      // write new base64 buffer to file synchronously
      fs.writeFileSync('public/images/' + file_name, base64_data, {
        encoding: 'base64',
      });

      // Delete previous image of the user
      const previous_img_parts: string[] = credentials.user.img.split('/');
      const previous_img_id: string =
        previous_img_parts[previous_img_parts.length - 1];
      fs.unlink('public/images/' + previous_img_id, function (err: any) {});

      const img: string = config.ENV_URL_API + '/images/' + file_name;

      $set.img = img;
    }

    if (credentials.name) {
      $set.name = credentials.name;
    }

    // TODO: check username_changed_at prop in the updateOne query to prevent race conditions
    if (credentials.username) {
      $set.username = credentials.username;

      if (credentials.username !== credentials.user.username) {
        query.username_changed_at = {
          $lt: new Date(Date.now() - config.time_one_day_ms * 30),
        };

        $set.username_changed_at = new Date();
      }
    }

    if (credentials.phone) {
      $set.phone = credentials.phone;
    }

    if (credentials.city) {
      $set.city = credentials.city;
    }

    if (credentials.district) {
      $set.district = credentials.district;
    }

    if (credentials.address) {
      $set.address = credentials.address;
    }

    if (credentials.zip) {
      $set.zip = credentials.zip;
    }

    // update user credentials
    const result: UpdateResult = await this.options.db.users.updateOne(query, {
      $set: $set,
    });

    return result;
  }

  async change_email(
    credentials: user_email_change_credentials_i,
  ): Promise<user_email_change_result_i> {
    await this.validator.change_email(credentials);

    const code: string = await user_generate_email_verification_code(
      config.time_one_hour_ms,
      this.options,
    );

    await this.options.db.users.updateOne(
      { _id: credentials.user._id },
      {
        $set: {
          email: credentials.email,
          email_verified: false,
          email_verification_code: code,
          updated_at: new Date(),
        },
      },
    );

    credentials.user.email = credentials.email;
    credentials.user.email_verified = false;
    credentials.user.updated_at = new Date();

    const profile: user_profile_i = user_return_profile(credentials.user);

    const result: user_email_change_result_i = {
      profile: profile,
      email_verification_code: code,
    };

    return result;
  }

  async reset_password(
    credentials: user_password_reset_credentials_i,
  ): Promise<user_profile_i> {
    const user: Document = await this.validator.reset_password(credentials);

    // put an expired password reset code after user successfully reset his password
    const code: string = await user_generate_password_reset_code(
      0,
      this.options,
    );

    await this.options.db.users.updateOne(
      { password_reset_code: credentials.code },
      {
        $set: {
          password: crypto
            .createHash('sha256')
            .update(credentials.password)
            .digest('hex'),
          password_reset_code: code,
          updated_at: new Date(),
        },
      },
    );

    const profile: user_profile_i = user_return_profile(user);

    return profile;
  }

  async change_password(
    credentials: user_password_change_credentials_i,
  ): Promise<user_profile_i> {
    await this.validator.change_password(credentials);

    await this.options.db.users.updateOne(
      { _id: credentials.user._id },
      {
        $set: {
          password: crypto
            .createHash('sha256')
            .update(credentials.password)
            .digest('hex'),
          updated_at: new Date(),
        },
      },
    );

    const profile: user_profile_i = user_return_profile(credentials.user);

    return profile;
  }

  async signout(credentials: user_signout_credentials_i): Promise<number> {
    // await this.validator.signout(credentials);

    const result: number = await this.options.redis.HDEL(
      'sessions',
      credentials.sid,
    );

    return result;
  }
}

export default service_user_init;
