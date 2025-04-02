import { Db, MongoClient } from 'mongodb';
import { RedisClientType } from 'redis';

export interface options_i {
  db: any;
  redis: any;
  chats: any[];
}
