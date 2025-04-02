'use strict';

// MODULES
import { Document, ObjectId } from 'mongodb';

// INTERFACES
import { options_i } from 'interfaces/common';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';

// CONFIG
import config from '../../config';

export async function validate_user(
  request: any,
  reply: FastifyReply,
  options: options_i
): Promise<Document | null> {
  request.user = undefined; // user must be undefined to overwrite any previous setting on the hooks pipeline

  const sid: string | undefined = request.cookies[config.ENV_SESSION_NAME];

  if (sid === undefined) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  const session: any | null = JSON.parse(
    await options.redis.hGet('sessions', sid)
  );

  if (session === null) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  if (session.ip !== request.ip) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  const user: Document | null = await options.db.users.findOne({
    _id: ObjectId.createFromHexString(session.user_id),
  });

  if (user === null) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  request.user = user;

  return user;
}

export async function validate_admin(
  request: any,
  reply: FastifyReply,
  options: options_i
): Promise<Document | null> {
  request.user = undefined; // user must be undefined to overwrite any previous setting on the hooks pipeline

  const sid: string | undefined = request.cookies[config.ENV_SESSION_NAME];

  if (sid === undefined) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  const session: any | null = JSON.parse(
    await options.redis.hGet('sessions', sid)
  );

  if (session === null) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  if (session.ip !== request.ip) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  const user: Document | null = await options.db.users.findOne({
    _id: ObjectId.createFromHexString(session.user_id),
  });

  if (user === null) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  if (
    user.role !== config.role_admin ||
    user.role_key !== config.ENV_ROLE_KEY_ADMIN
  ) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  request.user = user;

  return user;
}

export default {
  validate_user,
  validate_admin,
};
