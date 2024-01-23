'use strict';

// MODULES

// INTERFACES
import { Document } from 'mongodb';
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
  sessions_clear,
};
