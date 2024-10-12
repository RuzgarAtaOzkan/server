'use strict';

// MODULES
import { CronJob } from 'cron';
import axios from 'axios';
import nodemailer, { Transporter } from 'nodemailer';

// INTERFACES
import { options_i } from 'interfaces/common';
import { Document } from 'mongodb';
import { FastifyInstance } from 'fastify';

// CONFIG
import config from '../config';

async function admins_inspect(
  server: FastifyInstance,
  options: options_i
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: config.env.EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: config.env.EMAIL_USERNAME,
      pass: config.env.EMAIL_PASSWORD,
    },
  });

  const squery: object = { role: config.roles.admin };
  const admins: Document[] = await options.db.users.find(squery).toArray();

  if (admins.length > 1) {
    const user_list = admins.map((curr: Document, index: number) => {
      return (
        '<br>_id: ' +
        curr._id.toString() +
        '<br>username: ' +
        curr.username +
        '<br>email: ' +
        curr.email +
        '<br>============'
      );
    });

    const data: any = {
      from: config.env.EMAIL_USERNAME,
      to: 'uzayloncasi@gmail.com', // to property represents the emails that will be sent emails to.
      subject: config.env.DB_NAME + ' ADMIN ROLE BREACH!!!',
      html:
        config.env.DB_NAME +
        ' backend has been shutdown due to admin role breach. There are currently more than 1 admin in the system and requires immediate attention.<br><br> The users who have admin role are listed below.<br><br>' +
        user_list,
    };

    transporter.sendMail(data);

    setTimeout(function () {
      server.close();
    }, 3000);
  }
}

async function sessions_clear(options: options_i): Promise<void> {
  const sessions = await options.redis.hGetAll('sessions');

  for (const key in sessions) {
    const session: any = JSON.parse(sessions[key]);

    const expire_at: number =
      new Date(session.created_at).valueOf() +
      Number(config.env.SESSION_LIFETIME_MS);

    if (expire_at < Date.now()) {
      await options.redis.hDel('sessions', key);
    }
  }
}

async function load_cron(server: FastifyInstance, options: any): Promise<void> {
  // Every minute
  new CronJob('59 * * * * *', function () {
    admins_inspect(server, options);
  }).start();

  // Every hour
  new CronJob('00 59 * * * *', function () {
    sessions_clear(options);
  }).start();

  // Every midnight
  new CronJob('00 00 00 * * *', function () {}).start();
}

export default load_cron;
