'use strict';

// MODULES
import { ObjectId } from 'mongodb';
import validator from 'validator';

// INTERFACES
import { Document } from 'mongodb';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { options_i } from 'interfaces/common';
import { redis_session_i } from 'interfaces/loaders';

// CONFIG
import config from '../../config';

export async function validate_user(
  request: FastifyRequest | any,
  reply: FastifyReply,
  options: options_i,
): Promise<Document | null> {
  const sid: string | undefined = request.cookies[config.ENV_COOKIE_NAME];
  const user_agent: string = request.headers['user-agent'];

  if (sid === undefined) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  if (typeof sid !== config.type_string) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  if (sid.length > 128) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  if (validator.isAlphanumeric(sid) === false) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  const session: redis_session_i | null = JSON.parse(
    await options.redis.GET('session:' + sid),
  );

  if (session === null) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  if (session.ip !== request.ip) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  if (typeof user_agent !== config.type_string) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  if (user_agent.length > 128) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  if (
    /^[ \/\-\[\]!#$%&'*+.^`|~=?{}:;_a-zA-Z0-9]*$/.test(user_agent) === false
  ) {
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

  request.user = user; // bind the user to the request object

  return user;
}

export async function validate_admin(
  request: FastifyRequest | any,
  reply: FastifyReply,
  options: options_i,
): Promise<Document | null> {
  const sid: string | undefined = request.cookies[config.ENV_COOKIE_NAME];
  const user_agent: string = request.headers['user-agent'];

  if (sid === undefined) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  if (typeof sid !== config.type_string) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  if (sid.length > 128) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  if (validator.isAlphanumeric(sid) === false) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  const session: redis_session_i | null = JSON.parse(
    await options.redis.GET('session:' + sid),
  );

  if (session === null) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  if (session.ip !== request.ip) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  if (typeof user_agent !== config.type_string) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  if (user_agent.length > 128) {
    reply.status(401).send('ERR_UNAUTHORIZED');
    return null;
  }

  if (
    /^[ \/\-\[\]!#$%&'*+.^`|~=?{}:;_a-zA-Z0-9]*$/.test(user_agent) === false
  ) {
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

  request.user = user; // bind the user to the request object

  return user;
}

export default {
  validate_user,
  validate_admin,
};
