'use strict';

// MODULES
import { CronJob } from 'cron';
import ImageKit from 'imagekit';
import axios from 'axios';
import nodemailer from 'nodemailer';

// CONFIG
import config from '../config';

// UTILS
import UTILS_LOADERS from '../utils/loaders';

async function load_cron(options: any): Promise<void> {
  const mail_transporter = nodemailer.createTransport({
    host: config.env.EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: config.env.EMAIL_NO_REPLY_USERNAME,
      pass: config.env.EMAIL_NO_REPLY_PASSWORD,
    },
  });

  const imagekit: ImageKit = new ImageKit({
    publicKey: config.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: config.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: `https://ik.imagekit.io/${config.env.IMAGEKIT_ID}/`,
  });

  // Every minute
  new CronJob('59 * * * * *', function () {
    UTILS_LOADERS.admins_inspect(mail_transporter, options);
  }).start();

  // Every hour
  new CronJob('00 59 * * * *', function () {}).start();

  // Every midnight
  new CronJob('00 00 00 * * *', function () {
    UTILS_LOADERS.sessions_clear(options);
    UTILS_LOADERS.imagekit_clear(imagekit, options);
  }).start();
}

export default load_cron;
