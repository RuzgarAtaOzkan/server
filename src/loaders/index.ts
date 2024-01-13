'use strict';

// MODULES
import fs from 'fs';
import MongoClient, { ObjectId } from 'mongodb';
import crypto from 'node:crypto';
import axios from 'axios';

// INTERFACES
import { FastifyInstance } from 'fastify';
import options_i from 'interfaces/common';

// CONFIG
import config from '../config';

// LOADERS
import load_fastify from './fastify';
import load_mongodb from './mongodb';
import load_cron from './cron';
import load_redis from './redis';

async function load_server(): Promise<FastifyInstance> {
  // Dependency injections, you will carry that object throughout the whole program

  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
  }

  if (!fs.existsSync('public/images')) {
    fs.mkdirSync('public/images');
  }

  const options: options_i = {
    db: null,
    redis: null,
  };

  // ORDER OF LOADER COMPONENTS ARE IMPORTANT
  // LOADING COMPONENTS order has to be => 1. logger and redis functions 2. mongodb configurations 3. cron jobs initializations and fastify route binds

  await load_redis(options);
  console.info('Redis loaded...  ✅');

  // configure mongodb
  await load_mongodb(config.env.DB_CONN_STR, options);
  console.info('Mongodb loaded...  ✅');

  // We get the mongo client to pass in the fastify application loader to use in the routes
  // Load the Fastify App with the configured mongo client.
  const server: FastifyInstance = await load_fastify(options);
  console.info('Fastify loaded...  ✅');

  // Then initialize cron jobs and bind routes to fastify with the given configured mongodb object; options.db or options.db
  await load_cron(options);
  console.info('Cron jobs loaded...  ✅');

  return server;
}

export default load_server;
