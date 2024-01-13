'use strict';

// MODULES
import nodemailer from 'nodemailer';

// INTERFACES
import { Document } from 'mongodb';
import options_i from 'interfaces/common';

// CONFIG
import config from '../config';

// UTILS
import UTILS_SERVICES from '../utils/services';

class service_mail_init {
  private options: options_i;
  private transporter: any;
  private validator: any;

  constructor(options: any) {
    this.options = options;
    this.validator = new UTILS_SERVICES.validator_mail_init(options);

    this.transporter = nodemailer.createTransport({
      host: config.env.EMAIL_HOST,
      port: 587, //465,
      secure: false,
      auth: {
        user: config.env.EMAIL_NO_REPLY_USERNAME,
        pass: config.env.EMAIL_NO_REPLY_PASSWORD,
      },
      tls: {
        ciphers: 'SSLv3',
      },
    });

    this.transporter.verify(function (err: any, success: any) {
      if (err) {
        //throw err;
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
      'https://profile.' + config.env.URL_UI + endpoint + payload.token;

    const html: string = UTILS_SERVICES.generate_html('email-verify', {
      username: user.email,
      link,
    });

    const data: object = {
      from: config.env.EMAIL_NO_REPLY_USERNAME,
      to: payload.email, // to property represents the emails that will be sent emails to.
      subject:
        'Welcome to ' + config.env.URL_UI + ', Please Confirm your email',
      html,
    };

    this.transporter.sendMail(data);
  }

  // Generates an email verification token, update users email verification token in the database, sends the verification link to users email
  async resend_verification_link(email: string): Promise<void> {
    const user: Document = await this.validator.resend_verification_link(
      email,
      this.options
    );

    const endpoint: string = config.endpoints.auth_email_verify.split(':')[0];

    const token: string =
      await UTILS_SERVICES.generate_email_verification_token(this.options);

    await this.options.db.users.updateOne(
      { email },
      {
        $set: {
          email_verification_token: token,
          email_verification_token_exp_at: new Date(
            Date.now() + config.times.one_hour_ms * 24
          ),
          updated_at: new Date(),
        },
      }
    );

    const link: string =
      'https://profile.' + config.env.URL_UI + endpoint + token;
    const html: string = UTILS_SERVICES.generate_html('email-verify', {
      username: user.email,
      link,
    });

    const data: object = {
      from: config.env.EMAIL_NO_REPLY_USERNAME,
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
    const token: string = await UTILS_SERVICES.generate_password_reset_token(
      this.options
    );

    await this.options.db.users.updateOne(
      { email: email },
      {
        $set: {
          password_reset_token: token,
          password_reset_token_exp_at: new Date(
            Date.now() + config.times.one_hour_ms * 1
          ),
          updated_at: new Date(),
        },
      }
    );

    const link: string =
      'https://profile.' + config.env.URL_UI + endpoint + token;
    const html: string = UTILS_SERVICES.generate_html('password-reset', {
      username: user.email,
      link,
    });

    const data: object = {
      from: config.env.EMAIL_NO_REPLY_USERNAME,
      to: email, // to property represents the emails that will be sent emails to.
      subject: config.env.URL_UI + ' Password Reset',
      html,
    };

    this.transporter.sendMail(data);
  }

  async send_emails(credentials: any): Promise<void> {
    for (let i: number = 0; i < credentials.emails.length; i++) {
      const data: object = {
        from: credentials.from || config.env.EMAIL_NO_REPLY_USERNAME,
        to: credentials.emails[i], // to property represents the emails that will be sent emails to.
        subject: credentials.subject,
        html: credentials.html,
      };

      this.transporter.sendMail(data);
    }
  }

  async add_subscription_email(credentials: any): Promise<Document> {
    await this.validator.add_subscription_email(credentials);
    const doc = UTILS_SERVICES.create_subscription_email_doc(credentials);
    const result = await this.options.db.emails.insertOne(doc);

    return doc;
  }
}

export default service_mail_init;
