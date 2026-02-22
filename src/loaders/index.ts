'use strict';

// INTERFACES
import { FastifyInstance } from 'fastify';
import { MongoClient } from 'mongodb';
import { RedisClientType } from 'redis';
import { options_i } from 'interfaces/common';

// CONFIG
import config from '../config';

// LOADERS
import load_redis from './redis';
import load_mongodb from './mongodb';
import load_socket from './socket';
import load_cron from './cron';
import load_fastify from './fastify';

export async function init(): Promise<void> {
  // global pointer* object of the system for dependency injections, you will carry that object throughout the whole program
  const options: options_i = {
    db: null,
    redis: null,
    sockets: [], // blockchain client sockets
  };

  // ORDER OF LOADER COMPONENTS ARE IMPORTANT
  // LOADING COMPONENTS order has to be => 1. logger and redis functions 2. mongodb configurations 3. cron jobs initializations and fastify route binds

  const redis: RedisClientType = await load_redis(options);
  console.info(
    '[  \x1b[32mOK\x1b[0m  ] \x1b[1mRedis client connected and configured\x1b[0m',
  );

  // configure mongodb
  const mongodb: MongoClient = await load_mongodb(options);
  console.info(
    '[  \x1b[32mOK\x1b[0m  ] \x1b[1mMongoDB client connected and configured\x1b[0m',
  );

  await load_socket(options);
  console.info(
    `[  \x1b[32mOK\x1b[0m  ] \x1b[1mWeb socket clients initialized and configured\x1b[0m`,
  );

  // then initialize cron jobs and bind routes to fastify with the given configured mongodb object; options.db or options.db
  // TODO: clear cron jobs and wait for them to finish on SIGTERM & SIGINT, otherwise wallet status updates can cut in half which is a critical error
  const cron = await load_cron(options);
  console.info('[  \x1b[32mOK\x1b[0m  ] \x1b[1mCron jobs initialized\x1b[0m');

  // we get the mongo client to pass in the fastify application loader to use in the routes
  // load the Fastify App with the configured mongo client.
  const server: FastifyInstance = await load_fastify(options);
  console.info(
    `[  \x1b[32mOK\x1b[0m  ] \x1b[1mFastify server configured and initialized (PORT: \x1b[38;2;255;165;0m${config.ENV_PORT}\x1b[0m)`,
  );

  // IMPORTANT: stop accepting new requests and wait for the ongoing ones to finish before exiting the process. Super important for the scenarios such as: systemctl restart server, otherwise the user's requests, mongodb writes, redis processes can cut in halfway which is a nightmare

  process.on('SIGTERM', async function () {
    // wait for the users to finish their requests (db writes, other async)
    await Promise.all([server.close(), cron.close()]);
    await Promise.all([mongodb.close(), redis.quit()]);

    process.exit(0);
  });

  process.on('SIGINT', async function () {
    // wait for the users to finish their requests (db writes, other async)
    await Promise.all([server.close(), cron.close()]);
    await Promise.all([mongodb.close(), redis.quit()]);

    process.exit(0);
  });
}

export default init;
