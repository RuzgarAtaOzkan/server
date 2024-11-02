'use strict';

// MODULES
import fs from 'fs';
import crypto from 'node:crypto';

// INTERFACES
import { Document, InsertOneResult, ObjectId } from 'mongodb';

// CONFIG
import config from '../config';

// UTILS
import {
  validator_auth_init,
  return_user_profile,
  generate_api_key,
  generate_email_verification_token,
  create_user_doc,
  create_session,
} from '../utils/services';
import { random } from '../utils/common';

class service_auth_init {
  private readonly options: any;
  private readonly validator: any;

  constructor(options: any) {
    this.options = options;
    this.validator = new validator_auth_init(options);
  }

  async get_profile(credentials: any): Promise<any | null> {
    if (!credentials.sid) {
      return null;
    }

    const session: any = JSON.parse(
      await this.options.redis.hGet('sessions', credentials.sid)
    );

    if (!session) {
      return null;
    }

    if (
      new Date(session.created_at).valueOf() + config.env.SESSION_LIFETIME_MS <
      Date.now()
    ) {
      await this.options.redis.hDel('sessions', credentials.sid);
      return null;
    }

    if (session.ip !== credentials.ip) {
      return null;
    }

    const user: Document = await this.options.db.users.findOne({
      _id: new ObjectId(session.user_id),
    });

    if (!user) {
      return null;
    }

    const profile = return_user_profile(user);
    return profile;
  }

  async edit_profile(credentials: any): Promise<any> {
    await this.validator.edit_profile(credentials, this.options);

    let username_changed_at: Date = credentials.user.username_changed_at;
    if (
      credentials.username &&
      credentials.username !== credentials.user.username
    ) {
      username_changed_at = new Date();
    }

    let img: string = '';
    if (credentials.img_base64) {
      const base64_buffer: string[] = credentials.img_base64.split(';base64,');
      const base64_type: string = base64_buffer[0];
      const base64_data: string = base64_buffer[1];

      const file_ext: string = base64_type.split('/')[1];
      const file_name: string = random({ length: 32 }) + '.' + file_ext;

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

      img = 'https://' + config.env.URL_API + '/images/' + file_name;
    }

    let api_key: string = '';
    if (credentials.api_key) {
      api_key = await generate_api_key(this.options);
    }

    // update user credentials
    await this.options.db.users.updateOne(
      { _id: credentials.user._id },
      {
        $set: {
          name: credentials.name || credentials.user.name,
          username: credentials.username || credentials.user.username,
          username_changed_at: username_changed_at,

          //phone: credentials.phone || credentials.user.phone,
          img: img || credentials.user.img,
          api_key: api_key || credentials.user.api_key,
          wallet_address:
            credentials.wallet_address || credentials.user.wallet_address,

          updated_at: new Date(),
        },
      }
    );

    credentials.user.name = credentials.name || credentials.user.name;
    credentials.user.username =
      credentials.username || credentials.user.username;
    credentials.user.phone = credentials.phone || credentials.user.phone;
    credentials.user.img = img || credentials.user.img;
    credentials.user.api_key = api_key || credentials.user.api_key;

    // create client user to send it back to client to see the updated values.
    const profile = return_user_profile(credentials.user);

    return profile;
  }

  async signup(credentials: any): Promise<any> {
    await this.validator.signup(credentials);

    const doc = await create_user_doc(credentials, this.options);

    const insert_one_result: InsertOneResult =
      await this.options.db.users.insertOne(doc);

    const sid: string = await create_session(
      { user_id: insert_one_result.insertedId, ip: credentials.ip },
      this.options
    );

    doc._id = insert_one_result.insertedId;

    const profile = return_user_profile(doc);

    const result: any = {
      profile: profile,
      sid: sid,
      email_verification_token: doc.email_verification_token,
    };

    return result;
  }

  async signin(credentials: any): Promise<any> {
    const user: Document = await this.validator.signin(credentials);

    const sid: string = await create_session(
      { user_id: user._id, ip: credentials.ip },
      this.options
    );

    const profile = return_user_profile(user);
    const result = { profile: profile, sid };

    return result;
  }

  async signout(credentials: any): Promise<void> {
    //await this.validator.signout(credentials);
    await this.options.redis.hDel('sessions', credentials.sid);
  }

  async verify_email(token: string): Promise<any> {
    const user = await this.validator.verify_email(token, this.options);

    await this.options.db.users.updateOne(
      { _id: user._id },
      {
        $set: {
          email_verified: true,
          email_verification_token: null,
          updated_at: new Date(),
        },
      }
    );

    user.email_verified = true;

    const profile = return_user_profile(user);

    return profile;
  }

  async reset_password(credentials: any): Promise<any> {
    await this.validator.reset_password(credentials, this.options);

    const user: any = await this.options.db.users.findOne({
      password_reset_token: credentials.token,
    });

    await this.options.db.users.updateOne(
      { password_reset_token: credentials.token },
      {
        $set: {
          password: crypto
            .createHash('sha256')
            .update(credentials.password)
            .digest('hex'),
          password_reset_token: null,
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

    const profile = return_user_profile(user);

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
            .update(credentials.new_password)
            .digest('hex'),
          updated_at: new Date(),
        },
      }
    );

    const profile = return_user_profile(credentials.user);

    return profile;
  }

  async change_email(credentials: any): Promise<any> {
    await this.validator.change_email(credentials, this.options);

    const email_verification_token: string =
      await generate_email_verification_token(this.options);

    await this.options.db.users.updateOne(
      { _id: credentials.user._id },
      {
        $set: {
          email: credentials.email,
          email_verification_token: email_verification_token,
          email_verification_token_exp_at: new Date(
            Date.now() + config.times.one_day_ms
          ),
          email_verified: false,
          updated_at: new Date(),
        },
      }
    );

    credentials.user.email = credentials.email;
    credentials.user.email_verified = false;

    const profile: any = return_user_profile(credentials.user);

    const result: any = {
      profile,
      email_verification_token,
    };

    return result;
  }
}

export default service_auth_init;
