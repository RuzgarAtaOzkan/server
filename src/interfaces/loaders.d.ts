// CONFIG
import config from '../config';

// INTERFACES
import { Db, MongoClient, ObjectId } from 'mongodb';
import { WebSocket } from 'ws';
import { RedisClientType } from 'redis';

// TYPES
import { blockchain_t } from 'types/config';

export interface options_i {
  db: any;
  redis: any;
  sockets: WebSocket[]; // [new WebSocket(solana), new WebSocket(ethereum)]
}

export interface redis_settings_i {
  exchange: object;
  blockchains: {
    id: blockchain_t;
    price: number;
    name: string;
    symbol: string;
    img: string;
    url_explorer: string;
  }[];
}

export interface redis_session_i {
  user_id: string;
  ip: string;
  remember: boolean;
  created_at: Date;
}
