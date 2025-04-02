'use strict';

// MODULES
import fs from 'node:fs';
import crypto from 'node:crypto';

// INTERFACES
import { Document, InsertOneResult, ObjectId } from 'mongodb';
import { options_i } from 'interfaces/common';

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
  private readonly validator: any;

  constructor(options: options_i) {
    this.options = options;
    this.validator = new user_validator_init(options);
  }

  // renewes the cookie lifetime if any exists
  async get_profile(credentials: any): Promise<any | null> {
    if (credentials.sid === undefined) {
      return null;
    }

    const session: any | null = JSON.parse(
      await this.options.redis.hGet('sessions', credentials.sid)
    );

    if (session === null) {
      return null;
    }

    if (session.ip !== credentials.ip) {
      return null;
    }

    const user: Document | null = await this.options.db.users.findOne({
      _id: ObjectId.createFromHexString(session.user_id),
    });

    if (user === null) {
      return null;
    }

    // redis expiration in seconds
    let redis_exp: number = config.ENV_SESSION_LIFETIME_MS / 1000;
    let cookie_expires: undefined | Date = undefined;

    if (session.remember) {
      redis_exp = redis_exp * 30;
      cookie_expires = new Date(
        Date.now() + config.ENV_SESSION_LIFETIME_MS * 30
      );
    }

    // renew session expiry on redis hash
    await this.options.redis.expire(credentials.sid, redis_exp);

    const profile = user_return_profile(user);

    return {
      profile: profile,
      cookie_value: credentials.sid,
      cookie_expires: cookie_expires,
    };
  }

  async edit_profile(credentials: any): Promise<any> {
    await this.validator.edit_profile(credentials, this.options);

    const $set: any = {
      updated_at: new Date(),
    };

    if (credentials.name) {
      $set.name = credentials.name;
    }

    if (credentials.username) {
      $set.username = credentials.username;

      if (credentials.username !== credentials.user.username) {
        $set.username_changed_at = new Date();
      }
    }

    if (credentials.img) {
      const base64_buffer: string[] = credentials.img.split(';base64,');
      const base64_type: string = base64_buffer[0];
      const base64_data: string = base64_buffer[1];

      const file_ext: string = base64_type.split('/')[1];
      const file_name: string = random() + '.' + file_ext;

      // File system integration

      // Delete previous image of the user
      const previous_img_parts: string[] = credentials.user.img.split('/');
      const previous_img_id: string =
        previous_img_parts[previous_img_parts.length - 1];
      fs.unlink('public/images/' + previous_img_id, function (err: any) {});

      // Write new base64 buffer to file asynchronously
      fs.writeFileSync('public/images/' + file_name, base64_data, {
        encoding: 'base64',
      });

      const img: string = config.ENV_URL_API + '/images/' + file_name;

      $set.img = img;
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

    if (credentials.neighbourhood) {
      $set.neighbourhood = credentials.neighbourhood;
    }

    if (credentials.address) {
      $set.address = credentials.address;
    }

    if (credentials.zip) {
      $set.zip = credentials.zip;
    }

    // update user credentials
    await this.options.db.users.updateOne(
      { _id: credentials.user._id },
      { $set: $set }
    );

    return $set;
  }

  async signup(credentials: any): Promise<any> {
    await this.validator.signup(credentials);

    const doc: any = await user_create_doc(credentials, this.options);

    const insert_one_result: InsertOneResult =
      await this.options.db.users.insertOne(doc);

    const sid: string = await user_create_session(
      {
        user_id: insert_one_result.insertedId,
        ip: credentials.ip,
        remember: credentials.remember,
      },
      this.options
    );

    doc._id = insert_one_result.insertedId;

    const profile = user_return_profile(doc);

    let expires: undefined | Date = undefined;
    if (credentials.remember) {
      expires = new Date(Date.now() + config.ENV_SESSION_LIFETIME_MS * 30);
    }

    const result: any = {
      profile: profile,
      email_verification_code: doc.email_verification_code,
      cookie_value: sid, // cookie value
      cookie_expires: expires, // cookie expires
    };

    return result;
  }

  async signin(credentials: any): Promise<any> {
    const user: Document = await this.validator.signin(credentials);

    const sid: string = await user_create_session(
      { user_id: user._id, ip: credentials.ip, remember: credentials.remember },
      this.options
    );

    const profile = user_return_profile(user);

    let expires: undefined | Date = undefined;
    if (credentials.remember) {
      expires = new Date(Date.now() + config.ENV_SESSION_LIFETIME_MS * 30);
    }

    const result = {
      profile: profile,
      cookie_value: sid,
      cookie_expires: expires,
    };

    return result;
  }

  async signout(credentials: any): Promise<boolean> {
    //await this.validator.signout(credentials);
    const result: number = await this.options.redis.hDel(
      'sessions',
      credentials.sid
    );

    return true;
  }

  async verify_email(code: string): Promise<any> {
    const user: Document = await this.validator.verify_email(
      code,
      this.options
    );

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
      }
    );

    user.email_verified = true;

    const profile = user_return_profile(user);

    return profile;
  }

  async reset_password(credentials: any): Promise<any> {
    const user: Document = await this.validator.reset_password(
      credentials,
      this.options
    );

    const code: string = await user_generate_password_reset_code(
      0,
      this.options
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
      }
    );

    // delete user sessions
    const sessions = await this.options.redis.hGetAll('sessions');
    for (const key in sessions) {
      if (JSON.parse(sessions[key]).user_id === user._id.toString()) {
        this.options.redis.hDel('sessions', key);
      }
    }

    const profile = user_return_profile(user);

    return profile;
  }

  async change_password(credentials: any): Promise<any> {
    await this.validator.change_password(credentials, this.options);

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
      }
    );

    const profile = user_return_profile(credentials.user);

    return profile;
  }

  async change_email(credentials: any): Promise<any> {
    await this.validator.change_email(credentials, this.options);

    const code: string = await user_generate_email_verification_code(
      config.time_one_hour_ms,
      this.options
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
      }
    );

    credentials.user.email = credentials.email;
    credentials.user.email_verified = false;

    const profile: any = user_return_profile(credentials.user);

    const result: any = {
      profile: profile,
      email_verification_code: code,
    };

    return result;
  }
}

export default service_user_init;
