'use strict';

// MODULES
import nodemailer, { Transporter } from 'nodemailer';

// INTERFACES
import { Document } from 'mongodb';
import { options_i } from 'interfaces/common';

// CONFIG
import config from '../config';

// UTILS
import {
  mail_validator_init,
  mail_generate_html,
  user_generate_email_verification_code,
  user_generate_password_reset_code,
} from '../utils/services';

class service_mail_init {
  private readonly options: options_i;
  private readonly transporter: Transporter;
  private readonly validator: any;

  constructor(options: any) {
    this.options = options;
    this.validator = new mail_validator_init(options);

    this.transporter = nodemailer.createTransport({
      //service: 'Gmail',
      host: config.ENV_EMAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: config.ENV_EMAIL_USERNAME,
        pass: config.ENV_EMAIL_PASSWORD,
      },
    });

    this.transporter.verify(function (err: any, success: any) {
      if (err) {
        // TODO: enable error throw on email signin fail
        // throw err;
      }
    });
  }

  async send_verification_link(credentials: any): Promise<void> {
    const user: Document = await this.validator.send_verification_link(
      credentials,
      this.options
    );

    const endpoint: string =
      config.endpoint_user_email_verify.split(':')[0] + credentials.code;

    const link: string = config.ENV_URL_UI + endpoint;
    const html: string = mail_generate_html('email-verify', {
      username: user.email,
      link,
    });

    const data: object = {
      from: config.ENV_EMAIL_USERNAME,
      to: credentials.email,
      subject: config.ENV_URL_UI,
      html,
    };

    await this.transporter.sendMail(data);
  }

  // generates an email verification code, update users email verification code in the database, sends the verification link to users email
  async resend_verification_link(credentials: any): Promise<void> {
    const user: Document = await this.validator.resend_verification_link(
      credentials
    );

    const code: string = await user_generate_email_verification_code(
      config.time_one_hour_ms,
      this.options
    );

    const endpoint: string =
      config.endpoint_user_email_verify.split(':')[0] + code;

    await this.options.db.users.updateOne(
      { email: credentials.email },
      {
        $set: {
          email_verification_code: code,
          updated_at: new Date(),
        },
      }
    );

    const link: string = config.ENV_URL_UI + endpoint;
    const html: string = mail_generate_html('email-verify', {
      username: user.email,
      link,
    });

    const data: object = {
      from: config.ENV_EMAIL_USERNAME,
      to: credentials.email,
      subject: config.ENV_URL_UI,
      html,
    };

    await this.transporter.sendMail(data);
  }

  // generates a password reset code, updated users password reset code in the database, sends the reset link to users email
  async send_password_reset_link(credentials: any): Promise<void> {
    const user: Document = await this.validator.send_password_reset_link(
      credentials
    );

    const code: string = await user_generate_password_reset_code(
      config.time_one_hour_ms,
      this.options
    );

    const endpoint: string =
      config.endpoint_user_password_reset.split(':')[0] + code;

    await this.options.db.users.updateOne(
      { email: credentials.email },
      {
        $set: {
          password_reset_code: code,
          updated_at: new Date(),
        },
      }
    );

    const link: string = config.ENV_URL_UI + endpoint;
    const html: string = mail_generate_html('password-reset', {
      username: user.email,
      link,
    });

    const data: object = {
      from: config.ENV_EMAIL_USERNAME,
      to: credentials.email,
      subject: config.ENV_URL_UI,
      html,
    };

    await this.transporter.sendMail(data);
  }
}

export default service_mail_init;
