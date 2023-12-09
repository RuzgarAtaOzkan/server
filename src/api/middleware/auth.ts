'use strict';

// MODULES
import { Document, ObjectId } from 'mongodb';

// CONFIG
import config from '../../config';

export async function is_admin(request: any, options: any): Promise<boolean> {
  if (!request.cookies) {
    return false;
  }

  if (!request.cookies[config.env.SESSION_NAME]) {
    return false;
  }

  const session: string = await options.redis.hGet(
    'sessions',
    request.cookies[config.env.SESSION_NAME]
  );

  if (!session) {
    return false;
  }

  const session_parts: string[] = session.split('_');

  const session_user_id: string = session_parts[0];
  const session_ip: string = session_parts[1];
  const session_created_at: string = session_parts[2];

  if (
    Number(session_created_at) + config.env.SESSION_LIFETIME_MS <
    Date.now()
  ) {
    await options.redis.hDel(
      'sessions',
      request.cookies[config.env.SESSION_NAME]
    );

    return false;
  }

  if (session_ip !== request.ip) {
    return false;
  }

  const user: Document | null = await options.db.users.findOne({
    _id: new ObjectId(session_user_id),
  });

  if (!user) {
    return false;
  }

  if (
    user.role !== config.roles.admin ||
    user.permission !== config.env.PERM_ADMIN
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

  const session: string | null = await options.redis.hGet('sessions', sid);

  if (!session) {
    return false;
  }

  const sparts: string[] = session.split('_');

  const session_user_id: string = sparts[0];
  const session_ip: string = sparts[1];
  const session_time: string = sparts[2];

  if (Number(session_time) + config.env.SESSION_LIFETIME_MS < Date.now()) {
    await options.redis.hDel(
      'sessions',
      request.cookies[config.env.SESSION_NAME]
    );

    return false;
  }

  if (session_ip !== request.ip) {
    return false;
  }

  const promises = await Promise.all([
    options.db.users.findOne({ _id: new ObjectId(session_user_id) }),
  ]);

  // check parallel if the current authenticated user has premium subscription
  // options.db.premiums.findOne({ user_id: new ObjectId(user_id) })

  if (!promises) {
    return false;
  }

  const user: Document = promises[0];
  //const premium_doc: Document = promises[1];

  if (!user) {
    return false;
  }

  /*
  if (premium_doc && premium_doc.expire_at.valueOf() > Date.now() && premium_doc.status === 2) {
    user_doc.premium = true;
  }
  */

  // IMPORTANT DEPENDENCY ON MANY ROUTE ENTRANCE
  request.user = user;

  return true;
}

export async function is_premium(request: any, options: any): Promise<boolean> {
  if (!request.cookies) {
    return false;
  }

  const sid: string | null = request.cookies[config.env.SESSION_NAME];

  if (!sid) {
    return false;
  }

  const session: string = await options.redis.hGet('sessions', sid);

  if (!session) {
    return false;
  }

  const session_parts: string[] = session.split('_');
  const user_id: string = session_parts[0];
  const ip: string = session_parts[1];
  const time: string = session_parts[2];

  if (Number(time) + config.env.SESSION_LIFETIME_MS < Date.now()) {
    return false;
  }

  if (ip !== request.ip) {
    return false;
  }

  const promises = await Promise.all([
    options.db.users.findOne({ _id: new ObjectId(user_id) }),
  ]); // options.db.premiums.findOne({ userId: new ObjectId(user_id) })

  if (!promises) {
    return false;
  }

  const user: Document = promises[0];
  //const premium: Document = promises[1];

  if (!user) {
    return false;
  }

  request.user = user;

  return true;
}

export default {
  is_admin,
  is_auth,
  is_premium,
};
