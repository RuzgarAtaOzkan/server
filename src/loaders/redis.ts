'use strict';

// MODULES
import { createClient } from 'redis';

// INTERFACES
import { RedisClientType } from 'redis';
import { options_i } from 'interfaces/loaders';
import { redis_settings_i, redis_session_i } from 'interfaces/loaders';

// CONFIG
import config from '../config';

export async function load_redis(options: options_i): Promise<RedisClientType> {
  /**
   * All Redis hashes:
   *
   * - "settings" => String
   * - "session:{sid}" => String
   * - "sessions:{user_id}" => List
   */

  // provide a different IP address if you want to  connect to a different
  //  machine, to scale in the future, we would want to have a single redis source to do things like setting limit in sessions count or other atomic stuff,
  //  that is only achievable with a single source of redis service instance
  const client: RedisClientType = createClient({
    url: config.ENV_REDIS_URL,
  });

  client.on('error', (err: any) => {
    console.info(
      `[  \x1b[31mERR\x1b[0m  ] Redis ${err.code} (PORT: \x1b[38;2;255;165;0m${err.port}\x1b[0m)\n`,
    );
    console.info('            DEBUG: \x1b[1msystemctl status redis\x1b[0m\n');

    process.exit(1);
  });

  // redis configuration
  //await client.configSet('hz', '1');

  // connection
  await client.connect();

  // clean up
  await client.FLUSHDB();
  await client.FLUSHALL();

  const blockchains = [];
  for (let i: number = 0; i < config.blockchains.length; i++) {
    blockchains.push({
      id: config.blockchains[i].id,
      price: 0,
      name: config.blockchains[i].coin_name,
      symbol: config.blockchains[i].coin_symbol,
      img: config.blockchains[i].coin_img,
      url_explorer: config.blockchains[i].url_explorer,
    });
  }

  // TODO: configure the initial settings values
  const settings: redis_settings_i = {
    exchange: { USD: 1, AED: 3.6725, EUR: 0.8934, TRY: 50.34 }, // doviz burosu
    blockchains: blockchains,
  };

  // validate redis properties
  for (let i: number = 0; i < settings.blockchains.length; i++) {
    if (typeof settings.blockchains[i].price !== config.type_number) {
      throw 'REDIS: INVALID PRICE ' + settings.blockchains[i].id.toUpperCase();
    }
  }

  await client.SET('settings', JSON.stringify(settings));

  /**
   * @Sample user session
   * 
* const session: redis_session_i = {
*   user_agent: "Postman/7.8.9"
    user_id: '123',
    ip: '123',
    remember: false,
    created_at: new Date(),
  };

   * 
  await client.SET('session:{sid}', JSON.stringify(session), {
    NX: true,
    EX: config.time_one_hour_ms,
  });
   * 
   * 
   */

  // dependency injection
  options.redis = client;

  return client;
}

export default load_redis;
