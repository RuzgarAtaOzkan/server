'use strict';

// MODULES
import fs from 'node:fs';

// INTERFACES
import { FastifyInstance } from 'fastify';
import { options_i } from 'interfaces/common';

// CONFIG
import config from '../config';

// LOADERS
import load_redis from './redis';
import load_mongodb from './mongodb';
import load_fastify from './fastify';
import load_cron from './cron';
import load_socket from './socket';

async function load_server(): Promise<void> {
  // dependency injections, you will carry that object throughout the whole program
  const options: options_i = {
    db: null,
    redis: null,
    chats: new Array(0xffff), // 65535 (last 2 bytes of ObjectId in order document)
  };

  if (fs.existsSync('public') === false) {
    fs.mkdirSync('public');
  }

  if (fs.existsSync('public/images') === false) {
    fs.mkdirSync('public/images');
  }

  if (fs.existsSync('public/videos') === false) {
    fs.mkdirSync('public/videos');
  }

  // ORDER OF LOADER COMPONENTS ARE IMPORTANT
  // LOADING COMPONENTS order has to be => 1. logger and redis functions 2. mongodb configurations 3. cron jobs initializations and fastify route binds

  await load_redis(options);
  console.info(
    '[  \x1b[32mOK\x1b[0m  ] \x1b[1mRedis Client Connected and Configured.\x1b[0m'
  );

  // configure mongodb
  await load_mongodb(options);
  console.info(
    '[  \x1b[32mOK\x1b[0m  ] \x1b[1mMongoDB Client Connected and Configured.\x1b[0m'
  );

  // We get the mongo client to pass in the fastify application loader to use in the routes
  // Load the Fastify App with the configured mongo client.
  await load_fastify(options);
  console.info(
    `[  \x1b[32mOK\x1b[0m  ] \x1b[1mFastify Server (HTTP) Configured and Initialized. (PORT: \x1b[38;2;255;165;0m${config.ENV_PORT}\x1b[0m)`
  );

  await load_socket(options);
  console.info(
    `[  \x1b[32mOK\x1b[0m  ] \x1b[1mWeb Socket Server (WS) Initialized and Configured. (PORT: \x1b[38;2;255;165;0m${config.ENV_PORT_SOCKET}\x1b[0m)`
  );

  // Then initialize cron jobs and bind routes to fastify with the given configured mongodb object; options.db or options.db
  load_cron(options);
  console.info('[  \x1b[32mOK\x1b[0m  ] \x1b[1mCron Jobs Initialized.\x1b[0m');
}

export default load_server;
