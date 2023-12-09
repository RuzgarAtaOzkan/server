import { Db } from 'mongodb';
import { RedisClientType } from 'redis';

export default interface options_i {
  db: any;
  redis: any;
}
