'use strict';

// MODULES
import { Document, ObjectId } from 'mongodb';

// CONFIG
import config from '../../config';

export async function is_admin(request: any, options: any): Promise<boolean> {
  if (!request.cookies) {
    return false;
  }

  const sid: string | null = request.cookies[config.env.SESSION_NAME];

  if (!sid) {
    return false;
  }

  const session: any = JSON.parse(await options.redis.hGet('sessions', sid));

  if (!session) {
    return false;
  }

  if (
    new Date(session.created_at).valueOf() + config.env.SESSION_LIFETIME_MS <
    Date.now()
  ) {
    await options.redis.hDel('sessions', sid);

    return false;
  }

  if (session.ip !== request.ip) {
    return false;
  }

  const user: Document | null = await options.db.users.findOne({
    _id: new ObjectId(session.user_id),
  });

  if (!user) {
    return false;
  }

  if (
    user.role !== config.roles.admin ||
    user.role_key !== config.env.ROLE_KEY_ADMIN
  ) {
    return false;
  }

  request.user = user;

  return true;
}

export async function is_auth(request: any, options: any): Promise<boolean> {
  if (!request.cookies) {
    return false;
  }

  const sid: string | null = request.cookies[config.env.SESSION_NAME];

  if (!sid) {
    return false;
  }

  const session: any = JSON.parse(await options.redis.hGet('sessions', sid));

  if (!session) {
    return false;
  }

  if (
    new Date(session.created_at).valueOf() + config.env.SESSION_LIFETIME_MS <
    Date.now()
  ) {
    options.redis.hDel('sessions', sid);

    return false;
  }

  if (session.ip !== request.ip) {
    return false;
  }

  const user: Document | null = await options.db.users.findOne({
    _id: new ObjectId(session.user_id),
  });

  if (!user) {
    return false;
  }

  // IMPORTANT DEPENDENCY ON MANY ROUTE ENTRANCE
  request.user = user;

  return true;
}

export default {
  is_admin,
  is_auth,
};
