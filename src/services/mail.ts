'use strict';

// MODULES
import nodemailer from 'nodemailer';

// INTERFACES
import { Document } from 'mongodb';
import { options_i } from 'interfaces/common';

// CONFIG
import config from '../config';

// UTILS
import {
  validator_mail_init,
  generate_email_verification_token,
  generate_password_reset_token,
  generate_html,
} from '../utils/services';

class service_mail_init {
  private readonly options: options_i;
  private readonly transporter: any;
  private readonly validator: any;

  constructor(options: any) {
    this.options = options;
    this.validator = new validator_mail_init(options);

    this.transporter = nodemailer.createTransport({
      //service: 'Gmail',
      host: config.env.EMAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: config.env.EMAIL_USERNAME,
        pass: config.env.EMAIL_PASSWORD,
      },
    });

    this.transporter.verify(function (err: any, success: any) {
      if (err) {
        /*throw err;*/
      }
    });
  }

  async send_verification_link(payload: any): Promise<void> {
    const user: Document = await this.validator.send_verification_link(
      payload,
      this.options
    );

    const endpoint: string = config.endpoints.auth_email_verify.split(':')[0];

    const link: string =
      'https://' + config.env.URL_UI + endpoint + payload.token;

    const html: string = generate_html('email-verify', {
      username: user.email,
      link,
    });

    const data: object = {
      from: config.env.EMAIL_USERNAME,
      to: payload.email, // to property represents the emails that will be sent emails to.
      subject:
        'Welcome to ' + config.env.URL_UI + ', Please Confirm your email',
      html,
    };

    this.transporter.sendMail(data);
  }

  // Generates an email verification token, update users email verification token in the database, sends the verification link to users email
  async resend_verification_link(email: string): Promise<void> {
    const user: Document = await this.validator.resend_verification_link(email);

    const endpoint: string = config.endpoints.auth_email_verify.split(':')[0];

    const token: string = await generate_email_verification_token(this.options);

    await this.options.db.users.updateOne(
      { email },
      {
        $set: {
          email_verification_token: token,
          email_verification_token_exp_at: new Date(
            Date.now() + config.times.one_day_ms
          ),
          updated_at: new Date(),
        },
      }
    );

    const link: string = 'https://' + config.env.URL_UI + endpoint + token;
    const html: string = generate_html('email-verify', {
      username: user.email,
      link,
    });

    const data: object = {
      from: config.env.EMAIL_USERNAME,
      to: email, // to property represents the emails that will be sent emails to.
      subject:
        'Welcome back, ' + config.env.URL_UI + ', Please Confirm your email',
      html,
    };

    this.transporter.sendMail(data);
  }

  // Generates a password reset token, updated users password reset token in the database, sends the reset link to users email
  async send_password_reset_link(email: string): Promise<void> {
    const user: Document = await this.validator.send_password_reset_link(email);

    const endpoint: string = config.endpoints.auth_password_reset.split(':')[0];

    const token: string = await generate_password_reset_token(this.options);

    await this.options.db.users.updateOne(
      { email: email },
      {
        $set: {
          password_reset_token: token,
          password_reset_token_exp_at: new Date(
            Date.now() + config.times.one_day_ms
          ),
          updated_at: new Date(),
        },
      }
    );

    const link: string = 'https://' + config.env.URL_UI + endpoint + token;
    const html: string = generate_html('password-reset', {
      username: user.email,
      link,
    });

    const data: object = {
      from: config.env.EMAIL_USERNAME,
      to: email, // to property represents the emails that will be sent emails to.
      subject: config.env.URL_UI + ' Password Reset',
      html,
    };

    this.transporter.sendMail(data);
  }
}

export default service_mail_init;
