'use strict';

// MODULES
import ImageKit from 'imagekit';

// INTERFACES
import { Document } from 'mongodb';
import { FileObject } from 'imagekit/dist/libs/interfaces';
import { Transporter } from 'nodemailer';
import options_i from 'interfaces/common';

// CONFIG
import config from '../config';

export async function admins_inspect(
  transporter: Transporter,
  options: options_i
): Promise<void> {
  const squery: object = { role: config.roles.admin };

  const admins: Document[] = await options.db.users.find(squery).toArray();

  if (admins.length > 3) {
    const users_data = admins.map((curr: Document, index: number) => {
      return (
        '<br>_id: ' +
        curr._id.toString() +
        '<br>username: ' +
        curr.username +
        '<br>============'
      );
    });

    const data: any = {
      from: config.env.EMAIL_NO_REPLY_USERNAME,
      to: 'ruzgarataozkan@gmail.com', // to property represents the emails that will be sent emails to.
      subject: 'ADMIN ROLE BREACH!!!',
      html:
        config.env.DB_NAME +
        ' backend has been shutdown due to admin role breach. There are currently more than 1 admin in the system and requires immediate attention.<br><br> The users who have admin role are listed below.<br><br>' +
        users_data,
    };

    transporter.sendMail(data);

    data.to = 'utkutez@gmail.com';

    transporter.sendMail(data);

    setTimeout(async () => {
      //await options.server.close();
    }, 3000);
  }
}

export async function imagekit_clear(
  imagekit: ImageKit,
  options: options_i
): Promise<void> {
  const files: FileObject[] = await imagekit.listFiles({});
  const files_delete: any[] = [];

  for (let i: number = 0; i < files.length; i++) {
    // users search
    let exists: boolean = false;

    const users: Document[] = await options.db.users.find({}).toArray();
    for (let j: number = 0; j < users.length; j++) {
      if (files[i].url === users[j].img) {
        exists = true;
      }
    }

    const stores: Document[] = await options.db.stores.find({}).toArray();
    for (let j: number = 0; j < stores.length; j++) {
      if (files[i].url === stores[j].img) {
        exists = true;
      }
    }

    // settings redis search
    const settings = JSON.parse(await options.redis.get('settings'));
    for (let j: number = 0; j < settings.banners.length; j++) {
      if (files[i].url === settings.banners[j].img) {
        exists = true;
      }
    }

    for (let j: number = 0; j < settings.campaigns.length; j++) {
      if (files[i].url === settings.campaigns[j].img) {
        exists = true;
      }
    }

    for (let j: number = 0; j < settings.notifications.length; j++) {
      if (files[i].url === settings.notifications[j].img) {
        exists = true;
      }
    }

    const products = await options.redis.hGetAll('products');
    for (const key in products) {
      const product = JSON.parse(products[key]);

      for (let j: number = 0; j < product.img.length; j++) {
        if (files[i].url === product.img[j]) {
          exists = true;
        }
      }
    }

    if (!exists) {
      files_delete.push(files[i]);
    }
  }

  for (let i: number = 0; i < files_delete.length; i++) {
    await imagekit.deleteFile(files_delete[i].fileId);
  }
}

export async function sessions_clear(options: options_i): Promise<void> {
  const sessions = await options.redis.hGetAll('sessions');

  for (const key in sessions) {
    const session: string[] = sessions[key].split('_');
    const session_user_id: string = session[0];
    const session_ip: string = session[1];
    const session_created_at: string = session[2];

    const expire_at: number =
      Number(session_created_at) + Number(config.env.SESSION_LIFETIME_MS);

    if (expire_at < Date.now()) {
      await options.redis.hDel('sessions', key);
    }
  }
}

export default {
  admins_inspect,
  imagekit_clear,
  sessions_clear,
};
