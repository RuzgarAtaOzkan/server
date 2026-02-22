// CONFIG
import config from '../config';

import { Db, MongoClient } from 'mongodb';
import { WebSocket } from 'ws';
import { RedisClientType } from 'redis';

export interface options_i {
  db: any;
  redis: any;
  sockets: WebSocket[]; // [new WebSocket(solana), new WebSocket(ethereum)]
}
