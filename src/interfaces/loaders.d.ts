// INTERFACES
import { WebSocket } from 'ws';
import { MongoClient } from 'mongodb';
import { RedisClientType } from 'redis';

// TYPES
import { blockchain_t } from 'types/config';

export interface options_i {
  db: MongoClient | any;
  redis: RedisClientType | any;
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
  readonly user_id: string;
  readonly ip: string;
  readonly remember: boolean;
  created_at: Date;
}

export interface redis_sessions_i {}
