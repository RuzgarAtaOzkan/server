'use strict';

// MODULES
import fs from 'fs';
import crypto from 'node:crypto';

// INTERFACES
import { Document, InsertOneResult, ObjectId } from 'mongodb';

// CONFIG
import config from '../config';

// UTILS
import UTILS_SERVICES from '../utils/services';
import UTILS_COMMON from '../utils/common';

class service_auth_init {
  private options: any;
  private validator: any;

  constructor(options: any) {
    this.options = options;

    this.validator = new UTILS_SERVICES.validator_auth_init(options);
  }

  async get_profile(credentials: any): Promise<any | null> {
    if (!credentials.sid) {
      return null;
    }

    const session: string | null = await this.options.redis.hGet(
      'sessions',
      credentials.sid
    );

    if (!session) {
      return null;
    }

    const sparts: string[] = session.split('_');
    const session_user_id: string = sparts[0];
    const session_ip: string = sparts[1];
    const session_time: string = sparts[2];

    if (Number(session_time) + config.env.SESSION_LIFETIME_MS < Date.now()) {
      await this.options.redis.hDel('sessions', credentials.sid);
      return null;
    }

    if (session_ip !== credentials.ip) {
      return null;
    }

    const user: Document = await this.options.db.users.findOne({
      _id: new ObjectId(session_user_id),
    });

    if (!user) {
      return null;
    }

    const profile = UTILS_SERVICES.return_user_profile(user);
    return profile;
  }

  async edit_profile(credentials: any): Promise<any> {
    await this.validator.edit_profile(credentials, this.options);

    let image_url: string = '';
    if (credentials.img_base64) {
      const base64_buffer: string[] = credentials.img_base64.split(';base64,');
      const base64_type: string = base64_buffer[0];
      const base64_data: string = base64_buffer[1];

      const file_ext: string = base64_type.split('/')[1];
      const file_name: string =
        UTILS_COMMON.random({ length: 32 }) + '.' + file_ext;

      // File system integration

      // Delete previous image of the user
      const previous_img_parts: string[] = credentials.user.img.split('/');
      const previous_img_id: string =
        previous_img_parts[previous_img_parts.length - 1];
      fs.unlink('public/images/' + previous_img_id, function (err: any) {});

      // Write new base64 buffer to file asynchronously
      fs.writeFile(
        'public/images/' + file_name,
        base64_data,
        { encoding: 'base64' },
        function (err: any) {}
      );

      image_url = config.env.URL_API + '/public/images/' + file_name;
    }

    // update user credentials
    await this.options.db.users.updateOne(
      { _id: credentials.user._id },
      {
        $set: {
          name: credentials.name,
          username: credentials.username,

          username_changed_at:
            credentials.username !== credentials.user.username
              ? new Date()
              : credentials.user.username_changed_at,

          phone: credentials.phone,

          img: image_url ? image_url : credentials.user.img,

          favs: credentials.favs,
        },
      }
    );

    credentials.user.name = credentials.name;
    credentials.user.username = credentials.username;
    credentials.user.phone = credentials.phone;
    credentials.user.img = image_url ? image_url : credentials.user.img;
    credentials.user.favs = credentials.favs;

    // create client user to send it back to client to see the updated values.
    const profile = UTILS_SERVICES.return_user_profile(credentials.user);

    return profile;
  }

  async signup(credentials: any): Promise<any> {
    await this.validator.signup(credentials);

    const doc = await UTILS_SERVICES.create_user_doc(credentials, this.options);

    const insert_one_result: InsertOneResult =
      await this.options.db.users.insertOne(doc);

    const sid: string = await UTILS_SERVICES.create_session(
      { user_id: insert_one_result.insertedId, ip: credentials.ip },
      this.options
    );

    const profile = UTILS_SERVICES.return_user_profile({
      ...doc,
      _id: insert_one_result.insertedId,
    });

    const result = {
      user: profile,
      sid: sid,
      email_verification_token: doc.email_verification_token,
    };

    return result;
  }

  async signin(credentials: any): Promise<any> {
    const user: Document = await this.validator.signin(credentials);

    const sid: string = await UTILS_SERVICES.create_session(
      { user_id: user._id, ip: credentials.ip },
      this.options
    );

    const profile = UTILS_SERVICES.return_user_profile(user);
    const result = { user: profile, sid };
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
          email_verification_token_exp_at: null,
          updated_at: new Date(),
        },
      }
    );

    user.email_verified = true;

    const profile = UTILS_SERVICES.return_user_profile(user);

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
          password_reset_token_exp_at: null,
          updated_at: new Date(),
        },
      }
    );

    // Delete user sessions
    const sessions = await this.options.redis.hGetAll('sessions');
    for (const key in sessions) {
      if (sessions[key].includes(user._id.toString())) {
        this.options.redis.hDel('sessions', key);
      }
    }

    const profile = UTILS_SERVICES.return_user_profile(user);

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

    const profile = UTILS_SERVICES.return_user_profile(credentials.user);

    return profile;
  }

  async change_email(credentials: any): Promise<any> {
    await this.validator.change_email(credentials, this.options);

    const email_verification_token: string =
      await UTILS_SERVICES.generate_email_verification_token(this.options);

    await this.options.db.users.updateOne(
      { _id: credentials.user._id },
      {
        $set: {
          email: credentials.email,
          email_verification_token: email_verification_token,
          email_verification_token_exp_at: new Date(
            Date.now() + config.times.one_hour_ms * 24
          ),
          email_verified: false,
          updated_at: new Date(),
        },
      }
    );

    await this.options.services.mail.send_verification_link({
      email: credentials.email,
      token: email_verification_token,
    });

    credentials.user.email = credentials.email;
    credentials.user.email_verified = false;

    const profile = UTILS_SERVICES.return_user_profile(credentials.user);

    return profile;
  }
}

export default service_auth_init;
